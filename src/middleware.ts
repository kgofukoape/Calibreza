import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession'

// ─── SECRET ADMIN ENTRY + REAL SERVER-SIDE AUTH ──────────────────────────────
// Two layers guard the admin console:
//
//   Layer 1 (obscurity): /admin/* is a 404 for anyone who hasn't first visited
//                        the secret entry path. Hides the door.
//   Layer 2 (security):  /admin/* additionally requires a SIGNED session cookie
//                        issued by /api/admin/login after a server-side password
//                        check. This is the actual lock.
//
// Layer 2 matters because localStorage can be set by anyone in a browser
// console — it is not, and never was, authentication. The signed httpOnly
// cookie cannot be read or forged by client JavaScript.
//
// Flow:
//   1. Visit /sejamagoma          → sets gate cookie, redirects to /admin
//   2. No session cookie          → sent to /admin/login
//   3. Correct password           → /api/admin/login sets signed session cookie
//   4. /admin/* now loads
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

  // ── 2. Guard /admin/* ────────────────────────────────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // 2a. Gate cookie missing → pretend nothing is here
    const gate = request.cookies.get(ADMIN_GATE_COOKIE)
    if (!gate || gate.value !== ADMIN_GATE_VALUE) {
      return NextResponse.rewrite(new URL('/not-found-gx', request.url))
    }

    // 2b. The login page itself must stay reachable without a session
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // 2c. Everything else requires a valid signed session
    const secret = process.env.ADMIN_SESSION_SECRET
    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    const valid = await verifyAdminSession(session, secret ?? '')

    if (!valid) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
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
