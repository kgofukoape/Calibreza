import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { PAID_LISTING_PRICE } from '@/lib/plans';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/payfast/listing-checkout   { listingId }
//
// Builds and SIGNS the R29 private listing checkout on the server.
//
// /sell used to build this form in the browser, which cannot sign it: the
// PayFast passphrase is a server-only secret. Once a passphrase was set on the
// PayFast account, unsigned checkouts were rejected and nobody could pay for a
// listing.
//
// The price comes from the server. A browser-supplied amount is a
// browser-chosen amount.
//
// Fields match what /api/payfast/notify already expects:
//   m_payment_id = 'LISTING_<listing id>'
//   custom_str1  = 'private_listing'
//   custom_str2  = listing id

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const IS_SANDBOX = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true';
const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

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
  const limit = rateLimit(`listing-checkout:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 },
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const listingId = String(body?.listingId || '');
    if (!listingId) {
      return NextResponse.json({ error: 'Listing id required' }, { status: 400 });
    }

    // Must be their own listing, and still awaiting payment. Without this check
    // anyone could generate a checkout against someone else's listing.
    const { data: listing, error: lErr } = await supabase
      .from('listings')
      .select('id, seller_id, status, is_paid, title')
      .eq('id', listingId)
      .maybeSingle();

    if (lErr) {
      console.error('listing-checkout: lookup failed:', lErr.message);
      return NextResponse.json({ error: 'Could not load listing' }, { status: 500 });
    }
    if (!listing || listing.seller_id !== user.id) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.is_paid || listing.status !== 'pending_payment') {
      return NextResponse.json({ error: 'This listing is not awaiting payment' }, { status: 400 });
    }

    const origin = req.nextUrl.origin;
    const firstName = String(user.user_metadata?.full_name || '').split(' ')[0] || 'User';

    const raw: Array<[string, string]> = [
      ['merchant_id', process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || ''],
      ['merchant_key', process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || ''],
      ['return_url', `${origin}/dashboard/listings?payment=success`],
      ['cancel_url', `${origin}/dashboard/listings?payment=cancelled`],
      ['notify_url', `${origin}/api/payfast/notify`],
      ['name_first', firstName],
      ['email_address', (user.email || '').trim()],
      ['m_payment_id', `LISTING_${listing.id}`],
      ['amount', PAID_LISTING_PRICE.toFixed(2)],
      ['item_name', 'Gun X Listing Fee'],
      ['custom_str1', 'private_listing'],
      ['custom_str2', listing.id],
    ];

    const fields = raw
      .map(([k, v]) => [k, (v || '').trim()] as [string, string])
      .filter(([, v]) => v !== '');

    if (!fields.find(([k]) => k === 'merchant_id') || !fields.find(([k]) => k === 'merchant_key')) {
      console.error('listing-checkout: PayFast merchant credentials missing from env');
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    const signature = signFields(fields, process.env.PAYFAST_PASSPHRASE || '');
    fields.push(['signature', signature]);

    console.log(`listing-checkout: ${listing.id} R${PAID_LISTING_PRICE.toFixed(2)}`);

    return NextResponse.json({ payfast_url: PAYFAST_URL, fields });
  } catch (err: any) {
    console.error('listing-checkout error:', err?.message || err);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
