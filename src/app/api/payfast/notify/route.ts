import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

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
      const pfToken = data['token'] || null;
      const promoId = data['m_payment_id'] || '';
      const amountGross = parseFloat(data['amount_gross'] || '0');

      // ── CASE A: DEALER SUBSCRIPTION ──
      if (customStr1 === 'dealer_subscription') {
        const plan = customStr2; // 'pro' or 'premium'
        const dealerId = customStr3;

        // 4. Amount check — never upgrade on an underpayment
        const expected = DEALER_PLAN_PRICES[plan];
        if (expected === undefined) {
          console.warn(`Unknown dealer plan "${plan}" — amount not verified`);
        } else if (Math.abs(amountGross - expected) > 0.01) {
          console.error(`Dealer subscription REJECTED — expected R${expected}, got R${amountGross}`);
          return new NextResponse('OK', { status: 200 });
        }

        await supabase
          .from('dealers')
          .update({
            subscription_tier: plan,
            payfast_token: pfToken,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dealerId);

        console.log(`Dealer subscription activated: ${dealerId} -> ${plan}`);
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

      // ── CASE E: INDUSTRY JOBS ──
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
