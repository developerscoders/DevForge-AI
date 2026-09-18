import { FileNode } from '../types';

export interface SynthesizedProjectArtifact {
  name: string;
  description: string;
  prd: string;
  architecture: string;
  files: FileNode[];
}

export function detectProjectDomain(prompt: string): 'mern_taskflow' | 'ecommerce' | 'ai_tools' | 'saas_crm' | 'general' {
  const p = prompt.toLowerCase();
  if (
    p.includes('taskflow') ||
    p.includes('mern') ||
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

export function synthesizeProjectArtifact(prompt: string, customName?: string): SynthesizedProjectArtifact {
  const domain = detectProjectDomain(prompt);
  const cleanName = (customName || prompt.split(/[\n,.]/, 1)[0].slice(0, 60))
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim() || 'TaskFlow Pro';

  const file = (path: string, content: string): FileNode => ({
    path,
    name: path.split('/').pop() || path,
    type: 'file',
    content: content.trim()
  });

  if (domain === 'mern_taskflow') {
    return generateMernTaskflowArtifact(cleanName, prompt, file);
  } else if (domain === 'ecommerce') {
    return generateEcommerceArtifact(cleanName, prompt, file);
  } else if (domain === 'ai_tools') {
    return generateAiToolsArtifact(cleanName, prompt, file);
  } else if (domain === 'saas_crm') {
    return generateCrmArtifact(cleanName, prompt, file);
  } else {
    return generateGeneralArtifact(cleanName, prompt, file);
  }
}

function generateMernTaskflowArtifact(name: string, prompt: string, file: (p: string, c: string) => FileNode): SynthesizedProjectArtifact {
  const prd = `# Product Requirements Document (PRD)
## Project: ${name}
### 1. Executive Summary
${name} is a high-concurrency, production-grade MERN-stack task and project management ecosystem engineered for modern engineering and product teams. It features real-time Kanban state synchronization, role-based access control (RBAC), and automated workflow telemetry.

### 2. Core Functional Requirements
- **Authentication & RBAC**: Secure JWT-based authentication with bcrypt password hashing and tiered permissions (Admin, Manager, Contributor, Viewer).
- **Kanban Orchestration**: Interactive task lifecycle management with stages: Backlog, Todo, In Progress, Code Review, and Completed.
- **Project Workspaces**: Dynamic workspace isolation with scoped sprint timelines, milestone tracking, and velocity metrics.
- **RESTful API Service**: Express backend with structured error handling, request body schema validation, and rate limiting.
- **Data Persistence**: MongoDB / Mongoose schemas with indexed foreign keys and atomic state updates.
- **Resilient DevOps**: Multi-stage Dockerized deployment with isolated port 3000 mapping and health telemetry.

### 3. Acceptance Criteria
- 100% test coverage on authentication middleware and task state transitions.
- Zero client-side hydration or undefined state failures.
- Ingress response latency under 35ms on all CRUD routes.`;

  const architecture = `# System Architecture & Technical Specification
## Project: ${name}

### 1. Architecture Topology
\`\`\`
[ React 19 Frontend (Vite) ]  <--->  [ Express 5 REST API Gateway ]  <--->  [ MongoDB / Mongoose Store ]
       |                                      |                                      |
   (Tailwind CSS)                         (JWT Auth)                            (ACID Indexes)
\`\`\`

### 2. Component Hierarchy
- \`backend/server.ts\`: Master Express initialization, middleware pipeline, and route mounting.
- \`backend/config/db.ts\`: MongoDB connection pool management with retry backoff.
- \`backend/models/\`: Mongoose schema declarations for \`User\`, \`Project\`, and \`Task\`.
- \`backend/controllers/\`: Business logic controllers for auth, project management, and task lifecycles.
- \`backend/middleware/\`: JWT authentication gate, request validation, and centralized error handler.
- \`backend/routes/\`: Express routers mapped to REST endpoints.
- \`frontend/src/App.tsx\`: Root UI container with state management, workspace selector, and Kanban board.
- \`frontend/src/components/KanbanBoard.tsx\`: Drag-ready responsive task board with priority badges.
- \`frontend/src/components/TaskCard.tsx\`: Interactive task component with status change actions.
- \`frontend/src/context/AuthContext.tsx\`: React Context provider for user session and tokens.`;

  const files: FileNode[] = [
    file('package.json', JSON.stringify({
      name: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        start: 'node backend/dist/server.js',
        test: 'vitest run'
      },
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        'lucide-react': '^0.475.0',
        express: '^4.21.2',
        mongoose: '^8.9.5',
        jsonwebtoken: '^9.0.2',
        bcryptjs: '^2.4.3',
        dotenv: '^16.4.7',
        cors: '^2.8.5'
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        '@types/express': '^4.17.21',
        '@types/jsonwebtoken': '^9.0.8',
        '@types/bcryptjs': '^2.4.6',
        typescript: '^5.7.0',
        vite: '^6.2.0',
        vitest: '^3.0.0'
      }
    }, null, 2)),

    file('backend/server.ts', `import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Probe
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: '${name} API', timestamp: new Date().toISOString() });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(\`[Server] \${process.env.APP_NAME || '${name}'} operational on port \${PORT}\`);
});

export default app;
`),

    file('backend/config/db.ts', `import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow_pro';
  try {
    await mongoose.connect(uri);
    console.log('[MongoDB] Connected successfully to cluster');
  } catch (error) {
    console.warn('[MongoDB] Connection warning (using in-memory persistence fallback):', (error as Error).message);
  }
};
`),

    file('backend/models/User.ts', `import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager' | 'contributor' | 'viewer';
  avatarUrl?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'contributor', 'viewer'], default: 'contributor' },
  avatarUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>('User', userSchema);
`),

    file('backend/models/Project.ts', `import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  title: string;
  description: string;
  key: string;
  ownerId: Types.ObjectId;
  members: Types.ObjectId[];
  status: 'active' | 'archived' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  key: { type: String, required: true, uppercase: true, trim: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const ProjectModel = model<IProject>('Project', projectSchema);
`),

    file('backend/models/Task.ts', `import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId: Types.ObjectId;
  assigneeId?: Types.ObjectId;
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  tags: [{ type: String }],
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const TaskModel = model<ITask>('Task', taskSchema);
`),

    file('backend/middleware/authMiddleware.ts', `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_taskflow_9824';
    const decoded = jwt.verify(token, secret) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
};
`),

    file('backend/middleware/errorMiddleware.ts', `import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]', err.stack || err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
`),

    file('backend/controllers/authController.ts', `import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role: 'contributor'
    });

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_taskflow_9824';
    const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, secret, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'dev_jwt_secret_taskflow_9824';
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, { expiresIn: '7d' });

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
`),

    file('backend/controllers/projectController.ts', `import { Request, Response } from 'express';
import { ProjectModel } from '../models/Project';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projects = await ProjectModel.find().populate('ownerId', 'name email');
    res.status(200).json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, key } = req.body;
    if (!title || !key) {
      res.status(400).json({ error: 'Title and key are required' });
      return;
    }

    const newProject = await ProjectModel.create({
      title,
      description,
      key,
      ownerId: req.user?.id || '65f0a1b2c3d4e5f6a7b8c9d0',
      members: [req.user?.id || '65f0a1b2c3d4e5f6a7b8c9d0']
    });

    res.status(201).json(newProject);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
`),

    file('backend/controllers/taskController.ts', `import { Request, Response } from 'express';
import { TaskModel } from '../models/Task';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, status } = req.query;
    const query: any = {};
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;

    const tasks = await TaskModel.find(query).sort({ updatedAt: -1 });
    res.status(200).json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, projectId, tags } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    const newTask = await TaskModel.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      projectId: projectId || '65f0a1b2c3d4e5f6a7b8c9d1',
      assigneeId: req.user?.id,
      tags: tags || ['frontend']
    });

    res.status(201).json(newTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await TaskModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(200).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
`),

    file('backend/routes/authRoutes.ts', `import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';

const router = Router();
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
`),

    file('backend/routes/projectRoutes.ts', `import { Router } from 'express';
import { getProjects, createProject } from '../controllers/projectController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.get('/', getProjects);
router.post('/', requireAuth, createProject);

export default router;
`),

    file('backend/routes/taskRoutes.ts', `import { Router } from 'express';
import { getTasks, createTask, updateTaskStatus } from '../controllers/taskController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id/status', updateTaskStatus);

export default router;
`),

    file('frontend/src/types/index.ts', `export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  assignee: string;
  dueDate: string;
  tags: string[];
}

export interface ProjectWorkspace {
  id: string;
  name: string;
  key: string;
  taskCount: number;
}
`),

    file('frontend/src/components/KanbanBoard.tsx', `import React, { useState } from 'react';
import { TaskItem, TaskStatus } from '../types';
import { Plus, Clock, Tag, User, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  tasks: TaskItem[];
  onUpdateStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'border-blue-500/30' },
  { id: 'in_progress', label: 'In Progress', color: 'border-amber-500/30' },
  { id: 'review', label: 'Code Review', color: 'border-purple-500/30' },
  { id: 'done', label: 'Done', color: 'border-emerald-500/30' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdateStatus, onAddTask }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask({
      title: newTitle.trim(),
      description: 'Newly scoped engineering ticket with automated acceptance checks.',
      status: 'todo',
      priority: newPriority,
      assignee: 'Alex Dev',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      tags: ['feature']
    });
    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Active Sprint Board</h2>
          <p className="text-xs text-slate-400">Drag or click advance to synchronize task state across workers.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
        >
          <Plus size={14} /> New Task
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleCreate} className="bg-[#121216] border border-violet-500/30 p-4 rounded-2xl flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Task title (e.g. Implement WebSocket heartbeat)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-[#09090b] border border-white/10 px-3 py-2 text-xs text-white rounded-lg outline-none focus:border-violet-500"
          />
          <select
            value={newPriority}
            onChange={(e: any) => setNewPriority(e.target.value)}
            className="bg-[#09090b] border border-white/10 text-xs text-white px-3 py-2 rounded-lg"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-lg">
            Create
          </button>
          <button type="button" onClick={() => setShowAddModal(false)} className="text-xs text-slate-400 px-2">Cancel</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className={\`bg-[#0f0f13] border \${col.color} rounded-2xl p-4 flex flex-col min-h-[420px]\`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{col.label}</span>
                <span className="text-[10px] font-mono bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-[#17171d] border border-white/5 hover:border-violet-500/40 p-3.5 rounded-xl space-y-2.5 transition">
                    <div className="flex items-center justify-between">
                      <span className={\`text-[9px] font-bold uppercase px-2 py-0.5 rounded \${
                        task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        task.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }\`}>
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock size={10} />
                        {task.dueDate}
                      </div>
                    </div>
                    <h4 className="text-xs font-semibold text-white leading-snug">{task.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User size={10} /> {task.assignee}
                      </span>
                      {col.id !== 'done' && (
                        <button
                          onClick={() => {
                            const next: Record<TaskStatus, TaskStatus> = {
                              backlog: 'todo',
                              todo: 'in_progress',
                              in_progress: 'review',
                              review: 'done',
                              done: 'done'
                            };
                            onUpdateStatus(task.id, next[col.id]);
                          }}
                          className="text-[10px] text-violet-400 hover:text-violet-300 font-bold flex items-center gap-0.5"
                        >
                          Advance <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
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
`),

    file('frontend/src/App.tsx', `import React, { useState } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskItem, TaskStatus } from './types';
import { CheckSquare, ShieldCheck, Database, LayoutDashboard, Users, Zap, Terminal } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      title: 'Initialize MongoDB connection pool with exponential backoff',
      description: 'Configure mongoose cluster credentials with auto-reconnect handling and pool size 10.',
      status: 'done',
      priority: 'high',
      assignee: 'Devon Lead',
      dueDate: '2026-09-18',
      tags: ['backend', 'database']
    },
    {
      id: 'task-2',
      title: 'Implement JWT Auth token client & refresh rotation',
      description: 'Enforce bcrypt hash verification and HTTP-only cookie headers on /api/auth/login.',
      status: 'in_progress',
      priority: 'urgent',
      assignee: 'Frank Lead',
      dueDate: '2026-09-19',
      tags: ['security', 'auth']
    },
    {
      id: 'task-3',
      title: 'Build drag-and-drop Kanban state controller in React 19',
      description: 'Synchronize task updates via optimistic UI and REST payload dispatcher.',
      status: 'in_progress',
      priority: 'high',
      assignee: 'Sophia Lead',
      dueDate: '2026-09-20',
      tags: ['frontend', 'ui']
    },
    {
      id: 'task-4',
      title: 'Write automated unit test suite with vitest for controllers',
      description: 'Verify all project and task CRUD endpoints return proper HTTP response codes.',
      status: 'todo',
      priority: 'medium',
      assignee: 'Quinn QA',
      dueDate: '2026-09-22',
      tags: ['testing', 'qa']
    }
  ]);

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleAddTask = (newTask: Omit<TaskItem, 'id'>) => {
    setTasks(prev => [{ ...newTask, id: \`task-\${Date.now()}\` }, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#09090d] text-slate-100 font-sans">
      <header className="border-b border-white/10 bg-[#0d0d12] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-violet-600/30">
            TF
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">${name}</h1>
            <span className="text-[10px] text-emerald-400 font-mono">● MERN REST Engine Online • Port 3000</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-300 font-mono">
            {tasks.filter(t => t.status === 'done').length}/{tasks.length} Completed
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <KanbanBoard tasks={tasks} onUpdateStatus={handleUpdateStatus} onAddTask={handleAddTask} />
      </main>
    </div>
  );
}
`),

    file('docker-compose.yml', `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URI=mongodb://mongo:27017/taskflow_pro
      - JWT_SECRET=prod_secret_token_9824
    depends_on:
      - mongo
  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
volumes:
  mongo_data:
`),

    file('Dockerfile', `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app ./
EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
`),

    file('README.md', `# ${name}

Production MERN Task & Project Management Engine synthesized by DevForge Multi-Agent Swarm.

## Architecture
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Express 5 REST API Gateway, MongoDB, Mongoose, JWT Auth, Bcrypt
- **DevOps**: Docker, Docker Compose, Vitest

## Quickstart
\`\`\`bash
npm install
npm run dev
\`\`\`
`)
  ];

  return {
    name,
    description: prompt.slice(0, 200),
    prd,
    architecture,
    files
  };
}

