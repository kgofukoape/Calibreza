import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// ─── ADMIN LOGIN ─────────────────────────────────────────────────────────────
// Verifies the admin password SERVER-SIDE. The password never reaches the
// browser — it lives only in the ADMIN_PASSWORD environment variable.
//
// On success, sets a signed httpOnly cookie. httpOnly means client JavaScript
// cannot read or forge it, and the signature means it can't be fabricated
// without ADMIN_SESSION_SECRET.
//
// Required env vars (set in Vercel + .env.local):
//   ADMIN_PASSWORD        — the admin password
//   ADMIN_SESSION_SECRET  — a long random string used to sign sessions

export async function POST(req: NextRequest) {
  // ── Brute force protection ───────────────────────────────────────────────
  // The 600ms delay below slows a single attacker but does nothing against a
  // script running requests in parallel. This console can delete users and
  // approve dealers; it should not accept unlimited password guesses.
  //
  // 10 attempts per IP per 15 minutes. Generous for a person who has forgotten
  // their password, useless for a dictionary attack.
  const ip = getClientIp(req);
  const limit = rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    console.warn(`[admin-login] rate limit hit from ${ip}`);
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    console.error('Admin login misconfigured: ADMIN_PASSWORD or ADMIN_SESSION_SECRET missing');
    return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 });
  }

  let password = '';
  try {
    const body = await req.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  // Constant-time-ish comparison so response timing doesn't leak the password
  const a = password;
  const b = adminPassword;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }

  if (diff !== 0) {
    // Small delay blunts brute-forcing without needing a rate-limit store
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: false, error: 'Incorrect password' }, { status: 401 });
  }

  const token = await createAdminSession(sessionSecret);
  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,                                    // JS cannot read it
    secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,                              // 12 hours
  });

  return res;
}