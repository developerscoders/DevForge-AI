# Firestore production setup

## Important security boundary

Do **not** store OpenRouter, GitHub, Vercel, Firebase service-account, payment-provider, or OAuth access tokens in Firestore or in browser storage. Keep them in server-side environment variables or a secret manager. Firestore stores only project source, public deployment URLs, provider account display metadata, and audit events.

## Collections and document shapes

### `plans/{planId}` — admin-managed pricing catalog

```json
{
  "id": "pro",
  "name": "Pro Plan",
  "priceMonthly": 99,
  "priceYearly": 950,
  "credits": 5000,
  "features": ["Unlimited projects", "Collaborative agent swarms"],
  "active": true,
  "updatedAt": "2026-09-14T00:00:00.000Z"
}
```

Create one document each for `free`, `starter`, `pro`, and `enterprise` using the plan objects in `src/lib/firestoreService.ts` as the source values. Only an Admin SDK process should write these documents.

### `users/{uid}` — entitlement snapshot

```json
{
  "uid": "FIREBASE_AUTH_UID",
  "email": "owner@example.com",
  "displayName": "Owner",
  "photoURL": null,
  "planId": "pro",
  "planName": "Pro Plan",
  "billingCycle": "monthly",
  "creditsRemaining": 4650,
  "creditsTotal": 5000,
  "nextRenewal": "2026-10-14",
  "updatedAt": "2026-09-14T00:00:00.000Z"
}
```

Only a trusted payment webhook or Admin SDK can change `planId`, credit totals, or `creditsRemaining`. The browser may read its own entitlement document but must not grant or deduct credits.

### `projects/{projectId}` — owned source and deployment metadata

```json
{
  "id": "proj_abc123",
  "userId": "FIREBASE_AUTH_UID",
  "name": "L'Étoile",
  "prompt": "Original user prompt",
  "status": "deployed",
  "files": [{ "path": "src/App.tsx", "name": "App.tsx", "type": "file", "content": "..." }],
  "githubRepoUrl": "https://github.com/org/repo",
  "vercelDeployUrl": "https://project.vercel.app",
  "vercelDeploymentId": "deployment-id-only",
  "deploymentStatus": "deployed",
  "createdAt": "2026-09-14T00:00:00.000Z",
  "updatedAt": "2026-09-14T00:00:00.000Z"
}
```

The app saves a project at creation, updates its generated files/status after the API pipeline finishes, and persists GitHub/Vercel metadata through `onProjectUpdated`.

### `projects/{projectId}/exports/{exportId}` — immutable export audit

```json
{
  "id": "exp_123",
  "projectId": "proj_abc123",
  "userId": "FIREBASE_AUTH_UID",
  "format": "zip",
  "fileCount": 14,
  "exportedAt": "2026-09-14T00:00:00.000Z"
}
```

### Backend-only collections

`transactions`, `subscriptions`, and `deployment_events` must be written by a verified payment/deployment webhook using the Firebase Admin SDK. Store provider IDs and public URLs only—never card data, OAuth tokens, or webhook secrets.

## Deployment steps

1. In Firebase Console, create Firestore in production mode.
2. Deploy the repository's `firestore.rules` and `firestore.indexes.json` with Firebase CLI.
3. Seed the four plan documents using an Admin SDK script or the Firebase Console.
4. Configure a trusted backend/webhook to verify payment-provider signatures, update `users/{uid}` credits, create a `transactions` record, and update the `subscriptions` record atomically.
5. Configure the project-generation API to verify Firebase ID tokens and atomically decrement the same entitlement document before creating a project. Do not trust a client-supplied credit balance.

## SRE Admin Console

The SRE Admin Console now reads `users` (tenant directory) and `transactions` (ledger/analytics) directly from Firestore. It requires a Firebase custom claim; ordinary users receive an empty state rather than sample data.

Assign the claim once from a secure Admin SDK environment:

```js
await admin.auth().setCustomUserClaims('FIREBASE_AUTH_UID', { admin: true });
```

The admin must sign out and sign back in for the refreshed ID token to include the claim. Tenant tier changes, account creation, refunds, and credit grants remain backend-only operations; implement those through authenticated Admin SDK endpoints or verified provider webhooks.

## What is intentionally not retrievable

Secrets, payment details, OAuth tokens, and service credentials are not retrievable through the app, database UI, project exports, or this document. If any were previously stored in Firestore/client storage, revoke and rotate them immediately.
