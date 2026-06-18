import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── SECRET ADMIN ENTRY ──────────────────────────────────────────────────────
// Admin console lives at /admin/* internally. It's a dead end (404) for anyone
// who hasn't first visited the secret entry path.
//
// Flow:
//   1. Visit  /sejamagoma   → sets gate cookie, redirects to /admin
//   2. /admin/* loads only if the gate cookie is present
//   3. /admin direct (no cookie) → 404
//
// Change ADMIN_SECRET_PATH to rename the secret door. Keep it private.
const ADMIN_SECRET_PATH = '/sejamagoma'
const ADMIN_GATE_COOKIE  = 'gx_gate'
const ADMIN_GATE_VALUE   = 'open'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Secret entry: set the gate cookie, then send the user to /admin ───────
  if (pathname === ADMIN_SECRET_PATH) {
    const res = NextResponse.redirect(new URL('/admin', request.url))
    res.cookies.set({
      name: ADMIN_GATE_COOKIE,
      value: ADMIN_GATE_VALUE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    })
    return res
  }

  // ── 2. Guard /admin/* : allow only if gate cookie present, else 404 ──────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const gate = request.cookies.get(ADMIN_GATE_COOKIE)
    if (!gate || gate.value !== ADMIN_GATE_VALUE) {
      // Serve the 404 page while keeping the URL — looks like nothing's here
      return NextResponse.rewrite(new URL('/not-found-gx', request.url))
    }
    return NextResponse.next()
  }

  // ── 3. Existing Supabase auth gating for /sell (unchanged) ───────────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && pathname.startsWith('/sell')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/sell/:path*', '/sell', '/admin/:path*', '/admin', '/sejamagoma'],
}
