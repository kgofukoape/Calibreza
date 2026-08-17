import { supabase } from './supabase';
import type { ConsentContext } from './legal';
import type { BusinessTypeId } from './business';

// ─── CONSENT RECORDING ───────────────────────────────────────────────────────
// Posts to /api/legal/consent, which writes the append-only evidence row. The
// browser never writes to legal_consents directly — the table has no INSERT
// policy — so this is the only path.
//
// The access token proves who the caller is. Which documents and versions were
// accepted is decided server-side from src/lib/legal.ts, not sent from here.

async function postConsent(
  accessToken: string,
  context: ConsentContext,
  marketingConsent: boolean,
  reference?: string,
): Promise<boolean> {
  try {
    const res = await fetch('/api/legal/consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ context, marketingConsent, reference }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Record consent for the currently signed-in user.
 *
 * @param reference optional identifier for what was applied for — a business
 *                  name or slug — so the consent can be found later without
 *                  knowing which email address was used.
 */
export async function recordConsent(
  context: ConsentContext,
  marketingConsent = false,
  reference?: string,
): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return false;
  return postConsent(token, context, marketingConsent, reference);
}

// ─── ACCOUNT TYPE ────────────────────────────────────────────────────────────
// Personal and business accounts are deliberately separate. A business login
// is owned by the business and may be shared by its staff; a personal account
// belongs to one individual. Keeping them apart is what stops a shop's login
// and an employee's own account from colliding.

export type AccountType = 'personal' | 'business';

export async function getAccountType(userId: string): Promise<AccountType | null> {
  const { data } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', userId)
    .maybeSingle();

  return (data?.account_type as AccountType) ?? null;
}

// ─── PERSONAL SIGNUP ─────────────────────────────────────────────────────────

export interface SignUpResult {
  userId: string | null;
  /** True when Supabase returned no session because email confirmation is on. */
  needsEmailConfirmation: boolean;
  /** False means the account exists but the consent row was NOT written. */
  consentRecorded: boolean;
}

export interface PersonalProfile {
  fullName: string;
  /** Required: how buyers and sellers reach each other, and how we reach you. */
  phone: string;
  /** Required: drives local search results. */
  province: string;
  /** Optional. */
  city?: string;
  /** Optional category preferences. Registration succeeds without them. */
  interests?: string[];
}

export async function signUp(
  email: string,
  password: string,
  profile: PersonalProfile,
  marketingConsent = false,
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Carried in metadata because, when email confirmation is enabled,
      // signUp returns no session — the profile insert below is rejected by
      // RLS and the consent write has no token. /auth/callback rebuilds both
      // from these values once a session exists.
      data: {
        full_name: profile.fullName,
        account_type: 'personal',
        phone: profile.phone,
        province: profile.province,
        city: profile.city || null,
        interests: profile.interests || [],
        marketing_consent: marketingConsent,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: profile.fullName,
        phone: profile.phone,
        province: profile.province,
        city: profile.city || null,
        interests: profile.interests || [],
        account_type: 'personal',
      });

    // With email confirmation enabled there is no session yet, so this insert
    // is rejected by RLS. That is expected: /auth/callback creates the profile
    // from user metadata once the user confirms. Throwing here would leave the
    // account created but report failure to the user.
    if (profileError && data.session) throw profileError;
  }

  const token = data.session?.access_token;
  const consentRecorded = token
    ? await postConsent(token, 'signup', marketingConsent)
    : false;

  return {
    userId: data.user?.id ?? null,
    needsEmailConfirmation: !data.session,
    consentRecorded,
  };
}

// ─── BUSINESS SIGNUP ─────────────────────────────────────────────────────────

export interface BusinessSignUpInput {
  /** The login credential. May be a shared business address. */
  email: string;
  password: string;
  businessType: BusinessTypeId;
  /** Named human accountable for the account. */
  responsiblePerson: string;
  /** That person's own email, for notices. May differ from the login email. */
  responsiblePersonEmail: string;
}

export interface BusinessSignUpResult extends SignUpResult {
  businessType: BusinessTypeId;
}

/**
 * Creates a business login.
 *
 * The responsible person is held in user metadata so the application form can
 * prefill it, and is written onto the business record when that form is
 * submitted. It matters because a shared login has no human behind it, and two
 * things depend on there being one: the Dealer Agreement is accepted by someone
 * warranting they may bind the business, and the FCA licence declaration is a
 * statement of fact by a person.
 */
export async function signUpBusiness(
  input: BusinessSignUpInput,
  marketingConsent = false,
): Promise<BusinessSignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.responsiblePerson,
        account_type: 'business',
        business_type: input.businessType,
        responsible_person: input.responsiblePerson,
        responsible_person_email: input.responsiblePersonEmail,
        marketing_consent: marketingConsent,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: input.responsiblePerson,
        account_type: 'business',
      });

    // See the note in signUp: without a session this insert is rejected, and
    // /auth/callback rebuilds the profile after confirmation.
    if (profileError && data.session) throw profileError;
  }

  const token = data.session?.access_token;
  const consentRecorded = token
    ? await postConsent(token, 'signup', marketingConsent)
    : false;

  return {
    userId: data.user?.id ?? null,
    needsEmailConfirmation: !data.session,
    consentRecorded,
    businessType: input.businessType,
  };
}

// ─── SESSION ─────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}