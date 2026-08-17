import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeConsent, ensureUserProfile } from '@/lib/consentServer';

// ─── ACCOUNT BOOTSTRAP ───────────────────────────────────────────────────────
// POST /api/auth/bootstrap
//
// Guarantees that a signed-in account has both a profile row in public.users
// and a signup consent record, creating either if it is missing, then reports
// the account type so the caller can route correctly.
//
// WHY THIS EXISTS
// With email confirmation enabled, signUp returns no session — so the browser
// cannot write the profile row (RLS rejects it) and cannot record consent (no
// token). /auth/callback handles that on the confirmation link. But the
// callback cannot always run: PKCE keeps the code verifier in the browser that
// started the signup, so confirming on a phone and signing in on a laptop skips
// it entirely. Those accounts would then exist with no profile and no consent,
// and nothing would ever detect it.
//
// Calling this after every sign-in closes that gap. Both operations are
// no-ops when the records already exist, so it is cheap and idempotent.

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;

  if (userError || !user || !user.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const meta = (user.user_metadata || {}) as Record<string, any>;

  await ensureUserProfile(user.id, user.email, meta);

  await writeConsent({
    userId: user.id,
    userEmail: user.email,
    context: 'signup',
    marketingConsent: meta.marketing_consent === true,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: req.headers.get('user-agent'),
    onlyIfAbsent: true,
  });

  // Read back rather than trusting metadata: the profile row is the source of
  // truth for account type, and an older account may have no metadata at all.
  const { data: profile } = await admin
    .from('users')
    .select('account_type')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    accountType: profile?.account_type === 'business' ? 'business' : 'personal',
    businessType: meta.business_type ?? null,
  });
}