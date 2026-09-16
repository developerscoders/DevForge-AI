// Cloudflare Pages Function for /api/projects/:id/stream

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestGet(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
    'Content-Type': 'application/json',
  };

  const id = context.params.id;
  return new Response(JSON.stringify({
    projectId: id,
    status: 'complete',
    progress: 100,
    logs: [
      { agentId: 'ag_ceo', message: 'Project initialization verified at edge', timestamp: new Date().toISOString() }
    ]
  }), {
    status: 200,
    headers: corsHeaders,
  });
}
