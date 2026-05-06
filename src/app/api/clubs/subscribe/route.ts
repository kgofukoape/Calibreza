import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';
const IS_SANDBOX = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true';
const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

const MERCHANT_ID = IS_SANDBOX ? '10000100' : process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID!;
const MERCHANT_KEY = IS_SANDBOX ? '46f0cd694581a' : process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY!;
const PASSPHRASE = IS_SANDBOX ? 'jt7NOE43FZPn' : (process.env.PAYFAST_PASSPHRASE || '');

function generateSignature(params: Record<string, string>): string {
  const str = Object.keys(params)
    .filter(k => k !== 'signature' && params[k] !== '')
    .sort()
    .map(k => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');

  const withPassphrase = PASSPHRASE ? `${str}&passphrase=${encodeURIComponent(PASSPHRASE).replace(/%20/g, '+')}` : str;
  return crypto.createHash('md5').update(withPassphrase).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { clubId, clubName, contactEmail, contactName } = await req.json();

    if (!clubId || !contactEmail) {
      return NextResponse.json({ error: 'Missing club details' }, { status: 400 });
    }

    // Verify club exists
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('id, name, subscription_status, subscription_tier')
      .eq('id', clubId)
      .single();

    if (clubErr || !club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.subscription_tier === 'active' && club.subscription_status === 'active') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }

    // Billing date = 60 days from today (2 months free trial)
    const billingDate = new Date();
    billingDate.setDate(billingDate.getDate() + 60);
    const billingDateStr = billingDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const mPaymentId = `range_sub_${clubId}_${Date.now()}`;

    const nameParts = (contactName || 'Range').trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Owner';

    const params: Record<string, string> = {
      merchant_id: MERCHANT_ID,
      merchant_key: MERCHANT_KEY,
      return_url: `${BASE_URL}/club-dashboard?subscribed=true`,
      cancel_url: `${BASE_URL}/clubs/pricing?cancelled=true`,
      notify_url: `${BASE_URL}/api/payfast/notify`,
      name_first: firstName,
      name_last: lastName,
      email_address: contactEmail,
      m_payment_id: mPaymentId,
      amount: '0.00',                          // Free today
      item_name: 'Gun X Active Range Subscription',
      item_description: '2 months free then R399/month — cancel anytime',
      custom_str1: 'range_subscription',
      custom_str2: clubId,
      custom_str3: club.name || clubName || '',
      subscription_type: '1',                  // Recurring
      billing_date: billingDateStr,            // First charge in 60 days
      recurring_amount: '399.00',             // R399/month recurring
      frequency: '3',                          // Monthly
      cycles: '0',                             // Ongoing (never ends)
    };

    params.signature = generateSignature(params);

    // Store pending subscription record
    await supabase
      .from('clubs')
      .update({
        subscription_status: 'trial',
        subscription_tier: 'active',
        trial_start_date: new Date().toISOString(),
        trial_end_date: billingDate.toISOString(),
        billing_start_date: billingDate.toISOString(),
      })
      .eq('id', clubId);

    return NextResponse.json({
      payfast_url: PAYFAST_URL,
      params,
    });

  } catch (err: any) {
    console.error('Club subscribe error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
