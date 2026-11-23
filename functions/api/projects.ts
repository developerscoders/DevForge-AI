// Cloudflare Pages edge proxy for the Node orchestrator.
// Never synthesize a fake project at the edge: all project creation and execution
// must pass through the same authenticated Express orchestrator used by the UI.
function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

function resolveOrchestratorOrigin(context: any): string | null {
  const raw = context.env?.DEVFORGE_API_ORIGIN;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function proxyToOrchestrator(context: any, method: 'GET' | 'POST') {
  const headers = corsHeaders(context.request);
  const origin = resolveOrchestratorOrigin(context);
  if (!origin) {
    return new Response(JSON.stringify({
      error: 'The Cloudflare edge API is not configured to reach the DevForge Node orchestrator.',
      code: 'ORCHESTRATOR_API_ORIGIN_NOT_CONFIGURED',
      requiredVariable: 'DEVFORGE_API_ORIGIN',
    }), {
      status: 503,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  const incoming = new URL(context.request.url);
  const target = new URL('/api/projects', origin);
  target.search = incoming.search;
  const authorization = context.request.headers.get('Authorization');
  const requestHeaders = new Headers({ Accept: 'application/json' });
  if (authorization) requestHeaders.set('Authorization', authorization);
  let body: string | undefined;
  if (method === 'POST') {
    requestHeaders.set('Content-Type', 'application/json');
    body = await context.request.text();
  }

  try {
    const upstream = await fetch(target.toString(), {
      method,
      headers: requestHeaders,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
    });
    const responseHeaders = new Headers(headers);
    responseHeaders.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json');
    responseHeaders.set('Cache-Control', 'no-store');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      error: 'Could not reach the DevForge Node orchestrator. No project was created.',
      code: 'ORCHESTRATOR_UPSTREAM_UNAVAILABLE',
      detail: error?.message || String(error),
    }), {
      status: 502,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions(context: any) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

export async function onRequestGet(context: any) {
  return proxyToOrchestrator(context, 'GET');
}

export async function onRequestPost(context: any) {
  return proxyToOrchestrator(context, 'POST');
}
