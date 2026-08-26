import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from '@/lib/adminSession';
import { buildInvoice, nextInvoiceNumber } from '@/lib/invoices';

// ─── AD LIFECYCLE (ADMIN) ────────────────────────────────────────────────────
// Every write the Ad Manager makes goes through here rather than the browser
// Supabase client.
//
// WHY: the ads table's public SELECT policy is `status = 'active'`, and there
// is no policy granting the anon user UPDATE. Run from the browser, the Ad
// Manager could not see pending submissions and its approvals would fail
// silently — the same fault that was hiding pending dealer applications.
//
// Actions: approve · reject · mark_paid · pause · resume · create · update ·
//          delete · set_mobile_creative

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

const ACTIONS = [
  'approve', 'reject', 'mark_paid', 'pause', 'resume',
  'create', 'update', 'delete', 'set_mobile_creative',
];

async function notify(type: string, data: Record<string, any>) {
  try {
    await fetch(`${BASE_URL}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    });
  } catch (e) {
    console.error(`notify ${type} failed:`, e);
  }
}

export async function POST(req: NextRequest) {
  const secret  = process.env.ADMIN_SESSION_SECRET;
  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await verifyAdminSession(session, secret ?? ''))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const action: string = body?.action;
  const adId: string   = String(body?.adId || '');

  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // ── CREATE — admin-made ads are trusted and go live immediately ───────────
  if (action === 'create') {
    const payload = { ...(body?.payload || {}) };
    const { data, error } = await supabase.from('ads').insert(payload).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, ad: data, message: 'Ad created and live.' });
  }

  if (!adId) {
    return NextResponse.json({ error: 'Missing ad id' }, { status: 400 });
  }

  const { data: ad, error: fetchErr } = await supabase
    .from('ads').select('*').eq('id', adId).single();

  if (fetchErr || !ad) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────
  if (action === 'update') {
    const payload = { ...(body?.payload || {}) };
    const { error } = await supabase.from('ads').update(payload).eq('id', adId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: 'Ad updated.' });
  }

  // ── APPROVE — raises the invoice and opens the payment window ─────────────
  // Advertising is sales-led: the advertiser books, you approve, they are
  // invoiced, and the campaign goes live when payment reflects. The invoice was
  // the missing step — approval opened a payment window without ever telling
  // anyone what to pay or producing a document to pay against.
  //
  // Note it reads amount_due, not amount_paid. The booking form used to write
  // the total into amount_paid before anyone had been invoiced, which recorded
  // money as received that nobody had sent.
  if (action === 'approve') {
    const approvedAt = new Date();
    const dueAt = new Date(approvedAt.getTime() + 24 * 60 * 60 * 1000);

    const { error } = await supabase.from('ads').update({
      status: 'approved_awaiting_payment',
      reviewed_at: approvedAt.toISOString(),
      approved_at: approvedAt.toISOString(),
      payment_due_at: dueAt.toISOString(),
      payment_reminder_sent: false,
      review_notes: null,
    }).eq('id', adId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const amount = Number(ad.amount_due ?? ad.amount_paid ?? 0);
    let invoiceNumber: string | null = null;

    if (amount > 0 && ad.client_email) {
      try {
        const year = approvedAt.getFullYear();
        const { count } = await supabase
          .from('invoices').select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(year, 0, 1).toISOString());

        const inv = buildInvoice({
          invoiceNumber: nextInvoiceNumber(year, count || 0),
          clientType: 'advertiser',
          clientId: adId,
          clientName: ad.client_company || ad.client_name,
          clientEmail: ad.client_email,
          description: `Advertising — ${ad.title}`,
          lines: [{ description: `${ad.slot || 'Banner'} placement · ${ad.title}`, amount }],
          // Short, because the slot is held for 24 hours and released after.
          // A 14-day invoice against a 24-hour hold would promise something
          // the system will not honour.
          dueInDays: 1,
          notes: 'Payment by EFT. The slot is held for 24 hours from approval.',
          autoGenerated: true,
        });

        const { error: invErr } = await supabase.from('invoices').insert(inv);
        if (invErr) console.error('[admin/ads] invoice failed', invErr);
        else invoiceNumber = inv.invoice_number;
      } catch (e) {
        // The approval stands. A failed invoice is a thing you can raise by
        // hand; an approval that silently did not happen is not.
        console.error('[admin/ads] invoice generation failed', e);
      }
    }

    await notify('ad_approved_pay', {
      email: ad.client_email, name: ad.client_name, title: ad.title,
      amount, dueAt: dueAt.toISOString(), invoiceNumber,
    });

    return NextResponse.json({
      ok: true,
      status: 'approved_awaiting_payment',
      payment_due_at: dueAt.toISOString(),
      invoice_number: invoiceNumber,
      message: invoiceNumber
        ? `Approved and invoice ${invoiceNumber} raised. The advertiser has 24 hours to pay before the slot is released.`
        : 'Approved. The advertiser has 24 hours to pay before the slot is released. No invoice was raised — check the amount and billing email.',
    });
  }

  // ── REJECT ────────────────────────────────────────────────────────────────
  if (action === 'reject') {
    const reason = String(body?.reason || '').trim();
    if (reason.length < 3) {
      return NextResponse.json({ error: 'A reason is required to reject a submission.' }, { status: 400 });
    }

    const { error } = await supabase.from('ads').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      review_notes: reason,
    }).eq('id', adId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: 'rejected', message: 'Submission rejected. No charge applies.' });
  }

  // ── MARK PAID — the ad goes live ──────────────────────────────────────────
  if (action === 'mark_paid') {
    const { error } = await supabase.from('ads').update({
      status: 'active',
      paid_at: new Date().toISOString(),
    }).eq('id', adId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: 'active', message: 'Payment recorded. The ad is now live.' });
  }

  // ── PAUSE / RESUME ────────────────────────────────────────────────────────
  if (action === 'pause' || action === 'resume') {
    const next = action === 'pause' ? 'paused' : 'active';
    const { error } = await supabase.from('ads').update({ status: next }).eq('id', adId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: next, message: `Ad ${next}.` });
  }

  // ── SET MOBILE CREATIVE ───────────────────────────────────────────────────
  // Lets you fill in a missing mobile banner for a sidebar booking rather than
  // letting the desktop skyscraper get stretched into the phone feed.
  if (action === 'set_mobile_creative') {
    const url = String(body?.mobileFileUrl || '');
    if (!url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }
    const { error } = await supabase.from('ads').update({ mobile_file_url: url }).eq('id', adId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: 'Mobile creative saved.' });
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (action === 'delete') {
    const { error } = await supabase.from('ads').delete().eq('id', adId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: 'Ad deleted.' });
  }

  return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });
}