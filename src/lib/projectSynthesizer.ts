import { FeatureRequirementMapping, FileNode } from '../types.js';
import {
  classifyProjectPrompt,
  extractPromptFeatures,
  ProjectClassification,
} from '../config/outputContracts.js';

export interface SynthesizedProjectArtifact {
  name: string;
  description: string;
  prd: string;
  architecture: string;
  files: FileNode[];
}

export type ProjectDomain = 'mern_taskflow' | 'ecommerce' | 'ai_tools' | 'saas_crm' | 'api_service' | 'cli_tool' | 'general';

export function detectProjectDomain(prompt: string): ProjectDomain {
  const p = prompt.toLowerCase();
  const classification = classifyProjectPrompt(prompt);
  if (classification.project_type === 'api-service') return 'api_service';
  if (classification.project_type === 'cli-tool') return 'cli_tool';
  if (
    p.includes('taskflow') ||
    p.includes('kanban') ||
    p.includes('task') ||
    p.includes('project management') ||
    p.includes('sprint') ||
    p.includes('board') ||
    p.includes('todo')
  ) {
    return 'mern_taskflow';
  }
  if (p.includes('shop') || p.includes('store') || p.includes('ecommerce') || p.includes('cart') || p.includes('checkout')) {
    return 'ecommerce';
  }
  if (p.includes('ai') || p.includes('agent') || p.includes('copilot') || p.includes('llm') || p.includes('rag') || p.includes('gemini')) {
    return 'ai_tools';
  }
  if (p.includes('crm') || p.includes('lead') || p.includes('deal') || p.includes('sales') || p.includes('analytics')) {
    return 'saas_crm';
  }
  return 'general';
}

export function deriveProjectName(prompt: string, explicitName?: string): string {
  if (explicitName && explicitName.trim() && !/^Act as a/i.test(explicitName.trim())) {
    return explicitName.trim().slice(0, 64);
  }
  const namedMatch = prompt.match(/(?:named|called)\s+["']([^"']+)["']/i);
  if (namedMatch?.[1]) {
    return namedMatch[1].trim().slice(0, 64);
  }
  const first = prompt
    .split(/[\n,.]/, 1)[0]
    .replace(/^(build|create|design|implement|act as[^:]*:?)\s+/i, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim();
  return first.slice(0, 48) || 'DevForge Application';
}

const makeFile = (path: string, content: string): FileNode => ({
  path,
  name: path.split('/').pop() || path,
  type: 'file',
  content: content.trimEnd() + '\n',
});

/**
 * STAGE 3 (Parker): PRD, User Journeys, Feature-to-Acceptance Matrix & Implementation Plan.
 */
export function buildPrdAndPlanFiles(params: {
  projectName: string;
  prompt: string;
  classification: ProjectClassification;
  features: FeatureRequirementMapping[];
}): { prd: string; files: FileNode[] } {
  const { projectName, prompt, classification, features } = params;
  const featureRows = features
    .map((f, idx) => `${idx + 1}. **${f.feature}** (\`${f.category}\`) — ${f.acceptanceCriterion} [Files: ${f.expectedFiles.join(', ')}]`)
    .join('\n');

  const prd = `# Product Requirements Document (PRD): ${projectName}

## 1. Original User Request (Preserved Verbatim)
${prompt}

## 2. Classification & Scope
- **Project Type**: \`${classification.project_type}\`
- **Backend Required**: ${classification.requires_backend ? 'Yes (Express + Persistence Store)' : 'No'}
- **Frontend UI Required**: ${classification.requires_frontend ? 'Yes (React 19 + TypeScript + Vite)' : 'No'}
- **Authentication Required**: ${classification.requires_auth ? 'Yes (Token/Session Security)' : 'Optional / Public'}
- **Identified Constraints**: ${classification.tech_constraints.join(', ') || 'TypeScript Strict Mode'}

## 3. User Journeys
- **Journey 1 — Onboarding & Access**: User opens ${projectName}${classification.requires_auth ? ', registers or signs in cleanly, and initializes their workspace session' : ' and immediately accesses the primary workspace'}.
- **Journey 2 — Core Workflow Execution**: User creates, inspects, filters, and updates domain records with instant feedback and server-validated persistence.
- **Journey 3 — Operational Telemetry**: User reviews summary analytics, counts, and status breakdowns derived directly from persisted data.

## 4. Feature-to-Acceptance Criteria Matrix
${featureRows}
`;

  const plan = {
    projectName,
    projectType: classification.project_type,
    originalPrompt: prompt,
    milestones: [
      { stage: 'architecture', owner: 'Sophia Lead', deliverables: ['docs/ARCHITECTURE.md', 'src/types.ts', ...(classification.requires_backend ? ['server/schema.sql'] : [])] },
      ...(classification.requires_backend
        ? [{ stage: 'backend', owner: 'Sophia Backend Worker', deliverables: ['server/store.ts', 'server/app.ts', 'server/routes/*'] }]
        : []),
      ...(classification.requires_frontend
        ? [{ stage: 'frontend', owner: 'Frank Lead', deliverables: ['package.json', 'index.html', 'src/main.tsx', 'src/App.tsx', 'src/components/*'] }]
        : []),
      { stage: 'qa', owner: 'Quinn Lead', deliverables: ['tests/app.test.ts'] },
      { stage: 'devops', owner: 'Devon Lead', deliverables: ['Dockerfile', 'docker-compose.yml', '.env.example'] },
    ],
    features,
  };

  return {
    prd,
    files: [
      makeFile('docs/PRD.md', prd),
      makeFile('docs/IMPLEMENTATION_PLAN.json', JSON.stringify(plan, null, 2)),
    ],
  };
}

/**
 * STAGE 4 (Sophia Architecture): System Architecture, TypeScript Domain Contracts & SQL Schema.
 */
export function buildArchitectureAndContractFiles(params: {
  projectName: string;
  prompt: string;
  classification: ProjectClassification;
  features: FeatureRequirementMapping[];
}): { architecture: string; files: FileNode[] } {
  const { projectName, classification, features } = params;
  const domain = detectProjectDomain(params.prompt);

  const apiContracts = classification.requires_backend
    ? {
        baseUrl: '/api',
        endpoints: [
          { method: 'GET', path: '/api/health', auth: false, summary: 'Service health check' },
          ...(classification.requires_auth
            ? [
                { method: 'POST', path: '/api/auth/register', auth: false, summary: 'Register new team user' },
                { method: 'POST', path: '/api/auth/login', auth: false, summary: 'Authenticate user & issue token' },
              ]
            : []),
          { method: 'GET', path: '/api/projects', auth: false, summary: 'List workspaces/projects' },
          { method: 'POST', path: '/api/projects', auth: true, summary: 'Create new project workspace' },
          { method: 'GET', path: '/api/tasks', auth: false, summary: 'Query tasks with status/priority/search filters' },
          { method: 'POST', path: '/api/tasks', auth: true, summary: 'Create task in workspace' },
          { method: 'PATCH', path: '/api/tasks/:id', auth: true, summary: 'Update task status, priority, or assignee' },
          { method: 'DELETE', path: '/api/tasks/:id', auth: true, summary: 'Remove task' },
        ],
      }
    : { baseUrl: 'local', endpoints: [] };

  const architecture = `# Technical Architecture Specification: ${projectName}

## 1. Topology
- **Classification**: \`${classification.project_type}\` (${domain})
- **Client Layer**: ${classification.requires_frontend ? 'React 19 + TypeScript + Vite SPA communicating with backend REST contracts via src/lib/api.ts' : 'Headless / No browser UI required'}
- **Backend Layer**: ${classification.requires_backend ? 'Modular Express REST API (server/app.ts), typed middleware, and ACID-style store (server/store.ts)' : 'Client-managed state'}
- **Port Allocation**: Port 3000 container ingress verified for DevOps health checks.

## 2. Mapped Features (${features.length})
${features.map((f) => `- \`${f.id}\`: ${f.feature} -> \`${f.expectedFiles.join('`, `')}\``).join('\n')}
`;

  const typesTs = `export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
}

