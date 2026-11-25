<div align="center">

# DevForge AI

**Describe the product. Orchestrate the swarm. Inspect the work as it happens.**

[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?logo=github)](https://github.com/sponsors/developerscoders)

[Repository](https://github.com/developerscoders/DevForge-AI) · [Live app](https://forge-dev.developercoders.me/) · [Sponsor DevForge](https://github.com/sponsors/developerscoders)

</div>

DevForge AI is an AI-assisted full-stack project builder built around a hierarchical, multi-agent orchestration runtime. Give it a high-level application brief; its specialist agents plan the work, synthesize project files, run checks and expose execution telemetry in a live workspace.

## What it does

- **Multi-agent project orchestration:** Aria coordinates specialist leads for product planning, architecture, frontend engineering, QA and DevOps.
- **Task and tool visibility:** execution runs track dependency-aware tasks, agent messages, tool calls, approvals and outcomes.
- **Live execution stream:** follow event logs and tool activity in the project workspace while the run progresses.
- **Code workspace and preview:** inspect generated files, edit project output and use the live preview experience.
- **Quality and safety workflows:** AST/type checks, test and coverage tools, targeted self-healing, secret redaction and guarded workspace paths are part of the runtime.
- **Ship and share:** project workflows include GitHub synchronization and Vercel deployment integrations.

## Architecture at a glance

| Layer | Responsibility |
| --- | --- |
| React + TypeScript client | Project intake, dashboard, file/code views, live preview and execution telemetry |
| Express API | Project, execution, streaming, billing and integration endpoints |
| Orchestrator engine | Coordinates the lead-agent hierarchy, task graph, execution state and tool actions |
| Specialist agents | Product planning, solution architecture, frontend implementation, QA and DevOps |
| Model provider layer | Provider routing and fallback configuration across Gemini, OpenRouter, Groq and NVIDIA NIM (availability varies by configured model) |
| Event bus + execution store | Records ordered execution events and supports replay for reconnecting stream consumers |
| Persistence and integrations | Firestore services, GitHub sync, Vercel deployment and Razorpay payment/webhook routes |

The lead roster is defined in `src/config/agentRoster.ts`; orchestration and event handling live in `src/lib/orchestrator/`. The Express entry point is `server.ts`, and the React application is mounted from `src/App.tsx`.

## How a project run works

1. **Describe the application** in the project intake.
2. **Aria coordinates the run**, decomposing the brief into tasks and assigning specialist responsibilities.
3. **Specialists collaborate** across product requirements, architecture/contracts, frontend and backend implementation, QA and DevOps work.
4. **Tools execute under policy**, with run state, tool status and approval events recorded by the orchestrator.
5. **Inspect progress live** through the execution and tool stream; review the generated files and preview.
6. **Continue toward delivery** with the available GitHub and Vercel integrations.

## Self-hosting / local development

You will need Node.js and npm, plus credentials for whichever model providers and integrations you intend to use.

```bash
git clone https://github.com/developerscoders/DevForge-AI.git
cd DevForge-AI
npm install
cp .env.example .env
```

Add the relevant secrets to `.env`. The example file documents the supported provider keys and optional GitHub, Vercel and Razorpay settings. Do not commit real credentials.

```bash
npm run dev
```

The development script starts the TypeScript Express server (which hosts the Vite development experience). For a production build:

```bash
npm run build
npm start
```

Useful checks:

```bash
npm run lint
npm test
```

Some features require external services and valid credentials. Model availability, inference cost, deployment permissions and sandbox behavior depend on the provider and environment you configure; this repository does not imply that hosted inference or deployment is free.

## Who is it for?

- **Independent developers** who want to explore agent-driven application generation and inspect each stage rather than treating generation as a black box.
- **Small product teams and founders** who want a structured route from product brief to code, QA and deployment handoff.
- **AI engineering teams** experimenting with multi-provider LLM routing, tool execution, orchestration events and agent workflows.
- **Educators and contributors** studying a TypeScript implementation of a hierarchical agent runtime, streaming telemetry and guarded project workspaces.

## Contributing

Issues, bug reports, focused pull requests and documentation improvements are welcome. Please avoid committing secrets, generated credentials or private project data. For security-sensitive reports, do not publish exploit details in a public issue.

## Support & Sponsorship

DevForge AI is an evolving open-source engineering project. Sponsorship helps fund the practical costs of building and maintaining it:

- **Hosted agent sandboxes:** infrastructure and isolated runtime capacity for exercising project-generation and tool-execution workflows.
- **LLM inference testing credits:** provider usage for testing model routing, fallbacks, agent collaboration and regression scenarios.
- **Open-source maintenance:** time for issue triage, bug fixes, dependency updates, documentation, tests and release work.

If DevForge is useful in your workflow, [become a GitHub Sponsor](https://github.com/sponsors/developerscoders). Every contribution helps sustain development; sponsorship does not purchase guaranteed outcomes or support response times unless a tier explicitly states otherwise.

### Featured Sponsors

A dedicated recognition space for higher-tier backers who want their support acknowledged.

| Sponsor | Logo | Link |
| --- | --- | --- |
| *Your organization here* | *Add sponsor-approved logo URL* | *Add sponsor website URL* |

To be featured, sponsors can include their preferred organization name, a logo asset they have permission to use, and a destination URL with their sponsorship. Placement is subject to review, relevance and available space.

---

<p align="center">
  Built in the open by <a href="https://github.com/developerscoders">developerscoders</a> · <a href="https://github.com/sponsors/developerscoders">Support DevForge AI ♥</a>
</p>
