import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';

// ─── ACCOUNT SUSPENSION ──────────────────────────────────────────────────────
// One endpoint for suspending and reinstating every account type, so the rules
// and the side effects stay consistent instead of being reimplemented in four
// admin pages.
//
// WHY THIS IS A SERVER ROUTE, NOT A CLIENT UPDATE
// Suspension is a moderation action with real consequences. It runs with the
// service role key behind an admin session check, so it cannot be triggered by
// anyone poking the database from a browser.
//
// SUSPENSION HIDES, IT NEVER DELETES
// A suspended dealer's listings are set inactive and restored on reinstatement.
// The previous status is remembered so reinstating puts things back exactly as
// they were.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Actions this route supports beyond suspension. These exist because the admin
// console reads and writes as the ANON user, and the dealers table RLS only
// allows a dealer to update their OWN row (auth.uid() = user_id) and only
// allows reading rows where status = 'approved'. That means, from the browser,
// the admin console silently cannot change any dealer and cannot even SEE
// pending applications. Routing through the service role key here fixes both
// without loosening RLS for everyone else.
const ALLOWED_TIERS = ['free', 'pay_per_ad', 'pro', 'premium'];

// Each account type has its own status vocabulary and its own set of fields an
// admin may toggle. Whitelisting both means this route can serve every admin
// page without ever becoming a general-purpose "update any column" endpoint.
const TABLES: Record<string, {
  table: string;
  activeStatus: string;
  statuses: string[];
  fields: string[];
}> = {
  dealer: {
    table: 'dealers',
    activeStatus: 'approved',
    statuses: ['pending', 'approved', 'rejected'],
    fields: [],
  },
  club: {
    table: 'clubs',
    activeStatus: 'active',
    statuses: ['pending', 'active', 'rejected'],
    fields: ['is_verified'],
  },
  service: {
    table: 'services',
    activeStatus: 'active',
    statuses: ['pending', 'active', 'rejected'],
    fields: ['is_verified'],
  },
  user: {
    table: 'users',
    activeStatus: 'active',
    statuses: ['active'],
    fields: [],
  },
};

