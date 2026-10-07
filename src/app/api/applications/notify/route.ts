import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rateLimit';

// --- APPLICATION FORWARDING ------------------------------------------------
// When a dealer, club/range or service provider submits an application,
// this emails the admin inbox the business details and a link to each
// uploaded document. The links are signed and expire after 48 hours. No
// attachments, so no copies of ID documents sit in a mailbox for good.
//
// Called by the applicant's own browser straight after the insert, with
// their session token. The row is looked up from THAT user, so nobody can
// trigger an email about someone else's application, and every detail
// comes from the database, not from what the browser sends.

const ADMIN_EMAIL = 'pewpew@gunx.co.za';
const FROM_EMAIL = 'Gun X <notifications@gunx.co.za>';
const LINK_SECONDS = 48 * 60 * 60;
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

const LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000;

type Kind = 'dealer' | 'club' | 'service';

interface KindConfig {
  table: string;
  bucket: string;
  title: string;
  admin: string;
  nameCol: string;
  docs: Array<[string, string]>;
  fields: Array<[string, string]>;
}

const CONFIG: Record<Kind, KindConfig> = {
  dealer: {
    table: 'dealers',
    bucket: 'dealer-documents',
    title: 'Dealer application',
    admin: '/admin/dealers',
    nameCol: 'business_name',
    docs: [
      ['saps_certificate_url', 'SAPS dealer certificate'],
      ['business_registration_url', 'Business registration'],
      ['id_document_url', 'ID document'],
    ],
    fields: [
      ['business_name', 'Business'],
      ['registration_number', 'Registration no.'],
      ['saps_dealer_number', 'SAPS dealer no.'],
      ['business_type', 'Business type'],
      ['contact_person', 'Contact person'],
      ['email', 'Email'],
      ['phone', 'Phone'],
      ['address', 'Address'],
      ['city', 'City'],
      ['province', 'Province'],
      ['requested_tier', 'Plan requested'],
    ],
  },
  club: {
    table: 'clubs',
    bucket: 'business-documents',
    title: 'Club / range application',
    admin: '/admin/clubs',
    nameCol: 'name',
    docs: [
      ['saps_registration_url', 'SAPS registration'],
      ['compliance_cert_url', 'Compliance certificate'],
      ['business_registration_url', 'Business registration'],
    ],
    fields: [
      ['name', 'Name'],
      ['facility_type', 'Facility type'],
      ['saps_reg_number', 'SAPS reg no.'],
      ['contact_person', 'Contact person'],
      ['email', 'Email'],
      ['phone', 'Phone'],
      ['city', 'City'],
      ['province', 'Province'],
    ],
  },
  service: {
    table: 'services',
    bucket: 'business-documents',
    title: 'Service provider application',
    admin: '/admin/services',
    nameCol: 'name',
    docs: [['psira_certificate_url', 'PSIRA certificate']],
    fields: [
      ['name', 'Name'],
      ['type', 'Service type'],
      ['email', 'Email'],
      ['phone', 'Phone'],
      ['city', 'City'],
      ['province', 'Province'],
    ],
  },
};

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

async function sendEmail(subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${await res.text()}`);
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const ip = getClientIp(req);
    const limit = rateLimit(`appnotify:${ip}`, LIMIT, WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const kind = body?.kind as Kind;
    const cfg = CONFIG[kind];
    if (!cfg) {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
    }

    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: userData, error: userErr } = await svc.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: row, error: rowErr } = await svc
      .from(cfg.table)
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (rowErr || !row) {
      console.error('appnotify: no row for', user.id, rowErr?.message);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only a fresh application gets forwarded; an approved account
    // calling this again sends nothing.
    if (row.status && row.status !== 'pending') {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Business details: only fields that exist and have a value
    const detailRows = cfg.fields
      .filter(([col]) => row[col] !== undefined && row[col] !== null && row[col] !== '')
      .map(([col, label]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#8A8E99;` +
        `white-space:nowrap;vertical-align:top;">${esc(label)}</td>` +
        `<td style="padding:6px 0;color:#F0EDE8;">${esc(row[col])}</td></tr>`)
      .join('');

    // Documents: a fresh 48-hour signed link for each one
    const docRows: string[] = [];
    for (const [col, label] of cfg.docs) {
      const path: string | null = row[col] || null;
      let cell: string;
      if (!path) {
        cell = '<span style="color:#8A8E99;">Not uploaded</span>';
      } else if (path.startsWith('http://') || path.startsWith('https://')) {
        cell = `<a href="${esc(path)}" style="color:#C9922A;">Open</a>`;
      } else {
        const { data: signed, error: signErr } = await svc.storage
          .from(cfg.bucket)
          .createSignedUrl(path, LINK_SECONDS);
        cell = signErr || !signed
          ? `<span style="color:#E63946;">Could not create link: ` +
            `${esc(signErr?.message || 'unknown error')}</span>`
          : `<a href="${esc(signed.signedUrl)}" style="color:#C9922A;">Open</a>`;
      }
      docRows.push(
        `<tr><td style="padding:6px 12px 6px 0;color:#8A8E99;">` +
        `${esc(label)}</td><td style="padding:6px 0;">${cell}</td></tr>`);
    }

    const expires = new Date(Date.now() + LINK_SECONDS * 1000)
      .toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });
    const name = esc(row[cfg.nameCol] || 'Unnamed');

    const html =
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;` +
      `background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">` +
      `<h1 style="color:#C9922A;font-size:24px;margin:0 0 4px;">` +
      `New ${esc(cfg.title)}</h1>` +
      `<p style="color:#8A8E99;margin:0 0 20px;">${name}</p>` +
      `<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:2px;` +
      `color:#8A8E99;margin:0 0 8px;">Details</h2>` +
      `<table style="font-size:14px;border-collapse:collapse;margin-bottom:20px;">` +
      `${detailRows}</table>` +
      `<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:2px;` +
      `color:#8A8E99;margin:0 0 8px;">Documents</h2>` +
      `<table style="font-size:14px;border-collapse:collapse;margin-bottom:8px;">` +
      `${docRows.join('')}</table>` +
      `<p style="font-size:12px;color:#8A8E99;margin:0 0 24px;">` +
      `Document links expire ${esc(expires)} (48 hours). After that, ` +
      `open them from the admin page.</p>` +
      `<a href="${BASE_URL}${cfg.admin}" style="display:inline-block;` +
      `background:#C9922A;color:#000;font-weight:bold;font-size:14px;` +
      `text-transform:uppercase;letter-spacing:2px;padding:14px 28px;` +
      `border-radius:4px;text-decoration:none;">Review in admin</a></div>`;

    await sendEmail(`New ${cfg.title}: ${row[cfg.nameCol] || 'Unnamed'}`, html);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('appnotify failed:', err?.message || err);
    return NextResponse.json({ error: 'Email failed' }, { status: 502 });
  }
}
