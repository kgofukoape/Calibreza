import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── SUBSCRIPTION LIFECYCLE CRON ─────────────────────────────────────────────
// Run once a day (cron-job.org). Handles everything that happens on a schedule
// rather than on a click:
//
//   1. TRIAL ENDING SOON  — warn dealers 7 days and 1 day before their free
//                           Pro trial ends, so nobody is surprised.
//   2. TRIAL ENDED        — drop to the free tier, keep the 5 NEWEST listings
//                           live and ARCHIVE the rest.
//   3. ARCHIVE REMINDER   — 7 days after dropping to free, remind them their
//                           archived listings are waiting and can be restored.
//   4. PERIOD ENDED       — apply scheduled cancellations and downgrades once
//                           the paid period they bought has actually run out.
//
// ARCHIVING IS NOT DELETION. Listings are hidden, never destroyed. A dealer
// who subscribes gets them all back. Deleting a paying customer's content
// because a card expired is how you generate complaints and lose trust, so it
// does not happen here.
//
// Protected by CRON_SECRET, same as /api/ads-cron.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

const FREE_TIER_LISTING_LIMIT = 5;

async function notify(type: string, data: Record<string, any>) {
  try {
    await fetch(`${BASE_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    });
  } catch (e) {
    console.error(`notify ${type} failed:`, e);
  }
}

async function logEvent(entityId: string, eventType: string, from: string, to: string, notes: string) {
  try {
    await supabase.from('subscription_events').insert({
      entity_type: 'dealer',
      entity_id: entityId,
      event_type: eventType,
      from_tier: from,
      to_tier: to,
      actor: 'system',
      notes,
    });
  } catch (e) {
    console.error('subscription_events insert failed:', e);
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const token = req.nextUrl.searchParams.get('token');
  const header = req.headers.get('x-cron-secret');
  if (secret && token !== secret && header !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const result = {
    trial_warnings_sent: 0,
    trials_ended: 0,
    listings_archived: 0,
    archive_reminders_sent: 0,
    cancellations_applied: 0,
    errors: [] as string[],
  };

  // ── 1 & 2. TRIALS ──────────────────────────────────────────────────────────
  try {
    const { data: trialling } = await supabase
      .from('dealers')
      .select('id, business_name, email, subscription_tier, subscription_status, trial_end_date')
      .eq('subscription_status', 'trial')
      .not('trial_end_date', 'is', null);

    for (const d of trialling || []) {
      const endsAt = new Date(d.trial_end_date).getTime();
      const daysLeft = Math.ceil((endsAt - now.getTime()) / 86400000);

      // ── Trial still running: warn at 7 days and 1 day ──
      if (daysLeft > 0) {
        if (daysLeft === 7 || daysLeft === 1) {
          const { count } = await supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('dealer_id', d.id)
            .eq('status', 'active');

          const total = count || 0;
          const willArchive = Math.max(0, total - FREE_TIER_LISTING_LIMIT);

          await notify('dealer_trial_ending', {
            email: d.email,
            name: d.business_name,
            daysLeft,
            totalListings: total,
            willArchive,
          });
          result.trial_warnings_sent++;
        }
        continue;
      }

      // ── Trial has ended: drop to free and archive the excess ──
      const { data: listings } = await supabase
        .from('listings')
        .select('id, created_at, status')
        .eq('dealer_id', d.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const all = listings || [];
      const toArchive = all.slice(FREE_TIER_LISTING_LIMIT); // everything past the 5 newest

      if (toArchive.length > 0) {
        const { error: archErr } = await supabase
          .from('listings')
          .update({
            status: 'archived',
            previous_status: 'active',
            archived_at: now.toISOString(),
            archived_reason: 'free_tier_limit',
          })
          .in('id', toArchive.map(l => l.id));

        if (archErr) result.errors.push(`archive ${d.id}: ${archErr.message}`);
        else result.listings_archived += toArchive.length;
      }

      const { error: dErr } = await supabase
        .from('dealers')
        .update({
          subscription_tier: 'free',
          subscription_status: 'free',
          trial_used: true,
          free_since: now.toISOString(),
          archive_warning_sent: false,
          pending_tier: null,
          pending_change_type: null,
        })
        .eq('id', d.id);

      if (dErr) {
        result.errors.push(`trial end ${d.id}: ${dErr.message}`);
        continue;
      }

      await logEvent(d.id, 'trial_ended', 'pro', 'free',
        `Trial ended. ${toArchive.length} listing(s) archived, ${Math.min(all.length, FREE_TIER_LISTING_LIMIT)} kept live.`);

      await notify('dealer_trial_ended', {
        email: d.email,
        name: d.business_name,
        kept: Math.min(all.length, FREE_TIER_LISTING_LIMIT),
        archived: toArchive.length,
      });

      result.trials_ended++;
    }
  } catch (e: any) {
    result.errors.push(`trials: ${e.message}`);
  }

  // ── 3. ARCHIVE REMINDER — 7 days on the free tier ──────────────────────────
  try {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

    const { data: freeDealers } = await supabase
      .from('dealers')
      .select('id, business_name, email, free_since')
      .eq('subscription_tier', 'free')
      .lte('free_since', sevenDaysAgo)
      .or('archive_warning_sent.is.null,archive_warning_sent.eq.false');

    for (const d of freeDealers || []) {
      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_id', d.id)
        .eq('status', 'archived');

      if (!count) continue; // nothing archived, nothing to remind about

      await notify('dealer_archive_reminder', {
        email: d.email,
        name: d.business_name,
        archived: count,
      });

      await supabase
        .from('dealers')
        .update({ archive_warning_sent: true })
        .eq('id', d.id);

      result.archive_reminders_sent++;
    }
  } catch (e: any) {
    result.errors.push(`archive reminder: ${e.message}`);
  }

  // ── 4. APPLY SCHEDULED CANCELLATIONS / DOWNGRADES ──────────────────────────
  // A dealer or club who cancelled keeps access until their paid period ends.
  // This is where that actually takes effect.
  for (const table of ['dealers', 'clubs'] as const) {
    try {
      const freeTier = table === 'clubs' ? 'listed' : 'free';

      const { data: due } = await supabase
        .from(table)
        .select('id, subscription_tier, pending_tier, current_period_end, trial_end_date')
        .eq('subscription_status', 'cancelling')
        .not('pending_tier', 'is', null);

      for (const row of due || []) {
        const endRaw = row.current_period_end || row.trial_end_date;
        if (!endRaw) continue;
        if (new Date(endRaw).getTime() > now.getTime()) continue; // not yet

        const target = row.pending_tier || freeTier;

        await supabase
          .from(table)
          .update({
            subscription_tier: target,
            subscription_status: target === freeTier ? 'free' : 'active',
            pending_tier: null,
            pending_change_type: null,
            cancellation_requested_at: null,
            ...(table === 'dealers' ? { free_since: now.toISOString(), archive_warning_sent: false } : {}),
          })
          .eq('id', row.id);

        try {
          await supabase.from('subscription_events').insert({
            entity_type: table === 'clubs' ? 'club' : 'dealer',
            entity_id: row.id,
            event_type: 'cancel_applied',
            from_tier: row.subscription_tier,
            to_tier: target,
            actor: 'system',
            notes: 'Scheduled change applied at period end',
          });
        } catch { /* non-blocking */ }

        result.cancellations_applied++;
      }
    } catch (e: any) {
      result.errors.push(`${table} cancellations: ${e.message}`);
    }
  }

  return NextResponse.json({ ok: true, ran_at: now.toISOString(), ...result });
}