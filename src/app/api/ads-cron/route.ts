import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── AD PAYMENT WINDOW CRON ──────────────────────────────────────────────────
// Run this on a schedule (e.g. every 15-30 min via cron-job.org or Vercel Cron).
//
// It does two things for ads in status 'approved_awaiting_payment':
//   1. REMINDER  — if within 2 hours of payment_due_at and no reminder sent yet,
//                  email the advertiser a "pay now or lose your slot" reminder.
//   2. EXPIRE    — if payment_due_at has passed, set status='expired' (slot freed).
//
// Protected by a secret token so randoms can't trigger it. Set CRON_SECRET in
// your environment and pass it as ?token=... or the x-cron-secret header.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const token  = req.nextUrl.searchParams.get('token');
  const header = req.headers.get('x-cron-secret');
  const secret = process.env.CRON_SECRET;
  if (secret && token !== secret && header !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const result = {
    reminders_sent: 0,
    expired: 0,
    promotions_expired: 0,
    job_boosts_expired: 0,
    errors: [] as string[],
  };

  // ── EXPIRE LISTINGS ──────────────────────────────────────────────────────
  // 120 days. This is the thing that keeps the index honest — without it the
  // site slowly fills with stock that sold months ago, which is precisely what
  // makes a competitor's 34,000 listings worth less than our few hundred.
  try {
    const { data: expiryResult, error: expiryErr } =
      await supabaseAdmin.rpc('expire_listings');

    if (expiryErr) result.errors.push(`listings: ${expiryErr.message}`);
    else {
      (result as any).listings_expired = expiryResult?.expired || 0;
      (result as any).listings_due_reminder = expiryResult?.due_reminder || 0;
    }
  } catch (e: any) {
    result.errors.push(`listings: ${e.message}`);
  }

  // ── "STILL AVAILABLE?" REMINDERS ─────────────────────────────────────────
  // Sent 14 days out. One click renews for another 120 days. A seller who has
  // sold elsewhere simply ignores it and the listing drops out on its own.
  try {
    const { data: expiring } = await supabaseAdmin
      .from('listings')
      .select('id, title, seller_id, dealer_id, expires_at')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lte('expires_at', new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString())
      .gte('expires_at', now.toISOString())
      .is('expiry_notified_at', null)
      .limit(100);

    for (const listing of expiring || []) {
      const ownerId = listing.seller_id || listing.dealer_id;
      if (!ownerId) continue;

      const { data: owner } = await supabaseAdmin
        .from('users').select('email, full_name').eq('id', ownerId).maybeSingle();
      if (!owner?.email) continue;

      await fetch(`${BASE_URL}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'listing_expiring',
          data: {
            email: owner.email,
            name: owner.full_name,
            title: listing.title,
            listingId: listing.id,
            expiresAt: new Date(listing.expires_at).toLocaleDateString('en-ZA'),
          },
        }),
      }).catch(() => { /* a reminder failing must not stop the sweep */ });

      // Marked whether or not the email lands, so a mail outage cannot produce
      // a hundred reminders tomorrow.
      await supabaseAdmin
        .from('listings')
        .update({ expiry_notified_at: now.toISOString() })
        .eq('id', listing.id);

      (result as any).expiry_reminders_sent = ((result as any).expiry_reminders_sent || 0) + 1;
    }
  } catch (e: any) {
    result.errors.push(`expiry reminders: ${e.message}`);
  }

  // ── EXPIRE PAID PROMOTIONS ───────────────────────────────────────────────
  // Nothing cleared is_featured when featured_until passed, so every promotion
  // ever bought was permanent. A dealer paying R29 once stayed at the top of
  // the results forever, and there was no reason to ever pay again.
  try {
    const { data: expiredPromos, error: promoErr } = await supabaseAdmin
      .from('listings')
      .update({ is_featured: false })
      .eq('is_featured', true)
      .not('featured_until', 'is', null)
      .lt('featured_until', now.toISOString())
      .select('id');

    if (promoErr) result.errors.push(`promotions: ${promoErr.message}`);
    else result.promotions_expired = expiredPromos?.length || 0;

    // Mark the promotion records too, so reporting shows what actually ran
    // rather than everything looking permanently active.
    await supabaseAdmin
      .from('promoted_listings')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now.toISOString());
  } catch (e: any) {
    result.errors.push(`promotions: ${e.message}`);
  }

  // ── EXPIRE URGENT HIRE BOOSTS ────────────────────────────────────────────
  try {
    const { data: expiredBoosts, error: boostErr } = await supabaseAdmin
      .from('job_listings')
      .update({ is_boosted: false })
      .eq('is_boosted', true)
      .not('boosted_until', 'is', null)
      .lt('boosted_until', now.toISOString())
      .select('id');

    if (boostErr) result.errors.push(`job boosts: ${boostErr.message}`);
    else result.job_boosts_expired = expiredBoosts?.length || 0;
  } catch (e: any) {
    result.errors.push(`job boosts: ${e.message}`);
  }

  // ── Fetch all ads awaiting payment ─────────────────────────────────────────
  const { data: ads, error } = await supabaseAdmin
    .from('ads')
    .select('*')
    .eq('status', 'approved_awaiting_payment');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const ad of ads || []) {
    const dueAt = ad.payment_due_at ? new Date(ad.payment_due_at) : null;
    if (!dueAt) continue;

    // ── 1. EXPIRE — window has passed ────────────────────────────────────────
    if (now >= dueAt) {
      const { error: expErr } = await supabaseAdmin
        .from('ads')
        .update({ status: 'expired' })
        .eq('id', ad.id);
      if (expErr) { result.errors.push(`expire ${ad.id}: ${expErr.message}`); continue; }
      result.expired++;

      // Best-effort "slot released" notice to the advertiser
      try {
        await fetch(`${BASE_URL}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ad_slot_released',
            data: { email: ad.client_email, name: ad.client_name, title: ad.title },
          }),
        });
      } catch { /* non-blocking */ }
      continue;
    }

    // ── 2. REMINDER — within 2 hours of due, not yet reminded ─────────────────
    const twoHoursBefore = new Date(dueAt.getTime() - 2 * 60 * 60 * 1000);
    if (now >= twoHoursBefore && !ad.payment_reminder_sent) {
      try {
        await fetch(`${BASE_URL}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ad_payment_reminder',
            data: {
              email:   ad.client_email,
              name:    ad.client_name,
              title:   ad.title,
              amount:  ad.amount_paid,
              dueAt:   ad.payment_due_at,
            },
          }),
        });
        await supabaseAdmin
          .from('ads')
          .update({ payment_reminder_sent: true })
          .eq('id', ad.id);
        result.reminders_sent++;
      } catch (e: any) {
        result.errors.push(`reminder ${ad.id}: ${e.message}`);
      }
    }
  }

  return NextResponse.json({ ok: true, ran_at: now.toISOString(), ...result });
}