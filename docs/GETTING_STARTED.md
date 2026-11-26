# Getting Started

## 1. Requirements

- Git.
- Node.js LTS compatible with this repository's dependencies.
- npm.
- An OpenRouter API key for the default agent swarm.
- A Firebase project and app configuration for Firebase Authentication and Firestore features.
- Optional credentials for Gemini, NVIDIA NIM, Groq, GitHub, Vercel and Razorpay integrations.

## 2. Clone and install

```bash
git clone https://github.com/developerscoders/DevForge-AI.git
cd DevForge-AI
npm install
```

## 3. Configure local environment

Copy the example environment file:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the keys required for the services you plan to use. Do not commit `.env`, service account JSON, OAuth secrets or API tokens.

The browser Firebase configuration is supplied through `firebase-applet-config.json` in the configured applet environment. Do not replace it with a service-account private key. Server-side Firestore access in Cloud Run should use Application Default Credentials from the attached service account.

See [CONFIGURATION.md](CONFIGURATION.md) for the variables and deployment notes.

## 4. Start development server

```bash
npm run dev
```

The `dev` script runs `tsx server.ts`. The Express process serves API routes and the Vite development application.

## 5. Build and start production bundle

```bash
npm run lint
npm test
npm run build
npm start
```

The build runs `vite build` and bundles the Express server with esbuild into `dist/server.cjs`.

## 6. Create your first project

1. Open the running DevForge UI.
2. Sign in using a configured authentication provider or use the supported guest flow.
3. Start a new project.
4. Describe the product, audience, pages, data, workflows and acceptance criteria.
5. Review the generated task plan and any approval requests.
6. Watch agent and tool activity; expand tool calls to inspect real outputs.
7. Review generated files.
8. Run the actual checks and inspect the build output.
9. Open the Live Preview only after the project build is ready.
10. Export to GitHub or deploy through Vercel only after reviewing the code and granting the required permissions.

## Prompt-writing template

```text
Product:
Who will use it and what problem does it solve?

User roles:
List each role and what it can do.

Pages:
List every required page and its purpose.

Workflows:
Describe the important end-to-end user journeys.

Data:
List entities, relationships, validation and access rules.

Integrations:
Name external services and explain the required behavior.

Design:
Describe layout, responsive behavior, accessibility and visual direction.

Acceptance criteria:
List observable behaviors and tests that must pass.

Constraints:
Specify framework, hosting, budget, security and deployment restrictions.

Do not mark the project complete until the generated app builds, its key flows are tested, and the actual built app is visible in Live Preview.
```

## 7. Troubleshooting

### OpenRouter returns 401
Check that `OPENROUTER_API_KEY` is set on the server runtime, not exposed in browser variables.

### OpenRouter free model is rate-limited
Free routes have shared capacity limits. Check the recorded model attempts and actual fallback model. A fallback can also be unavailable.

### Firebase permission error
Check Firebase Authentication, Firestore rules, the signed-in UID, project ownership fields and Cloud Run service-account permissions. Do not make the database public to bypass the error.

### Project exists in browser but server returns 404
Check whether the project is present in Firestore, whether the backend can authenticate to Firestore, and whether the project hydration route verifies ownership and loads its metadata/files. Local execution JSON may not survive an ephemeral server restart.

### Vite HMR WebSocket fails behind a hosted preview
Use the hosted-preview configuration and set `DISABLE_HMR=true` when the proxy does not support the Vite WebSocket upgrade. This is a development experience issue; it does not itself fix API or project persistence errors.

### Live Preview is blank
Check dependency installation output, build exit code, generated `dist/index.html`, asset URLs, preview server status and browser console. A source file list is not proof that the application is running.

### SSE fails
The events endpoint must return `Content-Type: text/event-stream`. If it returns HTML, inspect API routing and frontend fallback middleware. Confirm that the project/run exists and that the stream can replay events from the supplied sequence cursor.
