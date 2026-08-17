import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rateLimit';
import { writeConsent } from '@/lib/consentServer';
import { CONSENT_BUNDLES, type ConsentContext } from '@/lib/legal';

// ─── LEGAL CONSENT RECORDING ─────────────────────────────────────────────────
// POST /api/legal/consent
//
// Writes one append-only row to legal_consents proving what a user accepted.
//
// EVERY CALLER MUST BE AUTHENTICATED
// There is no anonymous path. That is a deliberate constraint rather than a
// limitation: it means every row in legal_consents is tied to an account whose
// identity was proven by a validated access token, so identity_verified is
// always true and the table never contains a self-declared claim you might
// later mistake for proof.
//
// It also forces the application flows to require sign-in, which fixes a
// separate fault — a dealer or club row created without user_id can never be
// found by /dealer/login, leaving the applicant permanently locked out of the
// business they applied for.
//
// WHAT THE CLIENT IS NEVER TRUSTED WITH
// Which documents and versions were accepted. Those are read server-side from
// src/lib/legal.ts. If the client supplied them, a person could later claim
// they accepted some other version, which defeats the point of recording.

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const VALID_CONTEXTS = Object.keys(CONSENT_BUNDLES) as ConsentContext[];

export async function POST(req: NextRequest) {
  // ── Origin and rate limiting ───────────────────────────────────────────────
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = rateLimit(`legal-consent:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  // ── Identity ───────────────────────────────────────────────────────────────
  // getUser() validates the token's signature and expiry against the project,
  // so a forged or stale token fails here rather than producing a consent
  // record attributed to someone else.
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const user = userData?.user;

  if (userError || !user || !user.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  let body: { context?: string; marketingConsent?: boolean; reference?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const context = body.context as ConsentContext;
  if (!context || !VALID_CONTEXTS.includes(context)) {
    return NextResponse.json({ error: 'Invalid consent context' }, { status: 400 });
  }

  const marketingConsent = body.marketingConsent === true;

  // Ties the consent to what was applied for — the business name or slug — so
  // you can find it without knowing which email the applicant used.
  const reference =
    typeof body.reference === 'string' && body.reference.trim()
      ? body.reference.trim().slice(0, 200)
      : null;

  // ── Write ──────────────────────────────────────────────────────────────────
  // Shared with /auth/callback via lib/consentServer so the two paths cannot
  // record different document versions for the same event.
  const result = await writeConsent({
    userId: user.id,
    userEmail: user.email,
    context,
    marketingConsent,
    reference,
    ipAddress: ip !== 'unknown' ? ip : null,
    userAgent: req.headers.get('user-agent'),
  });

  if (!result.ok) {
    return NextResponse.json({ error: 'Could not record consent' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    consentId: result.consentId,
    acceptedAt: result.acceptedAt,
  });
}