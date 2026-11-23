import fs from 'node:fs';
import path from 'node:path';

type VerifiedFirebaseUser = { uid: string; email?: string };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, any>;
  createTime?: string;
  updateTime?: string;
};

function getFirebaseConfig(): { projectId: string; apiKey: string; firestoreDatabaseId?: string } {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) throw new Error('FIREBASE_CONFIG_MISSING: firebase-applet-config.json was not found.');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!config.projectId || !config.apiKey) throw new Error('FIREBASE_CONFIG_INVALID: projectId or apiKey is missing.');
  return config;
}

function decodeValue(value: any): any {
  if (!value || typeof value !== 'object') return value;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('bytesValue' in value) return value.bytesValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return value;
}

function decodeFields(fields: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function encodeValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
  return { stringValue: String(value) };
}

function encodeFields(value: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, item]) => Boolean(key) && item !== undefined)
      .map(([key, item]) => [key, encodeValue(item)])
  );
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getCloudRunAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) return cachedAccessToken.token;

  // Cloud Run exposes short-lived Application Default Credentials through its metadata server.
  const response = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(4000) }
  ).catch((error: any) => {
    throw new Error(`FIRESTORE_ADC_UNAVAILABLE: Cloud Run metadata credentials could not be reached: ${error?.message || error}`);
  });

  if (!response.ok) {
    throw new Error(`FIRESTORE_ADC_UNAVAILABLE: metadata server returned HTTP ${response.status}. Configure a Cloud Run service account with Firestore access.`);
  }
  const payload: any = await response.json();
  if (!payload.access_token) throw new Error('FIRESTORE_ADC_UNAVAILABLE: metadata server returned no access token.');
  cachedAccessToken = {
    token: payload.access_token,
    expiresAt: now + Math.max(60, Number(payload.expires_in || 3600)) * 1000,
  };
  return payload.access_token;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  if (!idToken?.trim()) throw new Error('AUTH_REQUIRED: A Firebase ID token is required.');
  const config = getFirebaseConfig();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!response.ok) throw new Error('AUTH_INVALID: Firebase rejected the supplied ID token.');
  const payload: any = await response.json();
  const user = payload.users?.[0];
  if (!user?.localId) throw new Error('AUTH_INVALID: Firebase token did not resolve to a user.');
  return { uid: user.localId, email: user.email };
}

function documentsBaseUrl(): string {
  const config = getFirebaseConfig();
  const databaseId = config.firestoreDatabaseId || '(default)';
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/${encodeURIComponent(databaseId)}/documents`;
}

async function firestoreRequest(url: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = await getCloudRunAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal: init.signal || AbortSignal.timeout(12000),
  });
  if (response.status === 403) {
    throw new Error('FIRESTORE_PERMISSION_DENIED: Cloud Run service account needs the Cloud Datastore User role (roles/datastore.user) on the Firebase project.');
  }
  if (response.status === 401) {
    cachedAccessToken = null;
    throw new Error('FIRESTORE_AUTH_FAILED: Cloud Run Application Default Credentials were rejected.');
  }
  return response;
}

export async function loadOwnedProjectFromFirestore(projectId: string, idToken: string): Promise<any | null> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(projectId)) throw new Error('INVALID_PROJECT_ID: Project ID format is invalid.');
  const user = await verifyFirebaseIdToken(idToken);
  const base = documentsBaseUrl();
  const projectResponse = await firestoreRequest(`${base}/projects/${encodeURIComponent(projectId)}`);
  if (projectResponse.status === 404) return null;
  if (!projectResponse.ok) throw new Error(`FIRESTORE_READ_FAILED: project document request returned HTTP ${projectResponse.status}.`);
  const document = await projectResponse.json() as FirestoreDocument;
  const project = decodeFields(document.fields || {});
  if (project.userId !== user.uid) throw new Error('PROJECT_FORBIDDEN: This project does not belong to the authenticated Firebase user.');

  const files: any[] = [];
  let pageToken = '';
  do {
    const url = new URL(`${base}/projects/${encodeURIComponent(projectId)}/files`);
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const filesResponse = await firestoreRequest(url.toString());
    if (filesResponse.status === 404) break;
    if (!filesResponse.ok) throw new Error(`FIRESTORE_FILES_READ_FAILED: files subcollection returned HTTP ${filesResponse.status}.`);
    const page: any = await filesResponse.json();
    for (const fileDoc of page.documents || []) {
      const file = decodeFields(fileDoc.fields || {});
      if (typeof file.path === 'string') files.push(file);
    }
    pageToken = page.nextPageToken || '';
  } while (pageToken);

  return { id: projectId, ...project, files };
}