export async function POST(req: NextRequest) {
  // ── Admin only ─────────────────────────────────────────────────────────────
  const secret = process.env.ADMIN_SESSION_SECRET;
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdmin = await verifyAdminSession(session, secret ?? '');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const entityType: string = body?.entityType;
  const entityId: string = String(body?.entityId || '');
  const action: string = body?.action; // 'suspend' | 'reinstate'
  const reason: string = String(body?.reason || '').slice(0, 500);

  const config = TABLES[entityType];
  if (!config || !entityId || !['suspend', 'reinstate', 'set_status', 'set_tier', 'set_field', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // A reason is required to suspend. It goes in the audit trail and is what
  // you would rely on if the person disputes the decision.
  if (action === 'suspend' && reason.trim().length < 3) {
    return NextResponse.json({ error: 'A reason is required to suspend an account.' }, { status: 400 });
  }

  const { data: entity, error: fetchErr } = await supabase
    .from(config.table)
    .select('*')
    .eq('id', entityId)
    .single();

  if (fetchErr || !entity) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const currentStatus = entity.status || config.activeStatus;
  const now = new Date().toISOString();

  // ── SET STATUS (pending / approved / rejected) ─────────────────────────────
  if (action === 'set_status') {
    const target = String(body?.status || '');
    if (!config.statuses.includes(target)) {
      return NextResponse.json({ error: `Invalid status for ${entityType}` }, { status: 400 });
    }

    const update: Record<string, any> = { status: target };

    // Grant the 2-month free Pro trial on first approval, once only
    if (
      entityType === 'dealer' &&
      target === 'approved' &&
      !entity.trial_used &&
      !['pro', 'premium'].includes(entity.subscription_tier || '')
    ) {
      const end = new Date();
      end.setDate(end.getDate() + 60);
      update.subscription_tier = 'pro';
      update.subscription_status = 'trial';
      update.trial_start_date = now;
      update.trial_end_date = end.toISOString();
      update.current_period_end = end.toISOString();
    }

    const { error } = await supabase.from(config.table).update(update).eq('id', entityId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (update.trial_start_date) {
      try {
        await supabase.from('subscription_events').insert({
          entity_type: entityType,
          entity_id: entityId,
          event_type: 'trial_started',
          from_tier: entity.subscription_tier || 'free',
          to_tier: 'pro',
          actor: 'admin',
          notes: '2-month free Pro trial granted on approval',
        });
      } catch { /* non-blocking */ }
    }

    return NextResponse.json({
      ok: true,
      status: target,
      update,
      message: update.trial_start_date
        ? 'Approved, and the 2-month free Pro trial has started.'
        : `Status set to ${target}.`,
    });
  }

  // ── SET A WHITELISTED FIELD (e.g. is_verified) ─────────────────────────────
  if (action === 'set_field') {
    const field = String(body?.field || '');
    if (!config.fields.includes(field)) {
      return NextResponse.json({ error: 'That field cannot be changed here.' }, { status: 400 });
    }

    const value = body?.value;
    if (typeof value !== 'boolean') {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }

    const { error } = await supabase
      .from(config.table)
      .update({ [field]: value })
      .eq('id', entityId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, field, value, message: 'Updated.' });
  }

  // ── SET SUBSCRIPTION TIER ──────────────────────────────────────────────────
  if (action === 'set_tier') {
    const tier = String(body?.tier || '');
    if (!ALLOWED_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const { error } = await supabase
      .from(config.table)
      .update({
        subscription_tier: tier,
        subscription_status: ['pro', 'premium'].includes(tier) ? 'active' : 'free',
      })
      .eq('id', entityId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      await supabase.from('subscription_events').insert({
        entity_type: entityType,
        entity_id: entityId,
        event_type: 'admin_override',
        from_tier: entity.subscription_tier || 'free',
        to_tier: tier,
        actor: 'admin',
        notes: 'Tier changed from the admin console',
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      ok: true,
      tier,
      message: `Tier set to ${tier}. This changes platform access only — any recurring PayFast charge must be handled separately.`,
    });
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (action === 'delete') {
    const { error } = await supabase.from(config.table).delete().eq('id', entityId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    try {
      await supabase.from('moderation_events').insert({
        entity_type: entityType,
        entity_id: entityId,
        action: 'delete',
        reason: reason || null,
        from_status: currentStatus,
        to_status: 'deleted',
        actor: 'admin',
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({ ok: true, message: 'Account deleted.' });
  }

  // ── SUSPEND ────────────────────────────────────────────────────────────────
  if (action === 'suspend') {
    if (currentStatus === 'suspended') {
      return NextResponse.json({ error: 'Account is already suspended.' }, { status: 400 });
    }

    const { error } = await supabase
      .from(config.table)
      .update({
        status: 'suspended',
        previous_status: currentStatus,
        suspended_at: now,
        suspended_reason: reason,
      })
      .eq('id', entityId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── Side effects: hide their public content ──────────────────────────────
    let hidden = 0;

    if (entityType === 'dealer') {
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('dealer_id', entityId)
        .eq('status', 'active');

      if (listings?.length) {
        await supabase
          .from('listings')
          .update({
            status: 'inactive',
            previous_status: 'active',
            archived_reason: 'account_suspended',
          })
          .in('id', listings.map(l => l.id));
        hidden = listings.length;
      }
    }

    if (entityType === 'user') {
      const { data: listings } = await supabase
        .from('listings')
        .select('id')
        .eq('seller_id', entityId)
        .eq('status', 'active');

      if (listings?.length) {
        await supabase
          .from('listings')
          .update({
            status: 'inactive',
            previous_status: 'active',
            archived_reason: 'account_suspended',
          })
          .in('id', listings.map(l => l.id));
        hidden = listings.length;
      }
    }

    try {
      await supabase.from('moderation_events').insert({
        entity_type: entityType,
        entity_id: entityId,
        action: 'suspend',
        reason,
        from_status: currentStatus,
        to_status: 'suspended',
        actor: 'admin',
      });
    } catch { /* non-blocking */ }

    return NextResponse.json({
      ok: true,
      status: 'suspended',
      // Returned so the console can show the reason immediately without a reload
      suspended_reason: reason,
      suspended_at: now,
      previous_status: currentStatus,
      hiddenListings: hidden,
      message: hidden > 0
        ? `Account suspended. ${hidden} listing${hidden === 1 ? '' : 's'} hidden from the public — nothing was deleted, and they return on reinstatement.`
        : 'Account suspended.',
    });
  }

  // ── REINSTATE ──────────────────────────────────────────────────────────────
  if (currentStatus !== 'suspended') {
    return NextResponse.json({ error: 'Account is not suspended.' }, { status: 400 });
  }

  const restoreTo = entity.previous_status || config.activeStatus;

  const { error } = await supabase
    .from(config.table)
    .update({
      status: restoreTo,
      previous_status: null,
      suspended_at: null,
      suspended_reason: null,
    })
    .eq('id', entityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Restore only what suspension itself hid — never touch listings the owner
  // deactivated themselves.
  let restored = 0;
  const ownerColumn = entityType === 'dealer' ? 'dealer_id' : entityType === 'user' ? 'seller_id' : null;

  if (ownerColumn) {
    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .eq(ownerColumn, entityId)
      .eq('archived_reason', 'account_suspended');

    if (listings?.length) {
      await supabase
        .from('listings')
        .update({ status: 'active', previous_status: null, archived_reason: null })
        .in('id', listings.map(l => l.id));
      restored = listings.length;
    }
  }

  try {
    await supabase.from('moderation_events').insert({
      entity_type: entityType,
      entity_id: entityId,
      action: 'reinstate',
      reason: reason || null,
      from_status: 'suspended',
      to_status: restoreTo,
      actor: 'admin',
    });
  } catch { /* non-blocking */ }

  return NextResponse.json({
    ok: true,
    status: restoreTo,
    suspended_reason: null,
    suspended_at: null,
    restoredListings: restored,
    message: restored > 0
      ? `Account reinstated. ${restored} listing${restored === 1 ? '' : 's'} restored.`
      : 'Account reinstated.',
  });
}
