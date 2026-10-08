import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';
import { audit } from '@/lib/adminApi';

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
    statuses: ['pending', 'approved', 'rejected', 'info_requested'],
    // is_verified was missing, so the verification page could not award a
    // dealer their badge through this route even though it could for a club.
    fields: ['is_verified'],
  },
  club: {
    table: 'clubs',
    activeStatus: 'active',
    statuses: ['pending', 'active', 'rejected', 'info_requested'],
    fields: ['is_verified'],
  },
  service: {
    table: 'services',
    activeStatus: 'active',
    statuses: ['pending', 'active', 'rejected', 'info_requested'],
    // saps_accredited is CLAIMED on the application form and GRANTED here. The
    // database guard forces it to false on insert, because it shows on the
    // public listing and a self-awarded value is a false credential.
    fields: ['is_verified', 'saps_accredited', 'is_featured'],
  },
  user: {
    table: 'users',
    activeStatus: 'active',
    statuses: ['active'],
    fields: [],
  },

  // ── ADDED: entities whose admin pages still wrote directly ───────────────
  // /admin/listings, /admin/jobs and /admin/verification were calling
  // supabase.from(...).update()/.delete() straight from the browser with the
  // anon key. Registering them here moves those writes onto the same
  // service-role path that dealers, clubs and services already use, so they get
  // the same status whitelist, the same audit trail and the same guard.

  listing: {
    table: 'listings',
    activeStatus: 'active',
    statuses: ['active', 'sold', 'under_offer', 'inactive', 'expired', 'archived'],
    // featured_until belongs here alongside is_featured. A feature flag with no
    // end date is a promotion that never expires, which is how three listings
    // ended up permanently pinned to the top of search.
    fields: ['is_featured', 'featured_until'],
  },
  job: {
    table: 'job_listings',
    activeStatus: 'active',
    // 'jobs' does not exist — the table is job_listings. The admin page spent
    // its life querying a table that was never there.
    statuses: ['active', 'pending_payment', 'rejected', 'expired', 'filled'],
    fields: ['is_boosted'],
  },
  advocacy: {
    table: 'advocacy_groups',
    activeStatus: 'active',
    statuses: ['pending', 'active', 'suspended'],
    fields: [],
  },
  verification_doc: {
    table: 'verification_documents',
    activeStatus: 'approved',
    statuses: ['pending', 'approved', 'rejected'],
    fields: [],
  },
  training: {
    table: 'training_events',
    activeStatus: 'active',
    statuses: ['active', 'cancelled'],
    fields: [],
  },
};

// --- DECISION EMAILS -------------------------------------------------------
// Approve, reject and request-information decisions are emailed to the
// applicant. Request-information can clear named documents so the applicant
// can upload new copies from their pending page; the old files stay in
// storage as a record.

const CLEARABLE_DOCS: Record<string, string[]> = {
  dealer: ['saps_certificate_url', 'business_registration_url', 'id_document_url'],
  club: ['saps_registration_url', 'compliance_cert_url', 'business_registration_url'],
  service: ['psira_certificate_url'],
};

