import { GoogleGenAI } from '@google/genai';

export interface LLMRequestOptions {
  provider: 'gemini' | 'openrouter' | 'nvidia' | 'groq';
  model: string;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  text: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
  isSimulated: boolean;
}

// Helper to map legacy, paid, or generic models to verified FREE and LATEST OpenRouter endpoints (:free)
function getOpenRouterCandidateModels(requestedModel?: string): string[] {
  const req = requestedModel?.trim() || '';

  // Roster entries are deliberate, verified IDs; never rewrite them to a
  // similarly named :free model because that changes the model the user chose.
  if (req === 'meta-llama/llama-3.2-1b-instruct' || req === 'deepseek/deepseek-chat-v3.1') {
    return [req];
  }

  // Active verified free models on OpenRouter (2025/2026):
  // - meta-llama/llama-3.3-70b-instruct:free (Latest high-power Llama 3.3 70B)
  // - deepseek/deepseek-r1:free (Latest reasoning R1 model)
  // - deepseek/deepseek-chat:free (Latest DeepSeek V3 chat)
  // - qwen/qwen-2.5-coder-32b-instruct:free (State-of-the-art free coding model)
  // - openrouter/free (Official OpenRouter free models auto-router)
  const freeModels = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'openrouter/free'
  ];

  if (!req || req === 'openrouter/free' || req === 'auto') {
    return ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'];
  }

  // If already explicitly specifies :free
  if (req.includes(':free')) {
    return Array.from(new Set([req, 'meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'])).slice(0, 3);
  }

  // Map requested models to their latest free counterparts
  const freeMapping: Record<string, string[]> = {
    // PM / General / OpenAI mappings -> LLaMA 3.3 70B Free & DeepSeek V3 Chat Free
    'openai/gpt-4o-mini': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
    'openai/gpt-4o': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
    'gpt-4o-mini': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
    'anthropic/claude-3-haiku': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free'],
    'anthropic/claude-3.5-sonnet': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'openrouter/free'],
    'anthropic/claude-3-5-sonnet': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'openrouter/free'],
    'claude-3.5-sonnet': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-r1:free', 'openrouter/free'],
    
    // Architecture / Reasoning mappings -> DeepSeek R1 Free & DeepSeek V3 Chat Free
    'deepseek/deepseek-r1': ['deepseek/deepseek-r1:free', 'deepseek/deepseek-chat:free', 'qwen/qwen-2.5-coder-32b-instruct:free'],
    'deepseek-r1': ['deepseek/deepseek-r1:free', 'deepseek/deepseek-chat:free', 'qwen/qwen-2.5-coder-32b-instruct:free'],
    'deepseek/deepseek-chat': ['deepseek/deepseek-chat:free', 'deepseek/deepseek-r1:free', 'meta-llama/llama-3.3-70b-instruct:free'],
    'deepseek-chat': ['deepseek/deepseek-chat:free', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter/free'],

    // Coding / SRE mappings -> Qwen 2.5 Coder 32B Free & LLaMA 3.3 70B Free
    'qwen/qwen-2.5-coder-32b-instruct': ['qwen/qwen-2.5-coder-32b-instruct:free', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter/free'],
    'meta-llama/llama-3.3-70b-instruct': ['meta-llama/llama-3.3-70b-instruct:free', 'deepseek/deepseek-chat:free', 'openrouter/free']
  };

  if (freeMapping[req]) {
    return freeMapping[req];
  }

  // Default fallback: Try requested model with :free, then verified free fallbacks
  const candidates = [
    `${req}:free`,
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-r1:free',
    'openrouter/free'
  ];

  return Array.from(new Set(candidates)).slice(0, 3);
}

// Lazy Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '') {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return geminiClient;
}

