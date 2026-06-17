import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── SECRET ADMIN ENTRY ──────────────────────────────────────────────────────
// The admin console lives at /admin/* internally, but /admin is a dead end (404)
// for anyone who hasn't passed through the secret entry path first.
//
// Flow:
//   1. You visit  /sejamagoma         → sets a gate cookie, forwards to /admin
//   2. Middleware allows /admin/*      only if that cookie is present
//   3. Scanners hitting /admin direct  → 404 (no cookie)
//
// To change the secret path, edit ADMIN_SECRET_PATH below. Keep it private.
const ADMIN_SECRET_PATH = '/sejamagoma'
const ADMIN_GATE_COOKIE  = 'gx_gate'
const ADMIN_GATE_VALUE   = 'open'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Secret entry: set the gate cookie, then forward into the console ──────
  if (pathname === ADMIN_SECRET_PATH) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    const res = NextResponse.redirect(url)
    res.cookies.set(ADMIN_GATE_COOKIE, ADMIN_GATE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours, then re-enter via the secret path
    })
    return res
  }

  // ── 2. Guard /admin/* : require the gate cookie, else 404 ────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const hasGate = request.cookies.get(ADMIN_GATE_COOKIE)?.value === ADMIN_GATE_VALUE
    if (!hasGate) {
      // Rewrite to the framework 404 — looks like the route simply doesn't exist
      return NextResponse.rewrite(new URL('/404', request.url))
    }
    // Cookie present → let the admin pages load normally
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/sell', '/admin', '/admin/:path*', '/sejamagoma'],
}
