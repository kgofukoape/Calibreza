// ─── ADMIN SESSION (signed cookie) ───────────────────────────────────────────
// Creates and verifies a tamper-proof admin session token using HMAC-SHA256.
//
// Why this exists: the old admin login compared a password inside a 'use client'
// component, which shipped the password to every visitor's browser, and then
// stored `localStorage.gunx_admin_session = 'authenticated'` — which anyone
// could set by hand. This replaces that with a token the browser cannot forge,
// because only the server knows ADMIN_SESSION_SECRET.
//
// Uses Web Crypto (crypto.subtle) so it works in BOTH the Edge middleware and
// Node route handlers. Do not swap this for node:crypto — middleware would break.

const encoder = new TextEncoder();

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Build a session token valid for `ttlMs` (default 12 hours). */
export async function createAdminSession(secret: string, ttlMs = 12 * 60 * 60 * 1000): Promise<string> {
  const exp = Date.now() + ttlMs;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(String(exp)));
  return `${exp}.${toHex(sig)}`;
}

/** Verify a session token: correct signature AND not expired. */
export async function verifyAdminSession(value: string | undefined | null, secret: string): Promise<boolean> {
  if (!value || !secret) return false;

  const dot = value.indexOf('.');
  if (dot < 1) return false;

  const expStr = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!expStr || !sig) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;

  const key = await getKey(secret);
  const expected = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(expStr)));

  // Length-safe, constant-time-ish comparison (avoids leaking via early exit)
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

export const ADMIN_SESSION_COOKIE = 'gx_admin';
