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
  status: 'idle' | 'active' | 'failed' | 'healing' | 'complete';
  instructionsReceived: string[];
  healingSummary?: string;
  model?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  tier: 'ceo' | 'senior' | 'subagent';
  provider: 'gemini' | 'openrouter' | 'nvidia' | 'groq';
  status: 'idle' | 'thinking' | 'active' | 'healing' | 'failed' | 'complete';
  avatar: string;
  currentTask?: string;
  outputLogs: { timestamp: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }[];
  model: string;
  subagents?: SubAgent[];
  ceoDirectives?: string[];
  validationStatus?: 'pending' | 'in_review' | 'validated' | 'rejection_healing';
  healingNotes?: string;
}

export interface ModelRoutingOption {
  role: string;
  selectedModel: string;
  latency: number; // in ms
  costPer1kTokens: number; // in cents
}

export interface Project {
  id: string;
  name: string;
  description: string;
  prompt: string;
  status: 'planning' | 'designing' | 'coding' | 'testing' | 'deployed' | 'idle';
  files: FileNode[];
  agents: Agent[];
  createdAt: string;
  aiCreditsUsed: number;
  modelConfig: Record<string, string>; // Role -> Model mapping
  deployedUrl?: string;
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
