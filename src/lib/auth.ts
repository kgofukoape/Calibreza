import { supabase } from './supabase';
import type { ConsentContext } from './legal';

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

export interface SignUpResult {
  userId: string | null;
  /** True when Supabase returned no session because email confirmation is on. */
  needsEmailConfirmation: boolean;
  /** False means the account exists but the consent row was NOT written. */
  consentRecorded: boolean;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  marketingConsent = false,
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;

  // Create user profile in our users table
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
      });

    if (profileError) throw profileError;
  }

  // Consent is recorded against the session created by signUp. If email
  // confirmation is enabled in Supabase, no session is returned here and the
  // consent record cannot be written yet — the caller is told so rather than
  // being left to assume it worked.
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

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

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