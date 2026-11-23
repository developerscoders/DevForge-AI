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
  gemini: [],
  openrouter: [
    { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'NVIDIA Nemotron 3 Ultra (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'baidu/ernie-5.5-flash-preview:free', label: 'Baidu ERNIE 5.5 Flash Preview (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'nvidia/nemotron-3.5-super-vl:free', label: 'NVIDIA Nemotron 3.5 Super VL (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'nvidia/nemotron-3.5-lightning:free', label: 'NVIDIA Nemotron 3.5 Lightning (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'particle-ai/particle-1:free', label: 'Particle-1 (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'dots-studio/dots-3-note-preview:free', label: 'Dots 3 Note Preview (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'inclusionai/ling-3.2-flash:free', label: 'Ling 3.2 Flash (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'nvidia/nemotron-3.5-super-vl:free', label: 'Cohere North Mini Code (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'recursive/flint-v1.0:free', label: 'Recursive Flint (Free)', provider: 'openrouter', maxOutputTokens: 8192, available: true },
    { id: 'openrouter/free', label: 'OpenRouter Free Auto Router', provider: 'openrouter', maxOutputTokens: 8192, available: true },
  ],
  groq: [],
  nvidia: [],
};

/** All default agents use explicitly free OpenRouter model IDs. No paid-provider fallback is allowed. */
export const AGENT_ROSTER: Record<AgentRosterEntry['key'], AgentRosterEntry> = {
  aria: {
    id: 'ag_ceo', key: 'aria', name: 'Aria CEO',
    role: 'Chief AI Executive & Orchestrator', provider: 'openrouter',
    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    fallbackModels: ['baidu/ernie-5.5-flash-preview:free', 'inclusionai/ling-3.2-flash:free', 'openrouter/free'],
    availability: 'verified',
  },
  parker: {
    id: 'ag_pm', key: 'parker', name: 'Parker Lead',
    role: 'Senior Product Manager', provider: 'openrouter',
    defaultModel: 'inclusionai/ling-3.2-flash:free',
    fallbackModels: ['baidu/ernie-5.5-flash-preview:free', 'nvidia/nemotron-3.5-lightning:free', 'openrouter/free'],
    availability: 'verified',
  },
  sophia: {
    id: 'ag_arch', key: 'sophia', name: 'Sophia Lead',
    role: 'Senior Solution Architect', provider: 'openrouter',
    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    fallbackModels: ['baidu/ernie-5.5-flash-preview:free', 'inclusionai/ling-3.2-flash:free', 'openrouter/free'],
    availability: 'verified',
  },
  frank: {
    id: 'ag_fe', key: 'frank', name: 'Frank Lead',
    role: 'Senior Frontend Engineer', provider: 'openrouter',
    defaultModel: 'nvidia/nemotron-3.5-super-vl:free',
    fallbackModels: ['recursive/flint-v1.0:free', 'particle-ai/particle-1:free', 'openrouter/free'],
    availability: 'verified',
  },
  quinn: {
    id: 'ag_qa', key: 'quinn', name: 'Quinn Lead',
    role: 'Senior QA & Testing Lead', provider: 'openrouter',
    defaultModel: 'dots-studio/dots-3-note-preview:free',
    fallbackModels: ['baidu/ernie-5.5-flash-preview:free', 'nvidia/nemotron-3.5-lightning:free', 'openrouter/free'],
    availability: 'verified',
  },
  devon: {
    id: 'ag_sre', key: 'devon', name: 'Devon Lead',
    role: 'Senior DevOps & SRE Lead', provider: 'openrouter',
    defaultModel: 'nvidia/nemotron-3.5-lightning:free',
    fallbackModels: ['nvidia/nemotron-3-ultra-550b-a55b:free', 'baidu/ernie-5.5-flash-preview:free', 'openrouter/free'],
    availability: 'verified',
  },
};

/** Reject stale/paid model IDs from saved project settings and keep the swarm on free OpenRouter endpoints. */
export function isFreeOpenRouterModel(modelId?: string): boolean {
  const id = (modelId || '').trim();
  return id === 'openrouter/free' || (
    id.endsWith(':free') &&
    PROVIDER_MODEL_CATALOG.openrouter.some((model) => model.id === id)
  );
}

export function resolveFreeAgentModel(key: AgentRosterEntry['key'], requestedModel?: string): string {
  return isFreeOpenRouterModel(requestedModel) ? requestedModel!.trim() : AGENT_ROSTER[key].defaultModel;
}

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
