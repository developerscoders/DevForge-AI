# Configuration

## Environment variables

The checked-in `.env.example` is the canonical starting point. The following variables are currently documented there:

| Variable | Required for | Notes |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | Default free-model agent swarm | Keep server-side. |
| `GEMINI_API_KEY` | Gemini provider/function-calling paths | Optional when using OpenRouter only. |
| `NVIDIA_API_KEY` | NVIDIA NIM provider | Optional. |
| `GROQ_API_KEY` | Groq provider | Optional. |
| `APP_URL` | Callback URLs and application links | Use the public HTTPS origin. |
| `GITHUB_TOKEN` | Server-side GitHub operations | Use least privilege; user OAuth may be used for user-authorized operations. |
| `VERCEL_TOKEN` | Vercel deployment | Optional; deployment may incur charges. |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook verification | Optional; never expose to the browser. |
| `VITE_GUEST_STORAGE_KEY` | Guest browser storage | Client-side cache key, not a secret. |
| `DISABLE_HMR` | Hosted development preview | Set to `true` if the host proxy cannot forward Vite HMR WebSocket upgrades. |

Other runtime settings may be consumed by specific modules. Search the source for `process.env` before deploying a customized environment.

## OpenRouter (default swarm)

Set `OPENROUTER_API_KEY` in the server's environment/secrets manager. The current roster is in `src/config/agentRoster.ts`; provider fallback logic is in `src/lib/multi-llm-provider.ts`.

The configured default agent models are:

| Agent | Model |
| --- | --- |
| Aria | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| Parker | `inclusionai/ling-3.2-flash:free` |
| Sophia | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| Frank | `nvidia/nemotron-3.5-super-vl:free` |
| Quinn | `nvidia/nemotron-3.5-super-vl:free` |
| Devon | `nvidia/nemotron-3.5-lightning:free` |

Configured free fallback candidates include ERNIE Flash Preview, Recursive Flint, Particle-1 and OpenRouter's free auto-router. Model catalog identifiers and availability can change. Check OpenRouter's current model catalog and the response's actual model field before assuming a route is live or free.

The application may report a provider error when credentials are missing, a model ID is invalid, a model is rate-limited or a provider is unavailable. Never hide this by reporting a simulated success.

## Gemini, NVIDIA NIM and Groq

These adapters are optional. Configure the matching key only if you intend to use that provider. Gemini is integrated using `@google/genai`; NVIDIA NIM and Groq use OpenAI-compatible request patterns in the multi-provider layer.

Provider support in code does not mean an account, endpoint, quota or model is automatically provisioned.

## Firebase client setup

The browser Firebase SDK configuration is read from `firebase-applet-config.json`. It identifies the Firebase project, API key, auth settings and Firestore database ID. This file is app configuration, not a server service-account private key.

Enable the Authentication providers you intend to use (Google and GitHub are supported by the current client setup). Configure authorized domains and OAuth callback settings in Firebase and the identity provider consoles.

Deploy Firestore security rules that match the app's ownership model. Do not use open/public rules as a troubleshooting shortcut.

## Server-side Firestore access on Cloud Run

The server-side project hydration helper uses Cloud Run metadata credentials / Application Default Credentials. Attach a dedicated service account to the Cloud Run service and grant only the permissions required to read/write the relevant Firestore database. The project documentation has previously used the Cloud Datastore User role (`roles/datastore.user`); review the current least-privilege IAM requirements for your Firebase/Firestore setup before granting it.

Do not download a service-account key into the repository or bake it into a container image. For local development, use an approved Application Default Credentials workflow and a non-production Firebase project.

## GitHub and Vercel

- GitHub operations require a token or user OAuth grant with the exact repository permissions required by the selected action.
- Vercel deployment requires a token with access to the target team/project.
- Review generated files, target repository and deployment settings before authorizing a push or deployment.
- Store credentials in the hosting platform's secret manager.

## Razorpay

Razorpay integration is optional. Configure webhook secret and dashboard webhook endpoint consistently. Validate signatures server-side. Never trust client-submitted payment status or amount as proof of payment.

## Hosted deployment checklist

- Build and run the Express server using `npm run build` and `npm start`.
- Configure environment variables in the hosting platform.
- Configure Firebase Authentication authorized domains and Firestore rules.
- Attach the correct service identity for server-side Firestore access.
- Use durable storage for execution records and project workspaces; ephemeral local files are not a backup.
- Configure health checks and request timeouts.
- Ensure API and SSE routes reach Express before any SPA fallback.
- Ensure SSE responses use `text/event-stream` and proxy buffering/timeouts permit streaming.
- Disable Vite HMR when the hosting proxy does not support WebSocket upgrades.
- Verify generated build assets and preview routing with a real browser.
- Review logs for secrets and redact sensitive values.

## Cost and free-tier notes

The default agent roster uses OpenRouter routes labeled `:free`, but providers can rate-limit or retire free endpoints. Firestore, Cloud Run, Vercel, domain hosting, storage, outbound bandwidth, GitHub features and optional inference providers may have usage limits or charges. Check each vendor's current pricing and quotas. DevForge does not guarantee an end-to-end zero-cost deployment.
