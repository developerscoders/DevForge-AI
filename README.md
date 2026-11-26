<div align="center">

# DevForge AI

**Describe a product. Coordinate an AI engineering swarm. Watch the implementation happen.**

[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?logo=github)](https://github.com/sponsors/developerscoders)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com/)

[Repository](https://github.com/developerscoders/DevForge-AI) · [Live app](https://forge-dev.developercoders.me/) · [Sponsor DevForge](https://github.com/sponsors/developerscoders)

</div>

DevForge AI is an open-source-oriented, AI-assisted full-stack project builder. It combines a React development workspace, an Express API, a multi-agent DAG orchestrator, a registered tool system, multi-provider model routing, project persistence, execution telemetry and generated-project preview workflows.

Give DevForge a product brief. Its agent team can decompose the intent, plan the implementation, work on project files, run configured development and verification tools, and expose the activity in the workspace. DevForge is an engineering platform: generated code and test results must still be reviewed before production use.

> **Project status:** DevForge is actively developed. Provider availability, deployment integrations, sandbox/preview capabilities and persistence behavior depend on the configured environment. Do not interpret a UI status or model label as proof that an external service operation succeeded; inspect the execution record and actual output.

## Contents

- [Capabilities](#capabilities)
- [Technology stack](#technology-stack)
- [Agent team and default models](#agent-team-and-default-models)
- [Architecture and data](#architecture-and-data)
- [How to use DevForge](#how-to-use-devforge)
- [Run locally](#run-locally)
- [Environment configuration](#environment-configuration)
- [Tooling and execution safety](#tooling-and-execution-safety)
- [Testing and verification](#testing-and-verification)
- [Deployment integrations](#deployment-integrations)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Capabilities

- **Prompt-to-project workflow:** turn a natural-language product brief into a structured plan and implementation tasks.
- **Six-agent team:** Aria coordinates Parker, Sophia, Frank, Quinn and Devon across product, architecture, frontend, QA and DevOps responsibilities.
- **Dependency-aware DAG orchestration:** tasks can wait for prerequisites, execute, retry, fail or complete with recorded state.
- **Tool execution:** registered tools cover workspace files, commands, typechecking, linting, tests, builds, Git, research, MCP and deployment integrations.
- **Execution visibility:** inspect agent/task state, tool calls, outputs, timestamps, errors and event history where exposed by the active runtime.
- **Project workspace:** inspect generated project files and workspace state.
- **Generated application preview:** preview support depends on the generated project's framework, successful dependency installation/build and the configured preview runtime.
- **Multi-provider model routing:** OpenRouter is the default agent swarm; Gemini, NVIDIA NIM and Groq adapters are supported when configured.
- **Cloud and local persistence:** Firestore stores application/product data and project files; the server-side execution store maintains orchestration state and isolated project workspaces.
- **Integrations:** Firebase Authentication, GitHub repository operations, Vercel deployment and Razorpay payment integration.

## Technology stack

### Frontend

| Technology | Role |
| --- | --- |
| React 19 | Component-based application UI |
| TypeScript 5.8 | Static typing |
| Vite 6 | Development server and frontend bundler |
| Tailwind CSS 4 + `@tailwindcss/vite` | Utility-first styling |
| React Router DOM 7 | Client-side routing |
| Motion 12 | UI animation |
| Recharts 3 | Charts and metrics |
| Lucide React | Icons |

### Backend and runtime

| Technology | Role |
| --- | --- |
| Node.js | Server runtime |
| Express 4 | HTTP API, project routes and event streaming |
| tsx | TypeScript execution in development |
| esbuild | Production CommonJS server bundle |
| Zod 4 | Runtime validation and tool argument schemas |
| JSZip | ZIP/archive handling |
| Vitest 5 | Automated tests |

### Cloud services and persistence

| Service | Role |
| --- | --- |
| Firebase Authentication | Google/GitHub sign-in and user identity |
| Cloud Firestore (Firebase JS SDK 12) | User profiles, plans, transactions, coupons, marketplace, templates, CMS and projects |
| Firestore project files subcollection | Generated source files stored separately under each project |
| Local execution store | JSON-backed DAG runs, event history/SSE replay and execution metadata |
| Per-project workspaces | Filesystem workspaces used by registered development tools |
| Browser localStorage | Offline/cache mirror for selected project and transaction data |

The configured Firestore database is identified by the applet configuration. Never commit service credentials, access tokens or private user data.

### AI and orchestration

- **OpenRouter:** default provider for the six-agent swarm, using explicitly configured free model IDs and fallback candidates.
- **Google Gemini:** supported through `@google/genai`, including Gemini function-calling paths when a key and model are configured.
- **NVIDIA NIM and Groq:** OpenAI-compatible provider adapters for configured endpoints and credentials.
- **Custom DAG orchestrator:** coordinates agent assignments, task dependencies, run state, retries, cancellation and event publication.
- **Tool registry:** validates arguments, applies agent permissions and security policy, executes the registered handler and records the result.

## Agent team and default models

The current default roster is configured in `src/config/agentRoster.ts`.

| Agent | Responsibility | Default OpenRouter model |
| --- | --- | --- |
| Aria | CEO, orchestration and task delegation | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| Parker | Product management and requirements | `inclusionai/ling-3.2-flash:free` |
| Sophia | Solution architecture and technical design | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| Frank | Frontend engineering | `nvidia/nemotron-3.5-super-vl:free` |
| Quinn | QA and testing | `nvidia/nemotron-3.5-super-vl:free` |
| Devon | DevOps and SRE | `nvidia/nemotron-3.5-lightning:free` |

Configured fallback candidates include:

- `baidu/ernie-5.5-flash-preview:free`
- `recursive/flint-v1.0:free`
- `particle-ai/particle-1:free`
- `openrouter/free`

**Free-model caveat:** the `:free` suffix describes the OpenRouter model route, not a service-level availability guarantee. Free endpoints can be rate-limited, unavailable, changed or removed by their providers. Fallback routing records should be inspected to identify the model that actually answered. Provider API access, hosting, storage, network usage and deployment may still incur charges. See [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Architecture and data

```text
React 19 + Vite client
  ├─ Project intake, dashboard and workspace
  ├─ Agent/task/tool timeline and event stream
  └─ File explorer and generated-app preview
          │ HTTP / SSE
          ▼
Node.js + Express API
  ├─ Authentication and project APIs
  ├─ Multi-provider LLM router
  ├─ DAG orchestrator and six-agent roster
  ├─ Zod-validated tool registry + security policy
  └─ Execution store and per-project workspaces
          │
          ├── Cloud Firestore
          │     ├─ users, plans, transactions and product data
          │     └─ projects/{projectId}/files/{fileId}
          │
          ├── .devforge-data/executions.json
          └── .devforge-data/workspaces/{projectId}/
```

### Firestore and local execution state

Firestore is the primary cloud database for the product's user-facing and business data. Project metadata is stored in the `projects/{projectId}` document, with generated files split into the `projects/{projectId}/files` subcollection to avoid placing an entire codebase in one Firestore document.

The execution engine also maintains a local file-backed store at `.devforge-data/executions.json` and per-project workspace directories. This local store is useful for the current server runtime, event replay and tool execution, but it is not automatically a distributed database. On ephemeral or horizontally scaled hosting, configure durable storage or implement/enable the Firestore-backed execution persistence and recovery path for the deployment you use. A local JSON file on an ephemeral instance must not be treated as durable backup.

The browser maintains selected localStorage mirrors for offline and quota-resilient behavior. These mirrors are caches, not an authorization source or replacement for server-side ownership checks.

For more detail, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## How to use DevForge

1. **Sign in.** Use the configured Firebase Authentication provider (Google or GitHub) or the available guest flow.
2. **Create a project.** Open the project intake and describe the product you want to build. Include target users, pages, workflows, data entities, integrations and design direction.
3. **Review the plan.** Check the intent decomposition, tasks and dependencies before allowing actions that require approval.
4. **Watch the agents.** Follow Aria and the specialist agents as tasks move through waiting, active, complete or failed states.
5. **Inspect tool calls.** Expand each tool record to review its arguments, output, duration and failure details. Approve gated operations only when you understand their effect.
6. **Inspect generated files.** Use the workspace file explorer to review and edit source files.
7. **Run verification.** Confirm that dependency installation, typecheck, lint, tests and build actually executed. A static preflight or a model's claim is not an executed test.
8. **Open Live Preview.** A preview is meaningful only after the generated application has been built and its assets are served by the preview runtime. If the build fails, inspect the real build output and fix it before marking the project ready.
9. **Export or deploy.** Review the project before using GitHub push or Vercel deployment integrations. Deployment requires your own provider credentials and may incur charges.

### Writing a good build prompt

Be specific about the product and its acceptance criteria. For example:

```text
Build a responsive appointment booking application for independent clinics.

Users and roles:
- Patient, receptionist and clinic administrator.

Pages:
- Public clinic page and appointment search.
- Patient sign-in and appointment history.
- Receptionist calendar and appointment management.
- Admin dashboard and clinic settings.

Core workflows:
- Search availability by clinician and date.
- Book, reschedule and cancel an appointment.
- Prevent double booking.
- Send confirmation and cancellation notifications.

Data:
- Users, clinics, clinicians, availability and appointments.
- Enforce ownership and role-based access on the server.

Quality requirements:
- Responsive desktop and mobile layouts.
- Accessible forms and keyboard navigation.
- Loading, empty, success and error states.
- Meaningful unit and integration tests.
- Run the production build and show the actual app in Live Preview.

Do not substitute a static mockup for working flows.
List assumptions and request approval before external deployment or paid services.
```

## Run locally

### Prerequisites

- Node.js (use a current LTS release compatible with the installed dependencies).
- npm.
- Git.
- Provider credentials for the AI models you want to call.
- Firebase project configuration for authentication and Firestore features.

### Install and start

```bash
git clone https://github.com/developerscoders/DevForge-AI.git
cd DevForge-AI
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the required values as described in [docs/CONFIGURATION.md](docs/CONFIGURATION.md), then run:

```bash
npm run dev
```

The development script runs `tsx server.ts`; the Express server hosts the Vite development experience and API.

### Production build

```bash
npm run lint
npm test
npm run build
npm start
```

The build runs `vite build` and bundles `server.ts` with esbuild as a Node.js CommonJS server at `dist/server.cjs`.

Available scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the TypeScript server in development |
| `npm run lint` | Run TypeScript compiler checks (`tsc --noEmit`) |
| `npm test` | Run the Vitest suite |
| `npm run build` | Build frontend assets and bundle the Express server |
| `npm start` | Start the production server |
| `npm run preview` | Run Vite's static preview server |
| `npm run clean` | Remove generated build output (script uses Unix `rm`) |

## Environment configuration

Start with [`.env.example`](.env.example). Common settings include:

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | OpenRouter model inference; required for the default swarm |
| `GEMINI_API_KEY` | Optional Gemini model/function-calling integration |
| `NVIDIA_API_KEY` | Optional NVIDIA NIM integration |
| `GROQ_API_KEY` | Optional Groq inference integration |
| `APP_URL` | Public application URL for callbacks and links |
| `GITHUB_TOKEN` | Optional server-side GitHub integration token |
| `VERCEL_TOKEN` | Optional Vercel deployment integration |
| `RAZORPAY_WEBHOOK_SECRET` | Optional Razorpay webhook signature verification |
| `VITE_GUEST_STORAGE_KEY` | Browser guest-session storage key |
| `DISABLE_HMR` | Disable Vite HMR where a hosting proxy cannot forward its WebSocket |

Firebase client settings are provided by `firebase-applet-config.json` in the AI Studio applet setup. Keep real secrets out of Git. Never put server-only credentials in variables exposed to the browser.

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for provider setup, Firebase configuration, deployment notes and troubleshooting.

## Tooling and execution safety

The tool registry contains several groups of registered operations:

- **Workspace:** `list_files`, `read_file`, `search_files`, `create_file`, `write_file`, `edit_file`, `apply_patch`, `delete_file`, `inspect_project_structure`.
- **Execution and quality:** `run_command`, `run_typecheck`, `run_linter`, `run_tests`, `install_dependencies`, `run_build`, `inspect_command_output`, `run_unit_tests`, `run_integration_tests`, `run_e2e_tests`, `run_playwright`, `check_api_endpoint`, `run_ast_audit`, `run_coverage_analysis`.
- **Git and research:** `git_status`, `git_diff`, `git_log`, `git_branch`, `git_commit`, `web_search`, `fetch_url`, `search_documentation`, `research_package`.
- **MCP, data and deployment:** `mcp_discover_servers`, `mcp_invoke_tool`, `browser_automation`, `inspect_database`, `deploy_integration`, `write_swarm_state`, `grant_deployment_certificate`.

Tool availability depends on the current configuration. The registry validates schemas and agent permissions; security controls restrict workspace paths, commands and outbound requests. Destructive writes and deployment actions may require approval. Do not expose API keys or user secrets in logs, prompts or generated source.

## Testing and verification

Run the repository checks locally:

```bash
npm run lint
npm test
npm run build
```

When validating a generated project, distinguish between:
- **Planned:** a task or tool was scheduled.
- **Started:** the process actually began.
- **Executed:** a real command or tool handler ran.
- **Passed:** the process returned a successful exit status and the expected artifact/result was checked.
- **Preview ready:** the generated app's build output is served and the browser can load it.

A green agent badge, generated test file, static AST check or model response is not by itself proof that a production build or browser test passed.

## Deployment integrations

DevForge includes integrations for GitHub repository operations and Vercel deployments. They require correctly scoped credentials, configured callback URLs and user approval where applicable. Firebase Authentication and Firestore also require the Firebase project and security rules to be configured correctly.

The application can be hosted on platforms that support a Node.js Express process and persistent storage appropriate to your execution workload. If deployed to Cloud Run or another ephemeral/container platform, do not rely on the container filesystem for durable project or execution data. Review the deployment-specific persistence and service-account setup before using it with real user projects.

## Contributing

Contributions are welcome: bug fixes, tests, documentation, accessibility improvements, provider adapters and orchestration enhancements.

1. Fork the repository.
2. Create a focused feature branch.
3. Install dependencies and configure only the services needed for your change.
4. Add or update tests.
5. Run `npm run lint`, `npm test` and `npm run build`.
6. Open a pull request describing the problem, approach, test evidence and any configuration changes.

Do not include credentials, production data, generated customer projects or private logs in commits. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Please report vulnerabilities privately rather than publishing exploit details in a public issue. See [SECURITY.md](SECURITY.md). Never commit secrets or disable authentication/authorization checks to make a test pass.

## License

DevForge AI is licensed under the **Apache License, Version 2.0**. You may use, reproduce, modify, distribute, sublicense and use the project commercially, subject to the license terms. The license includes an express patent license from contributors and conditions for redistribution, including retaining required notices and marking modified files.

See the full text in [`LICENSE`](LICENSE) or read the [official Apache-2.0 text](https://www.apache.org/licenses/LICENSE-2.0). The license does not grant permission to use the DevForge name or logo as a trademark, and it does not relicense third-party components, models, datasets or services bundled or used by the project. Review their individual terms.

SPDX identifier: `Apache-2.0`.
