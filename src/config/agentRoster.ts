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

export interface ProviderModelCatalogEntry {
  id: string;
  label: string;
  provider: AgentProvider;
  maxOutputTokens: number;
  available: boolean;
  availabilityReason?: string;
}

export const PROVIDER_MODEL_CATALOG: Record<AgentProvider, ProviderModelCatalogEntry[]> = {
  gemini: [
    {
      id: 'gemini-2.5-flash',
      label: 'Gemini 2.5 Flash',
      provider: 'gemini',
      maxOutputTokens: 8192,
      available: true,
    },
    {
      id: 'gemini-2.5-pro',
      label: 'Gemini 2.5 Pro',
      provider: 'gemini',
      maxOutputTokens: 8192,
      available: true,
    },
    {
      id: 'gemini-4-hydrogen',
      label: 'Gemini 4 Hydrogen',
      provider: 'gemini',
      maxOutputTokens: 8192,
      available: true,
    },
  ],
  openrouter: [
    {
      id: 'meta-llama/llama-3.2-1b-instruct',
      label: 'LLaMA 3.2 1B Instruct (OpenRouter)',
      provider: 'openrouter',
      maxOutputTokens: 1024,
      available: true,
    },
    {
      id: 'deepseek/deepseek-chat-v3.1',
      label: 'DeepSeek Chat v3.1 (OpenRouter)',
      provider: 'openrouter',
      maxOutputTokens: 4096,
      available: true,
    },
    {
      id: 'qwen/qwen-2.5-coder-32b-instruct:free',
      label: 'Qwen 2.5 Coder 32B Free (OpenRouter)',
      provider: 'openrouter',
      maxOutputTokens: 4096,
      available: true,
    },
    {
      id: 'meta-llama/llama-3.3-70b-instruct:free',
      label: 'LLaMA 3.3 70B Instruct Free (OpenRouter)',
      provider: 'openrouter',
      maxOutputTokens: 4096,
      available: true,
    },
    {
      id: 'deepseek/deepseek-chat:free',
      label: 'DeepSeek V3 Chat Free (OpenRouter)',
      provider: 'openrouter',
      maxOutputTokens: 4096,
      available: true,
    },
    {
      id: 'deepseek/deepseek-r1:free',
      label: 'DeepSeek R1 Free (OpenRouter)',
      provider: 'openrouter',
      maxOutputTokens: 4096,
      available: true,
    },
    {
      id: 'openrouter/free',
      label: 'OpenRouter Free Auto-Router',
      provider: 'openrouter',
      maxOutputTokens: 4096,
      available: true,
    },
  ],
  groq: [
    {
      id: 'openai/gpt-oss-20b',
      label: 'GPT-OSS 20B (Groq)',
      provider: 'groq',
      maxOutputTokens: 4096,
      available: true,
    },
    {
      id: 'llama-3.3-70b-versatile',
      label: 'LLaMA 3.3 70B Versatile (Groq)',
      provider: 'groq',
      maxOutputTokens: 4096,
      available: true,
    },
    {
      id: 'openai/gpt-oss-120b',
      label: 'GPT-OSS 120B (Groq)',
      provider: 'groq',
      maxOutputTokens: 4096,
      available: true,
    },
    {
      id: 'groq/compound-mini',
      label: 'Groq Compound Mini',
      provider: 'groq',
      maxOutputTokens: 2048,
      available: true,
    },
  ],
  nvidia: [
    {
      id: 'meta/llama-3.3-70b-instruct',
      label: 'NVIDIA NIM LLaMA 3.3 70B Instruct',
      provider: 'nvidia',
      maxOutputTokens: 4096,
      available: false,
      availabilityReason: 'NVIDIA NIM endpoint returned HTTP 410 (end of life) on 2026-09-13.',
    },
    {
      id: 'meta/llama-3.1-70b-instruct',
      label: 'NVIDIA NIM LLaMA 3.1 70B Instruct',
      provider: 'nvidia',
      maxOutputTokens: 4096,
      available: false,
      availabilityReason: 'NVIDIA NIM endpoint returned HTTP 410 (end of life) on 2026-09-13.',
    },
  ],
};

/** The internally consistent default model roster used by DevForge project generation. */
export const AGENT_ROSTER: Record<AgentRosterEntry['key'], AgentRosterEntry> = {
  aria: {
    id: 'ag_ceo',
    key: 'aria',
    name: 'Aria CEO',
    role: 'Chief AI Executive & Orchestrator',
    provider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    fallbackModels: ['gemini-2.5-pro'],
    availability: 'verified',
  },
  parker: {
    id: 'ag_pm',
    key: 'parker',
    name: 'Parker Lead',
    role: 'Senior Product Manager',
    provider: 'openrouter',
    defaultModel: 'meta-llama/llama-3.2-1b-instruct',
    fallbackModels: ['deepseek/deepseek-chat-v3.1', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter/free'],
    availability: 'verified',
  },
  sophia: {
    id: 'ag_arch',
    key: 'sophia',
    name: 'Sophia Lead',
    role: 'Senior Solution Architect',
    provider: 'openrouter',
    defaultModel: 'deepseek/deepseek-chat-v3.1',
    fallbackModels: ['qwen/qwen-2.5-coder-32b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter/free'],
    availability: 'verified',
  },
  frank: {
    id: 'ag_fe',
    key: 'frank',
    name: 'Frank Lead',
    role: 'Senior Frontend Engineer',
    provider: 'openrouter',
    defaultModel: 'qwen/qwen-2.5-coder-32b-instruct:free',
    fallbackModels: ['deepseek/deepseek-chat-v3.1', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter/free'],
    availability: 'verified',
  },
  quinn: {
    id: 'ag_qa',
    key: 'quinn',
    name: 'Quinn Lead',
    role: 'Senior QA & Testing Lead',
    provider: 'groq',
    defaultModel: 'openai/gpt-oss-20b',
    fallbackModels: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'groq/compound-mini'],
    availability: 'verified',
  },
  devon: {
    id: 'ag_sre',
    key: 'devon',
    name: 'Devon Lead',
    role: 'Senior DevOps & SRE Lead',
    provider: 'groq',
    defaultModel: 'openai/gpt-oss-20b',
    fallbackModels: ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'groq/compound-mini'],
    availability: 'verified',
  },
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

export function inferProviderFromModel(
  modelId?: string,
  fallbackProvider: AgentProvider = 'openrouter'
): AgentProvider {
  const m = (modelId || '').toLowerCase();
  if (!m) return fallbackProvider;
  if (m.includes('gemini')) return 'gemini';
  if (m.startsWith('meta/llama')) return 'nvidia';
  if (m.startsWith('openai/gpt-oss') || m.startsWith('groq/') || m.includes('versatile') || m.includes('mixtral')) {
    return 'groq';
  }
  return m.includes('/') || m.includes(':free') || m.includes('deepseek') || m.includes('qwen')
    ? 'openrouter'
    : fallbackProvider;
}
