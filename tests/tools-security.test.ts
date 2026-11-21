// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  SecurityPolicyError,
  resolveSafeWorkspacePath,
  validateCommandPolicy,
  validateOutboundUrl,
  redactSecrets,
  redactObject,
} from '../src/lib/security/executionSecurity.js';
import { executionStore } from '../src/lib/orchestrator/executionStore.js';
import {
  executeRegisteredTool,
  getAllToolsAvailabilityStatus,
  getRegisteredToolNames,
  isAgentAuthorizedForTool,
} from '../src/lib/tools/toolRegistry.js';
import { buildInitialAgentsForProject } from '../src/lib/orchestrator/orchestratorEngine.js';
import { Project } from '../src/types.js';

describe('Security Policy, Validation, RBAC & Real Tool Registry', () => {
  let tmpDir: string;
  let originalDataDir: string | undefined;
  const projectId = 'proj_sec_test_01';
  const runId = 'run_sec_test_01';

  beforeEach(() => {
    originalDataDir = process.env.DEVFORGE_DATA_DIR;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devforge-sec-test-'));
    process.env.DEVFORGE_DATA_DIR = tmpDir;
    executionStore.resetForTests();

    const proj: Project = {
      id: projectId,
      name: 'Security Test App',
      description: 'Test project for workspace tools and RBAC',
      prompt: 'Build a TypeScript task manager',
      status: 'coding',
      createdAt: new Date().toISOString(),
      aiCreditsUsed: 0,
      modelConfig: {},
      agents: buildInitialAgentsForProject(projectId),
      files: [
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          content: JSON.stringify({ name: 'sec-test', version: '1.0.0' }, null, 2),
        },
        {
          path: 'index.html',
          name: 'index.html',
          type: 'file',
          content: '<!doctype html><html><body><div id="root"></div></body></html>',
        },
        {
          path: 'src/App.tsx',
          name: 'App.tsx',
          type: 'file',
          content: 'export function App() { return "ok"; }\n',
        },
      ],
    };
    executionStore.saveProject(proj);
    executionStore.saveRun({
      runId,
      projectId,
      status: 'running',
      prompt: proj.prompt,
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
  });

  afterEach(() => {
    if (originalDataDir === undefined) delete process.env.DEVFORGE_DATA_DIR;
    else process.env.DEVFORGE_DATA_DIR = originalDataDir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('blocks path traversal and absolute paths outside the project workspace', () => {
    expect(() => resolveSafeWorkspacePath(projectId, '../etc/passwd')).toThrowError(SecurityPolicyError);
    expect(() => resolveSafeWorkspacePath(projectId, '../../secret.txt')).toThrowError(SecurityPolicyError);
    expect(() => resolveSafeWorkspacePath(projectId, '/etc/passwd')).toThrowError(SecurityPolicyError);
    expect(() => resolveSafeWorkspacePath(projectId, 'src/\0bad.ts')).toThrowError(SecurityPolicyError);

    const valid = resolveSafeWorkspacePath(projectId, 'src/utils/math.ts');
    expect(valid.startsWith(path.join(tmpDir, 'workspaces', projectId))).toBe(true);
  });

  it('enforces command execution allowlist and blocks shell injection metacharacters', () => {
    expect(validateCommandPolicy('rm', ['-rf', '/']).allowed).toBe(false);
    expect(validateCommandPolicy('bash', ['-c', 'whoami']).allowed).toBe(false);
    expect(validateCommandPolicy('node', ['index.js; cat /etc/passwd']).allowed).toBe(false);
    expect(validateCommandPolicy('git', ['status', '&&', 'rm -rf']).allowed).toBe(false);
    expect(validateCommandPolicy('npx', ['tsc', '|', 'grep err']).allowed).toBe(false);

    const safeGit = validateCommandPolicy('git', ['status', '--short']);
    expect(safeGit.allowed).toBe(true);
    expect(safeGit.requiresApproval).toBe(false);

    const mutatingGit = validateCommandPolicy('git', ['commit', '-m', 'init']);
    expect(mutatingGit.allowed).toBe(true);
    expect(mutatingGit.requiresApproval).toBe(true);
  });

  it('blocks SSRF access to localhost, private networks, and cloud metadata endpoints', () => {
    expect(() => validateOutboundUrl('http://127.0.0.1:8080/admin')).toThrowError(SecurityPolicyError);
    expect(() => validateOutboundUrl('http://169.254.169.254/latest/meta-data/')).toThrowError(SecurityPolicyError);
    expect(() => validateOutboundUrl('http://10.0.0.5/internal')).toThrowError(SecurityPolicyError);
    expect(() => validateOutboundUrl('http://192.168.1.1/')).toThrowError(SecurityPolicyError);
    expect(() => validateOutboundUrl('file:///etc/passwd')).toThrowError(SecurityPolicyError);

    const allowedLocal = validateOutboundUrl('http://127.0.0.1:3000/api/health', {
      allowLocalDevPort: 3000,
    });
    expect(allowedLocal.hostname).toBe('127.0.0.1');

    const publicUrl = validateOutboundUrl('https://registry.npmjs.org/zod');
    expect(publicUrl.hostname).toBe('registry.npmjs.org');
  });

  it('redacts sensitive API keys, bearer tokens, and secret object fields', () => {
    const raw =
      'Error with key AIzaSyD1234567890ABCDEFGHIJKLMNOP and ghp_abc123def456ghi789jkl and Bearer tok_super_secret_123456';
    const scrubbed = redactSecrets(raw);
    expect(scrubbed).not.toContain('AIzaSyD1234567890ABCDEFGHIJKLMNOP');
    expect(scrubbed).not.toContain('ghp_abc123def456ghi789jkl');
    expect(scrubbed).not.toContain('tok_super_secret_123456');

    const obj = redactObject({
      apiKey: 'sk-1234567890abcdefghijklmnop',
      nested: { note: 'nvapi-abcdef1234567890abcdef' },
    });
    expect(obj.apiKey).toBe('[REDACTED]');
    expect(obj.nested.note).not.toContain('nvapi-abcdef1234567890abcdef');
  });

  it('enforces RBAC agent permissions and Zod argument validation on executeRegisteredTool', async () => {
    expect(isAgentAuthorizedForTool('ag_pm', 'deploy_integration')).toBe(false);
    expect(isAgentAuthorizedForTool('ag_sre', 'deploy_integration')).toBe(true);

    // RBAC denial
    const denied = await executeRegisteredTool(
      'deploy_integration',
      { target: 'vercel' },
      { projectId, runId, agentId: 'ag_pm', agentName: 'Parker Lead' }
    );
    expect(denied.status).toBe('failed');
    expect(denied.error).toContain('Permission denied');

    // Invalid Zod schema arguments
    const badArgs = await executeRegisteredTool(
      'write_file',
      { path: '', content: 123 as any },
      { projectId, runId, agentId: 'ag_fe', agentName: 'Frank Lead' }
    );
    expect(badArgs.status).toBe('failed');
    expect(badArgs.error).toContain('Invalid tool arguments');
  });

  it('executes real workspace CRUD, search, git status, and TypeScript AST diagnostics', async () => {
    const ctx = {
      projectId,
      runId,
      agentId: 'ag_fe',
      agentName: 'Frank Lead',
      preApproved: true,
    };

    const createRec = await executeRegisteredTool(
      'create_file',
      { path: 'src/math.ts', content: 'export const add = (a: number, b: number) => a + b;\n' },
      ctx
    );
    expect(createRec.status).toBe('success');

    const readRec = await executeRegisteredTool('read_file', { path: 'src/math.ts' }, ctx);
    expect(readRec.status).toBe('success');
    expect(readRec.output.content).toContain('a + b');

    const editRec = await executeRegisteredTool(
      'edit_file',
      { path: 'src/math.ts', old_text: 'a + b', new_text: 'a + b + 0' },
      ctx
    );
    expect(editRec.status).toBe('success');

    const searchRec = await executeRegisteredTool(
      'search_files',
      { query: 'a \\+ b \\+ 0', is_regex: true },
      ctx
    );
    expect(searchRec.status).toBe('success');
    expect(searchRec.output.matchCount).toBe(1);

    // Introduce deliberate syntax error and verify real AST typecheck catches it
    await executeRegisteredTool(
      'write_file',
      { path: 'src/broken.ts', content: 'export const x: number = ;' },
      ctx
    );
    const tcBroken = await executeRegisteredTool('run_typecheck', {}, ctx);
    expect(tcBroken.status).toBe('success');
    expect(tcBroken.output.passed).toBe(false);
    expect(tcBroken.output.errorCount).toBeGreaterThan(0);

    // Delete broken file and verify typecheck passes again
    const delRec = await executeRegisteredTool('delete_file', { path: 'src/broken.ts' }, ctx);
    expect(delRec.status).toBe('success');

    const tcClean = await executeRegisteredTool('run_typecheck', {}, ctx);
    expect(tcClean.output.passed).toBe(true);

    // Git repository status works cleanly inside isolated workspace
    const gitStatus = await executeRegisteredTool('git_status', {}, ctx);
    expect(gitStatus.status).toBe('success');
    expect(gitStatus.output).toHaveProperty('clean');
  });

  it('exposes real availability metadata across all registered tools', async () => {
    const names = getRegisteredToolNames();
    expect(names.length).toBeGreaterThanOrEqual(25);
    expect(names).toEqual(
      expect.arrayContaining([
        'read_file',
        'write_file',
        'edit_file',
        'run_typecheck',
        'run_unit_tests',
        'git_status',
        'web_search',
        'mcp_discover_servers',
        'deploy_integration',
      ])
    );

    const statuses = await getAllToolsAvailabilityStatus();
    const browserTool = statuses.find((s) => s.name === 'browser_automation');
    expect(browserTool).toBeDefined();
    expect(typeof browserTool?.available).toBe('boolean');
  });
});
