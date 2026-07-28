import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE KEEPALIVE PING ─────────────────────────────────────────────────
// Supabase's free tier pauses a project after ~7 days with no database activity.
// This route runs one tiny read against a small, always-present reference table
// (provinces — 9 rows) so the project registers activity and never pauses.
//
// Schedule it on cron-job.org to run once a day (or every few hours). It is
// lightweight and safe to hit often. No secret is strictly required — it only
// performs a harmless count — but it accepts the same CRON_SECRET as the other
// cron route if you want to lock it down.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  // Optional auth — only enforced if a CRON_SECRET is set AND a token is passed.
  // Leaving it open is fine for a harmless keepalive; lock it down if you prefer.
  const secret = process.env.CRON_SECRET;
  const token  = req.nextUrl.searchParams.get('token');
  const header = req.headers.get('x-cron-secret');
  if (secret && (token || header) && token !== secret && header !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    // Minimal read: count rows on a tiny reference table. Registers DB activity
    // without loading anything. `head: true` fetches no rows, just the count.
    const { count, error } = await supabaseAdmin
      .from('provinces')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, pinged_at: new Date().toISOString() },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      pinged_at: new Date().toISOString(),
      provinces_count: count ?? 0,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message, pinged_at: new Date().toISOString() },
      { status: 500 },
    );
  }
}
