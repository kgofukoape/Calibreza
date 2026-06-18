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
  const result = { reminders_sent: 0, expired: 0, errors: [] as string[] };

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