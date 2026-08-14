import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rateLimit';
import {
  CONSENT_BUNDLES,
  CONSENT_BUNDLE_VERSION,
  MARKETING_CONSENT_VERSION,
  documentsForContext,
  type ConsentContext,
} from '@/lib/legal';

// ─── LEGAL CONSENT RECORDING ─────────────────────────────────────────────────
// POST /api/legal/consent
//
// Writes one append-only row to legal_consents proving what a user accepted.
//
// WHY THIS IS A SERVER ROUTE
// The legal_consents table has no INSERT policy, so the browser cannot write to
// it at all. That is deliberate. A consent record the client can create is a
// consent record the client can fabricate — and the entire value of this table
// is that it is evidence. Writes happen here, with the service role key, after
// the caller's identity has been proven.
//
// WHAT THE CLIENT IS AND IS NOT TRUSTED WITH
//   Trusted:     which context they are in ('signup'), and their marketing
//                answer. Both are checked against a fixed allow-list.
//   NOT trusted: who they are — proven by verifying their access token against
//                Supabase, never taken from the request body.
//   NOT trusted: which documents and versions were accepted — these are read
//                server-side from src/lib/legal.ts. If the client supplied
//                them, a user could later claim they accepted some other
//                version, which defeats the purpose of recording anything.
//
// FAILURE BEHAVIOUR
// Returns 500 on a write failure rather than swallowing it. The signup flow
// must be able to tell whether the record was actually written; silently
// carrying on would leave an account with no consent record and no way to know.

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
  // The bearer token is the user's Supabase access token. getUser() validates
  // its signature and expiry against the project, so a forged or stale token
  // fails here rather than producing a consent record for someone else.
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
  let body: { context?: string; marketingConsent?: boolean };
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

  // ── Write ──────────────────────────────────────────────────────────────────
  const { data, error } = await supabaseAdmin
    .from('legal_consents')
    .insert({
      user_id: user.id,
      user_email: user.email,
      context,
      documents: documentsForContext(context),
      bundle_version: CONSENT_BUNDLE_VERSION,
      marketing_consent: marketingConsent,
      marketing_consent_version: marketingConsent ? MARKETING_CONSENT_VERSION : null,
      ip_address: ip !== 'unknown' ? ip : null,
      user_agent: req.headers.get('user-agent'),
    })
    .select('id, accepted_at')
    .single();

  if (error) {
    console.error('[legal/consent] insert failed', error);
    return NextResponse.json({ error: 'Could not record consent' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    consentId: data.id,
    acceptedAt: data.accepted_at,
  });
}