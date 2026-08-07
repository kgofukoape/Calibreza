import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/adminSession';

// ─── ADMIN LOGOUT ────────────────────────────────────────────────────────────
// Clears the signed admin session cookie. Also clears the secret-path gate
// cookie so the console goes back to returning 404 for this browser.

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  res.cookies.set({
    name: 'gx_gate',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}
