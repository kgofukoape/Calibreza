import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { JOB_BOOST } from '@/lib/jobPackages';

// ─── PAYFAST ITN (Instant Transaction Notification) ──────────────────────────
// SECURITY: this endpoint grants paid features, so it must never trust the
// incoming request. Before ANY database write, the notification is verified:
//
//   1. SIGNATURE      — MD5 of the parameter string (+ passphrase) must match.
//   2. MERCHANT ID    — must be our merchant account.
//   3. SERVER CONFIRM — the data is posted back to PayFast, which replies
//                       "VALID" only if it genuinely sent this notification.
//   4. AMOUNT         — the amount paid must match what the item costs.
//
// Without these, anyone could POST `payment_status=COMPLETE` to this URL and
// grant themselves a paid subscription for free.
//
// Required env vars:
//   NEXT_PUBLIC_PAYFAST_MERCHANT_ID
//   PAYFAST_PASSPHRASE              — must match the PayFast dashboard setting
//   NEXT_PUBLIC_PAYFAST_SANDBOX     — 'true' while testing

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const IS_SANDBOX = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true';
const PF_HOST = IS_SANDBOX ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';

// Expected prices in Rands. Keep in sync with the pricing pages.
// If a plan is missing here the amount check is skipped (and logged) rather
// than blocking a legitimate payment.
const DEALER_PLAN_PRICES: Record<string, number> = {
  pro: 499,
  premium: 799,
};

