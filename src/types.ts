export interface AgentLog {
  id?: string;
  timestamp: string;
  message: string;
  agent?: string;
  agentId?: string;
  stage?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  level?: 'info' | 'warn' | 'error' | 'success';
  executionId?: string;
  toolName?: string;
}

export interface FileNode {
  path: string;
  name: string;
  content?: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export interface SubAgent {
  id: string;
  name: string;
  role: string;
  task: string;
  status: 'idle' | 'waiting' | 'active' | 'failed' | 'healing' | 'complete' | 'cancelled';
  instructionsReceived: string[];
  healingSummary?: string;
  model?: string;
  parentAgentId?: string;
  responsibility?: string;
  allowedTools?: string[];
  depth?: number;
  createdAt?: string;
  completedAt?: string;
  durationMs?: number;
  outputArtifact?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  tier: 'ceo' | 'senior' | 'subagent';
  provider: 'gemini' | 'openrouter' | 'nvidia' | 'groq' | 'deepseek';
  status: 'idle' | 'waiting' | 'thinking' | 'active' | 'healing' | 'failed' | 'complete' | 'cancelled';
  avatar: string;
  currentTask?: string;
  outputLogs: { timestamp: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[];
  model: string;
  requestedModel?: string;
  fallbackUsed?: boolean;
  attemptsCount?: number;
  error?: string;
  subagents?: SubAgent[];
  ceoDirectives?: string[];
  validationStatus?: 'pending' | 'in_review' | 'validated' | 'rejection_healing';
  healingNotes?: string;
  assignedPrompt?: string;
  modelUsed?: string;
  generatedArtifact?: string;
  executionLatencyMs?: number;
  responsibility?: string;
  allowedTools?: string[];
  parentAgentId?: string;
  rawOutput?: string;
}

export interface ModelRoutingOption {
  role: string;
  selectedModel: string;
  latency: number; // in ms
  costPer1kTokens: number; // in cents
}

export interface TestQualityAudit {
  lineCoverage: number;
  branchCoverage: number;
  untestedCriticalPaths: string[];
  testTheaterFindings: string[];
  verdict: 'pass' | 'failed_coverage_floor' | 'failed_critical_path' | 'failed_test_quality';
  functionCoverage?: number;
  rawTestContent?: string;
  untestedFiles?: string[];
  auditedAt?: string;
  executedRealTests?: boolean;
  testsPassed?: number;
  testsFailed?: number;
}

export interface AstAuditResult {
  passed: boolean;
  astValid: boolean;
  errors: string[];
  securityAlerts: number;
  port3000Configured: boolean;
  brokenReferences?: string[];
  auditedAt?: string;
  filesParsed?: number;
}

export interface DeploymentCertificate {
  certifiedAt: string;
  certificateHash: string;
  certifiedBy: string; // 'Aria, DevForge CEO Executive Orchestrator'
  verdict: 'VERIFIED_AND_CERTIFIED' | 'BLOCKED';
  reason?: string;
}

// ==========================================
// Orchestrator, Tool Calling & Live Telemetry Types
// ==========================================

export type ExecutionRunStatus =
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TaskNodeStatus =
  | 'pending'
  | 'blocked'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'skipped';

export interface TaskNode {
  id: string;
  runId: string;
  projectId: string;
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  subagentId?: string;
  subagentName?: string;
  milestone?: number;
  dependsOn: string[];
  status: TaskNodeStatus;
  idempotencyKey: string;
  attempt: number;
  maxRetries: number;
  priority: number;
  inputContext?: Record<string, any>;
  outputArtifact?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export type ToolCategory =
  | 'workspace'
  | 'terminal'
  | 'git'
  | 'research'
  | 'testing'
  | 'external'
  | 'orchestration';

export type ToolExecutionStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'success'
  | 'failed'
  | 'cancelled';

export interface ToolExecutionRecord {
  executionId: string;
  runId: string;
  projectId: string;
  taskId?: string;
  agentId: string;
  agentName: string;
  subagentId?: string;
  subagentName?: string;
  toolName: string;
  category: ToolCategory;
  status: ToolExecutionStatus;
  timestamp: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  retries: number;
  inputArgs: Record<string, any>;
  output?: any;
  stdout?: string;
  stderr?: string;
  error?: string;
  approvalId?: string;
  metadata?: Record<string, any>;
}

export interface AgentCommunication {
  id: string;
  runId: string;
  projectId: string;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  type: 'delegation' | 'context_share' | 'result' | 'self_heal' | 'error' | 'message';
  summary: string;
  payload?: any;
  timestamp: string;
}

export type ApprovalActionType =
  | 'destructive_command'
  | 'important_file_overwrite'
  | 'git_mutation'
  | 'database_mutation'
  | 'deployment'
  | 'external_integration';

export interface ApprovalRequest {
  id: string;
  runId: string;
  projectId: string;
  taskId?: string;
  executionId?: string;
  agentId: string;
  agentName: string;
  toolName: string;
  actionType: ApprovalActionType;
  riskLevel: 'medium' | 'high' | 'critical';
  summary: string;
  details: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export type ExecutionEventType =
  | 'run:started'
  | 'run:completed'
  | 'run:failed'
  | 'run:cancelled'
  | 'task:created'
  | 'task:updated'
  | 'agent:status'
  | 'subagent:created'
  | 'agent:message'
  | 'tool:pending'
  | 'tool:running'
  | 'tool:completed'
  | 'tool:failed'
  | 'approval:requested'
  | 'approval:resolved'
  | 'test:result'
  | 'build:result'
  | 'log:info';

export interface ExecutionEvent {
  seq: number;
  eventId: string;
  runId: string;
  projectId: string;
  timestamp: string;
  type: ExecutionEventType;
  agentId?: string;
  subagentId?: string;
  taskId?: string;
  executionId?: string;
  data: Record<string, any>;
}

export interface ExecutionRunMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  cancelledTasks: number;
  totalToolCalls: number;
  succeededToolCalls: number;
  failedToolCalls: number;
  totalTokensUsed: number;
  totalDurationMs: number;
}

export interface FeatureRequirementMapping {
  id: string;
  feature: string;
  category: 'auth' | 'frontend' | 'backend' | 'database' | 'realtime' | 'testing' | 'devops' | 'core';
  taskId: string;
  expectedFiles: string[];
  acceptanceCriterion: string;
  verified?: boolean;
  verificationNote?: string;
}

export interface ExecutionRun {
  runId: string;
  projectId: string;
  status: ExecutionRunStatus;
  prompt: string;
  triggeredBy: 'create' | 'rebuild' | 'self_heal' | 'manual';
  modelConfig: Record<string, string>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  cancelledReason?: string;
  recoveredFromRestart?: boolean;
  featureMap?: FeatureRequirementMapping[];
  tasks: TaskNode[];
  dynamicSubagents: SubAgent[];
  toolExecutions: ToolExecutionRecord[];
  communications: AgentCommunication[];
  approvals: ApprovalRequest[];
  metrics: ExecutionRunMetrics;
}

export interface ToolAvailabilityStatus {
  name: string;
  category: ToolCategory;
  description: string;
  available: boolean;
  configured: boolean;
  reason?: string;
  requiresApproval: boolean;
  allowedAgents: string[];
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  description: string;
  prompt: string;
  projectClassification?: any;
  featureMap?: FeatureRequirementMapping[];
  status: 'planning' | 'designing' | 'coding' | 'testing' | 'deployed' | 'idle' | 'building' | 'failed' | 'generating' | 'review' | 'cancelled';
  deploymentStatus?: 'idle' | 'queued' | 'building' | 'deployed' | 'failed';
  deploymentError?: string;
  files: FileNode[];
  agents: Agent[];
  createdAt: string;
  updatedAt?: string;
  aiCreditsUsed: number;
  modelConfig: Record<string, string>; // Role -> Model mapping
  deployedUrl?: string;
  githubRepoUrl?: string;
  vercelDeployUrl?: string;
  vercelDeploymentId?: string;
  testQualityAudit?: TestQualityAudit;
  astAudit?: AstAuditResult;
  deploymentCertificate?: DeploymentCertificate;
  selfHealingAttempts?: Record<number, number>;
  activeRunId?: string;
  lastExecutionRun?: ExecutionRun;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  credits: number;
  features: string[];
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  planName: string;
  status: 'success' | 'failed' | 'pending';
  invoiceNumber: string;
  couponUsed?: string;
  taxAmount: number;
  totalAmount: number;
}

export interface Coupon {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  description: string;
  active: boolean;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  description: string;
  price: number; // 0 for free
  type: 'agent' | 'prompt_pack' | 'template' | 'plugin' | 'workflow' | 'component';
  author: string;
  rating: number;
  downloads: number;
  earnings: number;
  artifactCode?: string;
  category?: string;
}

export interface WebhookEvent {
  id: string;
  timestamp: string;
  eventType: string;
  payload: string;
  status: 'success' | 'failed';
  responseCode: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  joinedDate: string;
}

export interface EntityItem {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface AppStats {
  totalRecords: number;
  activeUsers: number;
  uptime: string;
  latencyMs: number;
}

export interface AdminAnalytics {
  monthlyRecurringRevenue: number;
  annualRunRate: number;
  totalRevenue: number;
  activeSubscriptions: number;
  activeSreContainers: number;
  globalCreditUsage: number;
  refundsCount: number;
  revenueHistory?: Array<{ month: string; Revenue: number }>;
}

export interface DeploymentResult {
  success: boolean;
  provider: 'github' | 'vercel';
  url?: string;
  repoName?: string;
  deploymentId?: string;
  readyState?: string;
  error?: string;
  filesCount?: number;
}

export interface BlueprintTemplate {
  id: string;
  title: string;
  category: 'SaaS' | 'Analytics' | 'E-Commerce' | 'AI Tools' | 'Developer Tools';
  description: string;
  tags: string[];
  suggestedPrompt: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Enterprise';
  estimatedFiles: number;
  author?: string;
  createdAt?: string;
}

export interface CMSPageSEO {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[] | string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

export interface CMSPage {
  id: string;
  slug: string;
  name: string;
  seo: CMSPageSEO;
  contentSummary?: string;
  status: 'published' | 'draft';
  lastUpdated?: string;
}
