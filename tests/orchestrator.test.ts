// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executionStore } from '../src/lib/orchestrator/executionStore.js';
import {
  orchestratorEngine,
  buildInitialAgentsForProject,
} from '../src/lib/orchestrator/orchestratorEngine.js';
import { executeRegisteredTool } from '../src/lib/tools/toolRegistry.js';
import { Project } from '../src/types.js';

async function waitForCondition(
  predicate: () => boolean,
  timeoutMs = 60000,
  intervalMs = 40
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out after ${timeoutMs}ms waiting for condition`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe('MultiAgentOrchestrator DAG, Subagents, Approvals, Cancellation & Recovery', () => {
  let tmpDir: string;
  let originalDataDir: string | undefined;
  let originalKeys: Record<string, string | undefined> = {};

  beforeEach(() => {
    originalDataDir = process.env.DEVFORGE_DATA_DIR;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devforge-orch-test-'));
    process.env.DEVFORGE_DATA_DIR = tmpDir;

    // Isolate tests from external LLM provider network latency
    for (const k of ['GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'NVIDIA_API_KEY', 'GROQ_API_KEY']) {
      originalKeys[k] = process.env[k];
      delete process.env[k];
    }

    executionStore.resetForTests();
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(originalKeys)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    if (originalDataDir === undefined) delete process.env.DEVFORGE_DATA_DIR;
    else process.env.DEVFORGE_DATA_DIR = originalDataDir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createSampleProject(id: string): Project {
    const project: Project = {
      id,
      name: 'PulseMetrics SaaS',
      description: 'Analytics dashboard and billing platform',
      prompt: 'Build a real-time analytics SaaS dashboard with authentication and billing',
      status: 'planning',
      createdAt: new Date().toISOString(),
      aiCreditsUsed: 0,
      modelConfig: {},
      agents: buildInitialAgentsForProject(id),
      files: [],
    };
    executionStore.saveProject(project);
    return project;
  }

  it('executes full 9-node DAG, parallel branches, dynamic subagents, tools, and issues certificate', async () => {
    const project = createSampleProject('proj_dag_01');

    const run = await orchestratorEngine.startExecutionRun(project, {
      triggeredBy: 'create',
      preApprovedCriticalTools: true,
    });

    // Duplicate concurrent trigger returns the same active run (idempotent lock)
    const duplicateRun = await orchestratorEngine.startExecutionRun(project, {
      triggeredBy: 'rebuild',
    });
    expect(duplicateRun.runId).toBe(run.runId);

    await waitForCondition(() => {
      const latest = executionStore.getRun(run.runId);
      return latest?.status === 'completed' || latest?.status === 'failed';
    }, 60000);

    const finalRun = executionStore.getRun(run.runId)!;
    const finalProject = executionStore.getProject(project.id)!;

    expect(finalRun.error).toBeUndefined();
    expect(finalRun.status).toBe('completed');
    expect(finalRun.tasks).toHaveLength(9);
    expect(finalRun.tasks.every((t) => t.status === 'completed')).toBe(true);
    expect(finalRun.dynamicSubagents.length).toBeGreaterThanOrEqual(4);
    expect(finalRun.toolExecutions.length).toBeGreaterThanOrEqual(10);
    expect(finalRun.communications.length).toBeGreaterThanOrEqual(4);
    expect(finalProject.files.length).toBeGreaterThanOrEqual(5);
    expect(finalProject.status).toBe('deployed');
    expect(finalProject.deploymentCertificate?.verdict).toBe('VERIFIED_AND_CERTIFIED');
    expect(finalProject.testQualityAudit?.verdict).toBe('pass');
    expect(finalProject.astAudit?.passed).toBe(true);

    // Check dependency ordering: task_parker_prd starts after task_aria_plan completes
    const ariaPlan = finalRun.tasks.find((t) => t.id === 'task_aria_plan')!;
    const parkerPrd = finalRun.tasks.find((t) => t.id === 'task_parker_prd')!;
    expect(new Date(parkerPrd.startedAt!).getTime()).toBeGreaterThanOrEqual(
      new Date(ariaPlan.completedAt!).getTime() - 20
    );
  });

  it('enforces MAX_SUBAGENT_DEPTH and strict parent-subset RBAC permissions on dynamic subagents', async () => {
    const project = createSampleProject('proj_sub_01');
    const run = await orchestratorEngine.startExecutionRun(project, { triggeredBy: 'create' });

    const child = await orchestratorEngine.spawnDynamicSubagent(run.runId, project, 'ag_fe', {
      name: 'Styled Component Subagent',
      role: 'UI Subagent',
      task: 'Audit CSS modules',
      responsibility: 'Check Tailwind styles',
      allowedTools: ['read_file', 'deploy_integration', 'git_commit'], // deploy_integration/git_commit not allowed on ag_fe
      depth: 1,
    });

    // Only tools permitted to ag_fe survive subset filter
    expect(child.allowedTools).toEqual(['read_file']);

    // Depth > 2 must throw
    await expect(
      orchestratorEngine.spawnDynamicSubagent(run.runId, project, 'ag_fe', {
        name: 'Deep Subagent',
        role: 'Overflow',
        task: 'Exceed depth',
        responsibility: 'Should fail',
        allowedTools: ['read_file'],
        depth: 3,
      })
    ).rejects.toThrow(/Maximum dynamic subagent depth/);

    orchestratorEngine.cancelRun(project.id, 'Test cleanup');
  });

  it('pauses tool execution at human approval gate and resumes or rejects cleanly', async () => {
    const project = createSampleProject('proj_appr_01');
    executionStore.saveRun({
      runId: 'run_appr_01',
      projectId: project.id,
      status: 'running',
      prompt: project.prompt,
      triggeredBy: 'manual',
      modelConfig: {},
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      tasks: [],
      dynamicSubagents: [],
      toolExecutions: [],
      communications: [],
      approvals: [],
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        cancelledTasks: 0,
        totalToolCalls: 0,
        succeededToolCalls: 0,
        failedToolCalls: 0,
        totalTokensUsed: 0,
        totalDurationMs: 0,
      },
    });

    // Write Dockerfile first so overwriting it triggers approval gate
    await executeRegisteredTool(
      'write_file',
      { path: 'Dockerfile', content: 'FROM node:20-alpine\nEXPOSE 3000\n' },
      { projectId: project.id, runId: 'run_appr_01', agentId: 'ag_sre', agentName: 'Devon Lead', preApproved: true }
    );

    // 1. Trigger critical overwrite WITH approval gate enabled
    const pendingPromise = executeRegisteredTool(
      'write_file',
      { path: 'Dockerfile', content: 'FROM node:22-alpine\nEXPOSE 3000\n' },
      {
        projectId: project.id,
        runId: 'run_appr_01',
        agentId: 'ag_sre',
        agentName: 'Devon Lead',
        requireApprovalForCriticalWrites: true,
      }
    );

    await waitForCondition(() => {
      const r = executionStore.getRun('run_appr_01');
      return (r?.approvals?.length || 0) === 1 && r?.status === 'awaiting_approval';
    });

    const appr = executionStore.getRun('run_appr_01')!.approvals[0];
    expect(appr.status).toBe('pending');

    orchestratorEngine.resolveApproval(project.id, appr.id, 'approve', 'qa-operator');
    const approvedRec = await pendingPromise;
    expect(approvedRec.status).toBe('success');

    // 2. Test rejection path
    const rejectPromise = executeRegisteredTool(
      'write_file',
      { path: 'Dockerfile', content: 'FROM scratch\n' },
      {
        projectId: project.id,
        runId: 'run_appr_01',
        agentId: 'ag_sre',
        agentName: 'Devon Lead',
        requireApprovalForCriticalWrites: true,
      }
    );

    await waitForCondition(() => {
      const r = executionStore.getRun('run_appr_01');
      return (r?.approvals?.length || 0) === 2;
    });

    const secondAppr = executionStore.getRun('run_appr_01')!.approvals[1];
    orchestratorEngine.resolveApproval(project.id, secondAppr.id, 'reject', 'qa-operator', 'Unsafe base image');
    const rejectedRec = await rejectPromise;
    expect(rejectedRec.status).toBe('rejected');
  });

  it('cancels an active run cleanly and marks unfinished tasks cancelled', async () => {
    const project = createSampleProject('proj_cancel_01');
    const run = await orchestratorEngine.startExecutionRun(project, { triggeredBy: 'create' });

    const cancelRes = orchestratorEngine.cancelRun(project.id, 'Operator aborted');
    expect(cancelRes.cancelled).toBe(true);
    expect(cancelRes.runId).toBe(run.runId);

    const afterRun = executionStore.getRun(run.runId)!;
    expect(afterRun.status).toBe('cancelled');
    expect(executionStore.getProject(project.id)?.status).toBe('cancelled');
  });

  it('recovers interrupted runs on store reload after simulated server restart', () => {
    const project = createSampleProject('proj_restart_01');
    executionStore.saveRun({
      runId: 'run_inflight_01',
      projectId: project.id,
      status: 'running',
      prompt: project.prompt,
      triggeredBy: 'create',
      modelConfig: {},
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      tasks: [
        {
          id: 't1',
          runId: 'run_inflight_01',
          projectId: project.id,
          title: 'Running task',
          description: 'In flight',
          agentId: 'ag_fe',
          agentName: 'Frank Lead',
          milestone: 3,
          dependsOn: [],
          status: 'running',
          idempotencyKey: 'k1',
          attempt: 1,
          maxRetries: 1,
          priority: 5,
        },
      ],
      dynamicSubagents: [],
      toolExecutions: [],
      communications: [],
      approvals: [
        {
          id: 'appr_pending_01',
          runId: 'run_inflight_01',
          projectId: project.id,
          agentId: 'ag_sre',
          agentName: 'Devon Lead',
          toolName: 'git_commit',
          actionType: 'git_mutation',
          riskLevel: 'medium',
          summary: 'Pending commit',
          details: {},
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ],
      metrics: {
        totalTasks: 1,
        completedTasks: 0,
        failedTasks: 0,
        cancelledTasks: 0,
        totalToolCalls: 0,
        succeededToolCalls: 0,
        failedToolCalls: 0,
        totalTokensUsed: 0,
        totalDurationMs: 0,
      },
    });
    executionStore.flushSync();

    // Force cold reload from disk as happens after server restart
    executionStore.resetForTests();

    const recoveredRun = executionStore.getRun('run_inflight_01')!;
    expect(recoveredRun.status).toBe('failed');
    expect(recoveredRun.recoveredFromRestart).toBe(true);
    expect(recoveredRun.tasks[0].status).toBe('failed');
    expect(recoveredRun.approvals[0].status).toBe('expired');
  });
});
