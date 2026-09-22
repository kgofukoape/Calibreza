import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { DEALER_PLANS } from '@/lib/plans';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/payfast/dealer-subscribe
//
// Builds and SIGNS the PayFast checkout for a dealer subscription on the
// server. PayFast requires a passphrase (and so a signature) for recurring
// billing, and the passphrase is a server-only secret.
//
// Billing model: every dealer is charged on the 1st of the month.
//
//   TRIAL (first time for this business)
//     Pay R0 today. PayFast stores the card. The free months run from today,
//     and the first full charge is the 1st AFTER they end. Founding dealers
//     (the first FOUNDING_DEALER_LIMIT) get 2 months, everyone else gets 1.
//
//   NO TRIAL (this business has had one before)
//     Pay for the days left in this month, including today. The full fee is
//     then charged on the 1st of next month and every 1st after that.
//
// PayFast allows exactly one "first amount" plus one recurring amount, which
// is why a trial cannot also be prorated: the free period is stretched to the
// next 1st instead.
//
// Nothing is written to the database here. The trial only counts once PayFast
// confirms the card, which happens in /api/payfast/notify.
//
// Fields the ITN handler reads:
//   custom_str1 = 'dealer_subscription'
//   custom_str2 = plan id ('pro' | 'premium')
//   custom_str3 = dealer id
//   custom_str4 = 'trial_founding' | 'trial' | 'prorated' | 'full'
//   custom_str5 = first charge date (YYYY-MM-DD)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const IS_SANDBOX = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true';
const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

const FOUNDING_LIMIT = parseInt(process.env.FOUNDING_DEALER_LIMIT || '50', 10);
const FOUNDING_TRIAL_MONTHS = 2;
const STANDARD_TRIAL_MONTHS = 1;

// PayFast will not process a payment below this.
const PAYFAST_MIN_AMOUNT = 5.0;

const PAID_PLANS = ['pro', 'premium'] as const;
type PaidPlan = typeof PAID_PLANS[number];

// ── South African time ───────────────────────────────────────────────────────
// SAST is UTC+2 all year, no daylight saving. Billing happens just after
// midnight on the 1st, which is still the previous month in UTC, so every
// calendar decision below is made in SAST.

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

interface Ymd { y: number; m: number; d: number } // m is 0-based

function sastToday(): Ymd {
  const t = new Date(Date.now() + SAST_OFFSET_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
}

function ymdString(p: Ymd): string {
  const mm = String(p.m + 1).padStart(2, '0');
  const dd = String(p.d).padStart(2, '0');
  return `${p.y}-${mm}-${dd}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

function firstOfNextMonth(p: Ymd): Ymd {
  return p.m === 11 ? { y: p.y + 1, m: 0, d: 1 } : { y: p.y, m: p.m + 1, d: 1 };
}

/** Same day-of-month n months on, clamped (31 Jan + 1 month = 28 Feb). */
function addMonths(p: Ymd, n: number): Ymd {
  const total = p.m + n;
  const y = p.y + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  return { y, m, d: Math.min(p.d, daysInMonth(y, m)) };
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
      .select('id, business_name, email, status, trial_used, saps_dealer_number, registration_number')
      .eq('user_id', user.id)
      .maybeSingle();

    if (dealerErr) {
      console.error('dealer-subscribe: dealer lookup failed:', dealerErr.message);
      return NextResponse.json({ error: 'Could not load dealer' }, { status: 500 });
    }
    if (!dealer || dealer.status !== 'approved') {
      return NextResponse.json({ error: 'Approved dealer account required' }, { status: 403 });
    }

    // 4. Trial eligibility. Tied to the BUSINESS, not the email address: a
    //    dealer who cancels, deletes the account and signs up again with a new
    //    address is matched on their SAPS and CIPC numbers in the ledger.
    let trialEligible = !dealer.trial_used;

    if (trialEligible) {
      const { data: usedBefore, error: usedErr } = await supabase.rpc('trial_already_used', {
        p_saps: dealer.saps_dealer_number || null,
        p_reg: dealer.registration_number || null,
      });
      if (usedErr) {
        // Fail closed: if the ledger cannot be read, do not hand out a trial.
        console.error('dealer-subscribe: trial_already_used failed:', usedErr.message);
        trialEligible = false;
      } else if (usedBefore === true) {
        trialEligible = false;
      }
    }

    // 5. Founding slot, counted from the ledger so a deleted account does not
    //    return its slot. Two dealers checking out at the same moment may both
    //    be offered the last slot; whatever they were shown is honoured.
    let isFounding = false;
    if (trialEligible) {
      const { data: slotsUsed, error: slotsErr } = await supabase.rpc('founding_slots_used');
      if (slotsErr) {
        console.error('dealer-subscribe: founding_slots_used failed:', slotsErr.message);
      } else if (typeof slotsUsed === 'number' && slotsUsed < FOUNDING_LIMIT) {
        isFounding = true;
      }
    }

    // 6. Work out what they pay today and when the first full charge lands
    const today = sastToday();
    const fullPrice = planDef.price;

    let amount: number;
    let firstCharge: Ymd;
    let flag: string;
    let description: string;

    if (trialEligible) {
      const months = isFounding ? FOUNDING_TRIAL_MONTHS : STANDARD_TRIAL_MONTHS;
      const trialEnd = addMonths(today, months);
      // If the free period happens to end exactly on a 1st, bill that day
      // rather than giving away another whole month.
      firstCharge = trialEnd.d === 1 ? trialEnd : firstOfNextMonth(trialEnd);
      amount = 0;
      flag = isFounding ? 'trial_founding' : 'trial';
      description = `${months} month${months === 1 ? '' : 's'} free, then R${fullPrice} on the 1st of each month`;
    } else {
      const dim = daysInMonth(today.y, today.m);
      const daysRemaining = dim - today.d + 1; // includes today
      amount = Math.round((fullPrice * daysRemaining / dim) * 100) / 100;
      if (amount < PAYFAST_MIN_AMOUNT) amount = PAYFAST_MIN_AMOUNT;
      if (amount > fullPrice) amount = fullPrice;
      firstCharge = firstOfNextMonth(today);
      flag = amount < fullPrice ? 'prorated' : 'full';
      description = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} to month end, then R${fullPrice} on the 1st of each month`;
    }

    // 7. Build the checkout fields in PayFast's documented order
    const origin = req.nextUrl.origin;
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
      ['amount', amount.toFixed(2)],
      ['item_name', `GunX ${planDef.label} Dealer Subscription`],
      ['item_description', description],
      ['custom_str1', 'dealer_subscription'],
      ['custom_str2', plan],
      ['custom_str3', dealer.id],
      ['custom_str4', flag],
      ['custom_str5', ymdString(firstCharge)],
      ['subscription_type', '1'],
      ['billing_date', ymdString(firstCharge)],
      ['recurring_amount', fullPrice.toFixed(2)],
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

    console.log(`dealer-subscribe: ${dealer.id} ${plan} flag=${flag} pay_now=R${amount.toFixed(2)} first_charge=${ymdString(firstCharge)}`);

    return NextResponse.json({
      payfast_url: PAYFAST_URL,
      fields,
      summary: {
        pay_today: amount.toFixed(2),
        recurring: fullPrice.toFixed(2),
        first_charge_on: ymdString(firstCharge),
        trial: trialEligible,
        founding: isFounding,
      },
    });
  } catch (err: any) {
    console.error('dealer-subscribe error:', err?.message || err);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}

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
