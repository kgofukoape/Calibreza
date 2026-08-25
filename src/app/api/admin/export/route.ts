import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminGuard';
import { fail, audit } from '@/lib/adminApi';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── CSV EXPORT ──────────────────────────────────────────────────────────────
// GET /api/admin/export?dataset=users&from=2026-01-01&to=2026-12-31
//
// EXPORTING IS A PROCESSING EVENT, NOT A CONVENIENCE
// A CSV of your users is personal information leaving the system's controls and
// landing in a Downloads folder, an email, a spreadsheet. Under POPIA you
// remain the responsible party for it after it lands there. Three consequences,
// all built in below:
//
//   Columns are whitelisted per dataset. Never select *. A new sensitive column
//   added to a table months from now cannot silently start appearing in
//   extracts nobody re-read.
//
//   Every export is audited — who, which dataset, what filter, how many rows.
//   If you are ever asked where a copy of someone's data went, the answer
//   should not be a shrug.
//
//   Row counts are capped. An accidental full-table export is the most likely
//   way a large amount of personal information leaves at once.

const MAX_ROWS = 5000;

interface Dataset {
  table: string;
  columns: string[];
  dateColumn: string;
  /** Fields that make a person identifiable, listed so the warning is honest. */
  personal: string[];
}

const DATASETS: Record<string, Dataset> = {
  users: {
    table: 'users',
    columns: ['id', 'email', 'full_name', 'phone', 'province', 'city', 'account_type', 'created_at'],
    dateColumn: 'created_at',
    personal: ['email', 'full_name', 'phone'],
  },
  dealers: {
    table: 'dealers',
    columns: ['id', 'business_name', 'email', 'phone', 'city', 'province',
              'saps_dealer_number', 'status', 'subscription_tier', 'is_comped', 'created_at'],
    dateColumn: 'created_at',
    personal: ['email', 'phone', 'saps_dealer_number'],
  },
  clubs: {
    table: 'clubs',
    columns: ['id', 'name', 'email', 'phone', 'city', 'province',
              'facility_type', 'status', 'subscription_tier', 'created_at'],
    dateColumn: 'created_at',
    personal: ['email', 'phone'],
  },
  listings: {
    table: 'listings',
    columns: ['id', 'title', 'price', 'province', 'city', 'status',
              'listing_type', 'is_featured', 'views_count', 'created_at'],
    dateColumn: 'created_at',
    personal: [],
  },
  invoices: {
    table: 'invoices',
    columns: ['id', 'entity_type', 'entity_id', 'amount', 'status', 'notes', 'created_at'],
    dateColumn: 'created_at',
    personal: [],
  },
  consents: {
    table: 'legal_consents',
    columns: ['id', 'user_email', 'context', 'bundle_version', 'marketing_consent',
              'identity_verified', 'subject_reference', 'accepted_at'],
    dateColumn: 'accepted_at',
    personal: ['user_email'],
  },
};

/** RFC 4180 quoting. A description containing a comma or a quote must not shift columns. */
function csvCell(value: any): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const ip = getClientIp(req);
  const limit = rateLimit(`admin-export:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) return fail('Too many exports. Try again shortly.', 429);

  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('dataset') || '';
    const dataset = DATASETS[key];

    if (!dataset) {
      return fail(`Unknown dataset. Available: ${Object.keys(DATASETS).join(', ')}`);
    }

    const from = searchParams.get('from');
    const to   = searchParams.get('to');
    const status = searchParams.get('status');

    let query = supabase
      .from(dataset.table)
      .select(dataset.columns.join(','))
      .order(dataset.dateColumn, { ascending: false })
      .limit(MAX_ROWS);

    if (from)   query = query.gte(dataset.dateColumn, from);
    if (to)     query = query.lte(dataset.dateColumn, `${to}T23:59:59`);
    // Only where the dataset actually has a status column, so a stray parameter
    // cannot turn into an invalid query.
    if (status && dataset.columns.includes('status')) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return fail(error.message, 500);

    const rows = (data || []) as any[];

    const csv = [
      dataset.columns.join(','),
      ...rows.map(r => dataset.columns.map(c => csvCell(r[c])).join(',')),
    ].join('\r\n');

    await audit(supabase, {
      action: 'export.csv',
      entity: dataset.table,
      reason: `Exported ${rows.length} rows`,
      after: {
        dataset: key,
        filter: { from, to, status },
        rowCount: rows.length,
        truncated: rows.length === MAX_ROWS,
        containsPersonalInformation: dataset.personal.length > 0,
        personalColumns: dataset.personal,
      },
    });

    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="gunx-${key}-${stamp}.csv"`,
        // Tells the caller when the cap bit, so a truncated export is not
        // mistaken for the whole picture.
        'X-Row-Count': String(rows.length),
        'X-Truncated': rows.length === MAX_ROWS ? 'true' : 'false',
      },
    });

  } catch (error: any) {
    console.error('[admin/export]', error);
    return fail(error.message, 500);
  }
}