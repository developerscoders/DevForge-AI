// Cloudflare Pages Function for POST /api/payments/razorpay/webhook
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-razorpay-signature, x-razorpay-event, *',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-razorpay-signature, x-razorpay-event, *',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json().catch(() => ({}));
    const event = body.event || context.request.headers.get('x-razorpay-event') || 'payment.captured';

    return new Response(JSON.stringify({
      success: true,
      status: 'processed',
      event,
      timestamp: new Date().toISOString()
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Webhook processing failed' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
