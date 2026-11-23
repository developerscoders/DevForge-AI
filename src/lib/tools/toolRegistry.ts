import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import ts from 'typescript';
import { z } from 'zod';
import { FunctionDeclaration, Schema, Type } from '@google/genai';
import {
  ApprovalActionType,
  ApprovalRequest,
  FileNode,
  Project,
  ToolAvailabilityStatus,
  ToolCategory,
  ToolExecutionRecord,
} from '../../types.js';
import {
  SecurityPolicyError,
  ensureProjectWorkspaceDir,
  isImportantFileOverwrite,
  redactObject,
  redactSecrets,
  resolveSafeWorkspacePath,
  toWorkspaceRelativePath,
  validateCommandPolicy,
  validateOutboundUrl,
} from '../security/executionSecurity.js';
import { executionStore } from '../orchestrator/executionStore.js';
import { eventBus } from '../orchestrator/eventBus.js';
import { runAstAudit, runCoverageAnalysis } from '../ariaOrchestratorEngine.js';
import { pushProjectToGitHub, deployProjectToVercel } from '../deployService.js';

export interface ToolExecutionContext {
  projectId: string;
  runId: string;
  taskId?: string;
  agentId: string;
  agentName: string;
  subagentId?: string;
  subagentName?: string;
  allowedToolsOverride?: string[];
  abortSignal?: AbortSignal;
  preApproved?: boolean;
  requireApprovalForCriticalWrites?: boolean;
  approvalTimeoutMs?: number;
  retries?: number;
}

export interface ToolHandlerResult {
  output: any;
  stdout?: string;
  stderr?: string;
  filesModified?: string[];
}

export interface ApprovalGateSpec {
  actionType: ApprovalActionType;
  riskLevel: 'medium' | 'high' | 'critical';
  summary: string;
  details: Record<string, any>;
}

export interface RegisteredTool<TArgs = any> {
  name: string;
  category: ToolCategory;
  description: string;
  zodSchema: z.ZodType<TArgs>;
  geminiParameters: Schema;
  allowedAgents: string[];
  requiresApproval?: (args: TArgs, ctx: ToolExecutionContext) => ApprovalGateSpec | null;
  availabilityCheck: () => Promise<{ available: boolean; configured: boolean; reason?: string }>;
  execute: (args: TArgs, ctx: ToolExecutionContext) => Promise<ToolHandlerResult>;
}

// Pending approval waiters keyed by approvalId
const pendingApprovalWaiters = new Map<
  string,
  {
    resolve: (approved: boolean) => void;
    reject: (err: Error) => void;
    timer?: NodeJS.Timeout;
  }
>();

export function resolvePendingApprovalWaiter(approvalId: string, approved: boolean): boolean {
  const waiter = pendingApprovalWaiters.get(approvalId);
  if (!waiter) return false;
  if (waiter.timer) clearTimeout(waiter.timer);
  pendingApprovalWaiters.delete(approvalId);
  waiter.resolve(approved);
  return true;
}

function getWorkspaceFilesRecursive(root: string, dir = root, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getWorkspaceFilesRecursive(root, full, acc);
    } else {
      acc.push(path.relative(root, full).split(path.sep).join('/'));
    }
  }
  return acc;
}

function syncWorkspaceFileToProject(projectId: string, relPath: string, content: string): void {
  const proj = executionStore.getProject(projectId);
  if (!proj) return;
  if (!Array.isArray(proj.files)) proj.files = [];
  const normalized = relPath.replace(/^\/+/, '');
  const idx = proj.files.findIndex((f) => f.path === normalized);
  const name = normalized.split('/').pop() || normalized;
  if (idx >= 0) {
    proj.files[idx] = { ...proj.files[idx], content };
  } else {
    proj.files.push({ path: normalized, name, type: 'file', content });
  }
  proj.updatedAt = new Date().toISOString();
  executionStore.saveProject(proj);
}

function ensureWorkspaceSeeded(projectId: string): string {
  const root = ensureProjectWorkspaceDir(projectId);
  const proj = executionStore.getProject(projectId);
  if (proj && Array.isArray(proj.files) && proj.files.length > 0) {
    for (const f of proj.files) {
      if (f.type === 'folder' || typeof f.content !== 'string' || !f.path) continue;
      try {
        const safePath = resolveSafeWorkspacePath(projectId, f.path);
        if (!fs.existsSync(safePath)) {
          fs.mkdirSync(path.dirname(safePath), { recursive: true });
          fs.writeFileSync(safePath, f.content, 'utf8');
        }
      } catch {
        // Ignore invalid paths
      }
    }
  }
  return root;
}

const MAX_STDIO_BYTES = 64 * 1024;

export async function runSandboxedProcess(
  command: string,
  args: string[],
  cwd: string,
  options: { timeoutMs?: number; abortSignal?: AbortSignal } = {}
): Promise<{ exitCode: number; stdout: string; stderr: string; timedOut: boolean }> {
  const timeoutMs = options.timeoutMs ?? 20000;
  return new Promise((resolve, reject) => {
    if (options.abortSignal?.aborted) {
      return reject(new Error('Execution aborted before process start'));
    }

    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: {
        PATH: process.env.PATH || '',
        HOME: cwd,
        NODE_ENV: process.env.NODE_ENV || 'development',
        CI: 'true',
      },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      options.abortSignal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        child.kill('SIGTERM');
      } catch {}
      reject(new Error('Process cancelled via AbortSignal'));
    };

    options.abortSignal?.addEventListener('abort', onAbort);

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {}
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      if (stdout.length < MAX_STDIO_BYTES) {
        stdout += chunk.toString('utf8').slice(0, MAX_STDIO_BYTES - stdout.length);
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      if (stderr.length < MAX_STDIO_BYTES) {
        stderr += chunk.toString('utf8').slice(0, MAX_STDIO_BYTES - stderr.length);
      }
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        exitCode: code ?? (timedOut ? 124 : 1),
        stdout: redactSecrets(stdout),
        stderr: redactSecrets(stderr),
        timedOut,
      });
    });
  });
}

async function ensureGitRepoInitialized(projectId: string, abortSignal?: AbortSignal): Promise<string> {
  const root = ensureWorkspaceSeeded(projectId);
  if (!fs.existsSync(path.join(root, '.git'))) {
    await runSandboxedProcess('git', ['init'], root, { timeoutMs: 8000, abortSignal });
    await runSandboxedProcess('git', ['config', 'user.email', 'swarm@devforge.local'], root, {
      timeoutMs: 5000,
      abortSignal,
    });
    await runSandboxedProcess('git', ['config', 'user.name', 'DevForge Swarm'], root, {
      timeoutMs: 5000,
      abortSignal,
    });
  }
  return root;
}

function getConfiguredMcpServers(): Array<{ name: string; url?: string; command?: string }> {
  const servers: Array<{ name: string; url?: string; command?: string }> = [];
  if (process.env.MCP_SERVERS) {
    try {
      const parsed = JSON.parse(process.env.MCP_SERVERS);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.name) servers.push(item);
        }
      }
    } catch {}
  }
  const mcpFile = path.resolve(process.cwd(), '.mcp.json');
  if (fs.existsSync(mcpFile)) {
    try {
      const raw = JSON.parse(fs.readFileSync(mcpFile, 'utf8'));
      const map = raw.mcpServers || {};
      for (const [name, cfg] of Object.entries<any>(map)) {
        servers.push({ name, url: cfg.url, command: cfg.command });
      }
    } catch {}
  }
  return servers;
}

export function runTypeScriptAstDiagnostics(project: Project): string[] {
  const diagnostics: string[] = [];
  for (const file of project.files || []) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file.path) || typeof file.content !== 'string') continue;
    const scriptKind = file.path.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : file.path.endsWith('.jsx')
      ? ts.ScriptKind.JSX
      : file.path.endsWith('.js')
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
      file.path,
      file.content,
      ts.ScriptTarget.ES2022,
      true,
      scriptKind
    );
    const parseDiagnostics = (sourceFile as any).parseDiagnostics as ts.Diagnostic[] | undefined;
    if (parseDiagnostics && parseDiagnostics.length > 0) {
      for (const d of parseDiagnostics.slice(0, 3)) {
        const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
        const line =
          d.start !== undefined
            ? sourceFile.getLineAndCharacterOfPosition(d.start).line + 1
            : 0;
        diagnostics.push(`${file.path}:${line} AST Syntax Error: ${msg}`);
      }
    }
  }
  return diagnostics;
}

