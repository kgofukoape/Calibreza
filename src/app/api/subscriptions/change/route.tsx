import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rateLimit';
import { calculateProration, isUpgrade, PLAN_PRICES } from '@/lib/proration';

// ─── SUBSCRIPTION CHANGES (upgrade / downgrade / cancel / reactivate) ────────
//
// THE PROBLEM THIS SOLVES
// Previously, choosing a new plan simply sent the user to PayFast to start a
// NEW recurring subscription — while the existing one kept billing. That is
// double-billing, and it is exactly what our Dealer Agreement promises not to
// do.
//
// THE RULES ENFORCED HERE
//   • You cannot start a second paid subscription while one is active.
//   • Upgrades require the current subscription to be cancelled first (PayFast
//     recurring plans cannot be modified in place), so we walk the user through
//     it rather than silently charging twice.
//   • Downgrades and cancellations take effect at period end — you keep what
//     you paid for.
//   • Every change is written to subscription_events for dispute evidence.
//
// PAYFAST LIMITATION (read before launch)
// A PayFast recurring subscription can only be truly stopped via PayFast's own
// API using the stored token, or in the PayFast dashboard. Until the PayFast
// account exists, cancellation here marks the platform state and flags the
// account for the admin to action in PayFast. `cancelPayFastSubscription()`
// below is written but INTENTIONALLY INERT until you set PAYFAST_MERCHANT_ID,
// PAYFAST_MERCHANT_KEY and PAYFAST_PASSPHRASE and flip PAYFAST_API_ENABLED.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── TIER MODELS PER ENTITY TYPE ─────────────────────────────────────────────
// Dealers and clubs use DIFFERENT tier vocabularies. This previously only knew
// the dealer tiers, so a club calling cancel was told "no paid subscription to
// cancel" — its tier ('active') was not in the paid list.
//
//   dealers : free  → pro → premium
//   clubs   : listed → active            ('listed' = free directory entry)
const TIER_MODEL: Record<string, { rank: Record<string, number>; paid: string[]; freeTier: string }> = {
  dealer: {
    rank: { free: 0, pro: 1, premium: 2 },
    paid: ['pro', 'premium'],
    freeTier: 'free',
  },
  club: {
    rank: { listed: 0, free: 0, active: 1 },
    paid: ['active'],
    freeTier: 'listed',
  },
};

// Kept for the dealer proration path
const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, premium: 2 };

type Action = 'cancel' | 'downgrade' | 'reactivate' | 'check' | 'upgrade_quote';

async function logEvent(params: {
  entity_type: string;
  entity_id: string;
  event_type: string;
  from_tier?: string | null;
  to_tier?: string | null;
  effective_at?: string | null;
  actor?: string;
  notes?: string;
}) {
  try {
    await supabase.from('subscription_events').insert({
      actor: 'user',
      ...params,
    });
  } catch (e) {
    console.error('subscription_events insert failed:', e);
  }
}

/**
 * Placeholder for the real PayFast cancellation call.
 * Enable only once the PayFast account exists AND you have tested in sandbox.
 */
