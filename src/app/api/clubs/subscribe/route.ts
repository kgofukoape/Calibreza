import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// POST /api/clubs/subscribe   { }
//
// Builds and SIGNS the club/range subscription checkout on the server, on the
// same model as dealers:
//
//   TRIAL (first time for this club)
//     Pay R0 today. PayFast stores the card. The free months run from today and
//     the first full charge is the 1st AFTER they end. Founding clubs (the
//     first FOUNDING_CLUB_LIMIT) get 2 months, everyone after gets 1.
//
//   NO TRIAL (this club has had one before)
//     Pay for the days left in this month, then R399 on the 1st of each month.
//
// Four things were wrong with the previous version:
//   1. It took a clubId from the request body with NO authentication, so anyone
//      could upgrade any club by posting its id.
//   2. It marked the club subscribed BEFORE PayFast confirmed anything, so an
//      abandoned checkout still left the club on a paid tier.
//   3. It hardcoded the old shared sandbox merchant and passphrase, so it
//      signed for the wrong account.
//   4. It sorted signature fields alphabetically. PayFast checkouts use the
//      documented field order.
//
// Nothing is written to the database here. The club is upgraded by the verified
// ITN in /api/payfast/notify, which is the only thing that knows money moved.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const IS_SANDBOX = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true';
const PAYFAST_URL = IS_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

const CLUB_PRICE = 399;
const FOUNDING_LIMIT = parseInt(process.env.FOUNDING_CLUB_LIMIT || '50', 10);
const FOUNDING_TRIAL_MONTHS = 2;
const STANDARD_TRIAL_MONTHS = 1;
const PAYFAST_MIN_AMOUNT = 5.0;

// SAST is UTC+2 all year. Billing lands just after midnight on the 1st, which
// is still the previous month in UTC, so every date decision is made in SAST.
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

function addMonths(p: Ymd, n: number): Ymd {
  const total = p.m + n;
  const y = p.y + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12;
  return { y, m, d: Math.min(p.d, daysInMonth(y, m)) };
}

/** PHP urlencode() equivalent - PayFast builds its signature this way. */
function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (ch) => '%' + ch.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
}

