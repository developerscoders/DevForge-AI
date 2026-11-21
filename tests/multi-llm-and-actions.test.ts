// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { AGENT_ROSTER, DEFAULT_MODEL_CONFIG, PROVIDER_MODEL_CATALOG } from '../src/config/agentRoster.js';
import {
  callMultiProviderLLM,
  callStructuredLLMWithZod,
  getModelTokenBudget,
  getOpenRouterCandidateModels,
  resetCachedClientsForTests,
} from '../src/lib/multi-llm-provider.js';
import { runAgentWithControlledToolActions } from '../src/lib/openrouterToolCalling.js';
import { executionStore } from '../src/lib/orchestrator/executionStore.js';
import { buildInitialAgentsForProject } from '../src/lib/orchestrator/orchestratorEngine.js';
import { Project } from '../src/types.js';

describe('Multi-LLM Provider Resilience, Token Budgeting & Controlled Tool Actions', () => {
  let tmpDir: string;
  let originalDataDir: string | undefined;
  let originalKeys: Record<string, string | undefined> = {};

  beforeEach(() => {
    originalDataDir = process.env.DEVFORGE_DATA_DIR;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devforge-llm-test-'));
    process.env.DEVFORGE_DATA_DIR = tmpDir;

    for (const k of ['GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'NVIDIA_API_KEY', 'GROQ_API_KEY']) {
      originalKeys[k] = process.env[k];
      delete process.env[k];
    }

    resetCachedClientsForTests();
    executionStore.resetForTests();
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(originalKeys)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    if (originalDataDir === undefined) delete process.env.DEVFORGE_DATA_DIR;
    else process.env.DEVFORGE_DATA_DIR = originalDataDir;
    resetCachedClientsForTests();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('keeps AGENT_ROSTER, DEFAULT_MODEL_CONFIG, and PROVIDER_MODEL_CATALOG consistent with live verified defaults', () => {
    expect(AGENT_ROSTER.frank.provider).toBe('openrouter');
    expect(AGENT_ROSTER.frank.availability).toBe('verified');
    expect(AGENT_ROSTER.frank.defaultModel).toBe(DEFAULT_MODEL_CONFIG['Frontend Engineer']);
    expect(AGENT_ROSTER.parker.defaultModel).toBe('meta-llama/llama-3.2-1b-instruct');
    expect(PROVIDER_MODEL_CATALOG.nvidia.every((m) => !m.available)).toBe(true);
  });

  it('preserves requested small model first in candidate chain and caps token budget for 1B models', () => {
    const candidates = getOpenRouterCandidateModels('meta-llama/llama-3.2-1b-instruct');
    expect(candidates[0]).toBe('meta-llama/llama-3.2-1b-instruct');
    expect(candidates.length).toBeGreaterThanOrEqual(3);
    expect(getModelTokenBudget('meta-llama/llama-3.2-1b-instruct', 4096)).toBeLessThanOrEqual(1024);
  });

  it('tries OpenRouter primary model first, records failed attempts (429/404/empty), and recovers on fallback model', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test-key-12345';
    const calledModels: string[] = [];

    const mockFetch: typeof fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body || '{}'));
      calledModels.push(body.model);

      if (body.model === 'meta-llama/llama-3.2-1b-instruct') {
        return new Response(JSON.stringify({ error: { message: 'rate limited' } }), { status: 429 });
      }
      if (body.model === 'deepseek/deepseek-chat-v3.1') {
        return new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), { status: 200 });
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"ok":true,"source":"fallback"}' } }],
          usage: { total_tokens: 142 },
        }),
        { status: 200 }
      );
    };

    const res = await callMultiProviderLLM({
      provider: 'openrouter',
      model: 'meta-llama/llama-3.2-1b-instruct',
      fallbackModels: ['deepseek/deepseek-chat-v3.1', 'qwen/qwen-2.5-coder-32b-instruct:free'],
      prompt: 'Generate plan JSON',
      maxRetriesPerCandidate: 0,
      fetchImpl: mockFetch,
    });

    expect(calledModels[0]).toBe('meta-llama/llama-3.2-1b-instruct');
    expect(calledModels[1]).toBe('deepseek/deepseek-chat-v3.1');
    expect(calledModels[2]).toBe('qwen/qwen-2.5-coder-32b-instruct:free');
    expect(res.requestedModel).toBe('meta-llama/llama-3.2-1b-instruct');
    expect(res.actualProvider).toBe('openrouter');
    expect(res.actualModel).toBe('qwen/qwen-2.5-coder-32b-instruct:free');
    expect(res.usedFallback).toBe(true);
    expect(res.attempts).toHaveLength(3);
    expect(res.attempts[0].errorType).toBe('rate_limit');
    expect(res.attempts[1].errorType).toBe('empty_response');
    expect(res.attempts[2].errorType).toBe('ok');
  });

  it('falls back to Gemini truthfully when OpenRouter candidates all fail and GEMINI_API_KEY is configured', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test-key-12345';
    process.env.GEMINI_API_KEY = 'AIzaTestKeyForUnitTestingOnly12345';

    const mockFetch: typeof fetch = async () => {
      return new Response('unavailable', { status: 503 });
    };

    const res = await callMultiProviderLLM({
      provider: 'openrouter',
      model: 'deepseek/deepseek-chat-v3.1',
      fallbackModels: ['qwen/qwen-2.5-coder-32b-instruct:free'],
      prompt: 'Respond briefly',
      maxRetriesPerCandidate: 0,
      fetchImpl: mockFetch,
      geminiClientOverride: {
        models: {
          generateContent: async () => ({
            text: 'Gemini recovery response',
            usageMetadata: { totalTokenCount: 55 },
          }),
        },
      },
    });

    expect(res.text).toBe('Gemini recovery response');
    expect(res.requestedProvider).toBe('openrouter');
    expect(res.requestedModel).toBe('deepseek/deepseek-chat-v3.1');
    expect(res.actualProvider).toBe('gemini');
    expect(res.actualModel).toBe('gemini-2.5-flash');
    expect(res.usedFallback).toBe(true);
    expect(res.isSimulated).toBe(false);
  });

  it('retries callStructuredLLMWithZod once when initial output fails JSON/Zod validation', async () => {
    let turn = 0;
    const schema = z.object({ title: z.string(), count: z.number() });

    const out = await callStructuredLLMWithZod({
      provider: 'openrouter',
      model: 'deepseek/deepseek-chat-v3.1',
      prompt: 'Provide structured data',
      schema,
      maxSchemaRetries: 1,
      callFn: async () => {
        turn++;
        return {
          text: turn === 1 ? 'not valid json {' : '```json\n{"title":"TaskFlow","count":4}\n```',
          provider: 'openrouter',
          model: 'deepseek/deepseek-chat-v3.1',
          requestedProvider: 'openrouter',
          requestedModel: 'deepseek/deepseek-chat-v3.1',
          actualProvider: 'openrouter',
          actualModel: 'deepseek/deepseek-chat-v3.1',
          usedFallback: false,
          attempts: [],
          latencyMs: 5,
          isSimulated: false,
        };
      },
    });

    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.data).toEqual({ title: 'TaskFlow', count: 4 });
    }
    expect(turn).toBe(2);
  });

  it('runs OpenRouter controlled tool action loop through executeRegisteredTool with RBAC enforcement', async () => {
    const project: Project = {
      id: 'proj_ctrl_01',
      name: 'Controlled Action App',
      description: 'Test project',
      prompt: 'Build app',
      status: 'coding',
      createdAt: new Date().toISOString(),
      aiCreditsUsed: 0,
      modelConfig: {},
      agents: buildInitialAgentsForProject('proj_ctrl_01'),
      files: [],
    };
    executionStore.saveProject(project);
    executionStore.saveRun({
      runId: 'run_ctrl_01',
      projectId: project.id,
      status: 'running',
      prompt: project.prompt,
      triggeredBy: 'manual',
      modelConfig: {},
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      tasks: [],
      dynamicSubagents: [],
      toolExecutions: [],
      communications: [],
      approvals: [],
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        cancelledTasks: 0,
        totalToolCalls: 0,
        succeededToolCalls: 0,
        failedToolCalls: 0,
        totalTokensUsed: 0,
        totalDurationMs: 0,
      },
    });

    let step = 0;
    const res = await runAgentWithControlledToolActions({
      provider: 'openrouter',
      model: 'qwen/qwen-2.5-coder-32b-instruct:free',
      systemInstruction: 'Implement src/hello.ts cleanly',
      userPrompt: 'Write src/hello.ts then finalize.',
      toolContext: {
        projectId: project.id,
        runId: 'run_ctrl_01',
        agentId: 'ag_fe',
        agentName: 'Frank Lead',
      },
      allowedTools: ['write_file', 'run_typecheck'],
      callFn: async () => {
        step++;
        if (step === 1) {
          // Attempt unauthorized tool first (ag_fe lacks deploy_integration and it is outside allowedTools)
          return {
            text: JSON.stringify({
              thought: 'Try forbidden tool',
              action: { tool: 'deploy_integration', args: { provider: 'vercel', target_name: 'x' } },
            }),
            provider: 'openrouter',
            model: 'qwen/qwen-2.5-coder-32b-instruct:free',
            requestedProvider: 'openrouter',
            requestedModel: 'qwen/qwen-2.5-coder-32b-instruct:free',
            actualProvider: 'openrouter',
            actualModel: 'qwen/qwen-2.5-coder-32b-instruct:free',
            usedFallback: false,
            attempts: [{ provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct:free', errorType: 'ok', latencyMs: 10 }],
            tokensUsed: 30,
            latencyMs: 10,
            isSimulated: false,
          };
        }
        if (step === 2) {
          return {
            text: JSON.stringify({
              thought: 'Write allowed component file',
              action: { tool: 'write_file', args: { path: 'src/hello.ts', content: 'export const greeting = "hello";\n' } },
            }),
            provider: 'openrouter',
            model: 'qwen/qwen-2.5-coder-32b-instruct:free',
            requestedProvider: 'openrouter',
            requestedModel: 'qwen/qwen-2.5-coder-32b-instruct:free',
            actualProvider: 'openrouter',
            actualModel: 'qwen/qwen-2.5-coder-32b-instruct:free',
            usedFallback: false,
            attempts: [{ provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct:free', errorType: 'ok', latencyMs: 12 }],
            tokensUsed: 40,
            latencyMs: 12,
            isSimulated: false,
          };
        }
        return {
          text: JSON.stringify({ thought: 'Done', final: { filesCreated: ['src/hello.ts'] } }),
          provider: 'openrouter',
          model: 'qwen/qwen-2.5-coder-32b-instruct:free',
          requestedProvider: 'openrouter',
          requestedModel: 'qwen/qwen-2.5-coder-32b-instruct:free',
          actualProvider: 'openrouter',
          actualModel: 'qwen/qwen-2.5-coder-32b-instruct:free',
          usedFallback: false,
          attempts: [{ provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct:free', errorType: 'ok', latencyMs: 8 }],
          tokensUsed: 20,
          latencyMs: 8,
          isSimulated: false,
        };
      },
    });

    expect(res.iterations).toBe(3);
    expect(res.toolRecords).toHaveLength(2);
    expect(res.toolRecords[0].status).toBe('failed');
    expect(res.toolRecords[0].error).toMatch(/Permission denied/);
    expect(res.toolRecords[1].status).toBe('success');
    expect(executionStore.getProject(project.id)?.files.some((f) => f.path === 'src/hello.ts')).toBe(true);
  });
});
