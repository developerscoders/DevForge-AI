// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executionStore } from '../src/lib/orchestrator/executionStore.js';
import {
  buildInitialAgentsForProject,
  orchestratorEngine,
} from '../src/lib/orchestrator/orchestratorEngine.js';
import { Project } from '../src/types.js';

async function waitForCondition(
  predicate: () => boolean,
  timeoutMs = 20000,
  intervalMs = 40
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out after ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe('Staged Generation Workflow, Classification Branching & DAG Failure Propagation', () => {
  let tmpDir: string;
  let originalDataDir: string | undefined;
  let originalKeys: Record<string, string | undefined> = {};

  beforeEach(() => {
    originalDataDir = process.env.DEVFORGE_DATA_DIR;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devforge-staged-test-'));
    process.env.DEVFORGE_DATA_DIR = tmpDir;

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

  it('builds full-stack TaskFlow Pro deliverable across 9 staged tasks, preserving full prompt & verifying every mapped feature', async () => {
    const fullPrompt = `Act as a Principal Full-Stack Engineer and Software Architect specializing in the MERN stack (MongoDB, Express.js, React, Node.js).
Design and build "TaskFlow Pro", a real-time project & team task management platform with JWT authentication, interactive Kanban drag-and-drop board, priority badges, search and filter controls, team assignees, analytics velocity metrics dashboard, Express REST routes, and Docker port 3000 setup.`;

    const project: Project = {
      id: 'proj_taskflow_acceptance',
      name: 'TaskFlow Pro',
      description: fullPrompt,
      prompt: fullPrompt,
      status: 'planning',
      createdAt: new Date().toISOString(),
      aiCreditsUsed: 0,
      modelConfig: {},
      agents: buildInitialAgentsForProject('proj_taskflow_acceptance'),
      files: [],
    };
    executionStore.saveProject(project);

    const run = await orchestratorEngine.startExecutionRun(project, {
      triggeredBy: 'create',
      preApprovedCriticalTools: true,
    });

    await waitForCondition(() => {
      const r = executionStore.getRun(run.runId);
      return r?.status === 'completed' || r?.status === 'failed';
    });

    const finalRun = executionStore.getRun(run.runId)!;
    const finalProj = executionStore.getProject(project.id)!;

    expect(finalRun.status).toBe('completed');
    expect(finalRun.tasks).toHaveLength(9);
    expect(finalRun.tasks.every((t) => t.status === 'completed')).toBe(true);

    // Complete prompt preserved end-to-end
    expect(finalProj.projectClassification?.prompt_original).toBe(fullPrompt);
    const prdContent = finalProj.files.find((f) => f.path === 'docs/PRD.md')?.content || '';
    expect(prdContent).toContain('Kanban drag-and-drop board');

    // Every stage created its real files
    const paths = new Set(finalProj.files.map((f) => f.path));
    for (const expectedPath of [
      'docs/PRD.md',
      'docs/IMPLEMENTATION_PLAN.json',
      'docs/ARCHITECTURE.md',
      'docs/API_CONTRACTS.json',
      'src/types.ts',
      'server/schema.sql',
      'server/store.ts',
      'server/middleware/authMiddleware.ts',
      'server/routes/taskRoutes.ts',
      'server/app.ts',
      'package.json',
      'index.html',
      'src/main.tsx',
      'src/App.tsx',
      'src/components/KanbanBoard.tsx',
      'src/components/AnalyticsPanel.tsx',
      'tests/app.test.ts',
      'Dockerfile',
      'docker-compose.yml',
      '.env.example',
    ]) {
      expect(paths.has(expectedPath)).toBe(true);
    }

    // Security check: .env.example never contains hardcoded secrets
    const envExample = finalProj.files.find((f) => f.path === '.env.example')?.content || '';
    expect(envExample).toContain('SESSION_SECRET=');
    expect(envExample).not.toMatch(/SESSION_SECRET=.{8,}/);

    // Every mapped feature verified
    expect((finalProj.featureMap || []).length).toBeGreaterThanOrEqual(5);
    expect((finalProj.featureMap || []).every((f) => f.verified)).toBe(true);

    // Real certification & Step 2b passed
    expect(finalProj.astAudit?.passed).toBe(true);
    expect(finalProj.testQualityAudit?.verdict).toBe('pass');
    expect(finalProj.deploymentCertificate?.verdict).toBe('VERIFIED_AND_CERTIFIED');
    expect(finalProj.status).toBe('deployed');
  });

  it('skips React/HTML UI generation for explicit headless api-service prompts while generating full API & tests', async () => {
    const project: Project = {
      id: 'proj_api_only_01',
      name: 'Ledger Core API',
      description: 'Headless REST API service',
      prompt: 'Build an api service with Express, PostgreSQL schema, JWT auth, and Docker REST API only',
      status: 'planning',
      createdAt: new Date().toISOString(),
      aiCreditsUsed: 0,
      modelConfig: {},
      agents: buildInitialAgentsForProject('proj_api_only_01'),
      files: [],
    };
    executionStore.saveProject(project);

    const run = await orchestratorEngine.startExecutionRun(project, {
      triggeredBy: 'create',
      preApprovedCriticalTools: true,
    });

    await waitForCondition(() => {
      const r = executionStore.getRun(run.runId);
      return r?.status === 'completed' || r?.status === 'failed';
    });

    const finalRun = executionStore.getRun(run.runId)!;
    const finalProj = executionStore.getProject(project.id)!;
    const paths = new Set(finalProj.files.map((f) => f.path));

    expect(finalRun.status).toBe('completed');
    expect(finalProj.projectClassification?.project_type).toBe('api-service');
    expect(paths.has('server/app.ts')).toBe(true);
    expect(paths.has('package.json')).toBe(true);
    expect(paths.has('tests/app.test.ts')).toBe(true);
    expect(paths.has('Dockerfile')).toBe(true);
    // No forced React frontend files
    expect(paths.has('src/App.tsx')).toBe(false);
    expect(paths.has('index.html')).toBe(false);
    expect(finalProj.deploymentCertificate?.verdict).toBe('VERIFIED_AND_CERTIFIED');
  });

  it('propagates upstream DAG failure immediately, skips dependent tasks, and marks failing agent failed', async () => {
    const project: Project = {
      id: 'proj_fail_prop_01',
      name: 'Broken AST App',
      description: 'Test DAG failure cascade',
      prompt: 'Build a React dashboard app',
      status: 'planning',
      createdAt: new Date().toISOString(),
      aiCreditsUsed: 0,
      modelConfig: {},
      agents: buildInitialAgentsForProject('proj_fail_prop_01'),
      files: [
        {
          path: 'src/broken_syntax.ts',
          name: 'broken_syntax.ts',
          type: 'file',
          // Intentional invalid syntax causes task_sophia_arch run_typecheck to fail reliably
          content: 'export const broken = ( ;;;',
        },
      ],
    };
    executionStore.saveProject(project);

    const run = await orchestratorEngine.startExecutionRun(project, {
      triggeredBy: 'create',
      preApprovedCriticalTools: true,
    });

    await waitForCondition(() => {
      const r = executionStore.getRun(run.runId);
      return r?.status === 'completed' || r?.status === 'failed';
    });

    const finalRun = executionStore.getRun(run.runId)!;
    const finalProj = executionStore.getProject(project.id)!;

    expect(finalRun.status).toBe('failed');
    expect(finalProj.status).toBe('failed');
    expect(finalProj.deploymentCertificate).toBeUndefined();

    const archTask = finalRun.tasks.find((t) => t.id === 'task_sophia_arch')!;
    expect(archTask.status).toBe('failed');

    // Dependent downstream tasks must be skipped, never stuck in blocked/pending
    for (const depId of ['task_sophia_backend', 'task_frank_ui', 'task_quinn_prep', 'task_quinn_gate', 'task_devon_sre', 'task_aria_final_gate']) {
      expect(finalRun.tasks.find((t) => t.id === depId)?.status).toBe('skipped');
    }

    // Failing lead agent moves cleanly to 'failed', waiting agents halted cleanly to 'cancelled'
    const sophia = finalProj.agents.find((a) => a.id === 'ag_arch')!;
    const frank = finalProj.agents.find((a) => a.id === 'ag_fe')!;
    expect(sophia.status).toBe('failed');
    expect(frank.status).toBe('cancelled');
  });
});
