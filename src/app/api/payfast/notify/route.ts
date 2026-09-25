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

// Same pattern as the subscription cron: this route calls our own
// /api/notify endpoint and needs an absolute URL to do it.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

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
        their_signature: data['signature'],
        our_signature: expectedSig,
        passphrase_set: !!process.env.PAYFAST_PASSPHRASE,
        raw_body: rawBody,
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

    // ── HAVE WE SEEN THIS PAYMENT BEFORE? ────────────────────────────────────
    // The signature check proves the notification is genuine. It does not prove
    // it is new — a genuine notification captured from a log or a proxy is
    // genuine every time it is replayed. Without this, sending one valid R499
    // subscription notification ten times extends the subscription ten months.
    //
    // The uniqueness is enforced by an index rather than by a "have I seen
    // this?" query, because two notifications arriving at the same instant
    // would both pass a check written here. Only the database can settle that.
    const pfPaymentId = data['pf_payment_id'];

    if (pfPaymentId) {
      const { error: dupErr } = await supabase
        .from('payfast_notifications')
        .insert({
          pf_payment_id: pfPaymentId,
          m_payment_id: data['m_payment_id'] || null,
          amount_gross: parseFloat(data['amount_gross'] || '0'),
          payment_status: data['payment_status'] || null,
          raw: data,
        });

      if (dupErr) {
        // 23505 is the unique violation: this payment has already been acted
        // on. Answer 200 so PayFast stops retrying — the notification was
        // received and handled, just not twice.
        if (dupErr.code === '23505') {
          console.warn('PayFast ITN replay ignored:', pfPaymentId);
          return new NextResponse('OK', { status: 200 });
        }
        // Any other failure means we cannot tell whether this is a replay.
        // Refusing is the safe answer: PayFast will retry, and granting a
        // subscription we might grant again is worse than a delayed one.
        console.error('PayFast ITN: could not record notification', dupErr);
        return new NextResponse('Error', { status: 500 });
      }
    } else {
      // No payment id means nothing can be de-duplicated. PayFast always sends
      // one on a real transaction, so its absence is a reason to stop.
      console.error('PayFast ITN rejected: no pf_payment_id');
      return new NextResponse('Invalid', { status: 400 });
    }

    // ── VERIFIED AND NEW — safe to act on ────────────────────────────────────

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

        // Billing runs on the 1st of the month. First charge dates in SAST.
        const sastFirstOfNextMonthIso = (): string => {
          const t = new Date(Date.now() + 2 * 60 * 60 * 1000);
          const y = t.getUTCFullYear();
          const m = t.getUTCMonth();
          const ny = m === 11 ? y + 1 : y;
          const nm = m === 11 ? 0 : m + 1;
          return new Date(Date.UTC(ny, nm, 1) - 2 * 60 * 60 * 1000).toISOString();
        };

        // custom_str4 says what the FIRST payment was:
        //   'trial' / 'trial_founding' - R0, PayFast just confirmed the card
        //   'prorated'                 - part month, or a prorated upgrade
        //   'full'                     - the full tier price
        //
        // PayFast repeats these fields on EVERY recurring charge, so the flag
        // alone cannot tell a trial start from the monthly charge that follows
        // it. The amount decides: R0 is a card confirmation, anything more is a
        // real payment and gets the full amount check.
        const trialFlagged = customStr4 === 'trial' || customStr4 === 'trial_founding';
        const isFounding = customStr4 === 'trial_founding';
        const isProrated = customStr4 === 'prorated';
        const isCardConfirmation = amountGross <= 0.01;
        const expected = DEALER_PLAN_PRICES[plan];

        if (isCardConfirmation) {
          // A R0 notification that was never set up as a trial is not something
          // to act on.
          if (!trialFlagged) {
            console.error('Zero-amount dealer ITN with no trial flag - ignored: ' + dealerId);
            return new NextResponse('OK', { status: 200 });
          }
        } else if (expected === undefined) {
          console.warn('Unknown dealer plan "' + plan + '" - amount not verified');
        } else if (isProrated || trialFlagged) {
          // A part-month first payment, or the full monthly charge that follows
          // a trial. Never more than the tier price.
          if (amountGross <= 0 || amountGross > expected + 0.01) {
            console.error('Dealer payment REJECTED - R' + amountGross + ' outside 0 < x <= R' + expected);
            return new NextResponse('OK', { status: 200 });
          }
        } else if (Math.abs(amountGross - expected) > 0.01) {
          console.error('Dealer subscription REJECTED - expected R' + expected + ', got R' + amountGross);
          return new NextResponse('OK', { status: 200 });
        }

        // Paid until the next charge date. On a trial that is the date the
        // checkout worked out (custom_str5); on a payment it is the 1st of next
        // month, in South African time so a charge just after midnight on the
        // 1st does not land in the wrong month.
        const firstChargeStr = data['custom_str5'] || '';
        const hasFirstCharge = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(firstChargeStr);
        const periodEndIso = isCardConfirmation && hasFirstCharge
          ? new Date(firstChargeStr + 'T00:00:00+02:00').toISOString()
          : sastFirstOfNextMonthIso();

        const nowIso = new Date().toISOString();

        const update: Record<string, any> = {
          subscription_tier: plan,
          subscription_status: isCardConfirmation ? 'trial' : 'active',
          payfast_token: pfToken,
          current_period_end: periodEndIso,
          subscribed_at: nowIso,
          pending_tier: null,
          pending_change_type: null,
          cancellation_requested_at: null,
          // A payment that lands after a failure settles the account: the cron
          // must not go on to downgrade them.
          past_due_since: null,
        };

        if (isCardConfirmation) {
          update.trial_start_date = nowIso;
          update.trial_end_date = periodEndIso;
          update.trial_used = true;
          if (isFounding) update.is_founding = true;
        }

        const { data: updatedRows, error: updErr } = await supabase
          .from('dealers')
          .update(update)
          .eq('id', dealerId)
          .select('id, saps_dealer_number, registration_number');

        if (updErr) {
          console.error('Dealer subscription UPDATE FAILED for ' + dealerId + ': ' + updErr.message);
        } else if (!updatedRows || updatedRows.length === 0) {
          console.error('Dealer subscription update matched NO ROWS for id ' + dealerId);
        }

        // The ledger is what burns a founding slot and stops the same business
        // taking another trial under a new email address. Written only once the
        // card is confirmed, and it outlives a deleted account.
        if (isCardConfirmation && updatedRows && updatedRows.length > 0) {
          const row: any = updatedRows[0];
          const { error: ledgerErr } = await supabase.rpc('record_trial_start', {
            p_entity_type: 'dealer',
            p_entity_id: dealerId,
            p_saps: row.saps_dealer_number || null,
            p_reg: row.registration_number || null,
            p_plan: plan,
            p_is_founding: isFounding,
            p_trial_ends: periodEndIso,
            p_first_charge: hasFirstCharge ? firstChargeStr : null,
          });
          if (ledgerErr) {
            console.error('trial_ledger write FAILED for ' + dealerId + ': ' + ledgerErr.message);
          }
        }

        // Audit trail for billing disputes
        try {
          await supabase.from('subscription_events').insert({
            entity_type: 'dealer',
            entity_id: dealerId,
            event_type: isCardConfirmation ? 'trial_started' : 'payment_received',
            to_tier: plan,
            amount: amountGross,
            actor: 'payfast',
            notes: isCardConfirmation
              ? (isFounding ? 'Founding dealer trial started' : 'Trial started')
              : (isProrated ? 'Prorated payment' : 'Subscription payment'),
          });
        } catch (e) {
          console.error('subscription_events insert failed:', e);
        }

        console.log('Dealer ' + (isCardConfirmation ? 'trial started' : 'payment applied')
          + ': ' + dealerId + ' -> ' + plan + ', next charge ' + periodEndIso);
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

      // TRAINING EVENT
      // /training/post sends custom_str1 'training_event'. Same pattern as a
      // private listing: created as pending_payment, activated only when the
      // verified R299 ITN clears.
      else if (customStr1 === 'training_event') {
        const eventId = customStr2;
        if (Math.abs(amountGross - 299) > 0.01) {
          console.error('Training listing REJECTED - wrong amount: ' + amountGross);
          return new NextResponse('OK', { status: 200 });
        }
        await supabase
          .from('training_events')
          .update({ status: 'active', is_paid: true })
          .eq('id', eventId)
          .eq('status', 'pending_payment');
        console.log('Training event activated: ' + eventId);
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
      } else if (customStr1 === 'dealer_subscription') {
        // A recurring charge failed. Do NOT downgrade here: PayFast retries
        // over the following days and the dealer may simply need to fix a card.
        // They are marked past_due and emailed now; the subscription cron drops
        // them to free only if it is still unsettled after the grace period.
        const dealerId = data['custom_str3'] || data['m_payment_id'] || '';
        if (dealerId) {
          const { data: rows, error: pdErr } = await supabase
            .from('dealers')
            .update({
              subscription_status: 'past_due',
              past_due_since: new Date().toISOString(),
            })
            .eq('id', dealerId)
            .not('subscription_status', 'eq', 'past_due')
            .select('id, business_name, email, subscription_tier');

          if (pdErr) {
            console.error('Dealer past_due UPDATE FAILED for ' + dealerId + ': ' + pdErr.message);
          } else if (rows && rows.length > 0) {
            const d: any = rows[0];
            try {
              await supabase.from('subscription_events').insert({
                entity_type: 'dealer',
                entity_id: dealerId,
                event_type: 'payment_failed',
                to_tier: d.subscription_tier,
                // amountGross belongs to the COMPLETE branch and is not in
                // scope here; read what PayFast sent with the failure.
                amount: parseFloat(data['amount_gross'] || '0') || null,
                actor: 'payfast',
                notes: 'PayFast reported ' + (data['payment_status'] || 'FAILED'),
              });
            } catch (e) {
              console.error('subscription_events insert failed:', e);
            }

            try {
              await fetch(`${BASE_URL}/api/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // /api/notify reads body.data, not top-level fields.
                body: JSON.stringify({
                  type: 'dealer_payment_failed',
                  data: {
                    email: d.email,
                    name: d.business_name,
                    tier: d.subscription_tier,
                  },
                }),
              });
            } catch (e) {
              console.error('dealer_payment_failed email failed:', e);
            }
            console.log('Dealer payment failed, marked past_due: ' + dealerId);
          }
        }
      } else {
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