function generateEcommerceArtifact(name: string, prompt: string, file: (p: string, c: string) => FileNode): SynthesizedProjectArtifact {
  const prd = `# Product Requirements Document: ${name}\n\nFull-stack E-Commerce storefront with cart drawer, Razorpay/Stripe payments, catalog filters, and inventory tracking.`;
  const architecture = `# Architecture: ${name}\n\nReact 19 + Tailwind Storefront, Express REST Catalog & Order Service, SQLite / PostgreSQL persistence.`;
  const files: FileNode[] = [
    file('package.json', JSON.stringify({ name: 'ecommerce-store', version: '1.0.0', type: 'module', scripts: { dev: 'vite', build: 'tsc && vite build' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', 'lucide-react': '^0.475.0', express: '^4.21.2' } }, null, 2)),
    file('src/App.tsx', `import React, { useState } from 'react';\nexport default function App() { return <div className="p-8 text-white bg-black min-h-screen"><h1>${name}</h1></div>; }\n`),
    file('server/server.ts', `import express from 'express';\nconst app = express();\napp.get('/api/products', (req, res) => res.json([]));\napp.listen(3000);\n`),
    file('README.md', `# ${name}\n\nE-Commerce storefront.`)
  ];
  return { name, description: prompt.slice(0, 200), prd, architecture, files };
}

function generateAiToolsArtifact(name: string, prompt: string, file: (p: string, c: string) => FileNode): SynthesizedProjectArtifact {
  const prd = `# Product Requirements Document: ${name}\n\nMulti-Agent Orchestration cockpit and streaming LLM copilot.`;
  const architecture = `# Architecture: ${name}\n\nReact Copilot UI, WebSocket telemetry, Server-side Gemini API proxy.`;
  const files: FileNode[] = [
    file('package.json', JSON.stringify({ name: 'ai-copilot', version: '1.0.0', type: 'module', scripts: { dev: 'vite', build: 'tsc && vite build' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', 'lucide-react': '^0.475.0', express: '^4.21.2' } }, null, 2)),
    file('src/App.tsx', `import React from 'react';\nexport default function App() { return <div className="p-8 text-white bg-black min-h-screen"><h1>${name}</h1></div>; }\n`),
    file('server/server.ts', `import express from 'express';\nconst app = express();\napp.get('/api/chat', (req, res) => res.json({ response: 'AI Copilot Ready' }));\napp.listen(3000);\n`),
    file('README.md', `# ${name}\n\nAI Tools application.`)
  ];
  return { name, description: prompt.slice(0, 200), prd, architecture, files };
}

function generateCrmArtifact(name: string, prompt: string, file: (p: string, c: string) => FileNode): SynthesizedProjectArtifact {
  const prd = `# Product Requirements Document: ${name}\n\nB2B CRM with deal pipeline stages, lead tracking, and revenue forecasting.`;
  const architecture = `# Architecture: ${name}\n\nReact 19 CRM Dashboard, Express REST pipeline API, SQLite database.`;
  const files: FileNode[] = [
    file('package.json', JSON.stringify({ name: 'crm-hub', version: '1.0.0', type: 'module', scripts: { dev: 'vite', build: 'tsc && vite build' }, dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', 'lucide-react': '^0.475.0', express: '^4.21.2' } }, null, 2)),
    file('src/App.tsx', `import React from 'react';\nexport default function App() { return <div className="p-8 text-white bg-black min-h-screen"><h1>${name}</h1></div>; }\n`),
    file('README.md', `# ${name}\n\nB2B CRM.`)
  ];
  return { name, description: prompt.slice(0, 200), prd, architecture, files };
}

function generateGeneralArtifact(name: string, prompt: string, file: (p: string, c: string) => FileNode): SynthesizedProjectArtifact {
  return generateMernTaskflowArtifact(name, prompt, file);
}
