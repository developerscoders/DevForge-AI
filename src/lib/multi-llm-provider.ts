import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { PROVIDER_MODEL_CATALOG, AgentProvider } from '../config/agentRoster.js';

export type LLMErrorType =
  | 'ok'
  | 'rate_limit'
  | 'unavailable'
  | 'invalid_model'
  | 'timeout'
  | 'empty_response'
  | 'auth_error'
  | 'network_error'
  | 'unconfigured';

export interface LLMAttemptRecord {
  provider: string;
  model: string;
  statusCode?: number;
  errorType: LLMErrorType;
  error?: string;
  latencyMs: number;
}

export interface LLMRequestOptions {
  provider: AgentProvider;
  model: string;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  fallbackModels?: string[];
  timeoutMs?: number;
  maxRetriesPerCandidate?: number;
  fetchImpl?: typeof fetch;
  geminiClientOverride?: {
    models: {
      generateContent: (params: any) => Promise<any>;
    };
  };
}

export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
  requestedProvider: string;
  requestedModel: string;
  actualProvider: string;
  actualModel: string;
  usedFallback: boolean;
  attempts: LLMAttemptRecord[];
  failureReason?: string;
  tokensUsed?: number;
  latencyMs: number;
  isSimulated: boolean;
}

// Free-only fallback chain. Keep these IDs aligned with OpenRouter's live free catalog;
// OpenRouter may rotate free capacity, so the final router is retained as a dynamic fallback.
const DEFAULT_OPENROUTER_FALLBACKS = [
  'cohere/north-mini-code:free',
  'recursive/flint-v1.0:free',
  'particle-ai/particle-1:free',
  'inclusionai/ling-3.2-flash:free',
  'baidu/ernie-5.5-flash-preview:free',
  'nvidia/nemotron-3.5-lightning:free',
  'openrouter/free',
];

const DEFAULT_GROQ_FALLBACKS = [
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'groq/compound-mini',
];

/**
 * Compute safe output token budget per model so compact models (like 1B instruct)
 * never overflow output budgets or stall.
 */
export function getModelTokenBudget(model?: string, requestedMaxTokens?: number): number {
  const m = (model || '').toLowerCase();
  if (m.includes('llama-3.2-1b-instruct') || m.includes('1b-instruct')) {
    return Math.min(requestedMaxTokens ?? 900, 1024);
  }
  if (m.includes('compound-mini')) {
    return Math.min(requestedMaxTokens ?? 1536, 2048);
  }
  if (m.includes('gpt-oss-20b')) {
    return Math.min(requestedMaxTokens ?? 2048, 4096);
  }
  if (m.includes('gemini')) {
    return Math.min(requestedMaxTokens ?? 4096, 8192);
  }
  return Math.min(requestedMaxTokens ?? 2048, 4096);
}

/**
 * Returns the ordered candidate list for OpenRouter.
 * Preserves the exact requested model FIRST (e.g. meta-llama/llama-3.2-1b-instruct),
 * followed by configured/verified fallbacks when the primary fails.
 */
export function getOpenRouterCandidateModels(
  requestedModel?: string,
  explicitFallbacks?: string[]
): string[] {
  const req = requestedModel?.trim() || '';
  const fallbacks = (explicitFallbacks && explicitFallbacks.length > 0)
    ? explicitFallbacks
    : DEFAULT_OPENROUTER_FALLBACKS;

  const freeMapping: Record<string, string[]> = {
    'openai/gpt-4o-mini': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
    'openai/gpt-4o': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
    'gpt-4o-mini': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
    'anthropic/claude-3-haiku': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
    'anthropic/claude-3.5-sonnet': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'openrouter/free'],
    'anthropic/claude-3-5-sonnet': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'openrouter/free'],
    'claude-3.5-sonnet': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'openrouter/free'],
    'deepseek/deepseek-r1': ['deepseek/deepseek-r1:free', 'deepseek/deepseek-chat:free', 'qwen/qwen-2.5-coder-32b-instruct:free'],
    'deepseek-r1': ['deepseek/deepseek-r1:free', 'deepseek/deepseek-chat:free', 'qwen/qwen-2.5-coder-32b-instruct:free'],
    'deepseek/deepseek-chat': ['deepseek/deepseek-chat:free', 'deepseek/deepseek-r1:free', 'meta-llama/llama-3.3-70b-instruct:free'],
    'deepseek-chat': ['deepseek/deepseek-chat:free', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter/free'],
    'qwen/qwen-2.5-coder-32b-instruct': ['qwen/qwen-2.5-coder-32b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter/free'],
    'meta-llama/llama-3.3-70b-instruct': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
  };

  if (!req || req === 'openrouter/free' || req === 'auto') {
    return Array.from(new Set([...fallbacks, 'openrouter/free']));
  }

  // Exact roster or direct OpenRouter models: keep exact requested model at index 0,
  // then append explicit/default fallback candidates.
  if (
    req === 'meta-llama/llama-3.2-1b-instruct' ||
    req === 'deepseek/deepseek-chat-v3.1' ||
    req.includes(':free') ||
    req.includes('/')
  ) {
    const mapped = freeMapping[req] || [];
    return Array.from(new Set([req, ...mapped, ...fallbacks]));
  }

  if (freeMapping[req]) {
    return Array.from(new Set([...freeMapping[req], ...fallbacks]));
  }

  return Array.from(new Set([`${req}:free`, ...fallbacks]));
}

