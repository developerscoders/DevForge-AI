// Cloudflare Pages Function for GET /api/health
export async function onRequestGet() {
  return new Response(JSON.stringify({
    status: 'ok',
    environment: 'cloudflare-pages',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
  });
}
