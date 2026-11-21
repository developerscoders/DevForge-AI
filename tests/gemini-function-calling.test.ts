// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runAgentWithGeminiTools } from '../src/lib/geminiFunctionCalling.js';
import { executionStore } from '../src/lib/orchestrator/executionStore.js';
import { buildInitialAgentsForProject } from '../src/lib/orchestrator/orchestratorEngine.js';

describe('Gemini Multi-Turn Function Calling Engine', () => {
  let tmpDir: string;
  let originalDataDir: string | undefined;
  const projectId = 'proj_gemini_fc_01';
  const runId = 'run_gemini_fc_01';

  beforeEach(() => {
    originalDataDir = process.env.DEVFORGE_DATA_DIR;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devforge-gem-test-'));
    process.env.DEVFORGE_DATA_DIR = tmpDir;
    executionStore.resetForTests();

    executionStore.saveProject({
      id: projectId,
      name: 'Gemini Tool Test',
      description: 'Test project for function calling loop',
      prompt: 'Verify multi-turn tool calls',
      status: 'coding',
      createdAt: new Date().toISOString(),
      aiCreditsUsed: 0,
      modelConfig: {},
      agents: buildInitialAgentsForProject(projectId),
      files: [
        {
          path: 'README.txt',
          name: 'README.txt',
          type: 'file',
          content: 'DevForge FC Workspace Ready',
        },
      ],
    });
    executionStore.saveRun({
      runId,
      projectId,
      status: 'running',
      prompt: 'Verify multi-turn tool calls',
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
  });

  afterEach(() => {
    if (originalDataDir === undefined) delete process.env.DEVFORGE_DATA_DIR;
    else process.env.DEVFORGE_DATA_DIR = originalDataDir;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('executes multi-turn tool calls, preserves thoughtSignature parts, and returns functionResponse', async () => {
    const capturedCalls: any[] = [];
    let turn = 0;

    const fakeGeminiClient = {
      models: {
        generateContent: async (params: any) => {
          capturedCalls.push(JSON.parse(JSON.stringify(params)));
          turn++;
          if (turn === 1) {
            return {
              usageMetadata: { totalTokenCount: 120 },
              candidates: [
                {
                  content: {
                    role: 'model',
                    parts: [
                      {
                        thoughtSignature: 'sig_xyz_123',
                        functionCall: {
                          id: 'call_1',
                          name: 'write_file',
                          args: {
                            path: 'src/hello.ts',
                            content: 'export const greeting = "Hello DevForge";\n',
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            };
          }
          if (turn === 2) {
            return {
              usageMetadata: { totalTokenCount: 95 },
              candidates: [
                {
                  content: {
                    role: 'model',
                    parts: [
                      {
                        functionCall: {
                          id: 'call_2',
                          name: 'read_file',
                          args: { path: 'src/hello.ts' },
                        },
                      },
                    ],
                  },
                },
              ],
            };
          }
          return {
            usageMetadata: { totalTokenCount: 60 },
            text: 'Created src/hello.ts and verified contents cleanly.',
          };
        },
      },
    };

    const result = await runAgentWithGeminiTools({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are Frank, Senior Frontend Engineer.',
      userPrompt: 'Create src/hello.ts and read it back.',
      toolContext: {
        projectId,
        runId,
        agentId: 'ag_fe',
        agentName: 'Frank Lead',
      },
      allowedTools: ['write_file', 'read_file'],
      clientOverride: fakeGeminiClient,
    });

    expect(result.reachedMaxIterations).toBe(false);
    expect(result.iterations).toBe(3);
    expect(result.tokensUsed).toBe(275);
    expect(result.text).toContain('Created src/hello.ts');
    expect(result.toolRecords).toHaveLength(2);
    expect(result.toolRecords[0].status).toBe('success');
    expect(result.toolRecords[1].output.content).toContain('Hello DevForge');

    // Verify tool declarations were forwarded and thoughtSignature was preserved in conversation history
    const firstDeclarations = capturedCalls[0].config.tools[0].functionDeclarations.map((d: any) => d.name);
    expect(firstDeclarations).toEqual(expect.arrayContaining(['write_file', 'read_file']));
    expect(firstDeclarations).toHaveLength(2);

    const turn2History = capturedCalls[1].contents;
    expect(turn2History[1].parts[0].thoughtSignature).toBe('sig_xyz_123');
    expect(turn2History[2].parts[0].functionResponse.name).toBe('write_file');
    expect(turn2History[2].parts[0].functionResponse.response.response.ok).toBe(true);
  });

  it('returns structured RBAC failure in functionResponse without executing unauthorized tools', async () => {
    const capturedCalls: any[] = [];
    let turn = 0;

    const fakeGeminiClient = {
      models: {
        generateContent: async (params: any) => {
          capturedCalls.push(JSON.parse(JSON.stringify(params)));
          turn++;
          if (turn === 1) {
            return {
              candidates: [
                {
                  content: {
                    role: 'model',
                    parts: [
                      {
                        functionCall: {
                          id: 'call_denied',
                          name: 'deploy_integration',
                          args: { target: 'vercel' },
                        },
                      },
                    ],
                  },
                },
              ],
            };
          }
          return { text: 'Handled unauthorized tool response gracefully.' };
        },
      },
    };

    const result = await runAgentWithGeminiTools({
      model: 'gemini-2.5-flash',
      systemInstruction: 'You are Parker PM.',
      userPrompt: 'Try to deploy.',
      toolContext: {
        projectId,
        runId,
        agentId: 'ag_pm',
        agentName: 'Parker Lead',
      },
      allowedTools: ['read_file'],
      clientOverride: fakeGeminiClient,
    });

    expect(result.toolRecords).toHaveLength(1);
    expect(result.toolRecords[0].status).toBe('failed');
    expect(result.toolRecords[0].error).toContain('Permission denied');
    const secondTurnResponse = capturedCalls[1].contents[2].parts[0].functionResponse.response.response;
    expect(secondTurnResponse.ok).toBe(false);
    expect(secondTurnResponse.error).toContain('Permission denied');
  });

  it('retries transient 429 errors and caps execution cleanly at maxIterations', async () => {
    let attempts = 0;
    const fakeGeminiClient = {
      models: {
        generateContent: async () => {
          attempts++;
          if (attempts === 1) {
            throw new Error('429 rate limit exceeded');
          }
          return {
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [
                    {
                      functionCall: {
                        id: `call_loop_${attempts}`,
                        name: 'read_file',
                        args: { path: 'README.txt' },
                      },
                    },
                  ],
                },
              },
            ],
          };
        },
      },
    };

    const result = await runAgentWithGeminiTools({
      model: 'gemini-2.5-flash',
      systemInstruction: 'Loop test',
      userPrompt: 'Keep reading README.txt',
      toolContext: {
        projectId,
        runId,
        agentId: 'ag_fe',
        agentName: 'Frank Lead',
      },
      allowedTools: ['read_file'],
      maxIterations: 2,
      maxRetriesPerTurn: 1,
      clientOverride: fakeGeminiClient,
    });

    expect(attempts).toBe(3); // 1 initial failed 429 + 1 retry + 1 iteration 2
    expect(result.reachedMaxIterations).toBe(true);
    expect(result.iterations).toBe(2);
    expect(result.toolRecords).toHaveLength(2);
  });
});