/** PHP urlencode() equivalent — PayFast builds its signature this way. */
function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, '+')
    .replace(/[!'()*~]/g, (ch) => '%' + ch.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());
}

/**
 * Rebuild the signature from the parameters in the order received (excluding
 * `signature` itself), append the passphrase if configured, then MD5 it.
 */
function buildSignature(params: Array<[string, string]>, passphrase?: string): string {
  const pairs = params
    .filter(([k]) => k !== 'signature')
    .map(([k, v]) => `${k}=${pfEncode(v)}`);

  let str = pairs.join('&');
  if (passphrase) str += `&passphrase=${pfEncode(passphrase)}`;

  return createHash('md5').update(str).digest('hex');
}

/** Ask PayFast to confirm it really sent this notification. */
async function serverConfirm(rawBody: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${PF_HOST}/eng/query/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: rawBody,
    });
    const text = (await res.text()).trim().toUpperCase();
    return text === 'VALID';
  } catch (e) {
    console.error('PayFast server confirmation failed:', e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const search = new URLSearchParams(rawBody);

    // Preserve the exact order fields arrived in — required for the signature
    const ordered: Array<[string, string]> = [];
    search.forEach((v, k) => ordered.push([k, v]));
    const data = Object.fromEntries(ordered);

    // ── VERIFICATION GATE ────────────────────────────────────────────────────
    // Always reply 200 (PayFast retries otherwise), but process nothing unless
    // every check passes.

    // 1. Signature
    const expectedSig = buildSignature(ordered, process.env.PAYFAST_PASSPHRASE);
    if (!data['signature'] || data['signature'] !== expectedSig) {
      console.error('PayFast ITN REJECTED — signature mismatch', {
        m_payment_id: data['m_payment_id'],
      });
      return new NextResponse('OK', { status: 200 });
    }

    // 2. Merchant ID
    const ourMerchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID;
    if (ourMerchantId && data['merchant_id'] !== ourMerchantId) {
      console.error('PayFast ITN REJECTED — merchant_id mismatch:', data['merchant_id']);
      return new NextResponse('OK', { status: 200 });
    }

    // 3. Server confirmation — the strongest check
    const confirmed = await serverConfirm(rawBody);
    if (!confirmed) {
      console.error('PayFast ITN REJECTED — server confirmation not VALID', {
        m_payment_id: data['m_payment_id'],
      });
      return new NextResponse('OK', { status: 200 });
    }

    console.log('PayFast ITN verified:', JSON.stringify({
      m_payment_id: data['m_payment_id'],
      payment_status: data['payment_status'],
      amount_gross: data['amount_gross'],
    }));

    // ── VERIFIED — safe to act on ────────────────────────────────────────────

    if (data['payment_status'] === 'COMPLETE') {
      const customStr1 = data['custom_str1'] || '';
      const customStr2 = data['custom_str2'] || '';
      const customStr3 = data['custom_str3'] || '';
      const customStr4 = data['custom_str4'] || '';
      const pfToken = data['token'] || null;
      const promoId = data['m_payment_id'] || '';
      const amountGross = parseFloat(data['amount_gross'] || '0');

      // ── CASE A: DEALER SUBSCRIPTION ──
      if (customStr1 === 'dealer_subscription') {
        const plan = customStr2; // 'pro' or 'premium'
        const dealerId = customStr3;

        // 4. Amount check — never upgrade on an underpayment.
        //    A PRORATED UPGRADE legitimately pays LESS than the full tier price
        //    on its first payment (the unused portion of the old plan is
        //    credited), so accept a lower first payment when this ITN is flagged
        //    as prorated. Subsequent recurring payments are the full amount.
        const isProrated = customStr4 === 'prorated';
        const expected = DEALER_PLAN_PRICES[plan];

        if (expected === undefined) {
          console.warn(`Unknown dealer plan "${plan}" — amount not verified`);
        } else if (isProrated) {
          // Must still be a positive payment, and never MORE than the tier price
          if (amountGross <= 0 || amountGross > expected + 0.01) {
            console.error(`Prorated upgrade REJECTED — R${amountGross} outside 0 < x <= R${expected}`);
            return new NextResponse('OK', { status: 200 });
          }
          console.log(`Prorated upgrade accepted: R${amountGross} toward ${plan}`);
        } else if (Math.abs(amountGross - expected) > 0.01) {
          console.error(`Dealer subscription REJECTED — expected R${expected}, got R${amountGross}`);
          return new NextResponse('OK', { status: 200 });
        }

        // Set the paid-until date. Without this, proration on a future upgrade
        // has no period to calculate against (and the dashboard shows "—").
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await supabase
          .from('dealers')
          .update({
            subscription_tier: plan,
            subscription_status: 'active',
            payfast_token: pfToken,
            current_period_end: periodEnd.toISOString(),
            subscribed_at: new Date().toISOString(),
            pending_tier: null,
            pending_change_type: null,
            cancellation_requested_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dealerId);

        // Audit trail for billing disputes
        try {
          await supabase.from('subscription_events').insert({
            entity_type: 'dealer',
            entity_id: dealerId,
            event_type: 'payment_received',
            to_tier: plan,
            amount: amountGross,
            actor: 'payfast',
            notes: isProrated ? 'Prorated upgrade payment' : 'Subscription payment',
          });
        } catch (e) {
          console.error('subscription_events insert failed:', e);
        }

        console.log(`Dealer subscription activated: ${dealerId} -> ${plan}, paid until ${periodEnd.toISOString()}`);
      }

      // ── CASE B: LISTING BOOST ──
      else if (customStr1 === 'listing_boost') {
        const listingId = customStr2;

        const { data: promo } = await supabase
          .from('promoted_listings')
          .select('id, amount, scope')
          .eq('id', promoId)
          .single();

        if (promo) {
          const expectedRands = promo.amount / 100;

          if (Math.abs(amountGross - expectedRands) > 0.01) {
            console.error(`Amount mismatch: expected R${expectedRands}, got R${amountGross}`);
            await supabase.from('promoted_listings')
              .update({ status: 'amount_mismatch' })
              .eq('id', promoId);
            return new NextResponse('OK', { status: 200 });
          }

          const now = new Date();
          const expires = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

          await supabase.from('promoted_listings').update({
            status: 'active',
            payfast_payment_id: data['pf_payment_id'] || null,
            starts_at: now.toISOString(),
            expires_at: expires.toISOString(),
          }).eq('id', promoId);

          await supabase.from('listings').update({
            is_featured: true,
            featured_until: expires.toISOString(),
          }).eq('id', listingId);

          console.log(`Listing boost activated: ${listingId} until ${expires.toISOString()}`);
        }
      }

      // ── CASE C: RANGE / CLUB SUBSCRIPTION ──
      else if (customStr1 === 'range_subscription') {
        const clubId = customStr2;

        // amount_gross is 0.00 on the first ITN (trial start), then the monthly
        // charge on each subsequent payment.
        const isFirstCharge = amountGross === 0;

        if (isFirstCharge) {
          await supabase
            .from('clubs')
            .update({
              payfast_token: pfToken,
              subscription_status: 'trial',
              subscription_tier: 'active',
            })
            .eq('id', clubId);

          console.log(`Range subscription trial started: ${clubId} — first charge in 60 days`);
        } else {
          await supabase
            .from('clubs')
            .update({
              payfast_token: pfToken,
              subscription_status: 'active',
              subscription_tier: 'active',
              subscribed_at: new Date().toISOString(),
            })
            .eq('id', clubId);

          console.log(`Range subscription payment received: ${clubId} — R${amountGross}`);
        }
      }

      // ── CASE D: RANGE SUBSCRIPTION CANCELLED (via PayFast dashboard) ──
      else if (customStr1 === 'range_subscription_cancel') {
        const clubId = customStr2;

        await supabase
          .from('clubs')
          .update({
            subscription_status: 'cancelled',
            subscription_tier: 'listed',
            payfast_token: null,
          })
          .eq('id', clubId);

        console.log(`Range subscription cancelled: ${clubId}`);
      }

      // ── CASE E: PRIVATE PAID LISTING ──
      // /sell sends custom_str1 'private_listing'. There was no branch for it,
      // so the ITN arrived, matched nothing and did nothing — while the listing
      // was being created client-side on return from PayFast regardless of
      // whether payment succeeded. Anyone could cancel at the payment screen,
      // navigate back to /sell?paid=true, and receive a free listing outside
      // their allowance.
      else if (customStr1 === 'private_listing') {
        const listingId = customStr2;

        if (Math.abs(amountGross - 29) > 0.01) {
          console.error(`Private listing REJECTED — expected R29, got R${amountGross}`);
          return new NextResponse('OK', { status: 200 });
        }

        await supabase
          .from('listings')
          .update({ status: 'active', is_paid: true })
          .eq('id', listingId)
          .eq('status', 'pending_payment');

        console.log(`Private paid listing activated: ${listingId}`);
      }

      // ── CASE F: URGENT HIRE BOOST ──
      // MUST be tested before the plain JOB_ case below: 'JOB_BOOST_<id>' also
      // starts with 'JOB_', so the generic branch used to catch boosts first
      // and then update a job whose id was literally 'BOOST_<uuid>' — matching
      // nothing. The money was taken and the badge never appeared.
      else if (promoId.startsWith('JOB_BOOST_')) {
        const jid = promoId.replace('JOB_BOOST_', '');

        if (Math.abs(amountGross - JOB_BOOST.price) > 0.01) {
          console.error(`Job boost REJECTED — expected R${JOB_BOOST.price}, got R${amountGross}`);
          return new NextResponse('OK', { status: 200 });
        }

        const boostedUntil = new Date();
        boostedUntil.setDate(boostedUntil.getDate() + JOB_BOOST.days);

        await supabase
          .from('job_listings')
          .update({
            is_boosted: true,
            boosted_until: boostedUntil.toISOString(),
            boost_pending_until: null,
          })
          .eq('id', jid);

        console.log(`Job boost activated: ${jid} until ${boostedUntil.toISOString()}`);
      }

      // ── CASE G: INDUSTRY JOBS ──
      else if (promoId.startsWith('JOB_')) {
        const jid = promoId.replace('JOB_', '');

        await supabase
          .from('job_listings')
          .update({ status: 'active' })
          .eq('id', jid);

        console.log(`Job Listing payment received and activated: ${jid}`);
      }

    } else if (data['payment_status'] === 'FAILED' || data['payment_status'] === 'CANCELLED') {
      const customStr1 = data['custom_str1'] || '';
      const promoId = data['m_payment_id'] || '';

      if (customStr1 === 'range_subscription') {
        const clubId = data['custom_str2'] || '';
        if (clubId) {
          await supabase
            .from('clubs')
            .update({
              subscription_status: 'free',
              subscription_tier: 'listed',
            })
            .eq('id', clubId);
          console.log(`Range subscription failed/cancelled: ${clubId}`);
        }
      } else if (customStr1 === 'private_listing') {
        // Left as pending_payment. It stays invisible and the seller can retry
        // from their dashboard without re-entering everything.
        console.log(`Private listing payment failed/cancelled: ${data['custom_str2']}`);
      } else if (promoId.startsWith('JOB_BOOST_')) {
        // Clear the marker, otherwise the dashboard shows "awaiting payment"
        // indefinitely for a boost that was abandoned.
        await supabase
          .from('job_listings')
          .update({ boost_pending_until: null })
          .eq('id', promoId.replace('JOB_BOOST_', ''));
        console.log(`Job boost failed/cancelled: ${promoId.replace('JOB_BOOST_', '')}`);
      } else if (promoId.startsWith('JOB_')) {
        console.log(`Job payment failed/cancelled, remaining pending: ${promoId.replace('JOB_', '')}`);
      } else if (customStr1 !== 'dealer_subscription') {
        await supabase.from('promoted_listings')
          .update({ status: 'failed' })
          .eq('id', promoId);
      }
    }

    return new NextResponse('OK', { status: 200 });

  } catch (err: any) {
    console.error('PayFast ITN unhandled error:', err);
    return new NextResponse('OK', { status: 200 }); // Always 200 to PayFast
  }
}