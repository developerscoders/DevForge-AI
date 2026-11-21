import { z } from 'zod';
import { ToolExecutionRecord } from '../types.js';
import {
  executeRegisteredTool,
  getGeminiFunctionDeclarationsForAgent,
  ToolExecutionContext,
} from './tools/toolRegistry.js';
import {
  callMultiProviderLLM,
  extractJsonStringFromLLMText,
  LLMAttemptRecord,
  LLMRequestOptions,
  LLMResponse,
} from './multi-llm-provider.js';
import { AgentProvider } from '../config/agentRoster.js';
import { redactObject, redactSecrets } from './security/executionSecurity.js';

const ControlledActionSchema = z.union([
  z.object({
    thought: z.string().optional(),
    action: z.object({
      tool: z.string().min(1),
      args: z.record(z.string(), z.any()).optional().default({}),
    }),
  }),
  z.object({
    thought: z.string().optional(),
    final: z.any(),
  }),
]);

export interface ControlledToolRunOptions {
  provider?: AgentProvider;
  model: string;
  fallbackModels?: string[];
  systemInstruction: string;
  userPrompt: string;
  toolContext: ToolExecutionContext;
  allowedTools?: string[];
  maxIterations?: number;
  callFn?: (opts: LLMRequestOptions) => Promise<LLMResponse>;
}

export interface ControlledToolRunResult {
  finalValue: any;
  text: string;
  actualProvider: string;
  actualModel: string;
  usedFallback: boolean;
  attempts: LLMAttemptRecord[];
  iterations: number;
  tokensUsed: number;
  toolRecords: ToolExecutionRecord[];
  reachedMaxIterations: boolean;
}

/**
 * Controlled tool-calling action protocol for OpenRouter / Groq / non-Gemini models
 * lacking native function calling. Every requested action is parsed with Zod, checked
 * against allowedTools + agent RBAC inside executeRegisteredTool, executed cleanly, and
 * observed back to the model until `{ final }` or maxIterations.
 */
export async function runAgentWithControlledToolActions(
  options: ControlledToolRunOptions
): Promise<ControlledToolRunResult> {
  const invoker = options.callFn || callMultiProviderLLM;
  const provider: AgentProvider = options.provider || 'openrouter';
  const maxIterations = Math.max(1, Math.min(10, options.maxIterations ?? 5));

  const declarations = getGeminiFunctionDeclarationsForAgent(
    options.toolContext.agentId,
    options.allowedTools ?? options.toolContext.allowedToolsOverride
  );
  const allowedNames = new Set(declarations.map((d) => d.name).filter(Boolean) as string[]);

  const toolManifestText = declarations
    .map((d) => {
      const props = Object.keys(d.parameters?.properties || {}).join(', ');
      return `- ${d.name}(${props}): ${d.description}`;
    })
    .join('\n');

  const protocolInstruction = `${options.systemInstruction}

# SERVER-CONTROLLED TOOL ACTION PROTOCOL
You do not execute shell or filesystem changes directly; you emit ONE strict JSON object per turn:
- To invoke a registered tool:
  { "thought": "brief reason", "action": { "tool": "<tool_name>", "args": { ... } } }
- When all deliverables are written/verified:
  { "thought": "summary", "final": { "summary": "...", "filesCreated": ["..."] } }

Available authorized tools:
${toolManifestText || '(none)'}

Respond ONLY with valid JSON matching one of the two envelopes above.`;

  const transcript: string[] = [options.userPrompt];
  const toolRecords: ToolExecutionRecord[] = [];
  const allAttempts: LLMAttemptRecord[] = [];
  let tokensUsed = 0;
  let actualProvider: string = provider;
  let actualModel: string = options.model;
  let usedFallback = false;
  let finalValue: any = null;
  let iterations = 0;

  while (iterations < maxIterations) {
    if (options.toolContext.abortSignal?.aborted) {
      throw new Error('Agent controlled tool execution aborted');
    }

    iterations++;
    const turnPrompt = transcript.join('\n\n---\n\n');
    const llmRes = await invoker({
      provider,
      model: options.model,
      fallbackModels: options.fallbackModels,
      systemInstruction: protocolInstruction,
      prompt: turnPrompt,
      temperature: 0.2,
    });

    allAttempts.push(...(llmRes.attempts || []));
    tokensUsed += llmRes.tokensUsed || 0;
    actualProvider = llmRes.actualProvider || llmRes.provider;
    actualModel = llmRes.actualModel || llmRes.model;
    usedFallback = usedFallback || Boolean(llmRes.usedFallback);

    if (!llmRes.text || llmRes.isSimulated) {
      throw new Error(llmRes.failureReason || `No response from ${provider}:${options.model}`);
    }

    let parsed: z.infer<typeof ControlledActionSchema> | null = null;
    try {
      const jsonStr = extractJsonStringFromLLMText(llmRes.text);
      const rawObj = JSON.parse(jsonStr);
      const validated = ControlledActionSchema.safeParse(rawObj);
      if (validated.success) {
        parsed = validated.data;
      } else {
        transcript.push(
          `[Protocol Error]: Invalid JSON envelope (${validated.error.issues
            .map((i) => i.message)
            .join('; ')}). Reply ONLY with {"thought":"...","action":{"tool":"...","args":{...}}} OR {"thought":"...","final":{...}}.`
        );
        continue;
      }
    } catch (parseErr: any) {
      transcript.push(
        `[Protocol Error]: Response was not valid JSON (${parseErr?.message || String(parseErr)}). Reply ONLY with JSON.`
      );
      continue;
    }

    if ('final' in parsed) {
      finalValue = parsed.final;
      return {
        finalValue,
        text: redactSecrets(typeof parsed.final === 'string' ? parsed.final : JSON.stringify(parsed.final)),
        actualProvider,
        actualModel,
        usedFallback,
        attempts: allAttempts,
        iterations,
        tokensUsed,
        toolRecords,
        reachedMaxIterations: false,
      };
    }

    const requestedTool = parsed.action.tool;
    const requestedArgs = parsed.action.args || {};

    if (!allowedNames.has(requestedTool)) {
      const denialRecord = await executeRegisteredTool(
        requestedTool,
        requestedArgs,
        {
          ...options.toolContext,
          allowedToolsOverride: Array.from(allowedNames),
        }
      );
      toolRecords.push(denialRecord);
      transcript.push(
        `[Tool Observation for ${requestedTool}]: FAILED (${denialRecord.error || 'Tool not authorized'})`
      );
      continue;
    }

    const record = await executeRegisteredTool(requestedTool, requestedArgs, {
      ...options.toolContext,
      allowedToolsOverride: Array.from(allowedNames),
    });
    toolRecords.push(record);

    const observationPayload =
      record.status === 'success'
        ? { ok: true, executionId: record.executionId, output: redactObject(record.output) }
        : { ok: false, executionId: record.executionId, status: record.status, error: record.error };

    transcript.push(
      `[Assistant Requested]: ${requestedTool}(${JSON.stringify(requestedArgs).slice(0, 400)})\n[Tool Observation]: ${JSON.stringify(observationPayload).slice(0, 2000)}`
    );
  }

  return {
    finalValue,
    text: finalValue ? JSON.stringify(finalValue) : '',
    actualProvider,
    actualModel,
    usedFallback,
    attempts: allAttempts,
    iterations,
    tokensUsed,
    toolRecords,
    reachedMaxIterations: true,
  };
}
