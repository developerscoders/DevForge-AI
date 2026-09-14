# DevForge agent prompts

Each Markdown file is the human-readable contract for one lead or subagent. Runtime project generation imports `src/config/agentPromptRegistry.ts`, which applies the same role purpose and non-negotiable guardrails while injecting the complete, unmodified user prompt.

Do not put credentials or customer data in these files.
