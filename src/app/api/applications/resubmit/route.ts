import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rateLimit';

// --- RESUBMITTING AN APPLICATION -----------------------------------------------
// When an admin asks for more information, they can clear named documents.
// This route lets the APPLICANT, and only while their application is waiting
// for information, attach a new copy of a cleared document and then send the
// application back for review.
//
// Documents are otherwise locked: the database guard refuses any change to
// them from the browser, which is why this runs on the server. It will only
// fill a document that is currently empty, only with a file in the
// applicant's own storage folder, and only if that file really exists.

const CONFIG: Record<string, { table: string; bucket: string; docs: string[] }> = {
  dealer: {
    table: 'dealers',
    bucket: 'dealer-documents',
    docs: ['saps_certificate_url', 'business_registration_url', 'id_document_url'],
  },
  shooting_club: {
    table: 'shooting_clubs',
    bucket: 'business-documents',
    docs: ['affiliation_letter_url', 'accreditation_cert_url', 'business_registration_url', 'constitution_url'],
  },
  club: {
    table: 'clubs',
    bucket: 'business-documents',
    docs: ['saps_registration_url', 'compliance_cert_url', 'business_registration_url',
      'affiliation_letter_url', 'accreditation_cert_url', 'constitution_url'],
  },
  service: {
    table: 'services',
    bucket: 'business-documents',
    docs: ['psira_certificate_url'],
  },
};

const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const limit = rateLimit(`resubmit:${getClientIp(req)}`, LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const raw = String(body?.kind || '');
  // Ranges live in the clubs table; shooting clubs have their own.
  const kind = raw === 'range' ? 'club' : raw === 'club' ? 'shooting_club' : raw;
  const cfg = CONFIG[kind];
  const action = String(body?.action || '');
  if (!cfg || !['upload', 'submit'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: userData } = await svc.auth.getUser(token);
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

  const { data: row } = await svc
    .from(cfg.table).select('*').eq('user_id', user.id).limit(1).maybeSingle();
  if (!row) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  if (row.status !== 'info_requested') {
    return NextResponse.json(
      { error: 'This application is not waiting for documents.' }, { status: 409 });
  }

  if (action === 'upload') {
    const column = String(body?.column || '');
    const path = String(body?.path || '');
    if (!cfg.docs.includes(column)) {
      return NextResponse.json({ error: 'Unknown document' }, { status: 400 });
    }
    if (row[column]) {
      return NextResponse.json(
        { error: 'That document is already on file.' }, { status: 409 });
    }
    const prefix = `${user.id}/`;
    const fileName = path.slice(prefix.length);
    if (!path.startsWith(prefix) || !fileName || fileName.includes('/') || path.includes('..')) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }
    const { data: found } = await svc.storage
      .from(cfg.bucket).list(user.id, { search: fileName, limit: 5 });
    if (!found || !found.some((f) => f.name === fileName)) {
      return NextResponse.json({ error: 'The uploaded file was not found.' }, { status: 400 });
    }
    const { error } = await svc.from(cfg.table).update({ [column]: path }).eq('id', row.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // action === 'submit': back to the review queue
  const { error } = await svc.from(cfg.table).update({ status: 'pending' }).eq('id', row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
