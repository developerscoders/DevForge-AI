import fs from 'node:fs';
import path from 'node:path';
import {
  ExecutionRun,
  ExecutionEvent,
  Project,
  ToolExecutionRecord,
  TaskNode,
  AgentCommunication,
  ApprovalRequest,
  SubAgent,
} from '../../types.js';
import {
  getDataDir,
  ensureProjectWorkspaceDir,
  resolveSafeWorkspacePath,
  redactObject,
} from '../security/executionSecurity.js';

interface PersistedExecutionState {
  version: number;
  updatedAt: string;
  projects: Record<string, Project>;
  runs: Record<string, ExecutionRun>;
  eventsByProject: Record<string, ExecutionEvent[]>;
  latestSeqByProject: Record<string, number>;
}

const MAX_EVENTS_PER_PROJECT = 1500;
const MAX_RUNS_STORED = 200;

class ExecutionStore {
  private state: PersistedExecutionState = {
    version: 1,
    updatedAt: new Date().toISOString(),
    projects: {},
    runs: {},
    eventsByProject: {},
    latestSeqByProject: {},
  };

  private loaded = false;
  private storeFilePath: string | null = null;
  private writeTimer: NodeJS.Timeout | null = null;

  private getStorePath(): string {
    const dir = getDataDir();
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'executions.json');
  }

  public ensureLoaded(): void {
    const currentPath = this.getStorePath();
    if (this.loaded && this.storeFilePath === currentPath) return;

    this.storeFilePath = currentPath;
    this.loaded = true;

    if (!fs.existsSync(currentPath)) {
      this.state = {
        version: 1,
        updatedAt: new Date().toISOString(),
        projects: {},
        runs: {},
        eventsByProject: {},
        latestSeqByProject: {},
      };
      return;
    }

    try {
      const raw = fs.readFileSync(currentPath, 'utf8');
      if (!raw.trim()) return;
      const parsed = JSON.parse(raw) as PersistedExecutionState;
      this.state = {
        version: parsed.version || 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        projects: parsed.projects || {},
        runs: parsed.runs || {},
        eventsByProject: parsed.eventsByProject || {},
        latestSeqByProject: parsed.latestSeqByProject || {},
      };

      // Server restart recovery: clean up any runs/tasks left mid-flight before shutdown
      let recoveredAny = false;
      const nowIso = new Date().toISOString();
      for (const run of Object.values(this.state.runs)) {
        if (run.status === 'running' || run.status === 'queued' || run.status === 'awaiting_approval') {
          run.status = 'failed';
          run.recoveredFromRestart = true;
          run.completedAt = nowIso;
          run.error = 'Execution interrupted by server restart. Trigger Rebuild to resume cleanly.';
          for (const task of run.tasks || []) {
            if (task.status === 'running' || task.status === 'pending' || task.status === 'blocked' || task.status === 'awaiting_approval') {
              task.status = 'failed';
              task.completedAt = nowIso;
              task.error = 'Interrupted by server restart';
            }
          }
          for (const tool of run.toolExecutions || []) {
            if (tool.status === 'running' || tool.status === 'pending' || tool.status === 'awaiting_approval') {
              tool.status = 'failed';
              tool.completedAt = nowIso;
              tool.error = 'Interrupted by server restart';
            }
          }
          for (const req of run.approvals || []) {
            if (req.status === 'pending') {
              req.status = 'expired';
              req.resolvedAt = nowIso;
              req.resolutionNote = 'Expired due to server restart';
            }
          }
          const proj = this.state.projects[run.projectId];
          if (proj && proj.status !== 'deployed') {
            proj.status = 'failed';
            proj.updatedAt = nowIso;
          }
          recoveredAny = true;
        }
      }

      if (recoveredAny) {
        this.flushSync();
      }
    } catch (err) {
      console.warn('[ExecutionStore] Failed reading persisted store, starting fresh:', err);
    }
  }

  public resetForTests(): void {
    this.loaded = false;
    this.storeFilePath = null;
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.ensureLoaded();
  }

  public flushSync(): void {
    this.ensureLoaded();
    try {
      const target = this.getStorePath();
      const tmp = `${target}.tmp.${process.pid}`;
      this.state.updatedAt = new Date().toISOString();
      this.pruneOldRuns();
      fs.writeFileSync(tmp, JSON.stringify(redactObject(this.state), null, 2), 'utf8');
      fs.renameSync(tmp, target);
    } catch (err) {
      console.warn('[ExecutionStore] Persist flush warning:', err);
    }
  }

  private schedulePersist(): void {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.flushSync();
    }, 150);
    if (typeof this.writeTimer.unref === 'function') {
      this.writeTimer.unref();
    }
  }

  private pruneOldRuns(): void {
    const runIds = Object.keys(this.state.runs);
    if (runIds.length <= MAX_RUNS_STORED) return;
    const sorted = runIds.sort(
      (a, b) =>
        new Date(this.state.runs[a].createdAt).getTime() -
        new Date(this.state.runs[b].createdAt).getTime()
    );
    const toRemove = sorted.slice(0, runIds.length - MAX_RUNS_STORED);
    for (const id of toRemove) {
      delete this.state.runs[id];
    }
  }

  private sanitizeProjectPreserveFiles(project: Project): Project {
    const files = Array.isArray(project.files) ? project.files : [];
    const redacted = redactObject({ ...project, files: [] });
    redacted.files = files;
    return redacted;
  }

  // Projects
  public saveProject(project: Project): void {
    this.ensureLoaded();
    this.state.projects[project.id] = this.sanitizeProjectPreserveFiles(project);
    this.syncProjectFilesToWorkspace(project);
    this.schedulePersist();
  }

  public updateProject(projectId: string, updater: (project: Project) => void): Project | undefined {
    this.ensureLoaded();
    const current = this.state.projects[projectId];
    if (!current) return undefined;
    updater(current);
    this.state.projects[projectId] = this.sanitizeProjectPreserveFiles(current);
    this.schedulePersist();
    return this.state.projects[projectId];
  }

  public getProject(projectId: string): Project | undefined {
    this.ensureLoaded();
    return this.state.projects[projectId];
  }

  public getAllProjects(): Project[] {
    this.ensureLoaded();
    return Object.values(this.state.projects).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  public deleteProject(projectId: string): void {
    this.ensureLoaded();
    delete this.state.projects[projectId];
    delete this.state.eventsByProject[projectId];
    delete this.state.latestSeqByProject[projectId];
    for (const [runId, run] of Object.entries(this.state.runs)) {
      if (run.projectId === projectId) {
        delete this.state.runs[runId];
      }
    }
    this.flushSync();
  }

  public syncProjectFilesToWorkspace(project: Project): void {
    if (!project?.id || !Array.isArray(project.files)) return;
    try {
      ensureProjectWorkspaceDir(project.id);
      for (const f of project.files) {
        if (f.type === 'folder' || typeof f.content !== 'string' || !f.path) continue;
        try {
          const safeDest = resolveSafeWorkspacePath(project.id, f.path);
          fs.mkdirSync(path.dirname(safeDest), { recursive: true });
          fs.writeFileSync(safeDest, f.content, 'utf8');
        } catch {
          // Skip invalid paths safely
        }
      }
    } catch (err) {
      console.warn('[ExecutionStore] Workspace sync warning:', err);
    }
  }

  // Execution Runs
  public saveRun(run: ExecutionRun): void {
    this.ensureLoaded();
    this.recomputeRunMetrics(run);
    this.state.runs[run.runId] = redactObject(run);
    const proj = this.state.projects[run.projectId];
    if (proj) {
      proj.activeRunId = run.runId;
      proj.lastExecutionRun = this.state.runs[run.runId];
      proj.updatedAt = new Date().toISOString();
    }
    this.schedulePersist();
  }

  public getRun(runId: string): ExecutionRun | undefined {
    this.ensureLoaded();
    return this.state.runs[runId];
  }

  public getLatestRunForProject(projectId: string): ExecutionRun | undefined {
    this.ensureLoaded();
    const runs = Object.values(this.state.runs)
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return runs[0];
  }

  public getRunsForProject(projectId: string): ExecutionRun[] {
    this.ensureLoaded();
    return Object.values(this.state.runs)
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public upsertTask(runId: string, task: TaskNode): void {
    this.ensureLoaded();
    const run = this.state.runs[runId];
    if (!run) return;
    const idx = run.tasks.findIndex((t) => t.id === task.id);
    const sanitized = redactObject(task);
    if (idx >= 0) run.tasks[idx] = sanitized;
    else run.tasks.push(sanitized);
    this.recomputeRunMetrics(run);
    this.schedulePersist();
  }

  public upsertToolExecution(runId: string, record: ToolExecutionRecord): void {
    this.ensureLoaded();
    const run = this.state.runs[runId];
    if (!run) return;
    const idx = run.toolExecutions.findIndex((t) => t.executionId === record.executionId);
    const sanitized = redactObject(record);
    if (idx >= 0) run.toolExecutions[idx] = sanitized;
    else run.toolExecutions.push(sanitized);
    this.recomputeRunMetrics(run);
    this.schedulePersist();
  }

  public getToolExecution(projectId: string, executionId: string): ToolExecutionRecord | undefined {
    this.ensureLoaded();
    const runs = this.getRunsForProject(projectId);
    for (const run of runs) {
      const found = run.toolExecutions.find((t) => t.executionId === executionId);
      if (found) return found;
    }
    return undefined;
  }

  public addDynamicSubagent(runId: string, subagent: SubAgent): void {
    this.ensureLoaded();
    const run = this.state.runs[runId];
    if (!run) return;
    const idx = run.dynamicSubagents.findIndex((s) => s.id === subagent.id);
    const sanitized = redactObject(subagent);
    if (idx >= 0) run.dynamicSubagents[idx] = sanitized;
    else run.dynamicSubagents.push(sanitized);
    this.schedulePersist();
  }

  public addCommunication(runId: string, msg: AgentCommunication): void {
    this.ensureLoaded();
    const run = this.state.runs[runId];
    if (!run) return;
    run.communications.push(redactObject(msg));
    this.schedulePersist();
  }

  public upsertApproval(runId: string, approval: ApprovalRequest): void {
    this.ensureLoaded();
    const run = this.state.runs[runId];
    if (!run) return;
    const idx = run.approvals.findIndex((a) => a.id === approval.id);
    const sanitized = redactObject(approval);
    if (idx >= 0) run.approvals[idx] = sanitized;
    else run.approvals.push(sanitized);
    this.schedulePersist();
  }

  public findApproval(projectId: string, approvalId: string): { run: ExecutionRun; approval: ApprovalRequest } | undefined {
    this.ensureLoaded();
    for (const run of this.getRunsForProject(projectId)) {
      const found = run.approvals.find((a) => a.id === approvalId);
      if (found) return { run, approval: found };
    }
    return undefined;
  }

  private recomputeRunMetrics(run: ExecutionRun): void {
    const tasks = run.tasks || [];
    const tools = run.toolExecutions || [];
    run.metrics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      failedTasks: tasks.filter((t) => t.status === 'failed').length,
      cancelledTasks: tasks.filter((t) => t.status === 'cancelled').length,
      totalToolCalls: tools.length,
      succeededToolCalls: tools.filter((t) => t.status === 'success').length,
      failedToolCalls: tools.filter((t) => t.status === 'failed').length,
      totalTokensUsed: run.metrics?.totalTokensUsed || 0,
      totalDurationMs:
        run.startedAt && run.completedAt
          ? Math.max(0, new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime())
          : run.startedAt
          ? Math.max(0, Date.now() - new Date(run.startedAt).getTime())
          : 0,
    };
  }

  // Events
  public appendEvent(projectId: string, eventWithoutSeq: Omit<ExecutionEvent, 'seq' | 'eventId'>): ExecutionEvent {
    this.ensureLoaded();
    const nextSeq = (this.state.latestSeqByProject[projectId] || 0) + 1;
    this.state.latestSeqByProject[projectId] = nextSeq;

    const event: ExecutionEvent = redactObject({
      ...eventWithoutSeq,
      seq: nextSeq,
      eventId: `evt_${eventWithoutSeq.runId}_${nextSeq}`,
    });

    if (!this.state.eventsByProject[projectId]) {
      this.state.eventsByProject[projectId] = [];
    }
    const list = this.state.eventsByProject[projectId];
    list.push(event);
    if (list.length > MAX_EVENTS_PER_PROJECT) {
      list.splice(0, list.length - MAX_EVENTS_PER_PROJECT);
    }

    this.schedulePersist();
    return event;
  }

  public getEvents(projectId: string, sinceSeq = 0): ExecutionEvent[] {
    this.ensureLoaded();
    const list = this.state.eventsByProject[projectId] || [];
    if (!sinceSeq || sinceSeq <= 0) return list;
    return list.filter((e) => e.seq > sinceSeq);
  }
}

export const executionStore = new ExecutionStore();
