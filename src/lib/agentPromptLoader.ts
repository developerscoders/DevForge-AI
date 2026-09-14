import fs from 'node:fs';
import path from 'node:path';

/** Loads the version-controlled system prompt for a lead or pod at runtime. */
export function loadAgentPrompt(agentId: string, subagentPath?: string): string {
  const relativePath = subagentPath
    ? path.join('agents', agentId, `${subagentPath}.md`)
    : path.join('agents', `${agentId}.md`);
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

export function buildMilestoneUserMessage(originalPrompt: string, priorContext: unknown = {}): string {
  return `Original user prompt (do not truncate or summarize this):\n"""${originalPrompt}"""\n\nPrior milestone context: ${JSON.stringify(priorContext)}`;
}
