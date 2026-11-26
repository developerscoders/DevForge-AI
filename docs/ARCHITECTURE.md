# DevForge AI Architecture

This document describes the repository's current application architecture. It is not a promise that every optional integration is enabled in every deployment.

## System overview

DevForge is a TypeScript application with a Vite/React browser client and an Express/Node.js server.

```text
Browser
  React 19 + TypeScript + Vite
  ├─ Auth and project intake
  ├─ Agent/task/tool workspace
  ├─ File explorer and preview UI
  └─ localStorage cache
       │ HTTP + Server-Sent Events
       ▼
Express 4 / Node.js
  ├─ Firebase identity and project APIs
  ├─ Multi-provider LLM adapter
  ├─ DAG orchestrator
  ├─ Agent roster and delegation
  ├─ Zod-validated tool registry
  ├─ Security/approval policy
  └─ Execution store + project workspaces
       ├─ Firestore cloud data
       └─ Local execution JSON and workspace filesystem
```

## Frontend

- React 19 and TypeScript.
- Vite 6 for development and asset bundling.
- Tailwind CSS 4 through the Vite plugin.
- React Router DOM 7 for routes.
- Motion for animations.
- Recharts for metrics and charts.
- Lucide React for icons.

The application entry is `src/App.tsx`; Vite configuration is in `vite.config.ts`.

## Server

- Express 4 handles API endpoints and streaming.
- `tsx server.ts` runs the TypeScript server in development.
- Production build runs Vite and bundles `server.ts` using esbuild as CommonJS at `dist/server.cjs`.
- Zod validates structured inputs and tool arguments.
- JSZip supports archive operations.

The server entry point is `server.ts`.

## Agent orchestration

The six-agent roster is defined in `src/config/agentRoster.ts`:

| Agent | Role |
| --- | --- |
| Aria | CEO and orchestrator |
| Parker | Product manager |
| Sophia | Solution architect |
| Frank | Frontend engineer |
| Quinn | QA/testing lead |
| Devon | DevOps/SRE lead |

The orchestrator models work as tasks connected by dependencies (a DAG). A task should become runnable only when its prerequisites have completed successfully. Task state, agent state and tool state are distinct concepts and should be rendered from the same run identity and persisted event stream.

A model response is not a completed task. Completion should require the assigned work and its expected artifacts to be persisted and validated.

## Model providers

OpenRouter is the default provider for the current free-model swarm. Gemini is integrated through `@google/genai`; NVIDIA NIM and Groq are supported as OpenAI-compatible provider adapters.

Model IDs and fallback lists are configured in `src/config/agentRoster.ts` and `src/lib/multi-llm-provider.ts`. Provider availability and free-tier capacity can change. Store the requested model, actual responding model, provider, fallback attempts, latency and error for each inference call.

## Tool registry

The registered tools are grouped by responsibility:

- Workspace file operations.
- Command execution, dependency installation, build and test operations.
- Git inspection and operations.
- Web research and documentation retrieval.
- MCP discovery and invocation.
- Browser automation, database inspection and deployment integrations.

Tool definitions include a schema, allowed agents, availability check and execution handler. The server must validate the request, check permissions and safety policy, execute the registered handler, redact sensitive output and persist the result. Model-generated text must never be treated as executable code without going through a registered and validated tool.

## Data and persistence

### Firestore

Cloud Firestore is the primary cloud database for product data, including user profiles, plans, transactions, coupons, marketplace records, templates, CMS pages and project metadata.

Projects use:
- `projects/{projectId}` for project metadata.
- `projects/{projectId}/files/{fileId}` for generated source files.

Files are stored separately to avoid exceeding Firestore document size limits. File IDs should be deterministic/encoded from normalized relative paths, and writes must enforce project ownership.

### Execution store and workspaces

The current server also uses:
- `.devforge-data/executions.json` for local execution state.
- Isolated per-project directories below the configured workspace root for tool execution and generated files.

This file-backed state is local to the server filesystem. It is not automatically shared between multiple instances and can be lost when an ephemeral instance is replaced. For production multi-instance or ephemeral hosting, enable a durable shared persistence adapter and recovery process; do not treat a local JSON file as a durable database.

### Browser cache

The browser keeps local mirrors for selected project and transaction data using versioned localStorage keys, including `devforge_local_projects_v2` and `devforge_local_transactions_v2`. These are convenience/offline caches, not an authority for identity, ownership, billing or server-side authorization.

## Project generation lifecycle

A typical run follows this pattern:

1. Accept the user's complete prompt and project context.
2. Decompose the request into requirements and acceptance criteria.
3. Create a dependency-aware task graph.
4. Assign tasks to the specialist agents.
5. Invoke LLMs and registered tools as needed.
6. Write generated files into the project workspace and persist project file changes.
7. Install dependencies in the supported workspace runtime.
8. Run actual lint, tests and production build commands.
9. Serve the generated build through the preview runtime.
10. Verify preview assets and report any failures without claiming success prematurely.

Not every project type is a Vite app. Generation and preview logic should inspect the generated project's own package manifest and framework rather than assuming one template for every prompt.

## Real-time events and observability

The server publishes execution events for runs, tasks, agents, approvals and tools. SSE consumers should support:
- monotonically increasing sequence numbers;
- reconnect/replay from the last received sequence;
- duplicate-event handling;
- persisted run snapshots;
- correct `text/event-stream` content type;
- explicit error and terminal events.

The UI should display the actual tool name, agent, sanitized arguments, output, timestamps, duration and final status. Progress must be derived from the run's task graph, not unrelated counters or stale agent snapshots.

## Security boundaries

- Verify Firebase identity on protected server routes.
- Enforce project ownership for every project/file/run operation.
- Keep provider and deployment secrets server-side.
- Normalize workspace paths and prevent traversal/symlink escapes.
- Validate commands against an allowlist/policy; use argument arrays rather than shell interpolation.
- Apply timeouts, cancellation, output limits and secret redaction.
- Require explicit approval for destructive writes and external deployment.
- Treat generated code and external tool output as untrusted.

See [CONFIGURATION.md](CONFIGURATION.md), [CONTRIBUTING.md](../CONTRIBUTING.md) and [SECURITY.md](../SECURITY.md).
