import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rateLimit';

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

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, premium: 2 };
const PAID_PLANS = ['pro', 'premium'];

type Action = 'cancel' | 'downgrade' | 'reactivate' | 'check';

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

  if (!entityId || !['cancel', 'downgrade', 'reactivate', 'check'].includes(action)) {
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

  const currentTier: string = entity.subscription_tier || 'free';
  const status: string = entity.subscription_status || 'free';
  const periodEnd: string | null = entity.current_period_end || null;

  // ── CHECK — used by the UI before offering a plan change ───────────────────
  if (action === 'check') {
    const hasActivePaid = PAID_PLANS.includes(currentTier) && ['active', 'cancelling', 'past_due'].includes(status);
    return NextResponse.json({
      ok: true,
      currentTier,
      status,
      periodEnd,
      pendingTier: entity.pending_tier || null,
      hasActivePaid,
      // The UI uses this to block a second checkout instead of double-billing
      canStartNewSubscription: !hasActivePaid,
      message: hasActivePaid
        ? 'An active subscription already exists. Cancel it before starting a new plan, or contact support to change plans without a billing gap.'
        : 'No active paid subscription.',
    });
  }

  // ── CANCEL — ends at period end, keeps paid access until then ──────────────
  if (action === 'cancel') {
    if (!PAID_PLANS.includes(currentTier)) {
      return NextResponse.json({ error: 'No paid subscription to cancel.' }, { status: 400 });
    }

    const pf = await cancelPayFastSubscription(entity.payfast_token || null);

    await supabase
      .from(table)
      .update({
        subscription_status: 'cancelling',
        cancellation_requested_at: new Date().toISOString(),
        pending_tier: 'free',
        pending_change_type: 'cancel',
      })
      .eq('id', entityId);

    await logEvent({
      entity_type: entityType,
      entity_id: entityId,
      event_type: 'cancel',
      from_tier: currentTier,
      to_tier: 'free',
      effective_at: periodEnd,
      notes: pf.message,
    });

    return NextResponse.json({
      ok: true,
      status: 'cancelling',
      effectiveAt: periodEnd,
      // Surfaced honestly so nobody assumes billing definitely stopped
      billingNote: pf.ok ? 'Recurring billing cancelled.' : pf.message,
      message: periodEnd
        ? 'Your subscription will end at the close of your current paid period. You keep full access until then.'
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

    await supabase
      .from(table)
      .update({
        subscription_status: 'active',
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

    return NextResponse.json({ ok: true, message: 'Your subscription has been reactivated.' });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
