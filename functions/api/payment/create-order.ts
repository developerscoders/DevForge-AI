// Cloudflare Pages Function for POST /api/payment/create-order
// Enables instant order creation directly on Cloudflare Edge without 405 errors

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
    const { planId, billingCycle, extraCredits, providerId = 'razorpay' } = body;

    let amount = 0;
    let description = '';

    if (planId === 'starter') {
      amount = billingCycle === 'yearly' ? 470 : 1;
      description = `Upgrade to Starter Plan (${billingCycle || 'monthly'})`;
    } else if (planId === 'pro') {
      amount = billingCycle === 'yearly' ? 850 : 69;
      description = `Upgrade to Pro Plan (${billingCycle || 'monthly'})`;
    } else if (planId === 'enterprise') {
      amount = billingCycle === 'yearly' ? 2870 : 299;
      description = `Upgrade to Enterprise Plan (${billingCycle || 'monthly'})`;
    } else if (planId === 'free') {
      amount = 0;
      description = 'Free Tier';
    } else if (extraCredits) {
      amount = extraCredits === 1000 ? 10 : extraCredits === 5000 ? 45 : 80;
      description = `Purchase ${extraCredits} AI Credits`;
    } else {
      amount = 1;
      description = 'DevForge AI Subscription';
    }

    const keyId = context.env?.VITE_RAZORPAY_KEY_ID || context.env?.RAZORPAY_KEY_ID || 'rzp_test_TZVZBneslH7cuS';
    const keySecret = context.env?.RAZORPAY_KEY_SECRET || 'yCSL6HAN55uLu3N64CNzT3FA';
    const targetCurrency = body.currency || 'USD';

    // Call real Razorpay Orders API
    if (keyId && keySecret && keySecret.trim() !== '' && !keySecret.includes('...')) {
      try {
        const auth = btoa(`${keyId}:${keySecret}`);
        let rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: targetCurrency,
            receipt: `rcpt_${Math.random().toString(36).substring(2, 9)}`,
            notes: { description }
          })
        });

        // If USD is not enabled on merchant account, seamlessly fallback to INR
        if (!rzpRes.ok && targetCurrency === 'USD') {
          const inrAmount = Math.round(amount * 85 * 100); // 1 USD ≈ 85 INR
          rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: inrAmount,
              currency: 'INR',
              receipt: `rcpt_${Math.random().toString(36).substring(2, 9)}`,
              notes: { description }
            })
          });
        }

        if (rzpRes.ok) {
          const rzpData = await rzpRes.json();
          return new Response(JSON.stringify({
            order: {
              orderId: rzpData.id,
              provider: 'razorpay',
              amount: rzpData.currency === 'INR' ? Math.round(rzpData.amount / 85) / 100 : rzpData.amount / 100,
              currency: rzpData.currency,
              status: 'created',
              isRealOrder: true,
              rawResponse: rzpData
            },
            description,
            keyId
          }), { status: 200, headers: corsHeaders });
        } else {
          const errData = await rzpRes.text();
          console.warn('[Razorpay Edge] Order creation failed:', errData);
        }
      } catch (e) {
        console.warn('[Razorpay Edge] API call error:', e);
      }
    }

    // Direct checkout fallback: DO NOT set a synthetic order_id
    // Razorpay Standard Checkout opens cleanly with key, amount, and currency when order_id is omitted!
    return new Response(JSON.stringify({
      order: {
        orderId: null,
        provider: 'razorpay',
        amount,
        currency: targetCurrency,
        status: 'created',
        isRealOrder: false,
        rawResponse: {
          amount: Math.round(amount * 100),
          currency: targetCurrency,
          status: 'created',
          created_at: Math.floor(Date.now() / 1000),
          notes: { description },
          is_simulation: false
        }
      },
      description,
      keyId
    }), { status: 200, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to process order' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
