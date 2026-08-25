import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── ONE-CLICK UNSUBSCRIBE ───────────────────────────────────────────────────
// GET  /api/marketing/unsubscribe?token=...   from a link in an email
// POST /api/marketing/unsubscribe             from a mail client's List-Unsubscribe
//
// NO SIGN-IN, DELIBERATELY. Someone who has forgotten their password must still
// be able to stop you emailing them. Requiring a login to unsubscribe is a dark
// pattern, and under section 11(3) of POPIA it is arguably a failure to provide
// the means to object at all.
//
// The token is single-purpose: it can turn marketing off and nothing else. It
// cannot read the account, change it, or sign anybody in. Worst case if a token
// leaks is that a stranger unsubscribes someone from a newsletter — annoying,
// and far less bad than the alternative of making unsubscribing hard.

async function withdraw(token: string) {
  if (!token) return { ok: false, message: 'This unsubscribe link is not valid.' };

  const { data: user } = await supabase
    .from('users')
    .select('id, email, marketing_consent')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (!user) {
    return { ok: false, message: 'This unsubscribe link is not valid or has already been used.' };
  }

  if (!user.marketing_consent) {
    // Already off. Say so plainly rather than implying something changed.
    return { ok: true, message: `${user.email} is already unsubscribed from marketing emails.`, already: true };
  }

  const { error } = await supabase.rpc('set_marketing_consent', {
    p_user_id: user.id,
    p_consent: false,
    p_source: 'email_unsubscribe',
  });

  if (error) {
    console.error('[unsubscribe]', error);
    return { ok: false, message: 'Something went wrong. Please email support@gunx.co.za and we will action it by hand.' };
  }

  return { ok: true, message: `${user.email} has been unsubscribed from marketing emails.` };
}

function page(title: string, body: string, tone: 'ok' | 'error') {
  const accent = tone === 'ok' ? '#C9922A' : '#E63946';
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · Gun X</title>
<style>
  body{margin:0;background:#0D0F13;color:#F0EDE8;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;
       display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
  .card{max-width:480px;background:#13151A;border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:40px;text-align:center}
  h1{color:${accent};font-size:26px;margin:0 0 12px;letter-spacing:-.5px}
  p{color:#8A8E99;font-size:15px;line-height:1.6;margin:0 0 8px}
  .note{color:#5A5E69;font-size:13px;margin-top:24px;border-top:1px solid rgba(255,255,255,.05);padding-top:20px}
  a{color:#C9922A;text-decoration:none;font-weight:600}
</style></head>
<body><div class="card">
  <h1>${title}</h1>
  <p>${body}</p>
  <p class="note">
    You will still receive messages you need in order to use your account —
    enquiry notifications, billing notices and security alerts. Those are part of
    the service, not marketing.<br><br>
    <a href="https://gunx.co.za">Return to Gun X</a>
  </p>
</div></body></html>`;
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') || '';
  const result = await withdraw(token);

  return new NextResponse(
    page(
      result.ok ? (result.already ? 'Already unsubscribed' : 'Unsubscribed') : 'Link not valid',
      result.message,
      result.ok ? 'ok' : 'error',
    ),
    { status: result.ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

// Gmail and Outlook will POST here when the recipient uses their mail client's
// own unsubscribe button, provided the email carries the List-Unsubscribe and
// List-Unsubscribe-Post headers.
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let token = url.searchParams.get('token') || '';

  if (!token) {
    try {
      const body = await req.json();
      token = body?.token || '';
    } catch { /* form-encoded or empty body — the query parameter is the norm */ }
  }

  const result = await withdraw(token);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}