export async function callMultiProviderLLM(options: LLMRequestOptions): Promise<LLMResponse> {
  const startTime = Date.now();
  const { provider, model, prompt, systemInstruction, temperature = 0.7 } = options;

  // 1. Google Gemini Provider
  if (provider === 'gemini') {
    const client = getGeminiClient();
    if (client) {
      try {
        const geminiModel = model.includes('gemini') ? model : 'gemini-2.5-flash';
        const response = await client.models.generateContent({
          model: geminiModel,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined,
        });

        const text = response.text || '';
        return {
          text,
          provider: 'Google Gemini',
          model: geminiModel,
          latencyMs: Date.now() - startTime,
          isSimulated: false,
        };
      } catch (err: any) {
        console.warn(`[Gemini API Warning]: ${err.message}. Falling back to resilient generation.`);
      }
    }
  }

  // 2. OpenRouter Provider (Latest Free Models: LLaMA 3.3 70B, DeepSeek R1/Chat, Qwen 2.5 Coder)
  if (provider === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY;
    if (key && key.trim() !== '') {
      try {
        const candidateModels = getOpenRouterCandidateModels(model);
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          signal: AbortSignal.timeout(30000), // Extended 30s timeout for free queue & cold starts
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'https://devforge.ai',
            'X-Title': 'DevForge AI Swarm',
          },
          body: JSON.stringify({
            model: candidateModels[0],
            models: candidateModels,
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: options.maxTokens || 2048,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || '';
          return {
            text,
            provider: 'OpenRouter Free Tier',
            model: data.model || candidateModels[0],
            tokensUsed: data.usage?.total_tokens,
            latencyMs: Date.now() - startTime,
            isSimulated: false,
          };
        } else {
          const errBody = await res.text();
          console.warn(`[OpenRouter HTTP Status ${res.status}]: ${errBody.slice(0, 160)}. Routing to secondary fallback.`);
        }
      } catch (err: any) {
        if (err.name === 'TimeoutError' || err.message?.includes('timeout') || err.message?.includes('aborted')) {
          console.warn(`[OpenRouter Timeout]: OpenRouter free model took >30s or connection stalled. Routing to resilient fallback engine.`);
        } else {
          console.warn(`[OpenRouter Notice]: ${err.message}. Routing to fallback.`);
        }
      }
    }
  }

  // 3. NVIDIA NIM Provider (LLaMA 3.1 70B / Nemotron)
  if (provider === 'nvidia') {
    const key = process.env.NVIDIA_API_KEY;
    if (key && key.trim() !== '') {
      try {
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          signal: AbortSignal.timeout(12000),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: model || 'meta/llama-3.1-70b-instruct',
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt }
            ],
            temperature,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || '';
          return {
            text,
            provider: 'NVIDIA NIM',
            model: model || 'meta/llama-3.1-70b-instruct',
            tokensUsed: data.usage?.total_tokens,
            latencyMs: Date.now() - startTime,
            isSimulated: false,
          };
        } else {
          console.warn(`[NVIDIA NIM HTTP Error]: status ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`[NVIDIA NIM Warning]: ${err.message}`);
      }
    }
  }

  // 4. Groq Free Inference Provider (LLaMA 3.3 70B / Mixtral 8x7B)
  if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY;
    if (key && key.trim() !== '') {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          signal: AbortSignal.timeout(12000),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: model || 'llama-3.3-70b-versatile',
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt }
            ],
            temperature,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || '';
          return {
            text,
            provider: 'Groq (Free Inference)',
            model: model || 'llama-3.3-70b-versatile',
            tokensUsed: data.usage?.total_tokens,
            latencyMs: Date.now() - startTime,
            isSimulated: false,
          };
        } else {
          console.warn(`[Groq HTTP Error]: status ${res.status}`);
        }
      } catch (err: any) {
        console.warn(`[Groq Warning]: ${err.message}`);
      }
    }
  }

  // 5. Intelligent Fallback Routing: If a non-Gemini provider key is absent, route to Gemini client if available
  const fallbackClient = getGeminiClient();
  if (fallbackClient) {
    try {
      const response = await fallbackClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction: `You are executing on behalf of ${provider.toUpperCase()} (${model}).\n${systemInstruction}`,
            }
          : undefined,
      });

      const text = response.text || '';
      if (text) {
        return {
          text,
          provider: `${provider.toUpperCase()} (via Gemini Core)`,
          model: model || 'auto-routed',
          latencyMs: Date.now() - startTime,
          isSimulated: false,
        };
      }
    } catch (e: any) {
      console.warn(`Fallback to Gemini failed: ${e.message}`);
    }
  }

  // 6. Resilient Offline Synthesis when no keys are active
  return {
    text: '',
    provider: `${provider.toUpperCase()} (Offline Engine)`,
    model: model || 'auto-routed',
    latencyMs: Date.now() - startTime,
    isSimulated: true,
  };
}

export function getProviderConfigStatus() {
  const geminiConfigured = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const openrouterConfigured = !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim() !== '');
  const nvidiaConfigured = !!(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim() !== '');
  const groqConfigured = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '');

  return {
    gemini: {
      configured: geminiConfigured,
      name: 'Google Gemini',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
      role: 'CEO Executive Synthesis & Cross-Heal',
      latencyEstimate: '180ms',
    },
    openrouter: {
      configured: openrouterConfigured,
      name: 'OpenRouter (Free Tier)',
      models: [
        'meta-llama/llama-3.3-70b-instruct:free',
        'deepseek/deepseek-r1:free',
        'deepseek/deepseek-chat:free',
        'qwen/qwen-2.5-coder-32b-instruct:free',
        'openrouter/free'
      ],
      role: 'Strategic PRD & Architecture Contracts',
      latencyEstimate: openrouterConfigured ? '350ms' : 'Fallback to Gemini',
    },
    nvidia: {
      configured: nvidiaConfigured,
      name: 'NVIDIA NIM',
      models: ['meta/llama-3.1-70b-instruct', 'nvidia/nemotron-4-340b'],
      role: 'React UI Component Tree Synthesizer',
      latencyEstimate: nvidiaConfigured ? '220ms' : 'Fallback to Gemini',
    },
    groq: {
      configured: groqConfigured,
      name: 'Groq Free Inference',
      models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
      role: 'QA Security Assertions & SRE Ingress',
      latencyEstimate: groqConfigured ? '90ms' : 'Fallback to Gemini',
    },
  };
}