/** Documented field order, empty values removed, passphrase last, MD5. */
function signFields(fields: Array<[string, string]>, passphrase?: string): string {
  let str = fields.map(([k, v]) => `${k}=${pfEncode(v)}`).join('&');
  if (passphrase) str += `&passphrase=${pfEncode(passphrase)}`;
  return createHash('md5').update(str).digest('hex');
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as any);
  const limit = rateLimit(`clubs-subscribe:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 },
    );
  }

  try {
    // 1. Who is asking. The club is looked up FROM THE SESSION, never from the
    //    request body.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .select('id, name, email, status, subscription_status, trial_used, saps_reg_number, responsible_person_email')
      .eq('user_id', user.id)
      .maybeSingle();

    if (clubErr) {
      console.error('clubs-subscribe: club lookup failed:', clubErr.message);
      return NextResponse.json({ error: 'Could not load club' }, { status: 500 });
    }
    // Clubs use 'active' where dealers use 'approved' for the same thing: the
    // application has been reviewed and the club is live on the directory.
    if (!club || club.status !== 'active') {
      return NextResponse.json({ error: 'Approved club account required' }, { status: 403 });
    }
    if (club.subscription_status === 'active' || club.subscription_status === 'trial') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }

    // 2. Trial eligibility, tied to the CLUB, not the email address: a club that
    //    cancels, deletes the account and signs up again is matched on its SAPS
    //    registration number in the ledger.
    let trialEligible = !club.trial_used;

    if (trialEligible) {
      const { data: usedBefore, error: usedErr } = await supabase.rpc('trial_already_used', {
        p_saps: club.saps_reg_number || null,
        p_reg: null,
      });
      if (usedErr) {
        console.error('clubs-subscribe: trial_already_used failed:', usedErr.message);
        trialEligible = false; // fail closed
      } else if (usedBefore === true) {
        trialEligible = false;
      }
    }

    // 3. Founding slot, counted from the ledger so a deleted account does not
    //    return its slot. Clubs are counted separately from dealers.
    let isFounding = false;
    if (trialEligible) {
      const { data: slotsUsed, error: slotsErr } = await supabase.rpc('founding_slots_used_for', {
        p_entity_type: 'club',
      });
      if (slotsErr) {
        console.error('clubs-subscribe: founding_slots_used_for failed:', slotsErr.message);
      } else if (typeof slotsUsed === 'number' && slotsUsed < FOUNDING_LIMIT) {
        isFounding = true;
      }
    }

    // 4. What they pay today, and when the first full charge lands
    const today = sastToday();
    let amount: number;
    let firstCharge: Ymd;
    let flag: string;
    let description: string;

    if (trialEligible) {
      const months = isFounding ? FOUNDING_TRIAL_MONTHS : STANDARD_TRIAL_MONTHS;
      const trialEnd = addMonths(today, months);
      firstCharge = trialEnd.d === 1 ? trialEnd : firstOfNextMonth(trialEnd);
      amount = 0;
      flag = isFounding ? 'trial_founding' : 'trial';
      description = `${months} month${months === 1 ? '' : 's'} free, then R${CLUB_PRICE} on the 1st of each month`;
    } else {
      const dim = daysInMonth(today.y, today.m);
      const daysRemaining = dim - today.d + 1; // includes today
      amount = Math.round((CLUB_PRICE * daysRemaining / dim) * 100) / 100;
      if (amount < PAYFAST_MIN_AMOUNT) amount = PAYFAST_MIN_AMOUNT;
      if (amount > CLUB_PRICE) amount = CLUB_PRICE;
      firstCharge = firstOfNextMonth(today);
      flag = amount < CLUB_PRICE ? 'prorated' : 'full';
      description = `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} to month end, then R${CLUB_PRICE} on the 1st of each month`;
    }

    const origin = req.nextUrl.origin;
    const contactEmail = (club.email || club.responsible_person_email || user.email || '').trim();
    const clubName = (club.name || 'Range').trim();

    const raw: Array<[string, string]> = [
      ['merchant_id', process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || ''],
      ['merchant_key', process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || ''],
      ['return_url', `${origin}/club-dashboard?subscribed=true`],
      ['cancel_url', `${origin}/clubs/pricing?cancelled=true`],
      ['notify_url', `${origin}/api/payfast/notify`],
      ['name_first', clubName],
      ['email_address', contactEmail],
      ['m_payment_id', club.id],
      ['amount', amount.toFixed(2)],
      ['item_name', 'Gun X Active Range Subscription'],
      ['item_description', description],
      ['custom_str1', 'range_subscription'],
      ['custom_str2', club.id],
      ['custom_str3', clubName],
      ['custom_str4', flag],
      ['custom_str5', ymdString(firstCharge)],
      ['subscription_type', '1'],
      ['billing_date', ymdString(firstCharge)],
      ['recurring_amount', CLUB_PRICE.toFixed(2)],
      ['frequency', '3'],
      ['cycles', '0'],
    ];

    const fields = raw
      .map(([k, v]) => [k, (v || '').trim()] as [string, string])
      .filter(([, v]) => v !== '');

    if (!fields.find(([k]) => k === 'merchant_id') || !fields.find(([k]) => k === 'merchant_key')) {
      console.error('clubs-subscribe: PayFast merchant credentials missing from env');
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    const signature = signFields(fields, process.env.PAYFAST_PASSPHRASE || '');
    fields.push(['signature', signature]);

    console.log(`clubs-subscribe: ${club.id} flag=${flag} pay_now=R${amount.toFixed(2)} first_charge=${ymdString(firstCharge)}`);

    return NextResponse.json({
      payfast_url: PAYFAST_URL,
      fields,
      summary: {
        pay_today: amount.toFixed(2),
        recurring: CLUB_PRICE.toFixed(2),
        first_charge_on: ymdString(firstCharge),
        trial: trialEligible,
        founding: isFounding,
      },
    });
  } catch (err: any) {
    console.error('clubs-subscribe error:', err?.message || err);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
