import { createClient } from '@supabase/supabase-js';
import {
  CONSENT_BUNDLE_VERSION,
  MARKETING_CONSENT_VERSION,
  documentsForContext,
  type ConsentContext,
} from './legal';

// ─── SERVER-SIDE CONSENT WRITER ──────────────────────────────────────────────
// One implementation, used by both /api/legal/consent (browser calls) and
// /auth/callback (email confirmation). Duplicating this logic across the two
// was how the versions in the record could have drifted from the versions on
// the page.
//
// Uses the service role key: legal_consents has no INSERT policy, so the
// browser cannot write to it at all. That is deliberate — a consent record the
// client can create is a consent record the client can fabricate.

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface WriteConsentInput {
  userId: string;
  userEmail: string;
  context: ConsentContext;
  marketingConsent?: boolean;
  reference?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  /**
   * Skip the write if this user already has a record for this context.
   *
   * Used for signup, where the confirmation link can legitimately be clicked
   * more than once. The table is append-only by design, so a duplicate cannot
   * be tidied up afterwards — it has to be prevented here.
   */
  onlyIfAbsent?: boolean;
}

export interface WriteConsentResult {
  ok: boolean;
  skipped?: boolean;
  consentId?: string;
  acceptedAt?: string;
  error?: string;
}

export async function writeConsent(input: WriteConsentInput): Promise<WriteConsentResult> {
  if (input.onlyIfAbsent) {
    const { data: existing } = await admin
      .from('legal_consents')
      .select('id')
      .eq('user_id', input.userId)
      .eq('context', input.context)
      .limit(1)
      .maybeSingle();

    if (existing) return { ok: true, skipped: true, consentId: existing.id };
  }

  const marketingConsent = input.marketingConsent === true;

  const { data, error } = await admin
    .from('legal_consents')
    .insert({
      user_id: input.userId,
      user_email: input.userEmail,
      context: input.context,
      documents: documentsForContext(input.context),
      bundle_version: CONSENT_BUNDLE_VERSION,
      marketing_consent: marketingConsent,
      marketing_consent_version: marketingConsent ? MARKETING_CONSENT_VERSION : null,
      identity_verified: true,
      subject_reference: input.reference ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    })
    .select('id, accepted_at')
    .single();

  if (error) {
    console.error('[writeConsent] insert failed', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, consentId: data.id, acceptedAt: data.accepted_at };
}

// ─── PROFILE ROW ─────────────────────────────────────────────────────────────
// When email confirmation is enabled, signUp returns no session. The profile
// insert in the browser therefore runs unauthenticated and is rejected by RLS,
// leaving an account in auth.users with no row in public.users — which breaks
// account_type lookups and login routing.
//
// The callback runs after confirmation, when a session exists, so it is the
// right place to guarantee the profile exists. Everything needed is carried in
// user metadata, set at signup.

export async function ensureUserProfile(userId: string, email: string, meta: Record<string, any>) {
  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return;

  const { error } = await admin.from('users').insert({
    id: userId,
    email,
    full_name: meta.full_name || null,
    account_type: meta.account_type === 'business' ? 'business' : 'personal',
    phone: meta.phone || null,
    province: meta.province || null,
    city: meta.city || null,
    interests: Array.isArray(meta.interests) ? meta.interests : [],
  });

  if (error) console.error('[ensureUserProfile] insert failed', error);
}