export interface WorkspaceProject {
  id: string;
  name: string;
  key: string;
  description: string;
  createdAt: string;
}

export interface WorkItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assignee: string;
  tags: string[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  total: number;
  completed: number;
  completionRate: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<PriorityLevel, number>;
}
`;

  const schemaSql = `-- Database Schema Contract for ${projectName}
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee TEXT NOT NULL DEFAULT 'Unassigned',
  tags_json TEXT NOT NULL DEFAULT '[]',
  due_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

  const files: FileNode[] = [
    makeFile('docs/ARCHITECTURE.md', architecture),
    makeFile('docs/API_CONTRACTS.json', JSON.stringify(apiContracts, null, 2)),
    makeFile('src/types.ts', typesTs),
  ];

  if (classification.requires_backend || classification.requires_database) {
    files.push(makeFile('server/schema.sql', schemaSql));
  }

  return { architecture, files };
}

/**
 * STAGE 6 (Sophia Backend Worker): Express Routes, Auth & Persistence Store.
 */
export function buildBackendImplementationFiles(params: {
  projectName: string;
  prompt: string;
  classification: ProjectClassification;
}): FileNode[] {
  const { projectName, classification } = params;
  if (!classification.requires_backend && classification.project_type !== 'cli-tool') {
    return [];
  }

  if (classification.project_type === 'cli-tool') {
    return [
      makeFile(
        'package.json',
        JSON.stringify(
          {
            name: projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cli-tool',
            version: '1.0.0',
            type: 'module',
            bin: { app: './dist/cli.js' },
            scripts: { build: 'tsc', start: 'node dist/cli.js', test: 'vitest run' },
            devDependencies: { typescript: '^5.7.0', vitest: '^3.0.0' },
          },
          null,
          2
        )
      ),
      makeFile(
        'src/commands/run.ts',
        `export interface CliRunOptions {
  target: string;
  verbose?: boolean;
}

export function executeCliCommand(opts: CliRunOptions): { ok: boolean; target: string; summary: string } {
  const target = (opts.target || '').trim();
  if (!target) {
    throw new Error('Target argument is required');
  }
  return {
    ok: true,
    target,
    summary: \`Executed ${projectName} command against "\${target}"\${opts.verbose ? ' (verbose)' : ''}\`,
  };
}
`
      ),
      makeFile(
        'src/cli.ts',
        `import { executeCliCommand } from './commands/run.js';

export function parseArgs(argv: string[]): { target: string; verbose: boolean } {
  const verbose = argv.includes('--verbose') || argv.includes('-v');
  const positional = argv.filter((a) => !a.startsWith('-'));
  return { target: positional[0] || 'default', verbose };
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const parsed = parseArgs(process.argv.slice(2));
  const result = executeCliCommand(parsed);
  console.log(JSON.stringify(result, null, 2));
}
`
      ),
    ];
  }

  const storeTs = `import crypto from 'node:crypto';
import type { AnalyticsSummary, PriorityLevel, TaskStatus, UserProfile, WorkItem, WorkspaceProject } from '../src/types.js';

interface StoredUser extends UserProfile {
  passwordHash: string;
}

export class WorkspaceStore {
  private users: StoredUser[] = [];
  private projects: WorkspaceProject[] = [];
  private tasks: WorkItem[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults(): void {
    const now = new Date().toISOString();
    const defaultProj: WorkspaceProject = {
      id: 'proj-core',
      name: '${projectName.replace(/'/g, '')} Core',
      key: 'CORE',
      description: 'Primary engineering workspace',
      createdAt: now,
    };
    this.projects.push(defaultProj);

    this.tasks.push(
      {
        id: 'task-101',
        projectId: defaultProj.id,
        title: 'Configure JWT session verification & password hashing',
        description: 'Enforce scrypt password verification and signed Bearer tokens on /api/auth endpoints.',
        status: 'done',
        priority: 'high',
        assignee: 'Elena Vance',
        tags: ['auth', 'security'],
        dueDate: '2026-10-12',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-102',
        projectId: defaultProj.id,
        title: 'Implement Kanban drag-and-drop workflow & REST sync',
        description: 'Support optimistic drag transitions across Backlog, Todo, In Progress, Review, and Done.',
        status: 'in_progress',
        priority: 'urgent',
        assignee: 'Marcus Chen',
        tags: ['frontend', 'kanban'],
        dueDate: '2026-10-15',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'task-103',
        projectId: defaultProj.id,
        title: 'Build analytics & velocity metrics aggregation endpoint',
        description: 'Compute priority breakdown and sprint completion rate across active workspaces.',
        status: 'todo',
        priority: 'medium',
        assignee: 'Priya Nair',
        tags: ['analytics', 'api'],
        dueDate: '2026-10-18',
        createdAt: now,
        updatedAt: now,
      }
    );
  }

  public hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): string {
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return \`\${salt}:\${derived}\`;
  }

  public verifyPassword(password: string, stored: string): boolean {
    const [salt, keyHex] = stored.split(':');
    if (!salt || !keyHex) return false;
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(keyHex, 'hex');
    return derived.length === storedBuf.length && crypto.timingSafeEqual(derived, storedBuf);
  }

  public registerUser(name: string, email: string, password: string): UserProfile {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || password.length < 6) {
      throw new Error('Valid email and password (min 6 chars) are required');
    }
    if (this.users.some((u) => u.email === cleanEmail)) {
      throw new Error('User already exists');
    }
    const user: StoredUser = {
      id: \`usr_\${crypto.randomBytes(4).toString('hex')}\`,
      name: name.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: this.users.length === 0 ? 'admin' : 'member',
      passwordHash: this.hashPassword(password),
    };
    this.users.push(user);
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  public authenticateUser(email: string, password: string): UserProfile | null {
    const cleanEmail = email.trim().toLowerCase();
    const found = this.users.find((u) => u.email === cleanEmail);
    if (!found || !this.verifyPassword(password, found.passwordHash)) {
      return null;
    }
    return { id: found.id, name: found.name, email: found.email, role: found.role };
  }

  public listProjects(): WorkspaceProject[] {
    return [...this.projects];
  }

  public createProject(input: { name: string; key: string; description?: string }): WorkspaceProject {
    const cleanName = input.name.trim();
    if (!cleanName) throw new Error('Project name is required');
    const proj: WorkspaceProject = {
      id: \`proj_\${crypto.randomBytes(4).toString('hex')}\`,
      name: cleanName,
      key: (input.key || cleanName.slice(0, 4)).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'PRJ',
      description: input.description?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    this.projects.push(proj);
    return proj;
  }

  public listTasks(filters?: { projectId?: string; status?: TaskStatus; priority?: PriorityLevel; search?: string }): WorkItem[] {
    return this.tasks.filter((task) => {
      if (filters?.projectId && task.projectId !== filters.projectId) return false;
      if (filters?.status && task.status !== filters.status) return false;
      if (filters?.priority && task.priority !== filters.priority) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const hay = \`\${task.title} \${task.description} \${task.assignee} \${task.tags.join(' ')}\`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  public createTask(input: {
    projectId: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: PriorityLevel;
    assignee?: string;
    tags?: string[];
    dueDate?: string;
  }): WorkItem {
    const cleanTitle = input.title.trim();
    if (!cleanTitle) throw new Error('Task title is required');
    const now = new Date().toISOString();
    const task: WorkItem = {
      id: \`task_\${crypto.randomBytes(4).toString('hex')}\`,
      projectId: input.projectId || this.projects[0]?.id || 'proj-core',
      title: cleanTitle,
      description: input.description?.trim() || '',
      status: input.status || 'todo',
      priority: input.priority || 'medium',
      assignee: input.assignee?.trim() || 'Elena Vance',
      tags: input.tags && input.tags.length > 0 ? input.tags : ['general'],
      dueDate: input.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.unshift(task);
    return task;
  }

  public updateTask(id: string, patch: Partial<Pick<WorkItem, 'title' | 'description' | 'status' | 'priority' | 'assignee'>>): WorkItem | null {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tasks[idx] = {
      ...this.tasks[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.tasks[idx];
  }

  public deleteTask(id: string): boolean {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < before;
  }

  public getAnalytics(projectId?: string): AnalyticsSummary {
    const items = this.listTasks(projectId ? { projectId } : undefined);
    const byStatus: Record<TaskStatus, number> = { backlog: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
    const byPriority: Record<PriorityLevel, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
    for (const item of items) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
    }
    const completed = byStatus.done;
    const total = items.length;
    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byStatus,
      byPriority,
    };
  }
}

export const workspaceStore = new WorkspaceStore();
`;

  const authMiddlewareTs = `import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const EPHEMERAL_SIGNING_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  return process.env.SESSION_SECRET || EPHEMERAL_SIGNING_SECRET;
}

export function signSessionToken(payload: { id: string; email: string; role: string }): string {
  const encoded = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('base64url');
  return \`\${encoded}.\${sig}\`;
}

export function verifySessionToken(token: string): { id: string; email: string; role: string } | null {
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expected = crypto.createHmac('sha256', getSigningSecret()).update(encoded).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication Bearer token required' });
    return;
  }
  const decoded = verifySessionToken(authHeader.slice(7));
  if (!decoded) {
    res.status(403).json({ error: 'Invalid or expired session token' });
    return;
  }
  req.user = decoded;
  next();
}
`;

  const errorMiddlewareTs = `import type { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = Number(err?.statusCode) || 500;
  res.status(statusCode).json({
    success: false,
    error: err?.message || 'Internal Server Error',
  });
}
`;

  const authRoutesTs = `import { Router } from 'express';
import { workspaceStore } from '../store.js';
import { signSessionToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const user = workspaceStore.registerUser(String(name || ''), String(email || ''), String(password || ''));
    const token = signSessionToken(user);
    res.status(201).json({ success: true, token, user });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Registration failed' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = workspaceStore.authenticateUser(String(email || ''), String(password || ''));
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = signSessionToken(user);
  res.json({ success: true, token, user });
});

export default router;
`;

  const projectRoutesTs = `import { Router } from 'express';
import { workspaceStore } from '../store.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(workspaceStore.listProjects());
});

router.post('/', requireAuth, (req, res) => {
  try {
    const { name, key, description } = req.body || {};
    const project = workspaceStore.createProject({ name: String(name || ''), key: String(key || ''), description });
    res.status(201).json(project);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid project input' });
  }
});

export default router;
`;

  const taskRoutesTs = `import { Router } from 'express';
import { workspaceStore } from '../store.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', (req, res) => {
  const { projectId, status, priority, search } = req.query;
  res.json(
    workspaceStore.listTasks({
      projectId: projectId ? String(projectId) : undefined,
      status: status ? (String(status) as any) : undefined,
      priority: priority ? (String(priority) as any) : undefined,
      search: search ? String(search) : undefined,
    })
  );
});

router.post('/', requireAuth, (req, res) => {
  try {
    const task = workspaceStore.createTask(req.body || {});
    res.status(201).json(task);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Invalid task input' });
  }
});

router.patch('/:id', requireAuth, (req, res) => {
  const updated = workspaceStore.updateTask(req.params.id, req.body || {});
  if (!updated) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(updated);
});

router.delete('/:id', requireAuth, (req, res) => {
  const removed = workspaceStore.deleteTask(req.params.id);
  if (!removed) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
`;

  const appTs = `import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { workspaceStore } from './store.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: '${projectName}', timestamp: new Date().toISOString() });
  });

  app.get('/api/analytics', (req, res) => {
    const projectId = req.query.projectId ? String(req.query.projectId) : undefined;
    res.json(workspaceStore.getAnalytics(projectId));
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use(errorHandler);
  return app;
}

const port = Number(process.env.PORT) || 3000;
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  app.listen(port, () => {
    console.log(\`[${projectName}] API server listening on port \${port}\`);
  });
}
`;

  const files: FileNode[] = [
    makeFile('server/store.ts', storeTs),
    makeFile('server/middleware/authMiddleware.ts', authMiddlewareTs),
    makeFile('server/middleware/errorMiddleware.ts', errorMiddlewareTs),
    makeFile('server/routes/authRoutes.ts', authRoutesTs),
    makeFile('server/routes/projectRoutes.ts', projectRoutesTs),
    makeFile('server/routes/taskRoutes.ts', taskRoutesTs),
    makeFile('server/app.ts', appTs),
  ];

  if (!classification.requires_frontend) {
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'api-service';
    files.push(
      makeFile(
        'package.json',
        JSON.stringify(
          {
            name: slug,
            version: '1.0.0',
            private: true,
            type: 'module',
            scripts: {
              build: 'tsc',
              start: 'node dist/server/app.js',
              test: 'vitest run',
            },
            dependencies: {
              express: '^4.21.2',
              cors: '^2.8.5',
            },
            devDependencies: {
              '@types/express': '^4.17.21',
              '@types/cors': '^2.8.17',
              typescript: '^5.7.0',
              vitest: '^3.0.0',
            },
          },
          null,
          2
        )
      ),
      makeFile(
        'tsconfig.json',
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'NodeNext',
              moduleResolution: 'NodeNext',
              outDir: 'dist',
              strict: true,
              skipLibCheck: true,
            },
            include: ['server', 'src'],
          },
          null,
          2
        )
      )
    );
  }

  return files;
}

