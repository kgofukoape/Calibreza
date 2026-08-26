import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildInvoice, nextInvoiceNumber, dealerMonthlyLine, clubMonthlyLine } from '@/lib/invoices';

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
import { DEALER_PLANS } from '@/lib/plans';

// Read from the plan registry so the cron cannot enforce a different limit
// than the one advertised on the pricing pages.
const FREE_TIER_LISTING_LIMIT = DEALER_PLANS.free.listingLimit ?? 5;

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
    invoices_raised: 0,
    errors: [] as string[],
  };

  // ── MONTHLY SUBSCRIPTION INVOICES ────────────────────────────────────────
  // Raised on the 1st for every account on a paid tier.
  //
  // Three things this deliberately does NOT do:
  //
  //   It does not charge anyone. PayFast handles the recurring collection; this
  //   produces the document that records what was owed. Generating an invoice
  //   and taking money are separate acts and conflating them is how people end
  //   up billed twice.
  //
  //   It skips comped accounts. A tier that was granted is not a debt, and
  //   invoicing it would put revenue in your books that nobody owes you.
  //
  //   It will not raise a second invoice for the same account in the same
  //   month. The cron running twice — a retry, a manual trigger — must not
  //   double-bill.
  if (now.getDate() === 1) {
    try {
      const monthLabel = now.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const year = now.getFullYear();

      const { count: issuedThisYear } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(year, 0, 1).toISOString());

      let seq = issuedThisYear || 0;

      // Who already has an invoice this month?
      const { data: existing } = await supabase
        .from('invoices')
        .select('client_id')
        .gte('created_at', monthStart)
        .eq('auto_generated', true);

      const alreadyInvoiced = new Set((existing || []).map(i => i.client_id));

      const [{ data: dealersDue }, { data: clubsDue }] = await Promise.all([
        supabase.from('dealers')
          .select('id, business_name, email, subscription_tier, is_comped')
          .in('subscription_tier', ['pro', 'premium'])
          .eq('subscription_status', 'active'),
        supabase.from('clubs')
          .select('id, name, email, subscription_status, is_comped')
          .eq('subscription_status', 'active'),
      ]);

      for (const d of dealersDue || []) {
        if (d.is_comped || alreadyInvoiced.has(d.id) || !d.email) continue;

        const line = dealerMonthlyLine(d.subscription_tier, monthLabel);
        if (!line) continue;

        const inv = buildInvoice({
          invoiceNumber: nextInvoiceNumber(year, seq++),
          clientType: 'dealer',
          clientId: d.id,
          clientName: d.business_name,
          clientEmail: d.email,
          description: `Dealer subscription — ${monthLabel}`,
          lines: [line],
          autoGenerated: true,
        });

        const { error } = await supabase.from('invoices').insert(inv);
        if (error) { result.errors.push(`invoice ${d.business_name}: ${error.message}`); continue; }

        result.invoices_raised++;

        await fetch(`${BASE_URL}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'invoice_issued',
            data: {
              email: d.email, name: d.business_name,
              invoiceNumber: inv.invoice_number, total: inv.total,
              description: inv.description, dueDate: inv.due_date,
            },
          }),
        }).catch(() => { /* the invoice exists; a failed email must not undo it */ });
      }

      for (const c of clubsDue || []) {
        if (c.is_comped || alreadyInvoiced.has(c.id) || !c.email) continue;

        const inv = buildInvoice({
          invoiceNumber: nextInvoiceNumber(year, seq++),
          clientType: 'club',
          clientId: c.id,
          clientName: c.name,
          clientEmail: c.email,
          description: `Club subscription — ${monthLabel}`,
          lines: [clubMonthlyLine(monthLabel)],
          autoGenerated: true,
        });

        const { error } = await supabase.from('invoices').insert(inv);
        if (error) { result.errors.push(`invoice ${c.name}: ${error.message}`); continue; }

        result.invoices_raised++;

        await fetch(`${BASE_URL}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'invoice_issued',
            data: {
              email: c.email, name: c.name,
              invoiceNumber: inv.invoice_number, total: inv.total,
              description: inv.description, dueDate: inv.due_date,
            },
          }),
        }).catch(() => {});
      }
    } catch (e: any) {
      result.errors.push(`monthly invoices: ${e.message}`);
    }
  }

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