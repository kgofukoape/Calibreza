import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminGuard';
import { ok, fail, audit } from '@/lib/adminApi';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── RUN A SCHEDULED JOB BY HAND ─────────────────────────────────────────────
// POST /api/admin/run-job   { job: 'ads-cron' | 'subscription-cron' }
//
// The cron routes authenticate with CRON_SECRET. That secret is a server value
// and must never reach the browser, so the admin page cannot call them
// directly. This route sits in between: it verifies the admin session cookie,
// then calls the job server-side with the secret the browser never sees.
//
// WHY BOTHER
// The monthly invoice run fires on the 1st. Waiting until then to learn whether
// it works means finding out on the day your customers should have been billed
// — and that job already failed once on a column that did not exist. A job you
// cannot run on demand is a job you cannot test.
//
// The whitelist matters: without it this becomes an endpoint that fetches any
// URL the caller names, from inside your infrastructure.

const JOBS: Record<string, string> = {
  'ads-cron': '/api/ads-cron',
  'subscription-cron': '/api/subscription-cron',
};

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const ip = getClientIp(req);
  const limit = rateLimit(`admin-runjob:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return fail('Too many job runs. Try again shortly.', 429);

  try {
    const { job } = await req.json();
    const path = JOBS[job];

    if (!path) {
      return fail(`Unknown job. Available: ${Object.keys(JOBS).join(', ')}`);
    }

    const secret = process.env.CRON_SECRET;
    if (!secret) return fail('CRON_SECRET is not configured on this deployment', 500);

    const base = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get('host')}`;

    const started = Date.now();
    const res = await fetch(`${base}${path}`, {
      method: 'GET',
      headers: { 'x-cron-secret': secret },
    });

    const result = await res.json().catch(() => ({ error: 'The job returned no readable result' }));
    const ms = Date.now() - started;

    await audit(supabase, {
      action: 'job.run_manual',
      entity: 'cron',
      entityName: job,
      reason: 'Triggered from the diagnostics page',
      after: { durationMs: ms, ok: res.ok, result },
    });

    if (!res.ok) {
      return fail(`The job returned ${res.status}: ${JSON.stringify(result)}`, 502);
    }

    return ok(`${job} finished in ${(ms / 1000).toFixed(1)}s`, { ...result, durationMs: ms });

  } catch (error: any) {
    console.error('[admin/run-job]', error);
    return fail(error.message, 500);
  }
}