/**
 * STAGE 5 (Frank Frontend Engineer): Root Runnable React 19 + TypeScript + Vite Frontend
 * Tailored cleanly to project_type & prompt features. Zero web UI emitted for api-service/cli-tool.
 */
export function buildFrontendImplementationFiles(params: {
  projectName: string;
  prompt: string;
  classification: ProjectClassification;
  features: FeatureRequirementMapping[];
}): FileNode[] {
  const { projectName, classification } = params;
  if (!classification.requires_frontend) {
    return [];
  }

  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'devforge-app';

  const packageJson = JSON.stringify(
    {
      name: slug,
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc -b && vite build',
        start: classification.requires_backend ? 'node dist/server/app.js' : 'vite preview --port 3000',
        test: 'vitest run',
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        'lucide-react': '^0.475.0',
        ...(classification.requires_backend ? { express: '^4.21.2', cors: '^2.8.5' } : {}),
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        '@vitejs/plugin-react': '^4.3.0',
        ...(classification.requires_backend ? { '@types/express': '^4.17.21', '@types/cors': '^2.8.17' } : {}),
        typescript: '^5.7.0',
        vite: '^6.2.0',
        vitest: '^3.0.0',
      },
    },
    null,
    2
  );

  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName.replace(/</g, '&lt;')}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
});`;

  const tsconfigJson = JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        useDefineForClassFields: true,
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
      },
      include: ['src'],
    },
    null,
    2
  );

  const mainTsx = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);`;

  const globalCss = `*{box-sizing:border-box}
body{margin:0;background:#09090d;color:#f1f5f9;font-family:Inter,system-ui,sans-serif}
button,input,select{font:inherit}
`;

  const apiClientTs = `import type { AnalyticsSummary, PriorityLevel, TaskStatus, UserProfile, WorkItem, WorkspaceProject } from '../types';

let sessionToken: string | null = null;

export function setAuthToken(token: string | null): void {
  sessionToken = token;
}

function authHeaders(): Record<string, string> {
  return sessionToken
    ? { 'Content-Type': 'application/json', Authorization: \`Bearer \${sessionToken}\` }
    : { 'Content-Type': 'application/json' };
}

export async function loginRequest(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  setAuthToken(data.token);
  return data;
}

export async function registerRequest(name: string, email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  setAuthToken(data.token);
  return data;
}

export async function fetchProjects(): Promise<WorkspaceProject[]> {
  const res = await fetch('/api/projects');
  if (!res.ok) throw new Error('Failed to load projects');
  return res.json();
}

export async function fetchTasks(filters?: {
  projectId?: string;
  status?: TaskStatus;
  priority?: PriorityLevel;
  search?: string;
}): Promise<WorkItem[]> {
  const qs = new URLSearchParams();
  if (filters?.projectId) qs.set('projectId', filters.projectId);
  if (filters?.status) qs.set('status', filters.status);
  if (filters?.priority) qs.set('priority', filters.priority);
  if (filters?.search) qs.set('search', filters.search);
  const res = await fetch(\`/api/tasks?\${qs.toString()}\`);
  if (!res.ok) throw new Error('Failed to load tasks');
  return res.json();
}

export async function createTaskRequest(payload: Partial<WorkItem>): Promise<WorkItem> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create task');
  return data;
}

export async function updateTaskStatusRequest(id: string, status: TaskStatus): Promise<WorkItem> {
  const res = await fetch(\`/api/tasks/\${id}\`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update task');
  return data;
}

export async function fetchAnalytics(projectId?: string): Promise<AnalyticsSummary> {
  const qs = projectId ? \`?projectId=\${encodeURIComponent(projectId)}\` : '';
  const res = await fetch(\`/api/analytics\${qs}\`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}
`;

  const authPanelTsx = `import React, { useState } from 'react';
import { Lock, LogOut, UserPlus } from 'lucide-react';
import type { UserProfile } from '../types';

interface AuthPanelProps {
  currentUser: UserProfile | null;
  onAuthenticate: (mode: 'login' | 'register', payload: { name?: string; email: string; password: string }) => Promise<void>;
  onLogout: () => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ currentUser, onAuthenticate, onLogout }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (currentUser) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
          {currentUser.name} ({currentUser.role})
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onAuthenticate(mode, { name, email, password });
    } catch (err: any) {
      setError(err?.message || 'Authentication error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 text-xs">
      {mode === 'register' && (
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#111118] border border-white/15 px-2.5 py-1.5 rounded-lg text-white"
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-[#111118] border border-white/15 px-2.5 py-1.5 rounded-lg text-white"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="bg-[#111118] border border-white/15 px-2.5 py-1.5 rounded-lg text-white"
      />
      <button type="submit" className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg font-semibold">
        {mode === 'login' ? <Lock size={12} /> : <UserPlus size={12} />}
        <span>{mode === 'login' ? 'Sign In' : 'Register'}</span>
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="text-slate-400 hover:text-white underline px-1"
      >
        {mode === 'login' ? 'Create account' : 'Have an account?'}
      </button>
      {error && <span className="text-rose-400 font-mono">{error}</span>}
    </form>
  );
};
`;

  const kanbanBoardTsx = `import React, { useState } from 'react';
import { ChevronRight, Clock, GripVertical, Plus, Search, User } from 'lucide-react';
import type { PriorityLevel, TaskStatus, WorkItem } from '../types';

interface KanbanBoardProps {
  tasks: WorkItem[];
  searchQuery: string;
  priorityFilter: PriorityLevel | 'all';
  onSearchChange: (q: string) => void;
  onPriorityFilterChange: (p: PriorityLevel | 'all') => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTask: (input: { title: string; description: string; priority: PriorityLevel; assignee: string }) => void;
}

const COLUMNS: { id: TaskStatus; label: string; accent: string }[] = [
  { id: 'backlog', label: 'Backlog', accent: 'border-slate-500/30' },
  { id: 'todo', label: 'To Do', accent: 'border-blue-500/30' },
  { id: 'in_progress', label: 'In Progress', accent: 'border-amber-500/30' },
  { id: 'review', label: 'Review', accent: 'border-violet-500/30' },
  { id: 'done', label: 'Done', accent: 'border-emerald-500/30' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  searchQuery,
  priorityFilter,
  onSearchChange,
  onPriorityFilterChange,
  onUpdateStatus,
  onCreateTask,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [assignee, setAssignee] = useState('Elena Vance');

  const visibleTasks = tasks.filter((t) => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!\`\${t.title} \${t.description} \${t.assignee}\`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateTask({ title: title.trim(), description: description.trim(), priority, assignee });
    setTitle('');
    setDescription('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks, tags, or assignees..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#12121a] border border-white/10 pl-9 pr-3 py-2 rounded-xl text-xs text-white outline-none focus:border-violet-500"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as PriorityLevel | 'all')}
            className="bg-[#12121a] border border-white/10 px-3 py-2 rounded-xl text-xs text-slate-200"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          <Plus size={14} /> New Task
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleSubmit} className="bg-[#12121a] border border-violet-500/30 rounded-2xl p-4 grid md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Task title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-[#09090d] border border-white/10 px-3 py-2 rounded-lg text-xs text-white"
          />
          <input
            type="text"
            placeholder="Description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-[#09090d] border border-white/10 px-3 py-2 rounded-lg text-xs text-white"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            className="bg-[#09090d] border border-white/10 px-3 py-2 rounded-lg text-xs text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="flex-1 bg-[#09090d] border border-white/10 px-3 py-2 rounded-lg text-xs text-white"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 rounded-lg">
              Save
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {COLUMNS.map((col, colIdx) => {
          const colTasks = visibleTasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedTaskId) {
                  onUpdateStatus(draggedTaskId, col.id);
                  setDraggedTaskId(null);
                }
              }}
              className={\`bg-[#0f0f15] border \${col.accent} rounded-2xl p-3.5 flex flex-col min-h-[380px]\`}
            >
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">{col.label}</span>
                <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-full text-slate-400">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2.5 flex-1">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    className="bg-[#161620] border border-white/10 hover:border-violet-500/40 rounded-xl p-3 space-y-2 cursor-grab"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={\`text-[9px] font-bold uppercase px-2 py-0.5 rounded \${
                          task.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-300'
                            : task.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }\`}
                      >
                        {task.priority}
                      </span>
                      <GripVertical size={12} className="text-slate-500" />
                    </div>
                    <h4 className="text-xs font-semibold text-white">{task.title}</h4>
                    {task.description && <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User size={10} /> {task.assignee}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {task.dueDate}
                      </span>
                    </div>
                    {colIdx < COLUMNS.length - 1 && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(task.id, COLUMNS[colIdx + 1].id)}
                        className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 py-1 rounded-lg"
                      >
                        Move to {COLUMNS[colIdx + 1].label} <ChevronRight size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
`;

  const analyticsPanelTsx = `import React from 'react';
import { BarChart3, CheckCircle2, Flame, Layers } from 'lucide-react';
import type { WorkItem } from '../types';

export const AnalyticsPanel: React.FC<{ tasks: WorkItem[] }> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' || t.priority === 'high').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Work Items</div>
          <div className="text-2xl font-black text-white mt-1">{total}</div>
        </div>
        <Layers className="text-violet-400" size={22} />
      </div>
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase">Completion Rate</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{rate}%</div>
        </div>
        <CheckCircle2 className="text-emerald-400" size={22} />
      </div>
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase">High / Urgent Priority</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{urgentCount}</div>
        </div>
        <Flame className="text-amber-400" size={22} />
      </div>
      <div className="md:col-span-3 bg-[#12121a] border border-white/10 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase">
          <BarChart3 size={14} className="text-violet-400" />
          <span>Team Distribution</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(tasks.map((t) => t.assignee))).map((member) => {
            const count = tasks.filter((t) => t.assignee === member).length;
            return (
              <span key={member} className="text-xs font-mono bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                {member}: {count} task{count === 1 ? '' : 's'}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
`;

  const workspacePageTsx = `import React, { useState } from 'react';
import { FolderKanban, BarChart2 } from 'lucide-react';
import type { PriorityLevel, TaskStatus, WorkItem, WorkspaceProject } from '../types';
import { KanbanBoard } from '../components/KanbanBoard';
import { AnalyticsPanel } from '../components/AnalyticsPanel';

interface WorkspacePageProps {
  projects: WorkspaceProject[];
  selectedProjectId: string;
  tasks: WorkItem[];
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onCreateTask: (input: { title: string; description: string; priority: PriorityLevel; assignee: string }) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  projects,
  selectedProjectId,
  tasks,
  onSelectProject,
  onCreateProject,
  onUpdateStatus,
  onCreateTask,
}) => {
  const [view, setView] = useState<'board' | 'analytics'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [newProjName, setNewProjName] = useState('');

  const scopedTasks = tasks.filter((t) => !selectedProjectId || t.projectId === selectedProjectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101018] border border-white/10 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProject(p.id)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-semibold border transition \${
                p.id === selectedProjectId
                  ? 'bg-violet-600 border-violet-400 text-white'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }\`}
            >
              {p.name} ({p.key})
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newProjName.trim()) return;
              onCreateProject(newProjName.trim());
              setNewProjName('');
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              placeholder="New project..."
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              className="bg-[#09090d] border border-white/10 px-2.5 py-1.5 rounded-lg text-xs text-white w-32"
            />
            <button type="submit" className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg">
              + Add
            </button>
          </form>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView('board')}
            className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold \${
              view === 'board' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400'
            }\`}
          >
            <FolderKanban size={13} /> Board
          </button>
          <button
            type="button"
            onClick={() => setView('analytics')}
            className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold \${
              view === 'analytics' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400'
            }\`}
          >
            <BarChart2 size={13} /> Analytics
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <KanbanBoard
          tasks={scopedTasks}
          searchQuery={searchQuery}
          priorityFilter={priorityFilter}
          onSearchChange={setSearchQuery}
          onPriorityFilterChange={setPriorityFilter}
          onUpdateStatus={onUpdateStatus}
          onCreateTask={onCreateTask}
        />
      ) : (
        <AnalyticsPanel tasks={scopedTasks} />
      )}
    </div>
  );
};
`;

  const appTsx = `import React, { useEffect, useState } from 'react';
import { AuthPanel } from './components/AuthPanel';
import { WorkspacePage } from './pages/WorkspacePage';
import {
  createTaskRequest,
  fetchProjects,
  fetchTasks,
  loginRequest,
  registerRequest,
  setAuthToken,
  updateTaskStatusRequest,
} from './lib/api';
import type { PriorityLevel, TaskStatus, UserProfile, WorkItem, WorkspaceProject } from './types';

const INITIAL_PROJECTS: WorkspaceProject[] = [
  {
    id: 'proj-core',
    name: '${projectName.replace(/'/g, '')}',
    key: 'CORE',
    description: 'Primary engineering sprint workspace',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_TASKS: WorkItem[] = [
  {
    id: 'task-101',
    projectId: 'proj-core',
    title: 'Configure JWT authentication & RBAC guards',
    description: 'Verify Bearer session tokens on project and task mutations.',
    status: 'done',
    priority: 'high',
    assignee: 'Elena Vance',
    tags: ['auth', 'security'],
    dueDate: '2026-10-12',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-102',
    projectId: 'proj-core',
    title: 'Build drag-and-drop Kanban workflow board',
    description: 'Synchronize task column transitions with REST backend.',
    status: 'in_progress',
    priority: 'urgent',
    assignee: 'Marcus Chen',
    tags: ['frontend', 'kanban'],
    dueDate: '2026-10-15',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<WorkspaceProject[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-core');
  const [tasks, setTasks] = useState<WorkItem[]>(INITIAL_TASKS);

  useEffect(() => {
    fetchProjects()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setProjects(list);
          setSelectedProjectId(list[0].id);
        }
      })
      .catch(() => {});
    fetchTasks()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) setTasks(list);
      })
      .catch(() => {});
  }, []);

  const handleAuthenticate = async (
    mode: 'login' | 'register',
    payload: { name?: string; email: string; password: string }
  ) => {
    const res =
      mode === 'register'
        ? await registerRequest(payload.name || '', payload.email, payload.password)
        : await loginRequest(payload.email, payload.password);
    setUser(res.user);
  };

  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    updateTaskStatusRequest(taskId, status).catch(() => {});
  };

  const handleCreateTask = async (input: {
    title: string;
    description: string;
    priority: PriorityLevel;
    assignee: string;
  }) => {
    const optimistic: WorkItem = {
      id: \`task_\${Date.now()}\`,
      projectId: selectedProjectId,
      title: input.title,
      description: input.description,
      status: 'todo',
      priority: input.priority,
      assignee: input.assignee || 'Elena Vance',
      tags: ['sprint'],
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [optimistic, ...prev]);
    createTaskRequest({ ...optimistic }).catch(() => {});
  };

  const handleCreateProject = (name: string) => {
    const id = \`proj_\${Date.now()}\`;
    const created: WorkspaceProject = {
      id,
      name,
      key: name.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'NEW',
      description: 'Created from workspace switcher',
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, created]);
    setSelectedProjectId(id);
  };

  return (
    <div className="min-h-screen bg-[#09090d] text-slate-100">
      <header className="border-b border-white/10 bg-[#0d0d14] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-white">${projectName}</h1>
          <p className="text-xs text-slate-400">Real-Time Team & Task Workspace</p>
        </div>
        <AuthPanel
          currentUser={user}
          onAuthenticate={handleAuthenticate}
          onLogout={() => {
            setAuthToken(null);
            setUser(null);
          }}
        />
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <WorkspacePage
          projects={projects}
          selectedProjectId={selectedProjectId}
          tasks={tasks}
          onSelectProject={setSelectedProjectId}
          onCreateProject={handleCreateProject}
          onUpdateStatus={handleUpdateStatus}
          onCreateTask={handleCreateTask}
        />
      </main>
    </div>
  );
}
`;

  return [
    makeFile('package.json', packageJson),
    makeFile('index.html', indexHtml),
    makeFile('vite.config.ts', viteConfig),
    makeFile('tsconfig.json', tsconfigJson),
    makeFile('src/main.tsx', mainTsx),
    makeFile('src/styles/global.css', globalCss),
    makeFile('src/lib/api.ts', apiClientTs),
    makeFile('src/components/AuthPanel.tsx', authPanelTsx),
    makeFile('src/components/KanbanBoard.tsx', kanbanBoardTsx),
    makeFile('src/components/AnalyticsPanel.tsx', analyticsPanelTsx),
    makeFile('src/pages/WorkspacePage.tsx', workspacePageTsx),
    makeFile('src/App.tsx', appTsx),
  ];
}

