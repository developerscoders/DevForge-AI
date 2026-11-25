import { Project, Agent, AgentLog, ExecutionRun } from '../types';
import { saveFirestoreProject } from './firestoreService';

export interface SwarmProgressState {
  percentage: number;
  activeAgentId: string;
  activeAgentName: string;
  activeAgentRole: string;
  currentTask: string;
  stepDescription: string;
  filesGeneratedCount: number;
  logs: AgentLog[];
  executionRun?: ExecutionRun | null;
}

export type SwarmProgressCallback = (state: SwarmProgressState, updatedProject: Project) => void;

function computeRunProgress(proj: Project, run?: ExecutionRun | null): number {
  if (run?.metrics && run.metrics.totalTasks > 0) {
    if (run.status === 'completed') return 100;
    const pct = Math.round((run.metrics.completedTasks / run.metrics.totalTasks) * 100);
    return Math.min(99, Math.max(5, pct));
  }
  const agents = proj.agents || [];
  if (agents.length === 0) return proj.status === 'deployed' ? 100 : 5;
  const done = agents.filter((a) => a.status === 'complete').length;
  if (proj.status === 'deployed' && done === agents.length) return 100;
  return Math.min(99, Math.max(5, Math.round((done / agents.length) * 100)));
}

/**
 * Observes and drives the server-side MultiAgentOrchestrator run for a project.
 * Eliminates duplicate client-side generation and reads real DAG tasks, tool executions,
 * and file outputs from `/api/projects/:id/execution`.
 */
export async function executeAutonomousSwarm(
  initialProject: Project,
  userId: string | undefined,
  onProgress?: SwarmProgressCallback
): Promise<Project> {
  let currentProject: Project = JSON.parse(JSON.stringify(initialProject));

  const fetchExecutionSnapshot = async (): Promise<{
    project: Project;
    run: ExecutionRun | null;
    logs: AgentLog[];
  } | null> => {
    const res = await fetch(`/api/projects/${currentProject.id}/execution`);
    if (res.status === 404) {
      // Seed local client-created project on server and start an execution run
      await fetch('/api/projects/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentProject),
      });
      await fetch(`/api/projects/${currentProject.id}/rebuild`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const retryRes = await fetch(`/api/projects/${currentProject.id}/execution`);
      if (!retryRes.ok) return null;
      const retryData = await retryRes.json();
      const logs = retryData.project?.agents?.flatMap((a: Agent) => a.outputLogs || []) || [];
      return { project: retryData.project, run: retryData.run || null, logs };
    }
    if (!res.ok) return null;
    const data = await res.json();
    const streamRes = await fetch(`/api/projects/${currentProject.id}/stream`).catch(() => null);
    let streamLogs: AgentLog[] = [];
    if (streamRes && streamRes.ok) {
      const streamPayload = await streamRes.json().catch(() => ({ logs: [] }));
      if (Array.isArray(streamPayload.logs)) {
        streamLogs = streamPayload.logs;
      }
    }
    const logs =
      streamLogs.length > 0
        ? streamLogs
        : data.project?.agents?.flatMap((a: Agent) => a.outputLogs || []) || [];
    return { project: data.project, run: data.run || null, logs };
  };

  // Ensure a run exists if none has been created yet
  let snapshot = await fetchExecutionSnapshot();
  if (snapshot && !snapshot.run && snapshot.project.status !== 'deployed') {
    await fetch(`/api/projects/${currentProject.id}/rebuild`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    snapshot = await fetchExecutionSnapshot();
  }

  const maxPolls = 120;
  for (let i = 0; i < maxPolls; i++) {
    if (!snapshot) {
      await new Promise((r) => setTimeout(r, 1000));
      snapshot = await fetchExecutionSnapshot();
      continue;
    }

    currentProject = snapshot.project;
    const run = snapshot.run;
    const runningTaskAgentId = run?.tasks?.find((task) => task.status === 'running')?.agentId;
    const activeAgent =
      currentProject.agents?.find((agent) => ['active', 'thinking', 'healing'].includes(agent.status)) ||
      (runningTaskAgentId ? currentProject.agents?.find((agent) => agent.id === runningTaskAgentId) : undefined);

    const percentage = computeRunProgress(currentProject, run);

    if (onProgress) {
      onProgress(
        {
          percentage,
          activeAgentId: activeAgent?.id || (run?.status === 'completed' ? 'completed' : 'waiting'),
          activeAgentName: activeAgent?.name || (run?.status === 'completed' ? 'Completed' : 'Waiting'),
          activeAgentRole: activeAgent?.role || (run?.status === 'completed' ? 'All agents finished' : 'No active agent'),
          currentTask: activeAgent?.currentTask || (run?.status === 'completed' ? 'All DAG tasks completed' : 'Waiting for a dependency-ready task'),
          stepDescription: run
            ? `DAG Tasks: ${run.metrics.completedTasks}/${run.metrics.totalTasks} · Tool Calls: ${run.metrics.totalToolCalls}`
            : 'Synchronizing with backend orchestrator',
          filesGeneratedCount: currentProject.files?.length || 0,
          logs: snapshot.logs,
          executionRun: run,
        },
        currentProject
      );
    }

    const isTerminal =
      run?.status === 'completed' ||
      run?.status === 'failed' ||
      run?.status === 'cancelled' ||
      currentProject.status === 'deployed' ||
      currentProject.status === 'failed';

    if (isTerminal) {
      break;
    }

    await new Promise((r) => setTimeout(r, 1000));
    snapshot = await fetchExecutionSnapshot();
  }

  try {
    await saveFirestoreProject(currentProject, userId);
  } catch (saveErr) {
    console.warn('[Swarm Runner] Background storage save notice:', saveErr);
  }

  return currentProject;
}
