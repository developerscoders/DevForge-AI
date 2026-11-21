import { FeatureRequirementMapping } from '../types.js';

export const PROJECT_TYPES = [
  'web-app',
  'mobile-app',
  'browser-extension',
  'ai-ml-pipeline',
  'api-service',
  'data-pipeline',
  'game',
  'cli-tool',
  'chrome-extension',
  'static-site',
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export interface ProjectClassification {
  project_type: ProjectType;
  domain: string;
  feature_list: string[];
  tech_constraints: string[];
  requires_backend: boolean;
  requires_frontend: boolean;
  requires_auth: boolean;
  requires_realtime: boolean;
  requires_database: boolean;
  prompt_original: string;
}

export const SHARED_OUTPUT_CONTRACT = {
  classification: ['project_type', 'domain', 'feature_list', 'tech_constraints', 'prompt_original'],
  project: ['name', 'description', 'prd', 'architecture', 'files'],
} as const;

export function classifyProjectPrompt(prompt: string): ProjectClassification {
  const text = prompt.toLowerCase();

  const isExplicitApiOnly =
    /\b(api service|rest api only|api-only|backend only|microservice only|headless api)\b/.test(text) &&
    !/\b(react|frontend|ui|kanban|dashboard|page|vite|next\.js)\b/.test(text);

  const isExplicitCli =
    /\b(cli tool|command[- ]line tool|terminal utility)\b/.test(text) &&
    !/\b(react|frontend|ui|dashboard|web app|mern)\b/.test(text);

  const isStaticSite =
    /\b(static site|landing page|portfolio site|marketing site)\b/.test(text) &&
    !/\b(api|database|express|mongo|postgres|auth|jwt|backend|crud)\b/.test(text);

  const project_type: ProjectType = isExplicitApiOnly
    ? 'api-service'
    : isExplicitCli
    ? 'cli-tool'
    : /image classification|model inference|machine learning|\bml\b|training pipeline/.test(text)
    ? 'ai-ml-pipeline'
    : /react native|expo|\bmobile app\b/.test(text)
    ? 'mobile-app'
    : /chrome extension|browser extension/.test(text)
    ? 'browser-extension'
    : isStaticSite
    ? 'static-site'
    : 'web-app';

  const featureTerms = [
    'authentication',
    'auth',
    'jwt',
    'rbac',
    'real-time',
    'kanban',
    'drag-and-drop',
    'drag and drop',
    'priority',
    'search',
    'filter',
    'analytics',
    'dashboard',
    'team',
    'project',
    'payment',
    'checkout',
    'billing',
    'upload',
    'websocket',
    'notifications',
    'rest api',
    'docker',
    'testing',
  ];

  const feature_list = Array.from(
    new Set(featureTerms.filter((term) => text.includes(term)))
  );

  const constraintTerms = [
    'react',
    'typescript',
    'vite',
    'next.js',
    'tailwind',
    'node.js',
    'express',
    'mongodb',
    'mongoose',
    'postgresql',
    'sqlite',
    'zod',
    'vitest',
    'lucide',
    'docker',
    'react native',
    'expo',
    'three.js',
  ];

  const tech_constraints = Array.from(
    new Set(constraintTerms.filter((term) => text.includes(term)))
  );

  const requires_auth = /\b(auth|authentication|jwt|login|signup|register|rbac|bcrypt|session|role)\b/.test(text);
  const requires_realtime = /\b(real[- ]?time|websocket|socket\.io|sse|live updates)\b/.test(text);
  const requires_database = /\b(mongo|mongoose|postgres|postgresql|sqlite|sql|database|db|orm|prisma|drizzle|crud|persist)\b/.test(
    text
  );
  const requires_backend =
    project_type === 'api-service' ||
    (project_type !== 'static-site' &&
      project_type !== 'cli-tool' &&
      (requires_auth ||
        requires_database ||
        requires_realtime ||
        /\b(express|node\.js|backend|api|server|mern|full[- ]?stack|rest)\b/.test(text)));

  const requires_frontend = project_type !== 'api-service' && project_type !== 'cli-tool';

  // Derive concise semantic domain label while preserving complete prompt_original separately
  const namedMatch = prompt.match(/named\s+["']([^"']+)["']/i);
  const firstClause = prompt.split(/[\n.]/, 1)[0].trim();
  const domain = namedMatch?.[1]?.trim() || firstClause.slice(0, 120) || 'Custom Software System';

  return {
    project_type,
    domain,
    feature_list,
    tech_constraints,
    requires_backend,
    requires_frontend,
    requires_auth,
    requires_realtime,
    requires_database,
    prompt_original: prompt,
  };
}

export function extractPromptFeatures(
  prompt: string,
  classification: ProjectClassification
): FeatureRequirementMapping[] {
  const lower = prompt.toLowerCase();
  const mappings: FeatureRequirementMapping[] = [];

  if (classification.requires_auth || /\b(user|login|jwt|auth)\b/.test(lower)) {
    mappings.push({
      id: 'feat_auth',
      feature: 'JWT / Session Authentication & Role-Based Access',
      category: 'auth',
      taskId: classification.requires_backend ? 'task_sophia_backend' : 'task_frank_ui',
      expectedFiles: classification.requires_backend
        ? ['server/middleware/authMiddleware.ts', 'server/routes/authRoutes.ts', 'src/components/AuthPanel.tsx']
        : ['src/components/AuthPanel.tsx'],
      acceptanceCriterion:
        'Users can register and sign in with hashed passwords and receive verified session tokens enforced on protected mutations.',
    });
  }

  if (classification.requires_backend) {
    mappings.push({
      id: 'feat_backend_api',
      feature: 'REST API Service, Data Store & Schema Contracts',
      category: 'backend',
      taskId: 'task_sophia_backend',
      expectedFiles: ['server/schema.sql', 'server/store.ts', 'server/app.ts'],
      acceptanceCriterion:
        'Express backend exposes validated REST CRUD endpoints with centralized error handling and persistent state.',
    });
  }

  if (/\b(kanban|drag|board|task|project|sprint|workflow)\b/.test(lower)) {
    mappings.push({
      id: 'feat_kanban',
      feature: 'Interactive Project & Kanban Task Workflow Board',
      category: 'frontend',
      taskId: 'task_frank_ui',
      expectedFiles: ['src/components/KanbanBoard.tsx', 'src/App.tsx', 'src/lib/api.ts'],
      acceptanceCriterion:
        'Users can create projects and tasks, drag-and-drop or advance tasks across status columns, and persist changes.',
    });
  }

  if (/\b(search|filter|priority|priorities|tag|sort)\b/.test(lower) || /\b(task|crm|ecommerce|catalog)\b/.test(lower)) {
    mappings.push({
      id: 'feat_search_filter',
      feature: 'Search, Priority Badges & Multi-Criteria Filtering',
      category: 'frontend',
      taskId: 'task_frank_ui',
      expectedFiles: ['src/App.tsx', 'src/components/KanbanBoard.tsx'],
      acceptanceCriterion:
        'Users can filter items by priority/status and search across titles, descriptions, and assignees in real time.',
    });
  }

  if (/\b(analytics|metrics|chart|velocity|report|overview|dashboard)\b/.test(lower)) {
    mappings.push({
      id: 'feat_analytics',
      feature: 'Operational Analytics & Velocity Metrics Dashboard',
      category: 'frontend',
      taskId: 'task_frank_ui',
      expectedFiles: ['src/components/AnalyticsPanel.tsx', 'src/App.tsx'],
      acceptanceCriterion:
        'Analytics panel dynamically computes completion rates, priority breakdowns, and team workload from live application state.',
    });
  }

  if (/\b(team|member|collaborat|assign|workspace)\b/.test(lower)) {
    mappings.push({
      id: 'feat_team',
      feature: 'Team Collaboration & Assignee Management',
      category: 'core',
      taskId: 'task_frank_ui',
      expectedFiles: ['src/App.tsx', 'src/types.ts'],
      acceptanceCriterion:
        'Workspaces support assigning tasks to team members and inspecting per-member workload.',
    });
  }

  if (classification.requires_frontend) {
    mappings.push({
      id: 'feat_frontend_shell',
      feature: 'Production Entrypoint, Styles & Component Shell',
      category: 'frontend',
      taskId: 'task_frank_ui',
      expectedFiles: ['package.json', 'index.html', 'src/main.tsx', 'src/App.tsx', 'src/styles/global.css'],
      acceptanceCriterion:
        'Vite/React application compiles cleanly with TypeScript strict mode and accessible UI controls.',
    });
  } else if (classification.project_type === 'cli-tool') {
    mappings.push({
      id: 'feat_cli_entry',
      feature: 'CLI Command Entrypoint & Argument Parser',
      category: 'core',
      taskId: 'task_sophia_backend',
      expectedFiles: ['package.json', 'src/cli.ts', 'src/commands/run.ts'],
      acceptanceCriterion: 'CLI executes structured commands and returns deterministic exit codes without web UI dependencies.',
    });
  }

  mappings.push({
    id: 'feat_qa',
    feature: 'Automated Unit & Integration Test Suite',
    category: 'testing',
    taskId: 'task_quinn_gate',
    expectedFiles: ['tests/app.test.ts'],
    acceptanceCriterion:
      'Vitest suite exercises real exported functions and business state transitions with meaningful assertions.',
  });

  mappings.push({
    id: 'feat_devops',
    feature: 'Containerized Port-3000 Build & Runtime Readiness',
    category: 'devops',
    taskId: 'task_devon_sre',
    expectedFiles: ['Dockerfile', 'docker-compose.yml', '.env.example'],
    acceptanceCriterion: 'Dockerfile exposes port 3000, build scripts succeed, and .env.example documents runtime variables.',
  });

  return mappings;
}
