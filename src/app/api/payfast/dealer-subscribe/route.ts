import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { DEALER_PLANS } from '@/lib/plans';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/payfast/dealer-subscribe
//
// Builds and SIGNS the PayFast checkout for a dealer subscription on the
// server. The checkout used to be built in the browser, which could not sign
// it: the passphrase is a server-only secret. PayFast requires a passphrase
// (and therefore a signature) for recurring billing.
//
// The price comes from src/lib/plans.ts here on the server, never from the
// browser, so a dealer cannot edit the amount before paying.
//
// Fields match what the ITN handler (/api/payfast/notify) expects:
//   custom_str1 = 'dealer_subscription'
//   custom_str2 = plan id ('pro' | 'premium')
//   custom_str3 = dealer id

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const IS_SANDBOX = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true';
const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

const PAID_PLANS = ['pro', 'premium'] as const;
type PaidPlan = typeof PAID_PLANS[number];

/** PHP urlencode() equivalent - PayFast builds its signature this way. */
function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (ch) => '%' + ch.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
}

/**
 * Checkout signature: fields in PayFast's documented order (NOT alphabetical),
 * empty values removed, passphrase appended last, MD5 of the result.
 */
function signFields(fields: Array<[string, string]>, passphrase?: string): string {
  let str = fields.map(([k, v]) => `${k}=${pfEncode(v)}`).join('&');
  if (passphrase) str += `&passphrase=${pfEncode(passphrase)}`;
  return createHash('md5').update(str).digest('hex');
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as any);
  const limit = rateLimit(`dealer-subscribe:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 },
    );
  }

  try {
    // 1. Who is asking
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Which plan
    const body = await req.json().catch(() => ({}));
    const plan = body?.plan as PaidPlan;
    if (!PAID_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    const planDef = DEALER_PLANS[plan];
    if (!planDef || !planDef.price || planDef.price <= 0) {
      return NextResponse.json({ error: 'Plan has no price' }, { status: 400 });
    }

    // 3. Their dealer record - must exist and be approved
    const { data: dealer, error: dealerErr } = await supabase
      .from('dealers')
      .select('id, business_name, email, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (dealerErr) {
      console.error('dealer-subscribe: dealer lookup failed:', dealerErr.message);
      return NextResponse.json({ error: 'Could not load dealer' }, { status: 500 });
    }
    if (!dealer || dealer.status !== 'approved') {
      return NextResponse.json({ error: 'Approved dealer account required' }, { status: 403 });
    }

    // 4. Build the checkout fields in PayFast's documented order
    const origin = req.nextUrl.origin;
    const amount = planDef.price.toFixed(2);
    const today = new Date().toISOString().split('T')[0];
    const businessName = (dealer.business_name || 'Dealer').trim();

    const raw: Array<[string, string]> = [
      ['merchant_id', process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || ''],
      ['merchant_key', process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || ''],
      ['return_url', `${origin}/dealer-dashboard/subscription?success=true`],
      ['cancel_url', `${origin}/dealer-dashboard/subscription?cancel=true`],
      ['notify_url', `${origin}/api/payfast/notify`],
      ['name_first', businessName],
      ['email_address', (dealer.email || user.email || '').trim()],
      ['m_payment_id', dealer.id],
      ['amount', amount],
      ['item_name', `GunX ${planDef.label} Dealer Subscription`],
      ['item_description', `Monthly recurring subscription for ${businessName}`],
      ['custom_str1', 'dealer_subscription'],
      ['custom_str2', plan],
      ['custom_str3', dealer.id],
      ['subscription_type', '1'],
      ['billing_date', today],
      ['recurring_amount', amount],
      ['frequency', '3'],
      ['cycles', '0'],
    ];

    // Drop empty values so what we POST is exactly what we signed
    const fields = raw
      .map(([k, v]) => [k, (v || '').trim()] as [string, string])
      .filter(([, v]) => v !== '');

    if (!fields.find(([k]) => k === 'merchant_id') || !fields.find(([k]) => k === 'merchant_key')) {
      console.error('dealer-subscribe: PayFast merchant credentials missing from env');
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    const passphrase = process.env.PAYFAST_PASSPHRASE || '';
    if (!passphrase) {
      console.warn('dealer-subscribe: PAYFAST_PASSPHRASE not set - PayFast subscriptions require one');
    }

    const signature = signFields(fields, passphrase);
    fields.push(['signature', signature]);

    return NextResponse.json({ payfast_url: PAYFAST_URL, fields });
  } catch (err: any) {
    console.error('dealer-subscribe error:', err?.message || err);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
