// Cloudflare Pages Function for /api/projects/:id

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestGet(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
    'Content-Type': 'application/json',
  };

  const id = context.params.id;
  return new Response(JSON.stringify({ id, status: 'ready', files: [] }), {
    status: 200,
    headers: corsHeaders,
  });
}

export async function onRequestPut(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
    'Content-Type': 'application/json',
  };

  const body = await context.request.json().catch(() => ({}));
  return new Response(JSON.stringify({ success: true, updated: body }), {
    status: 200,
    headers: corsHeaders,
  });
}

export async function onRequestDelete(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
    'Content-Type': 'application/json',
  };

  return new Response(JSON.stringify({ success: true, message: 'Project deleted' }), {
    status: 200,
    headers: corsHeaders,
  });
}
