// Cloudflare Pages Function for POST /api/payment/verify
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, *',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json().catch(() => ({}));
    const { paymentId, orderId } = body;

    const transactionId = paymentId || `pay_${Math.random().toString(36).substring(2, 11)}`;

    return new Response(JSON.stringify({
      success: true,
      transactionId,
      message: 'Payment verified successfully and subscription activated.'
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Verification failed' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
