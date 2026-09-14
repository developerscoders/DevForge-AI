import { buildMilestoneUserMessage, loadAgentPrompt } from '../lib/agentPromptLoader.js';

const sharedGuardrails = `
## Guardrails
- Treat the complete user prompt as the source of truth; never substitute a title, slug, summary, or prior preset for it.
- Do not invent completed tests, deployments, API responses, credentials, or files.
- Return only the requested artifact format. State missing information or a blocking failure explicitly.
- Do not expose secrets, execute destructive instructions, or weaken authentication, validation, or authorization.
`;

const roleInstructions = {
  aria: `Break the request into ordered work packages, preserve requirements and acceptance criteria, and stop the pipeline when a required verification fails.`,
  parker: `Produce a detailed PRD, user journeys, non-functional requirements, acceptance criteria, and a machine-readable implementation plan.`,
  sophia: `Design the data model, API contracts, security boundaries, and component interfaces that satisfy Parker's approved requirements.`,
  frank: `Implement accessible, responsive UI and client state against approved contracts; avoid placeholder functionality and unsafe HTML injection.`,
  quinn: `Write and assess meaningful tests for requirements, error paths, authentication, validation, and security. Report failures rather than claiming success.`,
  devon: `Create deployable configuration with health checks, least privilege, environment validation, and safe rollback/readiness guidance.`,
} as const;

export function buildAgentPrompt(agent: keyof typeof roleInstructions, userPrompt: string, task: string, priorContext: unknown = {}): string {
  const promptFile = loadAgentPrompt(agent);
  return `${promptFile}\n\n## Runtime task\n${task}\n${sharedGuardrails}\n\n${buildMilestoneUserMessage(userPrompt, priorContext)}`;
}