export function classifyHttpFailure(status: number, bodyText = ''): {
  errorType: LLMErrorType;
  recoverable: boolean;
} {
  if (status === 429) {
    return { errorType: 'rate_limit', recoverable: true };
  }
  if (status === 404 || status === 410 || status === 502 || status === 503 || status === 504) {
    return { errorType: 'unavailable', recoverable: true };
  }
  if (status === 401 || status === 403) {
    return { errorType: 'auth_error', recoverable: false };
  }
  if (status === 400 || status === 422) {
    // Model ID invalid/unsupported -> do NOT retry same model, move to next fallback candidate
    return { errorType: 'invalid_model', recoverable: false };
  }
  if (status >= 500 || /rate|overload|capacity|timeout/i.test(bodyText)) {
    return { errorType: 'unavailable', recoverable: true };
  }
  return { errorType: 'network_error', recoverable: false };
}

function isTimeoutError(err: any): boolean {
  const name = String(err?.name || '');
  const msg = String(err?.message || '');
  return (
    name === 'TimeoutError' ||
    name === 'AbortError' ||
    /timeout|aborted|ETIMEDOUT/i.test(msg)
  );
}

// Lazy Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export function resetCachedClientsForTests(): void {
  geminiClient = null;
}

async function runOpenAICompatibleCandidates(params: {
  providerName: AgentProvider;
  endpoint: string;
  apiKey: string;
  candidates: string[];
  prompt: string;
  systemInstruction?: string;
  temperature: number;
  requestedMaxTokens?: number;
  headers?: Record<string, string>;
  timeoutMs: number;
  maxRetriesPerCandidate: number;
  fetchImpl: typeof fetch;
  attempts: LLMAttemptRecord[];
}): Promise<{
  ok: true;
  text: string;
  model: string;
  tokensUsed?: number;
} | {
  ok: false;
  lastError: string;
}> {
  let lastError = `All ${params.providerName} candidates failed`;

  for (const candidateModel of params.candidates) {
    const budget = getModelTokenBudget(candidateModel, params.requestedMaxTokens);

    for (let retry = 0; retry <= params.maxRetriesPerCandidate; retry++) {
      const attemptStart = Date.now();
      try {
        const res = await params.fetchImpl(params.endpoint, {
          method: 'POST',
          signal: AbortSignal.timeout(params.timeoutMs),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${params.apiKey}`,
            ...(params.headers || {}),
          },
          body: JSON.stringify({
            model: candidateModel,
            messages: [
              ...(params.systemInstruction ? [{ role: 'system', content: params.systemInstruction }] : []),
              { role: 'user', content: params.prompt },
            ],
            temperature: params.temperature,
            max_tokens: budget,
          }),
        });

        const latencyMs = Date.now() - attemptStart;
        if (res.ok) {
          const data: any = await res.json();
          const text = String(data?.choices?.[0]?.message?.content || '');
          const actualModel = String(data?.model || candidateModel);
          if (!text.trim()) {
            lastError = `${candidateModel} returned empty response`;
            params.attempts.push({
              provider: params.providerName,
              model: actualModel,
              statusCode: res.status,
              errorType: 'empty_response',
              error: lastError,
              latencyMs,
            });
            // Recoverable with next candidate model
            break;
          }

          params.attempts.push({
            provider: params.providerName,
            model: actualModel,
            statusCode: res.status,
            errorType: 'ok',
            latencyMs,
          });
          return {
            ok: true,
            text,
            model: actualModel,
            tokensUsed: data?.usage?.total_tokens,
          };
        }

        const errBody = await res.text().catch(() => '');
        const { errorType, recoverable } = classifyHttpFailure(res.status, errBody);
        lastError = `HTTP ${res.status} from ${candidateModel}: ${errBody.slice(0, 180) || errorType}`;
        params.attempts.push({
          provider: params.providerName,
          model: candidateModel,
          statusCode: res.status,
          errorType,
          error: lastError,
          latencyMs,
        });

        if (errorType === 'auth_error') {
          return { ok: false, lastError };
        }
        if (!recoverable || retry >= params.maxRetriesPerCandidate) {
          break; // Move to next candidate model
        }
        await new Promise((r) => setTimeout(r, 150 * (retry + 1)));
      } catch (err: any) {
        const latencyMs = Date.now() - attemptStart;
        const timedOut = isTimeoutError(err);
        const errorType: LLMErrorType = timedOut ? 'timeout' : 'network_error';
        lastError = `${candidateModel} ${errorType}: ${err?.message || String(err)}`;
        params.attempts.push({
          provider: params.providerName,
          model: candidateModel,
          errorType,
          error: lastError,
          latencyMs,
        });
        if (retry >= params.maxRetriesPerCandidate) {
          break;
        }
        await new Promise((r) => setTimeout(r, 150 * (retry + 1)));
      }
    }
  }

  return { ok: false, lastError };
}

export async function callMultiProviderLLM(options: LLMRequestOptions): Promise<LLMResponse> {
  const startTime = Date.now();
  const {
    provider,
    model,
    prompt,
    systemInstruction,
    temperature = 0.7,
    fallbackModels,
    timeoutMs = 25000,
    maxRetriesPerCandidate = 1,
  } = options;
  const fetchImpl = options.fetchImpl || fetch;
  const attempts: LLMAttemptRecord[] = [];
  let lastFailureReason = '';

  // 1. Google Gemini Provider
  if (provider === 'gemini') {
    const client = options.geminiClientOverride || getGeminiClient();
    if (!client) {
      attempts.push({
        provider: 'gemini',
        model: model || 'gemini-2.5-flash',
        errorType: 'unconfigured',
        error: 'GEMINI_API_KEY is not configured',
        latencyMs: 0,
      });
      lastFailureReason = 'GEMINI_API_KEY is not configured';
    } else {
      const geminiCandidates = Array.from(
        new Set([
          model && model.includes('gemini') ? model : 'gemini-2.5-flash',
          ...(fallbackModels || []).filter((m) => m.includes('gemini')),
          'gemini-2.5-flash',
        ])
      );

      for (const gemModel of geminiCandidates) {
        const attemptStart = Date.now();
        try {
          const response = await client.models.generateContent({
            model: gemModel,
            contents: prompt,
            config: systemInstruction ? { systemInstruction } : undefined,
          });
          const text = String(response?.text || '');
          const latencyMs = Date.now() - attemptStart;
          if (!text.trim()) {
            lastFailureReason = `${gemModel} returned empty response`;
            attempts.push({
              provider: 'gemini',
              model: gemModel,
              errorType: 'empty_response',
              error: lastFailureReason,
              latencyMs,
            });
            continue;
          }
          attempts.push({
            provider: 'gemini',
            model: gemModel,
            errorType: 'ok',
            latencyMs,
          });
          return {
            text,
            provider: 'gemini',
            model: gemModel,
            requestedProvider: provider,
            requestedModel: model || gemModel,
            actualProvider: 'gemini',
            actualModel: gemModel,
            usedFallback: gemModel !== (model || gemModel),
            attempts,
            tokensUsed: response?.usageMetadata?.totalTokenCount,
            latencyMs: Date.now() - startTime,
            isSimulated: false,
          };
        } catch (err: any) {
          const latencyMs = Date.now() - attemptStart;
          lastFailureReason = err?.message || String(err);
          attempts.push({
            provider: 'gemini',
            model: gemModel,
            errorType: isTimeoutError(err) ? 'timeout' : 'unavailable',
            error: lastFailureReason,
            latencyMs,
          });
        }
      }
    }
  }

  // 2. OpenRouter Provider (attempts exact requestedModel first, then configured fallbacks)
  if (provider === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY?.trim();
    if (!key) {
      attempts.push({
        provider: 'openrouter',
        model: model || 'meta-llama/llama-3.2-1b-instruct',
        errorType: 'unconfigured',
        error: 'OPENROUTER_API_KEY is not configured',
        latencyMs: 0,
      });
      lastFailureReason = 'OPENROUTER_API_KEY is not configured';
    } else {
      const candidateModels = getOpenRouterCandidateModels(model, fallbackModels);
      const result = await runOpenAICompatibleCandidates({
        providerName: 'openrouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: key,
        candidates: candidateModels,
        prompt,
        systemInstruction,
        temperature,
        requestedMaxTokens: options.maxTokens,
        headers: {
          'HTTP-Referer': 'https://devforge.ai',
          'X-Title': 'DevForge AI Swarm',
        },
        timeoutMs,
        maxRetriesPerCandidate,
        fetchImpl,
        attempts,
      });

      if (result.ok) {
        return {
          text: result.text,
          provider: 'openrouter',
          model: result.model,
          requestedProvider: provider,
          requestedModel: model || candidateModels[0],
          actualProvider: 'openrouter',
          actualModel: result.model,
          usedFallback: result.model !== (model || candidateModels[0]),
          attempts,
          tokensUsed: result.tokensUsed,
          latencyMs: Date.now() - startTime,
          isSimulated: false,
        };
      } else if ('lastError' in result) {
        lastFailureReason = result.lastError;
      }
    }
  }

  // 3. NVIDIA NIM Provider
  if (provider === 'nvidia') {
    const key = process.env.NVIDIA_API_KEY?.trim();
    const nvidiaCandidates = Array.from(
      new Set([model || 'meta/llama-3.3-70b-instruct', ...(fallbackModels || [])])
    );
    if (!key) {
      attempts.push({
        provider: 'nvidia',
        model: nvidiaCandidates[0],
        errorType: 'unconfigured',
        error: 'NVIDIA_API_KEY is not configured',
        latencyMs: 0,
      });
      lastFailureReason = 'NVIDIA_API_KEY is not configured';
    } else {
      const result = await runOpenAICompatibleCandidates({
        providerName: 'nvidia',
        endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
        apiKey: key,
        candidates: nvidiaCandidates,
        prompt,
        systemInstruction,
        temperature,
        requestedMaxTokens: options.maxTokens,
        timeoutMs: Math.min(timeoutMs, 15000),
        maxRetriesPerCandidate: 0,
        fetchImpl,
        attempts,
      });

      if (result.ok) {
        return {
          text: result.text,
          provider: 'nvidia',
          model: result.model,
          requestedProvider: provider,
          requestedModel: model || nvidiaCandidates[0],
          actualProvider: 'nvidia',
          actualModel: result.model,
          usedFallback: result.model !== (model || nvidiaCandidates[0]),
          attempts,
          tokensUsed: result.tokensUsed,
          latencyMs: Date.now() - startTime,
          isSimulated: false,
        };
      } else if ('lastError' in result) {
        lastFailureReason = result.lastError;
      }
    }
  }

  // 4. Groq Inference Provider
  if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY?.trim();
    const groqCandidates = Array.from(
      new Set([model || 'openai/gpt-oss-20b', ...(fallbackModels || []), ...DEFAULT_GROQ_FALLBACKS])
    );
    if (!key) {
      attempts.push({
        provider: 'groq',
        model: groqCandidates[0],
        errorType: 'unconfigured',
        error: 'GROQ_API_KEY is not configured',
        latencyMs: 0,
      });
      lastFailureReason = 'GROQ_API_KEY is not configured';
    } else {
      const result = await runOpenAICompatibleCandidates({
        providerName: 'groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: key,
        candidates: groqCandidates,
        prompt,
        systemInstruction,
        temperature,
        requestedMaxTokens: options.maxTokens,
        timeoutMs: Math.min(timeoutMs, 18000),
        maxRetriesPerCandidate,
        fetchImpl,
        attempts,
      });

      if (result.ok) {
        return {
          text: result.text,
          provider: 'groq',
          model: result.model,
          requestedProvider: provider,
          requestedModel: model || groqCandidates[0],
          actualProvider: 'groq',
          actualModel: result.model,
          usedFallback: result.model !== (model || groqCandidates[0]),
          attempts,
          tokensUsed: result.tokensUsed,
          latencyMs: Date.now() - startTime,
          isSimulated: false,
        };
      } else if ('lastError' in result) {
        lastFailureReason = result.lastError;
      }
    }
  }

  // 5. Cross-provider Gemini Core fallback (truthfully reports Gemini as actualProvider & actualModel!)
  if (provider !== 'gemini') {
    const fallbackClient = options.geminiClientOverride || getGeminiClient();
    if (fallbackClient) {
      const fallbackGemModel = 'gemini-2.5-flash';
      const attemptStart = Date.now();
      try {
        const response = await fallbackClient.models.generateContent({
          model: fallbackGemModel,
          contents: prompt,
          config: systemInstruction
            ? {
                systemInstruction: `Fallback execution after ${provider} (${model}) failed.\n${systemInstruction}`,
              }
            : undefined,
        });

        const text = String(response?.text || '');
        const latencyMs = Date.now() - attemptStart;
        if (text.trim()) {
          attempts.push({
            provider: 'gemini',
            model: fallbackGemModel,
            errorType: 'ok',
            latencyMs,
          });
          return {
            text,
            provider: 'gemini',
            model: fallbackGemModel,
            requestedProvider: provider,
            requestedModel: model,
            actualProvider: 'gemini',
            actualModel: fallbackGemModel,
            usedFallback: true,
            attempts,
            tokensUsed: response?.usageMetadata?.totalTokenCount,
            latencyMs: Date.now() - startTime,
            isSimulated: false,
          };
        }
        lastFailureReason = 'Fallback gemini-2.5-flash returned empty response';
        attempts.push({
          provider: 'gemini',
          model: fallbackGemModel,
          errorType: 'empty_response',
          error: lastFailureReason,
          latencyMs,
        });
      } catch (e: any) {
        const latencyMs = Date.now() - attemptStart;
        lastFailureReason = `Fallback to ${fallbackGemModel} failed: ${e?.message || String(e)}`;
        attempts.push({
          provider: 'gemini',
          model: fallbackGemModel,
          errorType: isTimeoutError(e) ? 'timeout' : 'unavailable',
          error: lastFailureReason,
          latencyMs,
        });
      }
    }
  }

  // 6. All configured providers exhausted or unconfigured
  return {
    text: '',
    provider,
    model,
    requestedProvider: provider,
    requestedModel: model,
    actualProvider: 'none',
    actualModel: 'none',
    usedFallback: false,
    attempts,
    failureReason: lastFailureReason || `No live provider succeeded for ${provider}:${model}`,
    latencyMs: Date.now() - startTime,
    isSimulated: true,
  };
}

export function extractJsonStringFromLLMText(raw: string): string {
  const trimmed = (raw || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }
  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else {
    start = Math.max(firstBrace, firstBracket);
  }
  if (start === -1) return trimmed;
  const opener = trimmed[start];
  const closer = opener === '{' ? '}' : ']';
  const lastClose = trimmed.lastIndexOf(closer);
  if (lastClose > start) {
    return trimmed.slice(start, lastClose + 1);
  }
  return trimmed.slice(start);
}

export interface StructuredLLMOptions<T> extends LLMRequestOptions {
  schema: z.ZodType<T>;
  maxSchemaRetries?: number;
  callFn?: (opts: LLMRequestOptions) => Promise<LLMResponse>;
}

export async function callStructuredLLMWithZod<T>(
  options: StructuredLLMOptions<T>
): Promise<
  | { ok: true; data: T; llmResponse: LLMResponse }
  | { ok: false; error: string; llmResponse: LLMResponse }
> {
  const invoker = options.callFn || callMultiProviderLLM;
  const maxSchemaRetries = Math.max(0, options.maxSchemaRetries ?? 1);
  let currentPrompt = options.prompt;
  let lastResponse: LLMResponse | null = null;
  let lastError = 'Unknown schema error';

  for (let attempt = 0; attempt <= maxSchemaRetries; attempt++) {
    const res = await invoker({
      ...options,
      prompt: currentPrompt,
      temperature: options.temperature ?? 0.2,
    });
    lastResponse = res;

    if (!res.text || res.isSimulated) {
      lastError = res.failureReason || 'Empty or unconfigured model response';
      break;
    }

    try {
      const jsonStr = extractJsonStringFromLLMText(res.text);
      const parsedJson = JSON.parse(jsonStr);
      const checked = options.schema.safeParse(parsedJson);
      if (checked.success) {
        return { ok: true, data: checked.data, llmResponse: res };
      }
      lastError = `Zod schema mismatch: ${checked.error.issues
        .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
        .join('; ')}`;
    } catch (parseErr: any) {
      lastError = `Invalid JSON response: ${parseErr?.message || String(parseErr)}`;
    }

    currentPrompt = `${options.prompt}\n\n[CRITICAL FORMAT CORRECTION — Attempt ${attempt + 2}]: Previous response failed validation (${lastError}). Respond ONLY with a valid, complete JSON object matching the requested schema. Keep strings concise so JSON is never truncated.`;
  }

  return {
    ok: false,
    error: lastError,
    llmResponse: lastResponse || {
      text: '',
      provider: options.provider,
      model: options.model,
      requestedProvider: options.provider,
      requestedModel: options.model,
      actualProvider: 'none',
      actualModel: 'none',
      usedFallback: false,
      attempts: [],
      failureReason: lastError,
      latencyMs: 0,
      isSimulated: true,
    },
  };
}

export function getProviderConfigStatus() {
  const geminiConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' && process.env.GEMINI_API_KEY.trim() !== '');
  const openrouterConfigured = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim() !== '');
  const nvidiaConfigured = !!(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim() !== '');
  const groqConfigured = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '');

  return {
    gemini: {
      configured: geminiConfigured,
      available: geminiConfigured,
      availabilityReason: geminiConfigured ? undefined : 'GEMINI_API_KEY is not set',
      name: 'Google Gemini',
      models: PROVIDER_MODEL_CATALOG.gemini.map((m) => m.id),
      modelCatalog: PROVIDER_MODEL_CATALOG.gemini,
      role: 'CEO Executive Orchestration & Final Gate',
      latencyEstimate: '180ms',
    },
    openrouter: {
      configured: openrouterConfigured,
      available: openrouterConfigured,
      availabilityReason: openrouterConfigured ? undefined : 'OPENROUTER_API_KEY is not set (falls back to Gemini if configured)',
      name: 'OpenRouter',
      models: PROVIDER_MODEL_CATALOG.openrouter.map((m) => m.id),
      modelCatalog: PROVIDER_MODEL_CATALOG.openrouter,
      role: 'PRD, Architecture & Frontend Code Synthesis',
      latencyEstimate: openrouterConfigured ? '350ms' : 'Fallback to Gemini',
    },
    nvidia: {
      configured: nvidiaConfigured,
      available: false,
      availabilityReason: 'NVIDIA NIM endpoints for configured LLaMA models returned HTTP 410 (end of life) on 2026-09-13',
      name: 'NVIDIA NIM',
      models: PROVIDER_MODEL_CATALOG.nvidia.map((m) => m.id),
      modelCatalog: PROVIDER_MODEL_CATALOG.nvidia,
      role: 'Deprecated / End-of-Life NIM Provider',
      latencyEstimate: 'Unavailable (HTTP 410 EOL)',
    },
    groq: {
      configured: groqConfigured,
      available: groqConfigured,
      availabilityReason: groqConfigured ? undefined : 'GROQ_API_KEY is not set (falls back to Gemini if configured)',
      name: 'Groq Inference',
      models: PROVIDER_MODEL_CATALOG.groq.map((m) => m.id),
      modelCatalog: PROVIDER_MODEL_CATALOG.groq,
      role: 'QA Assertions, Test Execution & SRE Readiness',
      latencyEstimate: groqConfigured ? '90ms' : 'Fallback to Gemini',
    },
  };
}