const ALL_CORE_AGENTS = ['ag_ceo', 'ag_pm', 'ag_arch', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'];

const registryEntries: RegisteredTool[] = [
  // ==========================================
  // 1. WORKSPACE TOOLS
  // ==========================================
  {
    name: 'list_files',
    category: 'workspace',
    description: 'List all files in the isolated project workspace directory.',
    zodSchema: z.object({ directory: z.string().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        directory: { type: Type.STRING, description: 'Optional relative subdirectory path.' },
      },
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const targetDir = args.directory
        ? resolveSafeWorkspacePath(ctx.projectId, args.directory, { allowRoot: true })
        : root;
      const files = getWorkspaceFilesRecursive(root, targetDir);
      return { output: { directory: args.directory || '.', count: files.length, files } };
    },
  },
  {
    name: 'read_file',
    category: 'workspace',
    description: 'Read contents of a file inside the isolated project workspace.',
    zodSchema: z.object({
      path: z.string().min(1),
      start_line: z.number().int().min(1).optional(),
      end_line: z.number().int().min(1).optional(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative path inside workspace.' },
        start_line: { type: Type.NUMBER, description: 'Optional 1-indexed start line.' },
        end_line: { type: Type.NUMBER, description: 'Optional 1-indexed end line.' },
      },
      required: ['path'],
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      ensureWorkspaceSeeded(ctx.projectId);
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      if (!fs.existsSync(safePath)) {
        throw new Error(`File not found: ${args.path}`);
      }
      const raw = fs.readFileSync(safePath, 'utf8');
      const lines = raw.split('\n');
      const start = Math.max(1, args.start_line ?? 1);
      const end = Math.min(lines.length, args.end_line ?? lines.length);
      const slice = lines.slice(start - 1, end).join('\n');
      return {
        output: {
          path: args.path,
          totalLines: lines.length,
          startLine: start,
          endLine: end,
          content: slice,
        },
      };
    },
  },
  {
    name: 'search_files',
    category: 'workspace',
    description: 'Search files in the project workspace matching a text or regex pattern.',
    zodSchema: z.object({
      query: z.string().min(1),
      is_regex: z.boolean().optional(),
      max_results: z.number().int().min(1).max(200).optional(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Text or regex pattern to search.' },
        is_regex: { type: Type.BOOLEAN, description: 'Treat query as regular expression.' },
        max_results: { type: Type.NUMBER, description: 'Maximum matches to return (default 50).' },
      },
      required: ['query'],
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const files = getWorkspaceFilesRecursive(root);
      const rx = args.is_regex
        ? new RegExp(args.query, 'i')
        : new RegExp(args.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const maxResults = args.max_results ?? 50;
      const matches: Array<{ path: string; line: number; text: string }> = [];

      for (const rel of files) {
        const full = resolveSafeWorkspacePath(ctx.projectId, rel);
        const lines = fs.readFileSync(full, 'utf8').split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (rx.test(lines[i])) {
            matches.push({ path: rel, line: i + 1, text: lines[i].trim().slice(0, 200) });
            if (matches.length >= maxResults) break;
          }
        }
        if (matches.length >= maxResults) break;
      }
      return { output: { query: args.query, matchCount: matches.length, matches } };
    },
  },
  {
    name: 'create_file',
    category: 'workspace',
    description: 'Create a new file inside the project workspace (fails if file already exists unless overwrite is true).',
    zodSchema: z.object({
      path: z.string().min(1),
      content: z.string(),
      overwrite: z.boolean().optional(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative path inside workspace.' },
        content: { type: Type.STRING, description: 'File contents.' },
        overwrite: { type: Type.BOOLEAN, description: 'Overwrite if existing.' },
      },
      required: ['path', 'content'],
    },
    allowedAgents: ['ag_ceo', 'ag_pm', 'ag_arch', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'],
    requiresApproval: (args, ctx) => {
      if (!ctx.requireApprovalForCriticalWrites) return null;
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      const exists = fs.existsSync(safePath);
      if (isImportantFileOverwrite(args.path, exists)) {
        return {
          actionType: 'important_file_overwrite',
          riskLevel: 'high',
          summary: `Overwrite protected configuration file "${args.path}"`,
          details: { path: args.path, bytes: args.content.length },
        };
      }
      return null;
    },
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      ensureWorkspaceSeeded(ctx.projectId);
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      if (fs.existsSync(safePath) && !args.overwrite) {
        throw new Error(`File "${args.path}" already exists. Use write_file or overwrite: true.`);
      }
      fs.mkdirSync(path.dirname(safePath), { recursive: true });
      fs.writeFileSync(safePath, args.content, 'utf8');
      const rel = toWorkspaceRelativePath(ctx.projectId, safePath);
      syncWorkspaceFileToProject(ctx.projectId, rel, args.content);
      return {
        output: { path: rel, bytesWritten: Buffer.byteLength(args.content, 'utf8'), created: true },
        filesModified: [rel],
      };
    },
  },
  {
    name: 'write_file',
    category: 'workspace',
    description: 'Write or update a file inside the isolated project workspace and sync to project store.',
    zodSchema: z.object({
      path: z.string().min(1),
      content: z.string(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative file path.' },
        content: { type: Type.STRING, description: 'Complete file content.' },
      },
      required: ['path', 'content'],
    },
    allowedAgents: ['ag_ceo', 'ag_pm', 'ag_arch', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'],
    requiresApproval: (args, ctx) => {
      if (!ctx.requireApprovalForCriticalWrites) return null;
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      const exists = fs.existsSync(safePath);
      if (isImportantFileOverwrite(args.path, exists)) {
        return {
          actionType: 'important_file_overwrite',
          riskLevel: 'high',
          summary: `Overwrite important workspace file "${args.path}"`,
          details: { path: args.path, bytes: args.content.length },
        };
      }
      return null;
    },
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      ensureWorkspaceSeeded(ctx.projectId);
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      const existed = fs.existsSync(safePath);
      fs.mkdirSync(path.dirname(safePath), { recursive: true });
      fs.writeFileSync(safePath, args.content, 'utf8');
      const rel = toWorkspaceRelativePath(ctx.projectId, safePath);
      syncWorkspaceFileToProject(ctx.projectId, rel, args.content);
      return {
        output: {
          path: rel,
          bytesWritten: Buffer.byteLength(args.content, 'utf8'),
          updated: existed,
          created: !existed,
        },
        filesModified: [rel],
      };
    },
  },
  {
    name: 'edit_file',
    category: 'workspace',
    description: 'Replace an exact target snippet inside an existing workspace file.',
    zodSchema: z.object({
      path: z.string().min(1),
      old_text: z.string().min(1),
      new_text: z.string(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative path to edit.' },
        old_text: { type: Type.STRING, description: 'Exact text snippet to replace.' },
        new_text: { type: Type.STRING, description: 'Replacement text.' },
      },
      required: ['path', 'old_text', 'new_text'],
    },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      ensureWorkspaceSeeded(ctx.projectId);
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      if (!fs.existsSync(safePath)) throw new Error(`File not found: ${args.path}`);
      const content = fs.readFileSync(safePath, 'utf8');
      if (!content.includes(args.old_text)) {
        throw new Error(`Target snippet not found in "${args.path}".`);
      }
      const updated = content.replace(args.old_text, args.new_text);
      fs.writeFileSync(safePath, updated, 'utf8');
      const rel = toWorkspaceRelativePath(ctx.projectId, safePath);
      syncWorkspaceFileToProject(ctx.projectId, rel, updated);
      return {
        output: { path: rel, replaced: true, bytesWritten: Buffer.byteLength(updated, 'utf8') },
        filesModified: [rel],
      };
    },
  },
  {
    name: 'apply_patch',
    category: 'workspace',
    description: 'Apply multiple search-and-replace hunks atomically to a file in workspace.',
    zodSchema: z.object({
      path: z.string().min(1),
      hunks: z
        .array(
          z.object({
            search: z.string().min(1),
            replace: z.string(),
          })
        )
        .min(1),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Target file path.' },
        hunks: {
          type: Type.ARRAY,
          description: 'Ordered replacement hunks.',
          items: {
            type: Type.OBJECT,
            properties: {
              search: { type: Type.STRING },
              replace: { type: Type.STRING },
            },
            required: ['search', 'replace'],
          },
        },
      },
      required: ['path', 'hunks'],
    },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      ensureWorkspaceSeeded(ctx.projectId);
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      if (!fs.existsSync(safePath)) throw new Error(`File not found: ${args.path}`);
      let content = fs.readFileSync(safePath, 'utf8');
      let applied = 0;
      for (const hunk of args.hunks) {
        if (!content.includes(hunk.search)) {
          throw new Error(`Patch hunk not matched in ${args.path}: "${hunk.search.slice(0, 60)}"`);
        }
        content = content.replace(hunk.search, hunk.replace);
        applied++;
      }
      fs.writeFileSync(safePath, content, 'utf8');
      const rel = toWorkspaceRelativePath(ctx.projectId, safePath);
      syncWorkspaceFileToProject(ctx.projectId, rel, content);
      return {
        output: { path: rel, hunksApplied: applied },
        filesModified: [rel],
      };
    },
  },
  {
    name: 'delete_file',
    category: 'workspace',
    description: 'Delete a file inside the isolated project workspace and remove it from project state.',
    zodSchema: z.object({ path: z.string().min(1) }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative workspace path of file to delete.' },
      },
      required: ['path'],
    },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_fe', 'ag_coder', 'ag_sre'],
    requiresApproval: (args, ctx) => {
      if (!ctx.requireApprovalForCriticalWrites) return null;
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      if (isImportantFileOverwrite(args.path, fs.existsSync(safePath))) {
        return {
          actionType: 'important_file_overwrite',
          riskLevel: 'high',
          summary: `Delete protected workspace file "${args.path}"`,
          details: { path: args.path },
        };
      }
      return null;
    },
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      ensureWorkspaceSeeded(ctx.projectId);
      const safePath = resolveSafeWorkspacePath(ctx.projectId, args.path);
      if (!fs.existsSync(safePath)) {
        throw new Error(`File not found: ${args.path}`);
      }
      fs.unlinkSync(safePath);
      const rel = toWorkspaceRelativePath(ctx.projectId, safePath);
      executionStore.updateProject(ctx.projectId, (proj) => {
        proj.files = (proj.files || []).filter((f) => f.path !== rel);
        proj.updatedAt = new Date().toISOString();
      });
      return {
        output: { path: rel, deleted: true },
        filesModified: [rel],
      };
    },
  },
  {
    name: 'inspect_project_structure',
    category: 'workspace',
    description: 'Inspect directory topology, file counts, total lines of code, and detected dependencies.',
    zodSchema: z.object({}),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {},
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const files = getWorkspaceFilesRecursive(root);
      let totalLines = 0;
      const byExtension: Record<string, number> = {};
      for (const rel of files) {
        const ext = path.extname(rel) || 'other';
        byExtension[ext] = (byExtension[ext] || 0) + 1;
        const content = fs.readFileSync(resolveSafeWorkspacePath(ctx.projectId, rel), 'utf8');
        totalLines += content.split('\n').length;
      }
      let dependencies: string[] = [];
      const pkgPath = resolveSafeWorkspacePath(ctx.projectId, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          dependencies = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
        } catch {}
      }
      return {
        output: {
          workspaceRoot: path.basename(root),
          fileCount: files.length,
          totalLines,
          byExtension,
          dependencies,
          files,
        },
      };
    },
  },

  // ==========================================
  // 2. TERMINAL TOOLS (SANDBOXED)
  // ==========================================
  {
    name: 'run_command',
    category: 'terminal',
    description: 'Run an allowlisted command inside the isolated project workspace without shell expansion.',
    zodSchema: z.object({
      command: z.string().min(1),
      args: z.array(z.string()).optional(),
      timeout_ms: z.number().int().min(500).max(60000).optional(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: 'Allowlisted binary name (e.g. node, npm, tsc, git).' },
        args: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Argument list.' },
        timeout_ms: { type: Type.NUMBER, description: 'Execution timeout in ms (max 60000).' },
      },
      required: ['command'],
    },
    allowedAgents: ['ag_ceo', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'],
    requiresApproval: (args) => {
      const policy = validateCommandPolicy(args.command, args.args || []);
      if (policy.allowed && policy.requiresApproval) {
        return {
          actionType: 'destructive_command',
          riskLevel: policy.riskLevel || 'high',
          summary: policy.reason || `Run command "${args.command} ${(args.args || []).join(' ')}"`,
          details: { command: args.command, args: args.args || [] },
        };
      }
      return null;
    },
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const cmdArgs = args.args || [];
      const policy = validateCommandPolicy(args.command, cmdArgs);
      if (!policy.allowed) {
        throw new SecurityPolicyError(policy.reason || 'Command blocked by security policy', 'COMMAND_BLOCKED');
      }
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const res = await runSandboxedProcess(args.command, cmdArgs, root, {
        timeoutMs: args.timeout_ms ?? 15000,
        abortSignal: ctx.abortSignal,
      });
      if (res.exitCode !== 0) {
        return {
          output: { exitCode: res.exitCode, timedOut: res.timedOut, success: false },
          stdout: res.stdout,
          stderr: res.stderr || `Process exited with code ${res.exitCode}`,
        };
      }
      return {
        output: { exitCode: res.exitCode, timedOut: res.timedOut, success: true },
        stdout: res.stdout,
        stderr: res.stderr,
      };
    },
  },
  {
    name: 'run_typecheck',
    category: 'terminal',
    description: 'Run real TypeScript AST syntax & parse diagnostics across all workspace TS/TSX/JS files.',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      ensureWorkspaceSeeded(ctx.projectId);
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');
      const errors = runTypeScriptAstDiagnostics(proj);
      const tsFiles = (proj.files || []).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f.path)).length;
      return {
        output: {
          passed: errors.length === 0,
          filesChecked: tsFiles,
          errorCount: errors.length,
          errors,
        },
        stdout:
          errors.length === 0
            ? `TypeScript AST parse verified cleanly across ${tsFiles} source files.`
            : undefined,
        stderr: errors.length > 0 ? errors.join('\n') : undefined,
      };
    },
  },
  {
    name: 'run_linter',
    category: 'terminal',
    description: 'Run static lint rules (TODOs, unsafe eval/XSS sinks, malformed JSON, TypeScript AST parse) on workspace.',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ['ag_ceo', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      ensureWorkspaceSeeded(ctx.projectId);
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');
      const astDiagnostics = runTypeScriptAstDiagnostics(proj);
      const audit = runAstAudit(proj, astDiagnostics);
      return {
        output: {
          passed: audit.passed,
          errors: audit.errors,
          brokenReferences: audit.brokenReferences,
          securityAlerts: audit.securityAlerts,
          filesParsed: audit.filesParsed,
        },
        stdout: audit.passed ? `Linter passed (${audit.filesParsed || 0} files inspected).` : undefined,
        stderr: audit.errors.length > 0 ? audit.errors.join('\n') : undefined,
      };
    },
  },
  {
    name: 'run_tests',
    category: 'terminal',
    description: 'Execute project test suite in workspace if runner available, otherwise validate test files & assertions cleanly.',
    zodSchema: z.object({ test_file: z.string().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        test_file: { type: Type.STRING, description: 'Optional specific test file path.' },
      },
    },
    allowedAgents: ['ag_ceo', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');

      // Check if local workspace has node_modules/vitest or host vitest can run standalone pure tests
      const hasWorkspaceNodeModules = fs.existsSync(path.join(root, 'node_modules', '.bin', 'vitest'));
      if (hasWorkspaceNodeModules) {
        const vitestArgs = ['run', ...(args.test_file ? [args.test_file] : [])];
        const res = await runSandboxedProcess(
          path.join(root, 'node_modules', '.bin', 'vitest'),
          vitestArgs,
          root,
          { timeoutMs: 25000, abortSignal: ctx.abortSignal }
        );
        return {
          output: {
            executedRunner: 'vitest',
            passed: res.exitCode === 0,
            exitCode: res.exitCode,
          },
          stdout: res.stdout,
          stderr: res.stderr,
        };
      }

      // Static inspection is NOT a test run. Never report success or coverage
      // when no executable test runner is installed in the generated workspace.
      const testFiles = (proj.files || []).filter(
        (f) =>
          (f.path.includes('.test.') || f.path.includes('.spec.') || f.path.startsWith('tests/')) &&
          (!args.test_file || f.path === args.test_file)
      );
      const syntaxErrors = runTypeScriptAstDiagnostics({ ...proj, files: testFiles });
      const testCases = testFiles.reduce(
        (sum, f) => sum + ((f.content || '').split(/\b(?:it|test)\s*\(/g).length - 1),
        0
      );
      const assertions = testFiles.reduce(
        (sum, f) => sum + ((f.content || '').match(/\bexpect\s*\(/g) || []).length,
        0
      );

      return {
        output: {
          executed: false,
          executedRunner: null,
          verdict: 'not_executed',
          passed: null,
          workspaceDependenciesInstalled: false,
          testFilesCount: testFiles.length,
          testCasesDetected: testCases,
          assertionsDetected: assertions,
          syntaxErrors,
          reason: 'No executable Vitest runner is installed in this project workspace. Static syntax inspection is not a substitute for executing tests.',
        },
        stdout: `Test execution skipped: detected ${testFiles.length} test file(s), ${testCases} test declarations and ${assertions} assertion calls, but no executable test runner is installed.`,
        stderr: syntaxErrors.length > 0 ? syntaxErrors.join('\n') : undefined,
      };
    },
  },
  {
    name: 'install_dependencies',
    category: 'terminal',
    description: 'Install the generated project dependencies in its isolated workspace using npm ci/install with lifecycle scripts disabled.',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ['ag_ceo', 'ag_fe', 'ag_coder', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const packagePath = resolveSafeWorkspacePath(ctx.projectId, 'package.json');
      if (!fs.existsSync(packagePath)) {
        return { output: { executed: false, installed: false, reason: 'package.json is missing; no dependency manifest exists.' } };
      }
      let pkg: any;
      try {
        pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      } catch (error: any) {
        throw new Error(`Invalid package.json: ${error?.message || 'JSON parse failed'}`);
      }
      const hasDependencies = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).length > 0;
      if (!hasDependencies) {
        return { output: { executed: false, installed: false, reason: 'package.json declares no dependencies.' } };
      }
      const hasLock = fs.existsSync(path.join(root, 'package-lock.json'));
      const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
      const runNpm = (npmArgs: string[]) => runSandboxedProcess(
        command,
        process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...npmArgs] : npmArgs,
        root,
        { timeoutMs: 180000, abortSignal: ctx.abortSignal }
      );
      let npmArgs = hasLock
        ? ['ci', '--ignore-scripts', '--no-audit', '--no-fund']
        : ['install', '--ignore-scripts', '--no-audit', '--no-fund'];
      let result = await runNpm(npmArgs);
      let lockfileFallback = false;
      // Generated manifests and older lockfiles can drift. Recover with npm install
      // rather than leaving the project stuck on a stale package-lock.json.
      if (result.exitCode !== 0 && hasLock) {
        lockfileFallback = true;
        npmArgs = ['install', '--ignore-scripts', '--no-audit', '--no-fund'];
        result = await runNpm(npmArgs);
      }
      const installed = result.exitCode === 0 && fs.existsSync(path.join(root, 'node_modules'));
      return {
        output: {
          executed: true,
          installed,
          command: `npm ${npmArgs.join(' ')}`,
          exitCode: result.exitCode,
          lockfileUsed: hasLock,
          lockfileFallback,
        },
        stdout: result.stdout,
        stderr: result.stderr,
      };
    },
  },
  {
    name: 'run_build',
    category: 'terminal',
    description: 'Execute the generated application build script and verify that the expected build artifact exists; never substitute static preflight for a build.',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ['ag_ceo', 'ag_fe', 'ag_coder', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');
      const packagePath = resolveSafeWorkspacePath(ctx.projectId, 'package.json');
      if (!fs.existsSync(packagePath)) {
        return { output: { executed: false, executedBuild: false, status: 'not_executed', passed: null, reason: 'package.json is missing.' } };
      }
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (!pkg.scripts?.build || typeof pkg.scripts.build !== 'string') {
        return { output: { executed: false, executedBuild: false, status: 'not_executed', passed: null, reason: 'package.json has no build script.' } };
      }
      const binDir = path.join(root, 'node_modules', '.bin');
      if (!fs.existsSync(binDir)) {
        return { output: { executed: false, executedBuild: false, status: 'not_executed', passed: null, workspaceDependenciesInstalled: false, reason: 'Dependencies are not installed. Run install_dependencies first.' } };
      }
      const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
      const buildArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', 'run', 'build'] : ['run', 'build'];
      const result = await runSandboxedProcess(command, buildArgs, root, {
        timeoutMs: 180000,
        abortSignal: ctx.abortSignal,
      });
      const candidates = ['dist/index.html', 'build/index.html', 'out/index.html', '.next/BUILD_ID'];
      const artifacts = candidates.filter((rel) => fs.existsSync(path.join(root, rel)));
      const hasFrontendArtifact = artifacts.includes('dist/index.html');
      const requiresFrontend = proj.projectClassification?.requires_frontend !== false;
      const passed = result.exitCode === 0 && (!requiresFrontend || hasFrontendArtifact);
      return {
        output: {
          executed: true,
          executedBuild: true,
          status: passed ? 'built' : 'failed',
          passed,
          exitCode: result.exitCode,
          buildScript: pkg.scripts.build,
          artifacts,
          previewReady: artifacts.includes('dist/index.html'),
          reason: result.exitCode !== 0
            ? 'The real npm build command failed.'
            : requiresFrontend && !hasFrontendArtifact
              ? 'Build command exited successfully but no static frontend entrypoint was produced.'
              : undefined,
        },
        stdout: result.stdout,
        stderr: result.stderr,
      };
    },
  },
  {
    name: 'inspect_command_output',
    category: 'terminal',
    description: 'Retrieve full persisted stdout, stderr, duration, and status for an earlier tool executionId.',
    zodSchema: z.object({ execution_id: z.string().min(1) }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        execution_id: { type: Type.STRING, description: 'Tool execution ID to inspect.' },
      },
      required: ['execution_id'],
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const record = executionStore.getToolExecution(ctx.projectId, args.execution_id);
      if (!record) {
        throw new Error(`Tool execution record "${args.execution_id}" not found.`);
      }
      return {
        output: {
          executionId: record.executionId,
          toolName: record.toolName,
          status: record.status,
          durationMs: record.durationMs,
          stdout: record.stdout,
          stderr: record.stderr,
          error: record.error,
          result: record.output,
        },
      };
    },
  },

  // ==========================================
  // 3. GIT TOOLS
  // ==========================================
  {
    name: 'git_status',
    category: 'git',
    description: 'Check git working tree status inside the isolated project workspace repository.',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      const root = await ensureGitRepoInitialized(ctx.projectId, ctx.abortSignal);
      const res = await runSandboxedProcess('git', ['status', '--short'], root, {
        timeoutMs: 8000,
        abortSignal: ctx.abortSignal,
      });
      return {
        output: { clean: res.stdout.trim() === '', changes: res.stdout.trim().split('\n').filter(Boolean) },
        stdout: res.stdout || 'Working tree clean',
        stderr: res.stderr,
      };
    },
  },
  {
    name: 'git_diff',
    category: 'git',
    description: 'Show git diff for modified files in the project workspace.',
    zodSchema: z.object({ path: z.string().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { path: { type: Type.STRING, description: 'Optional specific file path.' } },
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const root = await ensureGitRepoInitialized(ctx.projectId, ctx.abortSignal);
      const gitArgs = ['diff', ...(args.path ? ['--', args.path] : [])];
      const res = await runSandboxedProcess('git', gitArgs, root, {
        timeoutMs: 8000,
        abortSignal: ctx.abortSignal,
      });
      return { output: { hasDiff: res.stdout.trim().length > 0 }, stdout: res.stdout || '(no diff)', stderr: res.stderr };
    },
  },
  {
    name: 'git_log',
    category: 'git',
    description: 'List recent git commits in the project workspace repository.',
    zodSchema: z.object({ limit: z.number().int().min(1).max(50).optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { limit: { type: Type.NUMBER, description: 'Max commits (default 10).' } },
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const root = await ensureGitRepoInitialized(ctx.projectId, ctx.abortSignal);
      const limit = args.limit ?? 10;
      const res = await runSandboxedProcess('git', ['log', `-${limit}`, '--oneline'], root, {
        timeoutMs: 8000,
        abortSignal: ctx.abortSignal,
      });
      const commits = res.stdout.trim().split('\n').filter(Boolean);
      return { output: { commitCount: commits.length, commits }, stdout: res.stdout, stderr: res.stderr };
    },
  },
  {
    name: 'git_branch',
    category: 'git',
    description: 'List git branches or create/switch to a feature branch inside the workspace.',
    zodSchema: z.object({ name: z.string().optional(), create: z.boolean().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Optional branch name.' },
        create: { type: Type.BOOLEAN, description: 'Create and checkout branch.' },
      },
    },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_fe', 'ag_coder', 'ag_sre'],
    requiresApproval: (args) => {
      if (args.name) {
        return {
          actionType: 'git_mutation',
          riskLevel: 'medium',
          summary: `${args.create ? 'Create and checkout' : 'Switch to'} git branch "${args.name}"`,
          details: { branch: args.name, create: Boolean(args.create) },
        };
      }
      return null;
    },
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const root = await ensureGitRepoInitialized(ctx.projectId, ctx.abortSignal);
      const gitArgs = args.name
        ? args.create
          ? ['checkout', '-b', args.name]
          : ['checkout', args.name]
        : ['branch', '--list'];
      const res = await runSandboxedProcess('git', gitArgs, root, {
        timeoutMs: 8000,
        abortSignal: ctx.abortSignal,
      });
      return { output: { success: res.exitCode === 0, result: res.stdout.trim() }, stdout: res.stdout, stderr: res.stderr };
    },
  },
  {
    name: 'git_commit',
    category: 'git',
    description: 'Stage all workspace files and create a local git commit (requires approval gate).',
    zodSchema: z.object({ message: z.string().min(3) }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { message: { type: Type.STRING, description: 'Commit message.' } },
      required: ['message'],
    },
    allowedAgents: ['ag_ceo', 'ag_sre'],
    requiresApproval: (args) => ({
      actionType: 'git_mutation',
      riskLevel: 'medium',
      summary: `Create git commit: "${args.message}"`,
      details: { message: args.message },
    }),
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const root = await ensureGitRepoInitialized(ctx.projectId, ctx.abortSignal);
      await runSandboxedProcess('git', ['add', '-A'], root, {
        timeoutMs: 8000,
        abortSignal: ctx.abortSignal,
      });
      const res = await runSandboxedProcess('git', ['commit', '-m', args.message], root, {
        timeoutMs: 8000,
        abortSignal: ctx.abortSignal,
      });
      return {
        output: { committed: res.exitCode === 0, message: args.message },
        stdout: res.stdout,
        stderr: res.stderr,
      };
    },
  },

  // ==========================================
  // 4. RESEARCH TOOLS
  // ==========================================
  {
    name: 'web_search',
    category: 'research',
    description: 'Search public technical knowledge via DuckDuckGo Instant Answer API.',
    zodSchema: z.object({ query: z.string().min(2) }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: 'Search query.' } },
      required: ['query'],
    },
    allowedAgents: ['ag_ceo', 'ag_pm', 'ag_arch', 'ag_fe', 'ag_qa'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const target = `https://api.duckduckgo.com/?q=${encodeURIComponent(args.query)}&format=json&no_html=1&skip_disambig=1`;
      validateOutboundUrl(target);
      const res = await fetch(target, { signal: ctx.abortSignal ?? AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Search endpoint returned HTTP ${res.status}`);
      const json: any = await res.json();
      const topics = Array.isArray(json.RelatedTopics)
        ? json.RelatedTopics.slice(0, 5).map((t: any) => ({ text: t.Text, url: t.FirstURL })).filter((t: any) => t.text)
        : [];
      return {
        output: {
          query: args.query,
          abstract: json.AbstractText || '',
          heading: json.Heading || '',
          sourceUrl: json.AbstractURL || '',
          relatedTopics: topics,
        },
      };
    },
  },
  {
    name: 'fetch_url',
    category: 'research',
    description: 'Fetch a public HTTP/HTTPS URL safely after SSRF protection validation.',
    zodSchema: z.object({ url: z.string().url(), max_chars: z.number().int().min(200).max(20000).optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: 'Public http/https URL.' },
        max_chars: { type: Type.NUMBER, description: 'Max extracted text characters (default 4000).' },
      },
      required: ['url'],
    },
    allowedAgents: ['ag_ceo', 'ag_pm', 'ag_arch', 'ag_qa'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const parsed = validateOutboundUrl(args.url);
      const res = await fetch(parsed.toString(), {
        headers: { 'User-Agent': 'DevForge-AI-Research/1.0' },
        signal: ctx.abortSignal ?? AbortSignal.timeout(10000),
      });
      const text = await res.text();
      const stripped = text.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const cap = args.max_chars ?? 4000;
      return {
        output: {
          url: parsed.toString(),
          status: res.status,
          contentType: res.headers.get('content-type') || 'unknown',
          excerpt: redactSecrets(stripped.slice(0, cap)),
        },
      };
    },
  },
  {
    name: 'search_documentation',
    category: 'research',
    description: 'Search MDN / npm developer documentation for an API or package.',
    zodSchema: z.object({ topic: z.string().min(2) }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { topic: { type: Type.STRING, description: 'API, framework, or symbol name.' } },
      required: ['topic'],
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const url = `https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(args.topic)}`;
      validateOutboundUrl(url);
      const res = await fetch(url, { signal: ctx.abortSignal ?? AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`MDN docs search failed (${res.status})`);
      const data: any = await res.json();
      const docs = (data.documents || []).slice(0, 5).map((d: any) => ({
        title: d.title,
        summary: d.summary,
        url: `https://developer.mozilla.org${d.mdn_url}`,
      }));
      return { output: { topic: args.topic, results: docs } };
    },
  },
  {
    name: 'research_package',
    category: 'research',
    description: 'Query live npm registry metadata (latest version, license, description) for a package.',
    zodSchema: z.object({ package_name: z.string().min(1) }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { package_name: { type: Type.STRING, description: 'Exact npm package name.' } },
      required: ['package_name'],
    },
    allowedAgents: ALL_CORE_AGENTS,
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const encoded = encodeURIComponent(args.package_name.trim());
      const url = `https://registry.npmjs.org/${encoded}`;
      validateOutboundUrl(url);
      const res = await fetch(url, { signal: ctx.abortSignal ?? AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`npm registry returned ${res.status} for "${args.package_name}"`);
      const data: any = await res.json();
      const latest = data['dist-tags']?.latest;
      const latestInfo = latest ? data.versions?.[latest] : undefined;
      return {
        output: {
          name: data.name,
          latestVersion: latest,
          description: data.description,
          license: data.license,
          dependencies: latestInfo?.dependencies ? Object.keys(latestInfo.dependencies) : [],
        },
      };
    },
  },

  // ==========================================
  // 5. TESTING TOOLS
  // ==========================================
  {
    name: 'run_unit_tests',
    category: 'testing',
    description: 'Execute or verify unit tests inside the project workspace.',
    zodSchema: z.object({ filter: z.string().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { filter: { type: Type.STRING, description: 'Optional test file filter.' } },
    },
    allowedAgents: ['ag_ceo', 'ag_qa', 'ag_fe', 'ag_coder'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const runTestsTool = TOOL_REGISTRY.get('run_tests')!;
      return runTestsTool.execute({ test_file: args.filter }, ctx);
    },
  },
  {
    name: 'run_integration_tests',
    category: 'testing',
    description: 'Verify REST API contracts, database schema alignment, and server/client endpoint matching.',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');
      const astDiagnostics = runTypeScriptAstDiagnostics(proj);
      const audit = runAstAudit(proj, astDiagnostics);
      const indexPath = resolveSafeWorkspacePath(ctx.projectId, 'dist/index.html');
      if (proj.projectClassification?.requires_frontend === false) {
        return {
          output: {
            executed: false,
            status: 'not_executed',
            passed: null,
            reason: 'Browser preview smoke test is not applicable to a headless project; add an explicit integration test script for its runtime.',
            brokenReferences: audit.brokenReferences || [],
            astErrors: audit.errors,
          },
        };
      }
      if (!fs.existsSync(indexPath)) {
        return {
          output: {
            executed: false,
            status: 'not_executed',
            passed: null,
            reason: 'No successful dist/index.html exists. The real build must finish before preview integration checks.',
          },
        };
      }

      const port = Number(process.env.PORT) || 3000;
      const previewUrl = `http://127.0.0.1:${port}/preview/${encodeURIComponent(ctx.projectId)}/`;
      const checks: Array<{ name: string; passed: boolean; status?: number; contentType?: string; error?: string }> = [];
      try {
        const page = await fetch(previewUrl, { signal: AbortSignal.timeout(10000) });
        const html = await page.text();
        const htmlOk = page.ok && /text\/html/i.test(page.headers.get('content-type') || '') && html.includes('<');
        checks.push({ name: 'preview_html', passed: htmlOk, status: page.status, contentType: page.headers.get('content-type') || undefined });
        if (!htmlOk) {
          return { output: { executed: true, status: 'failed', passed: false, previewUrl, checks, reason: 'Preview route did not return a valid HTML document.' }, stderr: html.slice(0, 1000) };
        }

        const assetMatch = html.match(/(?:src|href)=[\"']([^\\"']+\.(?:js|css)(?:\?[^\\"']*)?)[\"']/i);
        if (assetMatch?.[1]) {
          const assetUrl = new URL(assetMatch[1], previewUrl).toString();
          const asset = await fetch(assetUrl, { signal: AbortSignal.timeout(10000) });
          const assetBody = await asset.text();
          const assetOk = asset.ok && assetBody.length > 0;
          checks.push({ name: 'first_bundled_asset', passed: assetOk, status: asset.status, contentType: asset.headers.get('content-type') || undefined });
        } else {
          checks.push({ name: 'first_bundled_asset', passed: false, error: 'No local JavaScript or CSS bundle reference was found in preview HTML.' });
        }

        const passed = checks.every((check) => check.passed) && audit.errors.length === 0 && (audit.brokenReferences || []).length === 0;
        return {
          output: {
            executed: true,
            status: passed ? 'passed' : 'failed',
            passed,
            previewUrl,
            checks,
            brokenReferences: audit.brokenReferences || [],
            astErrors: audit.errors,
            securityAlerts: audit.securityAlerts,
          },
          stdout: `Preview integration smoke test ${passed ? 'passed' : 'failed'}: ${checks.map((check) => `${check.name}=${check.passed ? 'ok' : 'failed'}`).join(', ')}.`,
          stderr: passed ? undefined : checks.filter((check) => !check.passed).map((check) => check.error || check.name).join('; '),
        };
      } catch (error: any) {
        return {
          output: { executed: true, status: 'failed', passed: false, previewUrl, checks, error: error?.message || String(error) },
          stderr: error?.message || String(error),
        };
      }
    },
  },
  {
    name: 'run_e2e_tests',
    category: 'testing',
    description: 'Execute E2E test suite if Playwright/E2E runner is installed; reports explicit availability otherwise.',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ['ag_ceo', 'ag_qa'],
    availabilityCheck: async () => {
      const hasPlaywright = fs.existsSync(path.resolve(process.cwd(), 'node_modules', '.bin', 'playwright'));
      return {
        available: hasPlaywright,
        configured: hasPlaywright,
        reason: hasPlaywright ? undefined : 'Playwright E2E runner is not installed in this environment.',
      };
    },
    execute: async (_args, ctx) => {
      const root = ensureWorkspaceSeeded(ctx.projectId);
      const pwBin = path.join(root, 'node_modules', '.bin', 'playwright');
      if (!fs.existsSync(pwBin)) {
        return {
          output: {
            executed: false,
            available: false,
            reason: 'Playwright browser runner is not installed in project workspace.',
          },
        };
      }
      const res = await runSandboxedProcess(pwBin, ['test'], root, {
        timeoutMs: 30000,
        abortSignal: ctx.abortSignal,
      });
      return {
        output: { executed: true, passed: res.exitCode === 0, exitCode: res.exitCode },
        stdout: res.stdout,
        stderr: res.stderr,
      };
    },
  },
  {
    name: 'run_playwright',
    category: 'testing',
    description: 'Check Playwright availability and execute browser verification specs.',
    zodSchema: z.object({ spec: z.string().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { spec: { type: Type.STRING, description: 'Optional Playwright spec file.' } },
    },
    allowedAgents: ['ag_ceo', 'ag_qa'],
    availabilityCheck: async () => {
      const hasPw = fs.existsSync(path.resolve(process.cwd(), 'node_modules', '.bin', 'playwright'));
      return {
        available: hasPw,
        configured: hasPw,
        reason: hasPw ? undefined : 'Playwright package is not installed.',
      };
    },
    execute: async (_args, ctx) => {
      const e2eTool = TOOL_REGISTRY.get('run_e2e_tests')!;
      return e2eTool.execute({}, ctx);
    },
  },
  {
    name: 'check_api_endpoint',
    category: 'testing',
    description: 'Send a real HTTP GET/POST health check to an API endpoint and measure latency & status.',
    zodSchema: z.object({
      url: z.string().url(),
      method: z.enum(['GET', 'HEAD', 'POST']).optional(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: 'Endpoint URL to check.' },
        method: { type: Type.STRING, description: 'HTTP method (GET, HEAD, POST).' },
      },
      required: ['url'],
    },
    allowedAgents: ['ag_ceo', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const port = Number(process.env.PORT) || 3000;
      const parsed = validateOutboundUrl(args.url, { allowLocalDevPort: port });
      const start = Date.now();
      const res = await fetch(parsed.toString(), {
        method: args.method || 'GET',
        signal: ctx.abortSignal ?? AbortSignal.timeout(8000),
      });
      const latencyMs = Date.now() - start;
      const bodyPreview = redactSecrets((await res.text()).slice(0, 1000));
      return {
        output: {
          url: parsed.toString(),
          status: res.status,
          ok: res.ok,
          latencyMs,
          bodyPreview,
        },
      };
    },
  },

  // ==========================================
  // 6. EXTERNAL / MCP / DB / DEPLOY TOOLS
  // ==========================================
  {
    name: 'mcp_discover_servers',
    category: 'external',
    description: 'Discover configured Model Context Protocol (MCP) servers from MCP_SERVERS env or .mcp.json.',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_sre'],
    availabilityCheck: async () => {
      const servers = getConfiguredMcpServers();
      return {
        available: servers.length > 0,
        configured: servers.length > 0,
        reason: servers.length > 0 ? undefined : 'No MCP servers configured in MCP_SERVERS or .mcp.json.',
      };
    },
    execute: async () => {
      const servers = getConfiguredMcpServers();
      return {
        output: {
          configured: servers.length > 0,
          count: servers.length,
          servers,
        },
      };
    },
  },
  {
    name: 'mcp_invoke_tool',
    category: 'external',
    description: 'Invoke a tool on a configured HTTP MCP server via JSON-RPC 2.0 (approval required).',
    zodSchema: z.object({
      server_name: z.string().min(1),
      tool_name: z.string().min(1),
      arguments: z.record(z.string(), z.any()).optional(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        server_name: { type: Type.STRING },
        tool_name: { type: Type.STRING },
        arguments: { type: Type.OBJECT, properties: {} },
      },
      required: ['server_name', 'tool_name'],
    },
    allowedAgents: ['ag_ceo', 'ag_sre'],
    requiresApproval: (args) => ({
      actionType: 'external_integration',
      riskLevel: 'high',
      summary: `Invoke external MCP tool "${args.tool_name}" on server "${args.server_name}"`,
      details: { server_name: args.server_name, tool_name: args.tool_name, arguments: args.arguments || {} },
    }),
    availabilityCheck: async () => {
      const servers = getConfiguredMcpServers();
      return {
        available: servers.some((s) => Boolean(s.url)),
        configured: servers.length > 0,
        reason: servers.length === 0 ? 'No MCP servers configured.' : undefined,
      };
    },
    execute: async (args, ctx) => {
      const servers = getConfiguredMcpServers();
      const target = servers.find((s) => s.name === args.server_name);
      if (!target || !target.url) {
        throw new Error(`Configured HTTP MCP server "${args.server_name}" not found.`);
      }
      const parsed = validateOutboundUrl(target.url);
      const res = await fetch(parsed.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: args.tool_name, arguments: args.arguments || {} },
        }),
        signal: ctx.abortSignal ?? AbortSignal.timeout(10000),
      });
      const json = await res.json();
      return { output: json };
    },
  },
  {
    name: 'browser_automation',
    category: 'external',
    description: 'Check headless browser automation availability; reports real configuration status.',
    zodSchema: z.object({ url: z.string().url().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { url: { type: Type.STRING } },
    },
    allowedAgents: ['ag_ceo', 'ag_qa'],
    availabilityCheck: async () => {
      const hasPw = fs.existsSync(path.resolve(process.cwd(), 'node_modules', '.bin', 'playwright'));
      return {
        available: hasPw,
        configured: hasPw,
        reason: hasPw ? undefined : 'Headless Chromium / Playwright binary not installed in container.',
      };
    },
    execute: async () => {
      return {
        output: {
          available: false,
          reason: 'Headless browser binary not installed; use check_api_endpoint for live HTTP verification.',
        },
      };
    },
  },
  {
    name: 'inspect_database',
    category: 'external',
    description: 'Inspect persisted execution store metrics and workspace SQL schema tables (read-only, secret-redacted).',
    zodSchema: z.object({}),
    geminiParameters: { type: Type.OBJECT, properties: {} },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      const proj = executionStore.getProject(ctx.projectId);
      const runs = executionStore.getRunsForProject(ctx.projectId);
      const sqlFile = proj?.files?.find((f) => f.path.endsWith('.sql'));
      const tables = sqlFile?.content
        ? Array.from(sqlFile.content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi)).map(
            (m) => m[1]
          )
        : [];
      return {
        output: {
          projectId: ctx.projectId,
          persistedRunsCount: runs.length,
          latestRunStatus: runs[0]?.status || 'none',
          schemaTablesDetected: tables,
        },
      };
    },
  },
  {
    name: 'deploy_integration',
    category: 'external',
    description: 'Deploy project artifacts to GitHub or Vercel (requires explicit approval & configured credentials).',
    zodSchema: z.object({
      provider: z.enum(['github', 'vercel']),
      target_name: z.string().min(1),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        provider: { type: Type.STRING, description: 'github or vercel' },
        target_name: { type: Type.STRING, description: 'Repository or Vercel project name' },
      },
      required: ['provider', 'target_name'],
    },
    allowedAgents: ['ag_ceo', 'ag_sre'],
    requiresApproval: (args) => ({
      actionType: 'deployment',
      riskLevel: 'critical',
      summary: `Deploy project to ${args.provider.toUpperCase()} (${args.target_name})`,
      details: { provider: args.provider, target_name: args.target_name },
    }),
    availabilityCheck: async () => {
      const gh = Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim().length > 5);
      const vc = Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_TOKEN.trim().length > 5);
      return {
        available: gh || vc,
        configured: gh || vc,
        reason: gh || vc ? undefined : 'Neither GITHUB_TOKEN nor VERCEL_TOKEN is configured.',
      };
    },
    execute: async (args, ctx) => {
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');
      if (args.provider === 'github') {
        const token = process.env.GITHUB_TOKEN;
        if (!token) throw new Error('GITHUB_TOKEN is not configured.');
        const res = await pushProjectToGitHub({
          token,
          repoName: args.target_name,
          files: proj.files || [],
          appName: proj.name,
        });
        return { output: res };
      } else {
        const token = process.env.VERCEL_TOKEN;
        if (!token) throw new Error('VERCEL_TOKEN is not configured.');
        const res = await deployProjectToVercel({
          token,
          projectName: args.target_name,
          files: proj.files || [],
          appName: proj.name,
        });
        return { output: res };
      }
    },
  },

  // ==========================================
  // 7. ORCHESTRATION & AUDIT TOOLS
  // ==========================================
  {
    name: 'run_ast_audit',
    category: 'orchestration',
    description: 'Perform TypeScript AST parsing, endpoint cross-reference checks, OWASP scanning, and port 3000 verification.',
    zodSchema: z.object({ project_id: z.string().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { project_id: { type: Type.STRING } },
    },
    allowedAgents: ['ag_ceo', 'ag_arch', 'ag_qa', 'ag_sre'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');
      const compilerDiagnostics = runTypeScriptAstDiagnostics(proj);
      const astResult = runAstAudit(proj, compilerDiagnostics);
      proj.astAudit = astResult;
      proj.updatedAt = new Date().toISOString();
      executionStore.saveProject(proj);
      return {
        output: astResult,
        stdout: astResult.passed
          ? `AST Audit PASSED (${astResult.filesParsed || 0} files parsed, 0 errors).`
          : undefined,
        stderr: astResult.errors.length > 0 ? astResult.errors.join('\n') : undefined,
      };
    },
  },
  {
    name: 'run_coverage_analysis',
    category: 'orchestration',
    description: 'Run symbol & branch coverage instrumentation against project test files and screen for test theater.',
    zodSchema: z.object({
      project_id: z.string().optional(),
      target_files: z.array(z.string()).optional(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        project_id: { type: Type.STRING },
        target_files: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    allowedAgents: ['ag_ceo', 'ag_qa'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');
      const audit = runCoverageAnalysis(proj, args.target_files);
      proj.testQualityAudit = audit;
      proj.updatedAt = new Date().toISOString();
      executionStore.saveProject(proj);
      return {
        output: audit,
        stdout: `Coverage Analysis (${audit.verdict}): Line ${audit.lineCoverage}%, Branch ${audit.branchCoverage}%, Function ${audit.functionCoverage || 0}%.`,
      };
    },
  },
  {
    name: 'write_swarm_state',
    category: 'orchestration',
    description: 'Flush current project & execution run state cleanly to durable store.',
    zodSchema: z.object({ project_id: z.string().optional() }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: { project_id: { type: Type.STRING } },
    },
    allowedAgents: ['ag_ceo'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (_args, ctx) => {
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');
      proj.updatedAt = new Date().toISOString();
      executionStore.saveProject(proj);
      executionStore.flushSync();
      return { output: { synced: true, projectId: proj.id, status: proj.status } };
    },
  },
  {
    name: 'grant_deployment_certificate',
    category: 'orchestration',
    description: 'Issue cryptographic deployment certificate after AST audit and Test Quality Audit pass.',
    zodSchema: z.object({
      project_id: z.string().optional(),
      verification_hash: z.string().optional(),
    }),
    geminiParameters: {
      type: Type.OBJECT,
      properties: {
        project_id: { type: Type.STRING },
        verification_hash: { type: Type.STRING },
      },
    },
    allowedAgents: ['ag_ceo'],
    availabilityCheck: async () => ({ available: true, configured: true }),
    execute: async (args, ctx) => {
      const proj = executionStore.getProject(ctx.projectId);
      if (!proj) throw new Error('Project not found');

      const compilerDiagnostics = runTypeScriptAstDiagnostics(proj);
      const astResult = proj.astAudit || runAstAudit(proj, compilerDiagnostics);
      const coverageResult = proj.testQualityAudit || runCoverageAnalysis(proj);
      proj.astAudit = astResult;
      proj.testQualityAudit = coverageResult;

      if (!astResult.passed) {
        throw new Error(`AST audit failed (${astResult.errors.join('; ')}). Certificate withheld.`);
      }
      if (coverageResult.verdict !== 'pass') {
        throw new Error(`Test quality audit failed (${coverageResult.verdict}). Certificate withheld.`);
      }

      const certHash =
        args.verification_hash ||
        `cert_sha256_${crypto.createHash('sha256').update(`${proj.id}:${Date.now()}`).digest('hex').slice(0, 16)}`;

      proj.deploymentCertificate = {
        certifiedAt: new Date().toISOString(),
        certificateHash: certHash,
        certifiedBy: 'Aria, DevForge CEO Executive Orchestrator',
        verdict: 'VERIFIED_AND_CERTIFIED',
      };
      proj.status = 'deployed';
      proj.deployedUrl = `/preview/${proj.id}`;
      proj.updatedAt = new Date().toISOString();
      executionStore.saveProject(proj);

      return { output: proj.deploymentCertificate };
    },
  },
];

export const TOOL_REGISTRY = new Map<string, RegisteredTool>(
  registryEntries.map((t) => [t.name, t])
);

export function getRegisteredToolNames(): string[] {
  return Array.from(TOOL_REGISTRY.keys());
}

export function getGeminiFunctionDeclarationsForAgent(
  agentId: string,
  allowedToolsOverride?: string[]
): FunctionDeclaration[] {
  const declarations: FunctionDeclaration[] = [];
  for (const tool of TOOL_REGISTRY.values()) {
    const allowedByOverride = allowedToolsOverride
      ? allowedToolsOverride.includes(tool.name)
      : tool.allowedAgents.includes(agentId);
    if (!allowedByOverride) continue;
    declarations.push({
      name: tool.name,
      description: tool.description,
      parameters: tool.geminiParameters,
    });
  }
  return declarations;
}

export async function getAllToolsAvailabilityStatus(): Promise<ToolAvailabilityStatus[]> {
  const results: ToolAvailabilityStatus[] = [];
  for (const tool of TOOL_REGISTRY.values()) {
    let status: { available: boolean; configured: boolean; reason?: string } = {
      available: false,
      configured: false,
      reason: 'Status check failed',
    };
    try {
      status = await tool.availabilityCheck();
    } catch (err: any) {
      status = { available: false, configured: false, reason: err.message };
    }
    results.push({
      name: tool.name,
      category: tool.category,
      description: tool.description,
      available: status.available,
      configured: status.configured,
      reason: status.reason,
      requiresApproval: Boolean(tool.requiresApproval),
      allowedAgents: tool.allowedAgents,
    });
  }
  return results;
}

export function isAgentAuthorizedForTool(
  agentId: string,
  toolName: string,
  allowedToolsOverride?: string[]
): boolean {
  const tool = TOOL_REGISTRY.get(toolName);
  if (!tool) return false;
  if (allowedToolsOverride) {
    return allowedToolsOverride.includes(toolName);
  }
  return tool.allowedAgents.includes(agentId);
}

/**
 * Unified server-side tool invocation pipeline:
 * 1. Allowlist check
 * 2. Agent/subagent RBAC check
 * 3. Strict Zod argument validation
 * 4. Approval Gate check (pauses execution cleanly until approved/rejected/cancelled)
 * 5. Real handler execution with timeout & cancellation
 * 6. Secret redaction, durable persistence, and ordered live SSE events
 */
export async function executeRegisteredTool(
  toolName: string,
  rawArgs: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<ToolExecutionRecord> {
  const executionId = `exec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const tool = TOOL_REGISTRY.get(toolName);
  const record: ToolExecutionRecord = {
    executionId,
    runId: ctx.runId,
    projectId: ctx.projectId,
    taskId: ctx.taskId,
    agentId: ctx.agentId,
    agentName: ctx.agentName,
    subagentId: ctx.subagentId,
    subagentName: ctx.subagentName,
    toolName,
    category: tool?.category || 'workspace',
    status: 'pending',
    timestamp: startedAt,
    startedAt,
    retries: ctx.retries ?? 0,
    inputArgs: redactObject(rawArgs || {}),
  };

  executionStore.upsertToolExecution(ctx.runId, record);
  eventBus.emit(
    ctx.projectId,
    ctx.runId,
    'tool:pending',
    {
      toolName,
      category: record.category,
      agentName: ctx.agentName,
      subagentName: ctx.subagentName,
      inputArgs: record.inputArgs,
    },
    { agentId: ctx.agentId, subagentId: ctx.subagentId, taskId: ctx.taskId, executionId }
  );

  const failRecord = (errorMessage: string, extra?: Partial<ToolExecutionRecord>): ToolExecutionRecord => {
    const completedAt = new Date().toISOString();
    Object.assign(record, extra, {
      status: ctx.abortSignal?.aborted ? 'cancelled' : extra?.status || 'failed',
      completedAt,
      durationMs: Math.max(0, Date.now() - startMs),
      error: redactSecrets(errorMessage),
    });
    executionStore.upsertToolExecution(ctx.runId, record);
    eventBus.emit(
      ctx.projectId,
      ctx.runId,
      'tool:failed',
      {
        toolName,
        category: record.category,
        agentName: ctx.agentName,
        subagentName: ctx.subagentName,
        durationMs: record.durationMs,
        error: record.error,
      },
      { agentId: ctx.agentId, subagentId: ctx.subagentId, taskId: ctx.taskId, executionId }
    );
    return record;
  };

  if (ctx.abortSignal?.aborted) {
    return failRecord('Tool invocation cancelled prior to execution.', { status: 'cancelled' });
  }

  // 1. Strict Registry Allowlist
  if (!tool) {
    return failRecord(`Tool "${toolName}" is not registered in TOOL_REGISTRY.`);
  }

  // 2. Agent/Subagent Permission Check
  if (!isAgentAuthorizedForTool(ctx.agentId, toolName, ctx.allowedToolsOverride)) {
    return failRecord(
      `Permission denied: agent "${ctx.agentName}" (${ctx.agentId}) is not authorized to invoke "${toolName}".`
    );
  }

  // 3. Strict Schema Validation
  const parsed = tool.zodSchema.safeParse(rawArgs || {});
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`).join('; ');
    return failRecord(`Invalid tool arguments for "${toolName}": ${issues}`);
  }

  // 4. Approval Gate
  if (!ctx.preApproved && tool.requiresApproval) {
    const gate = tool.requiresApproval(parsed.data, ctx);
    if (gate) {
      const approvalId = `appr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const approval: ApprovalRequest = {
        id: approvalId,
        runId: ctx.runId,
        projectId: ctx.projectId,
        taskId: ctx.taskId,
        executionId,
        agentId: ctx.agentId,
        agentName: ctx.agentName,
        toolName,
        actionType: gate.actionType,
        riskLevel: gate.riskLevel,
        summary: redactSecrets(gate.summary),
        details: redactObject(gate.details),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      record.status = 'awaiting_approval';
      record.approvalId = approvalId;
      executionStore.upsertApproval(ctx.runId, approval);
      executionStore.upsertToolExecution(ctx.runId, record);

      const run = executionStore.getRun(ctx.runId);
      if (run) {
        run.status = 'awaiting_approval';
        executionStore.saveRun(run);
      }

      eventBus.emit(
        ctx.projectId,
        ctx.runId,
        'approval:requested',
        {
          approvalId,
          toolName,
          agentName: ctx.agentName,
          actionType: approval.actionType,
          riskLevel: approval.riskLevel,
          summary: approval.summary,
          details: approval.details,
        },
        { agentId: ctx.agentId, taskId: ctx.taskId, executionId }
      );

      const approved = await new Promise<boolean>((resolve) => {
        const timeoutMs = ctx.approvalTimeoutMs ?? 5 * 60 * 1000;
        const onAbort = () => {
          pendingApprovalWaiters.delete(approvalId);
          clearTimeout(timer);
          resolve(false);
        };
        const timer = setTimeout(() => {
          pendingApprovalWaiters.delete(approvalId);
          ctx.abortSignal?.removeEventListener('abort', onAbort);
          resolve(false);
        }, timeoutMs);
        ctx.abortSignal?.addEventListener('abort', onAbort, { once: true });
        pendingApprovalWaiters.set(approvalId, {
          resolve: (ok) => {
            ctx.abortSignal?.removeEventListener('abort', onAbort);
            resolve(ok);
          },
          reject: () => resolve(false),
          timer,
        });
      });

      const currentRun = executionStore.getRun(ctx.runId);
      if (currentRun && currentRun.status === 'awaiting_approval' && !ctx.abortSignal?.aborted) {
        currentRun.status = 'running';
        executionStore.saveRun(currentRun);
      }

      if (!approved) {
        if (approval.status === 'pending') {
          approval.status = ctx.abortSignal?.aborted ? 'expired' : 'rejected';
          approval.resolvedAt = new Date().toISOString();
          approval.resolutionNote = ctx.abortSignal?.aborted ? 'Cancelled' : 'Timed out or rejected';
          executionStore.upsertApproval(ctx.runId, approval);
        }
        return failRecord(`Action "${toolName}" rejected or timed out at human approval gate.`, {
          status: ctx.abortSignal?.aborted ? 'cancelled' : 'rejected',
        });
      }
    }
  }

  // 5. Running phase
  record.status = 'running';
  executionStore.upsertToolExecution(ctx.runId, record);
  eventBus.emit(
    ctx.projectId,
    ctx.runId,
    'tool:running',
    {
      toolName,
      category: record.category,
      agentName: ctx.agentName,
      subagentName: ctx.subagentName,
    },
    { agentId: ctx.agentId, subagentId: ctx.subagentId, taskId: ctx.taskId, executionId }
  );

  try {
    const result = await tool.execute(parsed.data, ctx);
    const completedAt = new Date().toISOString();
    record.status = 'success';
    record.completedAt = completedAt;
    record.durationMs = Math.max(0, Date.now() - startMs);
    record.output = redactObject(result.output);
    record.stdout = result.stdout ? redactSecrets(result.stdout) : undefined;
    record.stderr = result.stderr ? redactSecrets(result.stderr) : undefined;
    if (result.filesModified) {
      record.metadata = { filesModified: result.filesModified };
    }
    executionStore.upsertToolExecution(ctx.runId, record);

    eventBus.emit(
      ctx.projectId,
      ctx.runId,
      'tool:completed',
      {
        toolName,
        category: record.category,
        agentName: ctx.agentName,
        subagentName: ctx.subagentName,
        durationMs: record.durationMs,
        output: record.output,
        stdout: record.stdout,
        stderr: record.stderr,
      },
      { agentId: ctx.agentId, subagentId: ctx.subagentId, taskId: ctx.taskId, executionId }
    );

    return record;
  } catch (err: any) {
    return failRecord(err?.message || String(err));
  }
}
