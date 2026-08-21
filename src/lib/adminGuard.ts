import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';

// ─── ADMIN GUARD ─────────────────────────────────────────────────────────────
// One check, used by every admin API route.
//
// WHY IT MATTERS THAT THIS IS SHARED
// The admin pages currently write to the database straight from the browser
// using the public anon key. Two things follow. Half those writes silently fail
// — the dealers UPDATE policy is `auth.uid() = user_id`, and an administrator
// is not the dealer, so "approve" appears to work and changes nothing. And
// wherever a permissive policy does exist, the same operation is available to
// anybody holding the anon key, which ships in every page.
//
// Every privileged action therefore belongs behind a route that holds the
// service key and checks this guard first. One implementation, so a new route
// cannot accidentally ship with a weaker check than the others.
//
// The token is an HMAC of its own expiry, signed with ADMIN_SESSION_SECRET. The
// browser cannot forge it and cannot read it — the cookie is httpOnly.

export interface AdminGuardResult {
  ok: boolean;
  response?: NextResponse;
}

export async function requireAdmin(req: NextRequest): Promise<AdminGuardResult> {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    console.error('[adminGuard] ADMIN_SESSION_SECRET is not set — refusing all admin actions');
    return {
      ok: false,
      response: NextResponse.json({ error: 'Server not configured' }, { status: 500 }),
    };
  }

  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = await verifyAdminSession(cookie, secret);

  if (!valid) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true };
}

/**
 * Records what an administrator did, so privileged actions are attributable
 * after the fact.
 *
 * A console that can grant free subscriptions, refund money and reset passwords
 * needs a trail — not because you would misuse it, but because when something
 * looks wrong months later the first question is always "who changed this, and
 * when". Best-effort: a failed audit write must never block the action itself.
 */
export async function logAdminAction(
  supabase: any,
  action: string,
  detail: Record<string, any>,
) {
  try {
    await supabase.from('audit_log').insert({
      action,
      actor: 'admin',
      detail,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[adminGuard] audit log failed', e);
  }
}