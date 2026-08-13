import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';

// ─── ADMIN READ ──────────────────────────────────────────────────────────────
// The admin console reads through the browser as the ANON user. On the dealers
// table the only SELECT policy is `status = 'approved'`, which means pending
// applications are INVISIBLE to the admin console — you cannot review what you
// cannot see.
//
// Rather than loosening RLS (which would expose unapproved applications, and
// the documents attached to them, to the public), this route reads with the
// service role key behind an admin session check.
//
// GET /api/admin/records?type=dealer

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const TABLES: Record<string, { table: string; orderBy: string }> = {
  dealer:  { table: 'dealers',  orderBy: 'created_at' },
  club:    { table: 'clubs',    orderBy: 'created_at' },
  service: { table: 'services', orderBy: 'created_at' },
  user:    { table: 'users',    orderBy: 'member_since' },
  // The ads table's only public SELECT policy is `status = 'active'`, so
  // reading it from the browser as the anon user would hide every pending
  // submission from the Ad Manager — the same fault that hid pending dealer
  // applications.
  ad:      { table: 'ads',      orderBy: 'created_at' },
};

export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdmin = await verifyAdminSession(session, secret ?? '');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') || '';
  const config = TABLES[type];
  if (!config) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(config.table)
    .select('*')
    .order(config.orderBy, { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, records: data || [] });
}