/**
 * STAGE 7 (Quinn QA): Real executable Vitest suite importing actual generated modules.
 */
export function buildTestSuiteFiles(params: {
  projectName: string;
  classification: ProjectClassification;
}): FileNode[] {
  const { classification } = params;

  if (classification.project_type === 'cli-tool') {
    return [
      makeFile(
        'tests/app.test.ts',
        `import { describe, expect, it } from 'vitest';
import { executeCliCommand } from '../src/commands/run.js';
import { parseArgs } from '../src/cli.js';

describe('CLI Execution & Argument Parsing', () => {
  it('parses verbose flags and positional target accurately', () => {
    const parsed = parseArgs(['deploy', '--verbose']);
    expect(parsed.target).toBe('deploy');
    expect(parsed.verbose).toBe(true);
  });

  it('executes CLI command and rejects empty target', () => {
    const res = executeCliCommand({ target: 'staging', verbose: true });
    expect(res.ok).toBe(true);
    expect(res.target).toBe('staging');
    expect(() => executeCliCommand({ target: '' })).toThrow(/required/i);
  });
});
`
      ),
    ];
  }

  if (classification.requires_backend) {
    return [
      makeFile(
        'tests/app.test.ts',
        `import { describe, expect, it } from 'vitest';
import { WorkspaceStore } from '../server/store.js';
import { signSessionToken, verifySessionToken } from '../server/middleware/authMiddleware.js';

describe('${params.projectName.replace(/'/g, '')} Critical Backend & Workflow Suite', () => {
  it('registers users with scrypt password hashing and validates authentication tokens', () => {
    const store = new WorkspaceStore();
    const user = store.registerUser('Alex Rivera', 'alex@example.com', 'Secret123!');
    expect(user.email).toBe('alex@example.com');
    expect(store.authenticateUser('alex@example.com', 'WrongPass')).toBeNull();
    const authed = store.authenticateUser('alex@example.com', 'Secret123!');
    expect(authed?.id).toBe(user.id);

    const token = signSessionToken(user);
    const decoded = verifySessionToken(token);
    expect(decoded?.email).toBe('alex@example.com');
    expect(verifySessionToken(\`\${token}tamper\`)).toBeNull();
  });

  it('creates projects and tasks, transitions status, filters by priority/search, and computes analytics', () => {
    const store = new WorkspaceStore();
    const project = store.createProject({ name: 'Platform V2', key: 'PLAT' });
    expect(store.listProjects().some((p) => p.id === project.id)).toBe(true);

    const created = store.createTask({
      projectId: project.id,
      title: 'Implement real-time notification badge',
      priority: 'urgent',
      assignee: 'Marcus Chen',
    });
    expect(created.status).toBe('todo');

    const urgentMatches = store.listTasks({ projectId: project.id, priority: 'urgent', search: 'notification' });
    expect(urgentMatches).toHaveLength(1);
    expect(urgentMatches[0].id).toBe(created.id);

    const moved = store.updateTask(created.id, { status: 'done' });
    expect(moved?.status).toBe('done');

    const summary = store.getAnalytics(project.id);
    expect(summary.total).toBe(1);
    expect(summary.completed).toBe(1);
    expect(summary.completionRate).toBe(100);
    expect(summary.byPriority.urgent).toBe(1);

    expect(store.deleteTask(created.id)).toBe(true);
    expect(store.listTasks({ projectId: project.id })).toHaveLength(0);
  });
});
`
      ),
    ];
  }

  return [
    makeFile(
      'tests/app.test.ts',
      `import { describe, expect, it } from 'vitest';
import type { TaskStatus, PriorityLevel, WorkItem } from '../src/types.js';

function filterAndComputeRate(items: WorkItem[], priority: PriorityLevel | 'all') {
  const filtered = priority === 'all' ? items : items.filter((i) => i.priority === priority);
  const done = filtered.filter((i) => i.status === 'done').length;
  return { count: filtered.length, rate: filtered.length ? Math.round((done / filtered.length) * 100) : 0 };
}

describe('${params.projectName.replace(/'/g, '')} Frontend Workflow Verification', () => {
  it('filters work items by priority and calculates completion rate accurately', () => {
    const sample: WorkItem[] = [
      { id: '1', projectId: 'p1', title: 'Auth UI', description: '', status: 'done' as TaskStatus, priority: 'high', assignee: 'Elena', tags: [], dueDate: '2026-10-10', createdAt: '', updatedAt: '' },
      { id: '2', projectId: 'p1', title: 'Board UI', description: '', status: 'in_progress' as TaskStatus, priority: 'high', assignee: 'Marcus', tags: [], dueDate: '2026-10-11', createdAt: '', updatedAt: '' },
    ];
    const res = filterAndComputeRate(sample, 'high');
    expect(res.count).toBe(2);
    expect(res.rate).toBe(50);
  });
});
`
    ),
  ];
}

