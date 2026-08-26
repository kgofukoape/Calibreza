import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminGuard';
import { ok, fail, missingField, audit } from '@/lib/adminApi';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { CONSENT_BUNDLE_VERSION } from '@/lib/legal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = 'Gun X <news@gunx.co.za>';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gunx.co.za';

// ─── MARKETING BROADCAST ─────────────────────────────────────────────────────
// POST /api/admin/broadcast
//
//   preview   how many people would receive this, and a sample
//   send      send it
//
// CONSENT IS READ AT SEND TIME, NEVER FROM A LIST
// The audience is computed from users.marketing_consent in the same request
// that sends the email. Not from a CSV exported last week, not from a saved
// segment. Under POPIA consent must be current and withdrawable — someone who
// unsubscribed this morning must not receive tonight's send, and the only way
// to guarantee that is to ask the database at the moment of sending.
//
// EVERY SEND IS RECORDED: who sent it, the audience filter, the recipient
// count, and the consent bundle version in force. If the Regulator ever asks
// what basis you had for emailing a particular person, the answer should be a
// record rather than a recollection.
//
// SERVICE MESSAGES DO NOT COME THROUGH HERE. Enquiry notifications, billing and
// security alerts are part of the contract and go via /api/notify regardless of
// marketing consent. Routing them through this endpoint would wrongly suppress
// mail people are entitled to receive.

interface Recipient {
  id: string;
  email: string;
  full_name: string | null;
  unsubscribe_token: string;
}

async function audience(filter: string): Promise<Recipient[]> {
  // The consent condition is not optional and is applied first, so a mistake in
  // the filter below can only ever narrow the audience, never widen it past
  // people who agreed.
  let query = supabase
    .from('users')
    .select('id, email, full_name, unsubscribe_token, account_type, province')
    .eq('marketing_consent', true)
    .not('email', 'is', null);

  if (filter === 'personal') query = query.eq('account_type', 'personal');
  if (filter === 'business') query = query.eq('account_type', 'business');

  const { data } = await query.limit(5000);
  return (data || []) as Recipient[];
}

function wrap(html: string, name: string | null, token: string) {
  const unsubscribe = `${BASE_URL}/api/marketing/unsubscribe?token=${token}`;

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">
  ${name ? `<p style="color:#8A8E99;font-size:14px;margin-top:0;">Hi ${name},</p>` : ''}
  ${html}
  <div style="color:#5A5E69;font-size:12px;margin-top:36px;border-top:1px solid rgba(255,255,255,0.06);padding-top:18px;line-height:1.6;">
    You are receiving this because you agreed to marketing emails when you
    registered on Gun X.<br>
    <a href="${unsubscribe}" style="color:#C9922A;">Unsubscribe</a> — one click, no sign-in needed.<br><br>
    GX SA (Pty) Ltd · Reg 2025/830094/07 · 11 Howe Street, Observatory, Western Cape, 7925
  </div>
</div>`;
}

async function sendOne(to: string, subject: string, html: string, token: string) {
  // List-Unsubscribe lets Gmail and Outlook show their own unsubscribe button.
  // Beyond being courteous, mail providers treat its absence as a spam signal —
  // making it hard to unsubscribe is the fastest way to stop being delivered.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${BASE_URL}/api/marketing/unsubscribe?token=${token}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const ip = getClientIp(req);
  const limit = rateLimit(`admin-broadcast:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return fail('Too many broadcast requests. Try again shortly.', 429);

  try {
    const body = await req.json();
    const { action, subject, html, filter = 'all' } = body;

    const missing = missingField(body, ['action']);
    if (missing) return fail(`${missing} is required`);

    if (!['all', 'personal', 'business'].includes(filter)) {
      return fail('filter must be all, personal or business');
    }

    // ── PREVIEW ──────────────────────────────────────────────────────────
    // Always run this before sending. A broadcast cannot be recalled, and the
    // difference between 12 recipients and 1,200 is worth knowing beforehand.
    if (action === 'preview') {
      const list = await audience(filter);
      const { count: totalUsers } = await supabase
        .from('users').select('id', { count: 'exact', head: true });

      return ok(`${list.length} people would receive this`, {
        recipients: list.length,
        totalUsers: totalUsers || 0,
        optedOut: (totalUsers || 0) - list.length,
        sample: list.slice(0, 5).map(r => r.email),
        filter,
      });
    }

    // ── SEND ─────────────────────────────────────────────────────────────
    if (action === 'send') {
      if (!RESEND_KEY) return fail('Email is not configured on this deployment', 500);

      const missingContent = missingField(body, ['subject', 'html']);
      if (missingContent) return fail(`${missingContent} is required`);

      if (String(subject).trim().length < 3) return fail('The subject is too short');
      if (String(html).trim().length < 20)  return fail('The message is too short');

      const list = await audience(filter);
      if (list.length === 0) {
        return fail('Nobody has consented to marketing in this audience. Nothing was sent.', 400);
      }

      let sent = 0;
      let failed = 0;

      for (const r of list) {
        const okSend = await sendOne(
          r.email, subject, wrap(html, r.full_name, r.unsubscribe_token), r.unsubscribe_token,
        ).catch(() => false);

        if (okSend) sent++; else failed++;

        // Resend permits 10 per second on the standard plan. Pausing is
        // cheaper than being rate-limited halfway through a send and having no
        // reliable way to tell who already received it.
        await new Promise(res => setTimeout(res, 120));
      }

      await audit(supabase, {
        action: 'broadcast.send',
        entity: 'marketing',
        reason: subject,
        after: {
          filter,
          audienceSize: list.length,
          sent,
          failed,
          // The version of the consent wording people agreed to. If the terms
          // change, this says which set this send relied on.
          consentBundleVersion: CONSENT_BUNDLE_VERSION,
          sentAt: new Date().toISOString(),
        },
      });

      return ok(
        `Sent to ${sent} of ${list.length}${failed ? `, ${failed} failed` : ''}.`,
        { sent, failed, audienceSize: list.length },
      );
    }

    return fail(`Unknown action: ${action}`);

  } catch (error: any) {
    console.error('[admin/broadcast]', error);
    return fail(error.message, 500);
  }
}