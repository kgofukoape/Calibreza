// ─── SIMPLE IN-MEMORY RATE LIMITER ───────────────────────────────────────────
// Protects public API routes from being hammered (cost abuse, email spam).
//
// HONEST LIMITATION: this stores counters in the server instance's memory. On
// serverless (Vercel) there may be several instances, and they recycle — so a
// determined attacker spreading requests could get somewhat more through than
// the stated limit, and counters reset on cold start. It is NOT a hard
// guarantee. It IS enough to stop casual abuse and runaway scripts, which is
// the realistic threat here.
//
// For a hard guarantee later, use Vercel Firewall rate-limit rules (dashboard →
// Firewall) or a shared store like Upstash Redis.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Stop the map growing forever on a long-lived instance
function sweep(now: number) {
  if (buckets.size < 5000) return;
  // Using forEach (not for...of) so this compiles without --downlevelIteration
  const stale: string[] = [];
  buckets.forEach((b, k) => {
    if (b.resetAt <= now) stale.push(k);
  });
  stale.forEach((k) => buckets.delete(k));
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key      unique caller identity (usually `${routeName}:${ip}`)
 * @param limit    max requests allowed per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Best-effort client IP. Vercel sets x-forwarded-for. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Reject requests that didn't come from our own site.
 * Blocks casual cross-site abuse from a browser. Note that non-browser clients
 * (curl, scripts) can forge these headers — rate limiting is the real defence.
 */
export function isSameOrigin(req: Request): boolean {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

  // Nothing to compare against — don't block (e.g. local dev without the var)
  if (!site) return true;

  let host: string;
  try {
    host = new URL(site).host;
  } catch {
    return true;
  }

  const check = (value: string | null) => {
    if (!value) return false;
    try {
      return new URL(value).host === host;
    } catch {
      return false;
    }
  };

  // Allow localhost during development
  const devHosts = ['localhost:3000', 'localhost:3001', 'localhost:3002'];
  const isDev = (value: string | null) => {
    if (!value) return false;
    try {
      return devHosts.includes(new URL(value).host);
    } catch {
      return false;
    }
  };

  if (process.env.NODE_ENV !== 'production' && (isDev(origin) || isDev(referer))) {
    return true;
  }

  return check(origin) || check(referer);
}