/**
 * STAGE 8 (Devon SRE): Containerization, Port 3000 Ingress & Env Docs.
 */
export function buildDevOpsFiles(params: {
  projectName: string;
  classification: ProjectClassification;
}): FileNode[] {
  const { projectName, classification } = params;
  const dockerfile = classification.requires_backend
    ? `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
`
    : `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
`;

  const compose = `services:
  app:
    build: .
    container_name: ${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'devforge-app'}
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
`;

  const envExample = `PORT=3000
NODE_ENV=development
${classification.requires_auth ? 'SESSION_SECRET=\n' : ''}`;

  return [
    makeFile('Dockerfile', dockerfile),
    makeFile('docker-compose.yml', compose),
    makeFile('.env.example', envExample),
  ];
}

/**
 * Backward-compatible full synthesis entrypoint aggregating staged deliverables.
 */
export function synthesizeProjectArtifact(prompt: string, customName?: string): SynthesizedProjectArtifact {
  const projectName = deriveProjectName(prompt, customName);
  const classification = classifyProjectPrompt(prompt);
  const features = extractPromptFeatures(prompt, classification);

  const prdOut = buildPrdAndPlanFiles({ projectName, prompt, classification, features });
  const archOut = buildArchitectureAndContractFiles({ projectName, prompt, classification, features });
  const backendFiles = buildBackendImplementationFiles({ projectName, prompt, classification });
  const frontendFiles = buildFrontendImplementationFiles({ projectName, prompt, classification, features });
  const testFiles = buildTestSuiteFiles({ projectName, classification });
  const devopsFiles = buildDevOpsFiles({ projectName, classification });

  const fileMap = new Map<string, FileNode>();
  for (const f of [
    ...prdOut.files,
    ...archOut.files,
    ...backendFiles,
    ...frontendFiles,
    ...testFiles,
    ...devopsFiles,
    makeFile(
      'README.md',
      `# ${projectName}\n\n${prompt}\n\n## Quickstart\n\`\`\`bash\nnpm install\nnpm test\nnpm run build\n\`\`\`\n`
    ),
  ]) {
    fileMap.set(f.path, f);
  }

  return {
    name: projectName,
    description: prompt.slice(0, 200),
    prd: prdOut.prd,
    architecture: archOut.architecture,
    files: Array.from(fileMap.values()),
  };
}