const DOC_LABELS: Record<string, string> = {
  saps_certificate_url: 'SAPS dealer certificate',
  business_registration_url: 'Business registration',
  id_document_url: 'ID document',
  saps_registration_url: 'SAPS registration',
  compliance_cert_url: 'Compliance certificate',
  psira_certificate_url: 'PSIRA certificate',
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

const escHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

async function sendDecisionEmail(o: {
  entityType: string; entity: any; target: string;
  activeStatus: string; note: string; cleared: string[];
}): Promise<true | string> {
  const to: string = o.entity.email || '';
  if (!to) return 'no email address on the application';
  if (!process.env.RESEND_API_KEY) return 'email is not configured';

  const name = o.entity.business_name || o.entity.name || 'your business';
  const kind = o.entityType === 'dealer' ? 'dealer'
    : o.entityType === 'club' ? 'club or range' : 'service provider';
  const p = (t: string) => `<p style="margin:0 0 14px;line-height:1.6;">${t}</p>`;
  const button = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;background:#C9922A;color:#000;` +
    `font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:2px;` +
    `padding:14px 28px;border-radius:4px;text-decoration:none;">${label}</a>`;
  const quote = (t: string) =>
    `<div style="border-left:3px solid #C9922A;padding:8px 14px;margin:0 0 14px;` +
    `color:#F0EDE8;white-space:pre-wrap;">${escHtml(t)}</div>`;

  let subject = '';
  let body = '';
  if (o.target === o.activeStatus) {
    subject = `${name} is approved on Gun X`;
    body = p(`Good news: your ${kind} account for <strong>${escHtml(name)}</strong> ` +
      'has been approved.');
    if (o.entityType === 'dealer') {
      body += p('<strong style="color:#C9922A;">Next step: start your free Premium ' +
        'trial. You pay R0 today.</strong>');
      body += p('Sign in and add your card through PayFast. You get every Premium ' +
        'feature free for 2 months (our first 50 dealers) or 1 month. We email you ' +
        '5 days before your first charge, and you can cancel, or switch to Pro or ' +
        'Free, at any time before then.');
    } else {
      if (o.entityType === 'club' && !o.entity.trial_used && !o.entity.payfast_token) {
        body += p('<strong style="color:#C9922A;">Your Active plan is free for 60 days. ' +
          'No card needed.</strong>');
        body += p('Online booking, live status, the results board and every other ' +
          'Active feature are switched on now. After 60 days you can carry on at ' +
          'R499 per month, or stay listed on Gun X for free.');
      } else {
        body += p('Your profile is live on Gun X and your dashboard is open.');
      }
    }
    body += button(`${SITE}/business/login`, 'Sign in');
  } else if (o.target === 'rejected') {
    subject = `Your Gun X application for ${name}`;
    body = p(`We could not approve the ${kind} application for ` +
      `<strong>${escHtml(name)}</strong>. The reason:`);
    body += quote(o.note);
    body += p('If you can resolve this, or think it is a mistake, reply to this ' +
      'email or write to support@gunx.co.za.');
  } else {
    subject = `We need a little more for ${name}`;
    body = p(`Thank you for applying. Before we can approve ` +
      `<strong>${escHtml(name)}</strong> we need the following:`);
    body += quote(o.note);
    if (o.cleared.length) {
      body += p('Please upload new copies of: <strong>' +
        o.cleared.map((c) => DOC_LABELS[c] || c).join(', ') + '</strong>.');
    }
    body += p('Sign in and you will see exactly what to do on your application page.');
    body += button(`${SITE}/business/login`, 'Sign in');
  }

  const html =
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;` +
    `background:#0D0F13;color:#C9CCD3;padding:32px;border-radius:8px;">` +
    `<h1 style="color:#C9922A;font-size:22px;margin:0 0 20px;">Gun X</h1>` +
    body + `</div>`;

  const cc = o.entity.responsible_person_email &&
    String(o.entity.responsible_person_email).toLowerCase() !== to.toLowerCase()
    ? [o.entity.responsible_person_email] : undefined;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gun X <notifications@gunx.co.za>',
        to: [to], cc, reply_to: 'support@gunx.co.za',
        subject, html,
      }),
    });
    if (!res.ok) return `Resend refused it: ${(await res.text()).slice(0, 160)}`;
    return true;
  } catch (e: any) {
    return e?.message || 'unknown error';
  }
}

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

    // Approval does not start a trial. The trial begins only when the dealer
    // puts a card on file through PayFast (R0 today), which records it in
    // the trial ledger and the founding count. Granting one here gave a
    // second free trial and skipped both.

    // Decisions on an application (dealers, clubs, service providers)
    const isApplication = ['dealer', 'club', 'service'].includes(entityType);
    const note = reason.trim();
    let cleared: string[] = [];
    if (isApplication) {
      if (target === 'rejected' || target === 'info_requested') {
        if (note.length < 5) {
          return NextResponse.json({
            error: target === 'rejected'
              ? 'Give the applicant a reason (at least 5 characters).'
              : 'Tell the applicant what you need (at least 5 characters).',
          }, { status: 400 });
        }
        update.review_note = note;
      } else if (target === config.activeStatus) {
        update.review_note = null;
        // Clubs and ranges: 60 days of the Active plan free, no card needed
        // (agreed Oct 2026). Once only: never for a club that has had a
        // trial or already pays. The nightly job ends it after 60 days.
        if (entityType === 'club' && entity.status !== target
            && !entity.trial_used && !entity.payfast_token) {
          const start = new Date();
          const end = new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000);
          Object.assign(update, {
            subscription_tier: 'active',
            subscription_status: 'trial',
            trial_start_date: start.toISOString(),
            trial_end_date: end.toISOString(),
            current_period_end: end.toISOString(),
            trial_used: true,
          });
        }
      }
      if (target === 'info_requested' && Array.isArray(body?.clearDocs)) {
        const allowed = CLEARABLE_DOCS[entityType] || [];
        cleared = (body.clearDocs as unknown[])
          .filter((c): c is string => typeof c === 'string' && allowed.includes(c));
        cleared.forEach((c) => { update[c] = null; });
      }
    }

    const { error } = await supabase.from(config.table).update(update).eq('id', entityId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Tell the applicant: once per real change of decision, or whenever a
    // new information request is sent.
    let emailNote = '';
    const decided = ['rejected', 'info_requested', config.activeStatus].includes(target);
    const changed = entity.status !== target
      || (target === 'info_requested' && entity.review_note !== note);
    if (isApplication && decided && changed) {
      const sent = await sendDecisionEmail({
        entityType, entity, target,
        activeStatus: config.activeStatus, note, cleared,
      });
      emailNote = sent === true
        ? ' Email sent to the applicant.'
        : ` Email NOT sent: ${sent}`;
    }

    // WHO CHANGED THIS, AND WHEN.
    // This route has been the one that approves dealers, clubs, services and
    // advocacy organisations since it was written, and it recorded none of it.
    // The comments at the top of this file claimed an audit trail that did not
    // exist. "Who published this organisation" is exactly the question you
    // cannot answer afterwards without a record.
    await audit(supabase, {
      action: `${entityType}.set_status`,
      entity: entityType,
      entityId,
      entityName: entity.business_name || entity.name || entity.title || null,
      reason: body?.reason || `Status set to ${target}`,
      before: { status: entity.status },
      after: update,
    });

    return NextResponse.json({
      ok: true,
      status: target,
      update,
      message: `Status set to ${target}.${emailNote}`,
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

        await audit(supabase, {
      action: `${entityType}.set_field`,
      entity: entityType, entityId,
      entityName: entity.business_name || entity.name || null,
      reason: body?.reason || `${field} set to ${value}`,
      before: { [field]: entity[field] }, after: { [field]: value },
    });

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

        await audit(supabase, {
      action: `${entityType}.set_tier`,
      entity: entityType, entityId,
      entityName: entity.business_name || entity.name || null,
      reason: body?.reason || `Tier set to ${tier}`,
      before: { subscription_tier: entity.subscription_tier },
      after: { subscription_tier: tier },
    });

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

        // Deletion above all: after this the row is gone, so the log is the only
    // remaining evidence that it existed and who removed it.
    await audit(supabase, {
      action: `${entityType}.delete`,
      entity: entityType, entityId,
      entityName: entity.business_name || entity.name || entity.title || null,
      reason: body?.reason || 'Deleted by administrator',
      before: { status: entity.status },
    });

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

    await audit(supabase, {
    action: `${entityType}.suspend`,
    entity: entityType, entityId,
    entityName: entity.business_name || entity.name || null,
    reason,
    before: { status: entity.status },
    after: { status: 'suspended' },
  });

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

  await audit(supabase, {
    action: `${entityType}.reinstate`,
    entity: entityType, entityId,
    entityName: entity.business_name || entity.name || null,
    reason: body?.reason || 'Reinstated by administrator',
    before: { status: entity.status },
    after: { status: restoreTo, restoredListings: restored },
  });

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