async function cancelPayFastSubscription(token: string | null): Promise<{ ok: boolean; message: string }> {
  if (!token) {
    return { ok: false, message: 'No PayFast token on record — cancel manually in the PayFast dashboard.' };
  }
  if (process.env.PAYFAST_API_ENABLED !== 'true') {
    return {
      ok: false,
      message: 'PayFast API not enabled — platform access has been ended, but the recurring charge must be stopped manually in the PayFast dashboard.',
    };
  }
  // Intentionally not implemented until the account exists and can be tested.
  // PayFast's subscription API requires signed, timestamped headers; guessing at
  // it now would create the illusion of a working cancellation.
  return {
    ok: false,
    message: 'PayFast API cancellation not yet implemented — cancel in the PayFast dashboard.',
  };
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limited = rateLimit(`subchange:${ip}`, 10, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const entityType: string = body?.entityType === 'club' ? 'club' : 'dealer';
  const entityId: string = String(body?.entityId || '');
  const action: Action = body?.action;
  const targetTier: string | undefined = body?.targetTier;

  if (!entityId || !['cancel', 'downgrade', 'reactivate', 'check', 'upgrade_quote'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const table = entityType === 'club' ? 'clubs' : 'dealers';

  const { data: entity, error: fetchErr } = await supabase
    .from(table)
    .select('*')
    .eq('id', entityId)
    .single();

  if (fetchErr || !entity) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  // Resolve which tier vocabulary applies to this entity
  const model = TIER_MODEL[entityType] || TIER_MODEL.dealer;
  const PAID_PLANS = model.paid;
  const FREE_TIER = model.freeTier;

  const currentTier: string = entity.subscription_tier || FREE_TIER;
  const status: string = entity.subscription_status || 'free';

  // Trial handling. Clubs get a 2-month free trial before first billing, so
  // "cancel" during a trial must NOT cut access — the trial was free, they keep
  // it to the end, then fall back to the free tier.
  const trialEnd: string | null = entity.trial_end_date || entity.trial_ends_at || null;
  const isTrialling = status === 'trial' && !!trialEnd && new Date(trialEnd).getTime() > Date.now();
  const trialDaysLeft = isTrialling
    ? Math.max(0, Math.ceil((new Date(trialEnd as string).getTime() - Date.now()) / 86_400_000))
    : 0;

  // While trialling, the trial end IS the effective period end
  const periodEnd: string | null = isTrialling ? trialEnd : (entity.current_period_end || null);

  // ── CHECK — used by the UI before offering a plan change ───────────────────
  if (action === 'check') {
    const hasActivePaid =
      (PAID_PLANS.includes(currentTier) && ['active', 'cancelling', 'past_due'].includes(status)) ||
      isTrialling;
    return NextResponse.json({
      ok: true,
      currentTier,
      status,
      periodEnd,
      pendingTier: entity.pending_tier || null,
      hasActivePaid,
      isTrialling,
      trialDaysLeft,
      trialEnd,
      freeTier: FREE_TIER,
      // The UI uses this to block a second checkout instead of double-billing
      canStartNewSubscription: !hasActivePaid,
      message: hasActivePaid
        ? 'An active subscription already exists. Cancel it before starting a new plan, or contact support to change plans without a billing gap.'
        : 'No active paid subscription.',
    });
  }

  // ── UPGRADE QUOTE — prorated cost to move up a tier today ──────────────────
  // Rather than forcing "cancel, wait out the month, re-subscribe" (friction
  // that loses upgrades), we credit the unused portion of the current plan and
  // charge only the difference.
  if (action === 'upgrade_quote') {
    if (!targetTier || !(targetTier in PLAN_PRICES)) {
      return NextResponse.json({ error: 'Invalid target plan' }, { status: 400 });
    }
    if (!isUpgrade(currentTier, targetTier)) {
      return NextResponse.json(
        { error: 'That is not an upgrade. Use a scheduled downgrade instead.' },
        { status: 400 },
      );
    }

    const quote = calculateProration(currentTier, targetTier, periodEnd);

    return NextResponse.json({
      ok: true,
      currentTier,
      targetTier,
      ...quote,
      // Honest about the operational constraint — the old recurring charge at
      // PayFast must be stopped, or the customer pays twice.
      requiresOldSubscriptionCancellation: PLAN_PRICES[currentTier] > 0,
    });
  }

  // ── CANCEL — nothing is cut off today ──────────────────────────────────────
  // Two cases, both of which preserve access already earned:
  //   TRIAL  — the trial was free, so cancelling costs them nothing. They keep
  //            the trial to its end date, then drop to the free tier.
  //   PAID   — they keep the features to the end of the period they paid for.
  if (action === 'cancel') {
    if (!PAID_PLANS.includes(currentTier) && !isTrialling) {
      return NextResponse.json({ error: 'No active subscription to cancel.' }, { status: 400 });
    }

    // Only attempt a PayFast cancellation if money is actually flowing. During
    // a trial nothing has been charged yet, but the mandate may already exist.
    const pf = await cancelPayFastSubscription(entity.payfast_token || null);

    await supabase
      .from(table)
      .update({
        subscription_status: 'cancelling',
        cancellation_requested_at: new Date().toISOString(),
        pending_tier: FREE_TIER,
        pending_change_type: 'cancel',
      })
      .eq('id', entityId);

    await logEvent({
      entity_type: entityType,
      entity_id: entityId,
      event_type: 'cancel',
      from_tier: currentTier,
      to_tier: FREE_TIER,
      effective_at: periodEnd,
      notes: isTrialling ? `Cancelled during trial — ${trialDaysLeft} days remaining` : pf.message,
    });

    const endStr = periodEnd
      ? new Date(periodEnd).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    return NextResponse.json({
      ok: true,
      status: 'cancelling',
      effectiveAt: periodEnd,
      isTrialling,
      trialDaysLeft,
      freeTier: FREE_TIER,
      // Stated honestly so nobody assumes billing definitely stopped
      billingNote: isTrialling
        ? 'No payment has been taken — your trial was free.'
        : (pf.ok ? 'Recurring billing cancelled.' : pf.message),
      message: isTrialling
        ? `Nothing has been charged, and nothing changes today. You still have ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left on your free trial${endStr ? ` (until ${endStr})` : ''} — keep using every feature until then. After that your listing stays live on the free tier. Change your mind any time before then and you can pick the trial back up.`
        : endStr
          ? `Your subscription ends on ${endStr}. You keep full access until then, after which your listing stays live on the free tier.`
          : 'Your cancellation has been recorded. Our team will confirm the exact end date.',
    });
  }

  // ── DOWNGRADE — scheduled for period end ───────────────────────────────────
  if (action === 'downgrade') {
    if (!targetTier || !(targetTier in PLAN_RANK)) {
      return NextResponse.json({ error: 'Invalid target plan' }, { status: 400 });
    }
    if (PLAN_RANK[targetTier] >= PLAN_RANK[currentTier]) {
      return NextResponse.json(
        { error: 'That is not a downgrade. Upgrades require cancelling the current plan first.' },
        { status: 400 },
      );
    }

    await supabase
      .from(table)
      .update({
        pending_tier: targetTier,
        pending_change_type: 'downgrade',
        subscription_status: 'cancelling',
        cancellation_requested_at: new Date().toISOString(),
      })
      .eq('id', entityId);

    await logEvent({
      entity_type: entityType,
      entity_id: entityId,
      event_type: 'downgrade',
      from_tier: currentTier,
      to_tier: targetTier,
      effective_at: periodEnd,
    });

    return NextResponse.json({
      ok: true,
      message: `Your plan will change to ${targetTier} at the end of your current paid period. You keep your current features until then.`,
      effectiveAt: periodEnd,
    });
  }

  // ── REACTIVATE — undo a pending cancellation before it takes effect ────────
  if (action === 'reactivate') {
    if (status !== 'cancelling') {
      return NextResponse.json({ error: 'Nothing to reactivate.' }, { status: 400 });
    }

    // Restore to 'trial' if the trial is still running, otherwise 'active'
    await supabase
      .from(table)
      .update({
        subscription_status: isTrialling ? 'trial' : 'active',
        pending_tier: null,
        pending_change_type: null,
        cancellation_requested_at: null,
      })
      .eq('id', entityId);

    await logEvent({
      entity_type: entityType,
      entity_id: entityId,
      event_type: 'reactivate',
      from_tier: currentTier,
      to_tier: currentTier,
    });

    return NextResponse.json({
      ok: true,
      message: isTrialling
        ? `Welcome back — your free trial continues, with ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} still to run.`
        : 'Your subscription has been reactivated.',
    });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
