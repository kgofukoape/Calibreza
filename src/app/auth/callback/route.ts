import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { writeConsent, ensureUserProfile } from '@/lib/consentServer'
import { BUSINESS_TYPES, type BusinessTypeId } from '@/lib/business'

// ─── AUTH CALLBACK ───────────────────────────────────────────────────────────
// Where the email confirmation link lands.
//
// This route used to do one thing: exchange the code and redirect everyone to
// /dashboard. That caused three faults, all invisible:
//
//   1. A business account landed on the personal dashboard and never saw its
//      application form. A dealer would sign up, confirm, and find a page
//      offering to help them post a private listing.
//
//   2. No profile row existed in public.users. With email confirmation on,
//      signUp returns no session, so the browser's insert into public.users
//      ran unauthenticated and was rejected by RLS. The account existed in
//      auth.users with nothing in public.users, so account_type could not be
//      read and login routing had nothing to work with.
//
//   3. No consent was recorded. Same cause — no session means no token, and
//      /api/legal/consent requires one. Every confirmation-based signup
//      produced an account with no record of what was agreed to.
//
// All three are fixed here, because this is the first moment a session exists.
// Everything needed is carried in user metadata, set at signup.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=auth-failed`)
  }

  const user = data.user
  const meta = (user.user_metadata || {}) as Record<string, any>

  // 1. Guarantee the profile row exists.
  await ensureUserProfile(user.id, user.email!, meta)

  // 2. Record consent. onlyIfAbsent because a confirmation link can be clicked
  //    more than once, and legal_consents is append-only — a duplicate cannot
  //    be removed afterwards.
  await writeConsent({
    userId: user.id,
    userEmail: user.email!,
    context: 'signup',
    marketingConsent: meta.marketing_consent === true,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: request.headers.get('user-agent'),
    onlyIfAbsent: true,
  })

  // 3. Send them where they were actually going. A business account that has
  //    not yet completed its application goes to the matching form; a business
  //    that already has one, and every personal account, goes to a dashboard.
  if (meta.account_type === 'business') {
    const typeId = meta.business_type as BusinessTypeId | undefined
    const type = typeId ? BUSINESS_TYPES[typeId] : undefined

    if (type) {
      const { data: existing } = await supabase
        .from(type.table)
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()

      return NextResponse.redirect(
        `${origin}${existing ? type.dashboardPath : type.applyPath}`
      )
    }

    return NextResponse.redirect(`${origin}/business/login`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}