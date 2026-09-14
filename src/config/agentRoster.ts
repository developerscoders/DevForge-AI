export type AgentProvider = 'gemini' | 'openrouter' | 'nvidia' | 'groq';

export interface AgentRosterEntry {
  id: 'ag_ceo' | 'ag_pm' | 'ag_arch' | 'ag_fe' | 'ag_qa' | 'ag_sre';
  key: 'aria' | 'parker' | 'sophia' | 'frank' | 'quinn' | 'devon';
  name: string;
  role: string;
  provider: AgentProvider;
  defaultModel: string;
  fallbackModels: string[];
  availability: 'verified' | 'unavailable';
  availabilityReason?: string;
}

/** The only model roster used by DevForge project generation. */
export const AGENT_ROSTER: Record<AgentRosterEntry['key'], AgentRosterEntry> = {
  aria: { id: 'ag_ceo', key: 'aria', name: 'Aria CEO', role: 'Chief AI Executive & Orchestrator', provider: 'gemini', defaultModel: 'gemini-2.5-flash', fallbackModels: ['gemini-2.5-pro'], availability: 'verified' },
  parker: { id: 'ag_pm', key: 'parker', name: 'Parker Lead', role: 'Senior Product Manager', provider: 'openrouter', defaultModel: 'meta-llama/llama-3.2-1b-instruct', fallbackModels: ['deepseek/deepseek-chat-v3.1'], availability: 'verified' },
  sophia: { id: 'ag_arch', key: 'sophia', name: 'Sophia Lead', role: 'Senior Solution Architect', provider: 'openrouter', defaultModel: 'deepseek/deepseek-chat-v3.1', fallbackModels: ['meta-llama/llama-3.2-1b-instruct'], availability: 'verified' },
  frank: { id: 'ag_fe', key: 'frank', name: 'Frank Lead', role: 'Senior Frontend Engineer', provider: 'nvidia', defaultModel: 'meta/llama-3.3-70b-instruct', fallbackModels: ['meta/llama-3.1-70b-instruct'], availability: 'unavailable', availabilityReason: 'NVIDIA returned HTTP 410 (end of life) for both configured models on 2026-09-13.' },
  quinn: { id: 'ag_qa', key: 'quinn', name: 'Quinn Lead', role: 'Senior QA & Testing Lead', provider: 'groq', defaultModel: 'openai/gpt-oss-20b', fallbackModels: ['openai/gpt-oss-120b', 'groq/compound-mini'], availability: 'verified' },
  devon: { id: 'ag_sre', key: 'devon', name: 'Devon Lead', role: 'Senior DevOps & SRE Lead', provider: 'groq', defaultModel: 'openai/gpt-oss-20b', fallbackModels: ['openai/gpt-oss-120b', 'groq/compound-mini'], availability: 'verified' },
};

export const DEFAULT_MODEL_CONFIG = {
  'CEO Orchestrator': AGENT_ROSTER.aria.defaultModel,
  'Product Manager': AGENT_ROSTER.parker.defaultModel,
  'Solution Architect': AGENT_ROSTER.sophia.defaultModel,
  'Frontend Engineer': AGENT_ROSTER.frank.defaultModel,
  'QA/Test Engineer': AGENT_ROSTER.quinn.defaultModel,
  'DevOps Engineer': AGENT_ROSTER.devon.defaultModel,
} as const;

export const rosterById = (id: AgentRosterEntry['id']) =>
  Object.values(AGENT_ROSTER).find((entry) => entry.id === id)!;
