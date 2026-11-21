import { Content, FunctionDeclaration, GoogleGenAI, Part } from '@google/genai';
import { ToolExecutionRecord } from '../types.js';
import {
  executeRegisteredTool,
  getGeminiFunctionDeclarationsForAgent,
  ToolExecutionContext,
} from './tools/toolRegistry.js';
import { redactObject, redactSecrets } from './security/executionSecurity.js';

export interface GeminiAgentRunOptions {
  model?: string;
  systemInstruction: string;
  userPrompt: string;
  toolContext: ToolExecutionContext;
  allowedTools?: string[];
  maxIterations?: number;
  timeoutMs?: number;
  maxRetriesPerTurn?: number;
  // Injectable client for deterministic test verification
  clientOverride?: {
    models: {
      generateContent: (params: any) => Promise<any>;
    };
  };
}

export interface GeminiAgentRunResult {
  text: string;
  model: string;
  iterations: number;
  tokensUsed: number;
  toolRecords: ToolExecutionRecord[];
  reachedMaxIterations: boolean;
}

let cachedClient: GoogleGenAI | null = null;
export function getSharedGeminiClient(): GoogleGenAI | null {
  if (!cachedClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY' && key.trim() !== '') {
      cachedClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return cachedClient;
}

function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Aborted'));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function generateWithRetry(
  client: { models: { generateContent: (p: any) => Promise<any> } },
  params: any,
  maxRetries: number,
  signal?: AbortSignal
): Promise<any> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw new Error('Gemini execution cancelled via AbortSignal');
    try {
      return await client.models.generateContent(params);
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err);
      const isTransient = /429|503|502|500|timeout|ECONNRESET|ETIMEDOUT|rate/i.test(msg);
      if (!isTransient || attempt >= maxRetries) {
        throw err;
      }
      await sleepWithAbort(350 * Math.pow(2, attempt), signal);
    }
  }
  throw lastError;
}

/**
 * Multi-turn `@google/genai` function calling loop:
 * Sends declarations -> inspects response.functionCalls -> validates/permissions/approvals ->
 * executes actual tools -> returns functionResponse parts -> loops until final text or limit.
 */
export async function runAgentWithGeminiTools(
  options: GeminiAgentRunOptions
): Promise<GeminiAgentRunResult> {
  const client = options.clientOverride || getSharedGeminiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured for Gemini function calling.');
  }

  const model = options.model || 'gemini-2.5-flash';
  const maxIterations = Math.max(1, Math.min(12, options.maxIterations ?? 6));
  const timeoutMs = options.timeoutMs ?? 45000;
  const maxRetries = options.maxRetriesPerTurn ?? 1;

  const declarations: FunctionDeclaration[] = getGeminiFunctionDeclarationsForAgent(
    options.toolContext.agentId,
    options.allowedTools ?? options.toolContext.allowedToolsOverride
  );

  const runAbort = new AbortController();
  const timeoutHandle = setTimeout(() => runAbort.abort(), timeoutMs);
  const onParentAbort = () => runAbort.abort();
  options.toolContext.abortSignal?.addEventListener('abort', onParentAbort, { once: true });

  const contents: Content[] = [
    {
      role: 'user',
      parts: [{ text: options.userPrompt }],
    },
  ];

  const toolRecords: ToolExecutionRecord[] = [];
  let tokensUsed = 0;
  let iterations = 0;
  let finalText = '';

  try {
    while (iterations < maxIterations) {
      if (runAbort.signal.aborted) {
        throw new Error(
          options.toolContext.abortSignal?.aborted
            ? 'Agent execution cancelled'
            : `Gemini function calling exceeded timeout (${timeoutMs}ms)`
        );
      }

      iterations++;

      const config: Record<string, any> = {
        systemInstruction: options.systemInstruction,
      };
      if (declarations.length > 0) {
        config.tools = [{ functionDeclarations: declarations }];
      }

      const response = await generateWithRetry(
        client,
        {
          model,
          contents,
          config,
        },
        maxRetries,
        runAbort.signal
      );

      if (response?.usageMetadata?.totalTokenCount) {
        tokensUsed += Number(response.usageMetadata.totalTokenCount) || 0;
      }

      const candidateContent: Content | undefined = response?.candidates?.[0]?.content;
      const functionCalls: Array<{ id?: string; name?: string; args?: Record<string, any> }> =
        response?.functionCalls ||
        (candidateContent?.parts
          ?.filter((p: any) => Boolean(p.functionCall))
          .map((p: any) => p.functionCall) ??
          []);

      if (!functionCalls || functionCalls.length === 0) {
        finalText = response?.text || candidateContent?.parts?.map((p: any) => p.text || '').join('') || '';
        return {
          text: redactSecrets(finalText),
          model,
          iterations,
          tokensUsed,
          toolRecords,
          reachedMaxIterations: false,
        };
      }

      // Preserve the model's exact turn (including functionCall and thoughtSignature parts)
      if (candidateContent) {
        contents.push(candidateContent);
      } else {
        contents.push({
          role: 'model',
          parts: functionCalls.map((fc) => ({ functionCall: fc })),
        });
      }

      // Execute each requested tool through the verified server-side tool pipeline
      const responseParts: Part[] = [];
      for (const fc of functionCalls) {
        const toolName = fc.name || '';
        const execRecord = await executeRegisteredTool(toolName, fc.args || {}, {
          ...options.toolContext,
          abortSignal: runAbort.signal,
          allowedToolsOverride: options.allowedTools ?? options.toolContext.allowedToolsOverride,
        });
        toolRecords.push(execRecord);

        const payload =
          execRecord.status === 'success'
            ? {
                ok: true,
                executionId: execRecord.executionId,
                result: redactObject(execRecord.output),
                stdout: execRecord.stdout,
              }
            : {
                ok: false,
                executionId: execRecord.executionId,
                status: execRecord.status,
                error: execRecord.error || 'Tool execution failed',
                stderr: execRecord.stderr,
              };

        responseParts.push({
          functionResponse: {
            id: fc.id,
            name: toolName,
            response: { response: payload },
          },
        });
      }

      contents.push({
        role: 'user',
        parts: responseParts,
      });
    }

    return {
      text: redactSecrets(finalText),
      model,
      iterations,
      tokensUsed,
      toolRecords,
      reachedMaxIterations: true,
    };
  } finally {
    clearTimeout(timeoutHandle);
    options.toolContext.abortSignal?.removeEventListener('abort', onParentAbort);
  }
}
