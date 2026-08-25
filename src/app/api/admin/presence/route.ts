import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminGuard';
import { ok, fail } from '@/lib/adminApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── WHO IS ON THE SITE NOW ──────────────────────────────────────────────────
// GET /api/admin/presence
//
// Reads active_visitors, which PageTracker keeps fresh with a heartbeat every
// 30 seconds. Anyone whose last heartbeat is inside the window is on the site.
//
// The window is 2 minutes rather than 30 seconds: a browser tab in the
// background throttles timers, so a 30-second cutoff would show people leaving
// and returning constantly. Two minutes is stable without being stale.
//
// SIGNED-IN VISITORS ARE NAMED, ANONYMOUS ONES ARE NOT. This exists to tell you
// what is happening on the platform, not to watch individuals — so an anonymous
// session shows a page and a session prefix, and nothing else. Session ids are
// truncated because the full value would let you follow one person around the
// site across a day, which is surveillance rather than operations.

const WINDOW_MINUTES = 2;

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  try {
    const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

    const { data: visitors, error } = await supabase
      .from('active_visitors')
      .select('session_id, path, last_seen, user_id')
      .gte('last_seen', cutoff)
      .order('last_seen', { ascending: false })
      .limit(200);

    if (error) return fail(error.message, 500);

    const rows = visitors || [];
    const userIds = [...new Set(rows.map(v => v.user_id).filter(Boolean))] as string[];

    // Resolve signed-in visitors to a name, and to the business they hold where
    // there is one — a dealer browsing your site is worth recognising.
    let profiles: Record<string, any> = {};
    if (userIds.length) {
      const [{ data: users }, { data: dealers }] = await Promise.all([
        supabase.from('users').select('id, full_name, email, account_type').in('id', userIds),
        supabase.from('dealers').select('user_id, business_name, subscription_tier').in('user_id', userIds),
      ]);

      for (const u of users || []) profiles[u.id] = { ...u };
      for (const d of dealers || []) {
        if (profiles[d.user_id]) {
          profiles[d.user_id].business = d.business_name;
          profiles[d.user_id].tier = d.subscription_tier;
        }
      }
    }

    const present = rows.map(v => {
      const p = v.user_id ? profiles[v.user_id] : null;
      return {
        sessionRef: String(v.session_id || '').slice(0, 8),
        path: v.path,
        lastSeen: v.last_seen,
        signedIn: Boolean(v.user_id),
        name: p?.business || p?.full_name || null,
        email: p?.email || null,
        accountType: p?.account_type || null,
        tier: p?.tier || null,
      };
    });

    // What are people actually looking at? More useful at a glance than the
    // raw list once there is any real traffic.
    const byPath: Record<string, number> = {};
    for (const v of present) byPath[v.path || '/'] = (byPath[v.path || '/'] || 0) + 1;

    const topPaths = Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    return ok(`${present.length} on the site now`, {
      total: present.length,
      signedIn: present.filter(v => v.signedIn).length,
      anonymous: present.filter(v => !v.signedIn).length,
      windowMinutes: WINDOW_MINUTES,
      topPaths,
      visitors: present,
    });

  } catch (error: any) {
    console.error('[admin/presence]', error);
    return fail(error.message, 500);
  }
}