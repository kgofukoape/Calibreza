import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rateLimit';

// ─── ABUSE PROTECTION ────────────────────────────────────────────────────────
// This route sends email through our Resend account on our verified domain.
// Left open, anyone could use it as a spam relay and burn our sender reputation.
// It cannot require login (public forms call it), so instead:
//
//   1. SAME-ORIGIN  — the request must come from our own site. Blocks casual
//                     cross-site abuse. Forgeable by scripts, hence also:
//   2. RATE LIMIT   — caps how many emails one IP can trigger.
//
// The `switch (type)` below already acts as an allow-list: unknown types 400.
const NOTIFY_LIMIT = 5;                    // emails...
const NOTIFY_WINDOW_MS = 10 * 60 * 1000;   // ...per 10 minutes per IP

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const ADMIN_EMAIL    = 'pewpew@gunx.co.za';
const FROM_EMAIL     = 'Gun X <notifications@gunx.co.za>';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    throw new Error(`Resend failed: ${err}`);
  }
  return res.json();
}

const adminAlert = (entity: string, name: string, detail: string, link: string) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">
  <h1 style="color:#C9922A;font-size:26px;margin-bottom:4px;">New ${entity}</h1>
  <p style="color:#8A8E99;margin-top:0;">Action required in your Command Center</p>
  <div style="background:#13151A;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:20px;margin:24px 0;">
    <p style="font-size:18px;font-weight:bold;color:#F0EDE8;margin:0 0 8px;">${name}</p>
    <p style="font-size:14px;color:#8A8E99;margin:0;">${detail}</p>
  </div>
  <a href="${link}" style="display:inline-block;background:#C9922A;color:black;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:14px 28px;border-radius:4px;text-decoration:none;">
    Review in Command Center →
  </a>
  <p style="color:#5A5E69;font-size:12px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
    Gun X · <a href="${BASE_URL}" style="color:#C9922A;text-decoration:none;">calibreza.vercel.app</a>
  </p>
</div>`;

// ─── AD BOOKING: EVERYTHING NEEDED TO RAISE AN INVOICE ──────────────────────
// The generic adminAlert is a nudge to go and look. For an ad booking that is
// not enough: the next action is to raise an invoice, which needs the billing
// details in front of you. Putting them in the email means you can invoice from
// your phone without opening the admin panel.
const adBookingTemplate = (d: any) => {
  const row = (label: string, value: any) =>
    value === undefined || value === null || value === ''
      ? ''
      : `<tr>
           <td style="padding:7px 0;color:#8A8E99;font-size:13px;vertical-align:top;width:170px;">${label}</td>
           <td style="padding:7px 0;color:#F0EDE8;font-size:13px;font-weight:bold;">${value}</td>
         </tr>`;

  return `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">
  <h1 style="color:#C9922A;font-size:26px;margin-bottom:4px;">Ad booking — invoice required</h1>
  <p style="color:#8A8E99;margin-top:0;font-size:14px;">
    Nothing has been charged. Approve the creative, raise the invoice, and mark it paid when the EFT reflects.
  </p>

  <div style="background:#13151A;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:20px;margin:24px 0;">
    <p style="font-size:11px;font-weight:bold;color:#C9922A;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Bill to</p>
    <table style="width:100%;border-collapse:collapse;">
      ${row('Company', d.company)}
      ${row('Registration no.', d.registration)}
      ${row('VAT no.', d.vat)}
      ${row('Contact', d.contact)}
      ${row('Email', d.email)}
      ${row('Phone', d.phone)}
    </table>
  </div>

  <div style="background:#13151A;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:20px;margin:24px 0;">
    <p style="font-size:11px;font-weight:bold;color:#C9922A;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Campaign</p>
    <table style="width:100%;border-collapse:collapse;">
      ${row('Campaign title', d.title)}
      ${row('Slot', d.slot)}
      ${row('Page', d.page)}
      ${row('Format', d.adType)}
      ${row('Starts', d.startsAt)}
      ${row('Ends', d.expiresAt)}
      ${row('Duration', d.duration ? `${d.duration} month${d.duration > 1 ? 's' : ''}` : '')}
      ${row('Rate', d.monthlyRate ? `R${Number(d.monthlyRate).toLocaleString('en-ZA')} / month` : '')}
      ${row('Click-through URL', d.clickUrl)}
    </table>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid rgba(255,255,255,0.08);margin-top:12px;">
      ${row('AMOUNT DUE', d.total ? `<span style="color:#C9922A;font-size:19px;">R${Number(d.total).toLocaleString('en-ZA')}</span>` : '')}
    </table>
    <p style="color:#5A5E69;font-size:11px;margin:10px 0 0;">Amounts include VAT where applicable.</p>
  </div>

  <a href="${BASE_URL}/admin/ads" style="display:inline-block;background:#C9922A;color:black;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:14px 28px;border-radius:4px;text-decoration:none;">
    Review creative →
  </a>

  <p style="color:#5A5E69;font-size:12px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
    Gun X · <a href="${BASE_URL}" style="color:#C9922A;text-decoration:none;">calibreza.vercel.app</a>
  </p>
</div>`;
};

const approvedTemplate = (heading: string, body: string, btnText: string, btnUrl: string) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">
  <h1 style="color:#2A9C6E;font-size:26px;margin-bottom:4px;">${heading}</h1>
  <p style="color:#8A8E99;margin-top:0;">${body}</p>
  <a href="${btnUrl}" style="display:inline-block;background:#C9922A;color:black;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:14px 28px;border-radius:4px;text-decoration:none;margin-top:20px;">
    ${btnText}
  </a>
  <p style="color:#5A5E69;font-size:12px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
    Gun X · <a href="${BASE_URL}" style="color:#C9922A;text-decoration:none;">calibreza.vercel.app</a>
  </p>
</div>`;

export async function POST(req: NextRequest) {
  try {
    // ── Same-origin check ────────────────────────────────────────────────────
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Rate limit (per IP) ──────────────────────────────────────────────────
    const ip = getClientIp(req);
    const limit = rateLimit(`notify:${ip}`, NOTIFY_LIMIT, NOTIFY_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
      );
    }

    const body     = await req.json();
    const { type } = body;

    switch (type) {

      case 'dealer_applied':
        await sendEmail(
          ADMIN_EMAIL,
          `🏪 New Dealer Application — ${body.name}`,
          adminAlert('Dealer Application', body.name, `${body.city}, ${body.province} · ${body.email}`, `${BASE_URL}/admin/dealers`)
        );
        break;

      case 'dealer_approved':
        if (body.email) {
          await sendEmail(
            body.email,
            `✓ Your Gun X Dealer Account is Approved`,
            approvedTemplate(
              'Dealer Account Approved ✓',
              `Hi ${body.contact || body.name}, your dealer account on Gun X has been approved. You can now log in and start listing.`,
              'Go to Dealer Dashboard →',
              `${BASE_URL}/dealer-dashboard`
            )
          );
        }
        break;

      case 'club_applied':
        await sendEmail(
          ADMIN_EMAIL,
          `⊕ New Club/Range Application — ${body.name}`,
          adminAlert('Club / Range Application', body.name, `${body.city}, ${body.province} · ${body.email}`, `${BASE_URL}/admin/clubs`)
        );
        break;

      case 'service_applied':
        await sendEmail(
          ADMIN_EMAIL,
          `🔧 New Service Provider — ${body.name}`,
          adminAlert('Service Provider Application', body.name, `${body.type} · ${body.city}, ${body.province} · ${body.email}`, `${BASE_URL}/admin/services`)
        );
        break;

      case 'service_approved':
        if (body.to) {
          await sendEmail(
            body.to,
            `✓ Your Gun X Service Listing is Live`,
            approvedTemplate(
              "You're Live! ✓",
              `Hi ${body.contact || body.name}, your service listing on Gun X is now active and visible to thousands of firearm owners across South Africa.`,
              'View Your Profile →',
              `${BASE_URL}/services/${body.slug}`
            )
          );
        }
        break;

      case 'job_posted':
        await sendEmail(
          ADMIN_EMAIL,
          `💼 New Job Posted — ${body.title} @ ${body.company}`,
          adminAlert('Job Listing', `${body.title} @ ${body.company}`, `${body.location} · ${body.employer_email}`, `${BASE_URL}/admin/jobs`)
        );
        break;

      case 'listing_reported':
        await sendEmail(
          ADMIN_EMAIL,
          `${body.is_urgent ? '🚨 URGENT' : '🚩'} Listing Reported — ${body.reason}`,
          adminAlert(
            'Listing Report',
            body.listing_title || 'Unknown listing',
            `Reason: ${body.reason} · ${body.is_urgent ? 'URGENT' : 'Standard'} · Contact: ${body.contact || 'Not provided'}`,
            `${BASE_URL}/admin/listings`
          )
        );
        break;

      case 'contact_form':
        await sendEmail(
          ADMIN_EMAIL,
          `📩 Contact Form — ${body.subject} from ${body.name}`,
          adminAlert(
            'Contact Form Message',
            body.name,
            `${body.email} · ${body.subject} · "${body.message?.slice(0, 100)}..."`,
            `${BASE_URL}/admin`
          )
        );
        break;

      // ── New self-service ad submission → alert admin ──────────────────────
      // ── INVOICE ISSUED ───────────────────────────────────────────────────
      // Raised automatically on the 1st for accounts on a paid tier. It records
      // what is owed; it does not take money — PayFast handles collection where
      // a recurring mandate exists.
      case 'invoice_issued':
        await sendEmail(
          body.data?.email,
          `Invoice ${body.data?.invoiceNumber} — R${Number(body.data?.total || 0).toLocaleString('en-ZA')}`,
          `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">
  <h1 style="color:#C9922A;font-size:24px;margin-bottom:4px;">Invoice ${body.data?.invoiceNumber}</h1>
  <p style="color:#8A8E99;font-size:14px;margin-top:0;">${body.data?.description}</p>

  <div style="background:#13151A;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:20px;margin:24px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="color:#8A8E99;font-size:13px;padding:6px 0;">Amount due</td>
        <td style="color:#C9922A;font-size:20px;font-weight:bold;text-align:right;">
          R${Number(body.data?.total || 0).toLocaleString('en-ZA')}
        </td>
      </tr>
      <tr>
        <td style="color:#8A8E99;font-size:13px;padding:6px 0;">Due by</td>
        <td style="color:#F0EDE8;font-size:13px;font-weight:bold;text-align:right;">${body.data?.dueDate}</td>
      </tr>
    </table>
  </div>

  <p style="color:#8A8E99;font-size:13px;line-height:1.6;">
    If you pay by recurring card mandate, this will be collected automatically and
    no action is needed — this is your record of the charge.
  </p>

  <p style="color:#5A5E69;font-size:12px;margin-top:28px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
    GX SA (Pty) Ltd · Reg 2025/830094/07 · 11 Howe Street, Observatory, Western Cape, 7925<br>
    Questions? <a href="mailto:support@gunx.co.za" style="color:#C9922A;text-decoration:none;">support@gunx.co.za</a>
  </p>
</div>`
        );
        break;

      // ── LISTING ABOUT TO EXPIRE ──────────────────────────────────────────
      // Sent 14 days out. One click renews for another 120 days; ignoring it
      // lets the listing drop off on its own, which is exactly what should
      // happen when something has sold elsewhere.
      case 'listing_expiring':
        await sendEmail(
          body.data?.email,
          `Still available? "${body.data?.title}" expires ${body.data?.expiresAt}`,
          `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">
  <h1 style="color:#C9922A;font-size:24px;margin-bottom:8px;">Is this still available?</h1>
  <p style="color:#8A8E99;font-size:15px;line-height:1.6;margin-top:0;">
    Hi ${body.data?.name || 'there'} — your listing
    <strong style="color:#F0EDE8;">${body.data?.title}</strong>
    expires on <strong style="color:#F0EDE8;">${body.data?.expiresAt}</strong>.
  </p>
  <p style="color:#8A8E99;font-size:15px;line-height:1.6;">
    If it is still for sale, renew it in one click and it stays live for another
    120 days. If it has sold, do nothing and it will come down on its own.
  </p>

  <a href="${BASE_URL}/dashboard/listings?renew=${body.data?.listingId}"
     style="display:inline-block;background:#C9922A;color:black;font-weight:bold;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:14px 28px;border-radius:4px;text-decoration:none;margin:16px 0;">
    Yes, keep it listed →
  </a>

  <p style="color:#5A5E69;font-size:12px;margin-top:28px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;">
    We expire listings after 120 days so buyers can trust that what they see is
    genuinely for sale. It is why searching Gun X is worth doing.
  </p>
</div>`
        );
        break;

      case 'ad_submitted':
        await sendEmail(
          ADMIN_EMAIL,
          `Ad booking — invoice required — ${body.data?.company || body.data?.title || 'Advertiser'} — R${(body.data?.total || 0).toLocaleString('en-ZA')}`,
          adBookingTemplate(body.data || {})
        );
        break;

      // ── Ad approved → tell advertiser to pay within 24h ───────────────────
      case 'ad_approved_pay':
        if (body.data?.email) {
          const dueStr = body.data?.dueAt
            ? new Date(body.data.dueAt).toLocaleString('en-ZA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
            : 'within 24 hours';
          await sendEmail(
            body.data.email,
            `✓ Your Gun X Ad is Approved — Payment Due Within 24 Hours`,
            approvedTemplate(
              'Ad Approved ✓ — Payment Due',
              `Hi ${body.data.name || 'there'}, your ad "${body.data.title}" has been approved. To secure your slot, please complete payment of R${(body.data.amount || 0).toLocaleString()} by ${dueStr}. If payment isn't received within 24 hours, the slot is automatically released.`,
              'Complete Payment →',
              `${BASE_URL}/advertise`
            )
          );
        }
        break;

      // ── 2-hour payment reminder ───────────────────────────────────────────
      case 'ad_payment_reminder':
        if (body.data?.email) {
          const dueStr = body.data?.dueAt
            ? new Date(body.data.dueAt).toLocaleString('en-ZA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
            : 'soon';
          await sendEmail(
            body.data.email,
            `⏳ Reminder: Pay for Your Gun X Ad Before You Lose the Slot`,
            approvedTemplate(
              'Payment Reminder ⏳',
              `Hi ${body.data.name || 'there'}, this is a reminder that payment of R${(body.data.amount || 0).toLocaleString()} for your ad "${body.data.title}" is due by ${dueStr}. If we don't receive payment, your reserved slot will be released to other advertisers.`,
              'Pay Now →',
              `${BASE_URL}/advertise`
            )
          );
        }
        break;

      // ── Slot released after non-payment ───────────────────────────────────
      case 'ad_slot_released':
        if (body.data?.email) {
          await sendEmail(
            body.data.email,
            `Your Gun X Ad Slot Has Been Released`,
            approvedTemplate(
              'Slot Released',
              `Hi ${body.data.name || 'there'}, the payment window for your ad "${body.data.title}" has closed and the slot has been released. You're welcome to rebook anytime, subject to availability.`,
              'Book Again →',
              `${BASE_URL}/advertise`
            )
          );
        }
        break;

      // ── Outside-company advertising enquiry → alert admin ─────────────────
      case 'advertiser_enquiry':
        await sendEmail(
          ADMIN_EMAIL,
          `📢 Advertising Enquiry — ${body.data?.company || body.data?.name || 'New Advertiser'}`,
          adminAlert(
            'Advertising Enquiry',
            body.data?.company || body.data?.name || 'New advertiser',
            `Contact: ${body.data?.name || ''} · ${body.data?.email || ''} · ${body.data?.phone || ''} · Preferred: ${body.data?.preference || 'not specified'}${body.data?.message ? ` · "${String(body.data.message).slice(0, 140)}"` : ''}`,
            `${BASE_URL}/admin/ads`
          )
        );
        break;

      case 'dealer_trial_ending':
        if (body.data?.email) {
          const d = body.data;
          const willArchive = Number(d.willArchive || 0);
          await sendEmail(
            d.email,
            `Your Gun X Pro trial ends in ${d.daysLeft} day${d.daysLeft === 1 ? '' : 's'}`,
            approvedTemplate(
              `Trial Ends in ${d.daysLeft} Day${d.daysLeft === 1 ? '' : 's'}`,
              `Hi ${d.name || 'there'}, your free Pro trial ends soon. You currently have ${d.totalListings || 0} live listing${d.totalListings === 1 ? '' : 's'}.` +
              (willArchive > 0
                ? ` If you don't continue on Pro, your 5 newest listings stay live and the other ${willArchive} will be moved to your archive. Nothing is deleted — subscribe any time and they all come straight back.`
                : ` You're within the free tier limit, so nothing will change.`),
              'Continue on Pro →',
              `${BASE_URL}/dealer-dashboard/subscription`
            )
          );
        }
        break;

      // ── Trial ended, dealer moved to the free tier ────────────────────────
      case 'dealer_trial_ended':
        if (body.data?.email) {
          const d = body.data;
          const archived = Number(d.archived || 0);
          await sendEmail(
            d.email,
            `Your Gun X Pro trial has ended`,
            approvedTemplate(
              'Trial Ended',
              `Hi ${d.name || 'there'}, your free Pro trial has ended and your account is now on the free tier. Your ${d.kept || 0} newest listing${d.kept === 1 ? '' : 's'} ${d.kept === 1 ? 'is' : 'are'} still live.` +
              (archived > 0
                ? ` ${archived} listing${archived === 1 ? '' : 's'} ${archived === 1 ? 'has' : 'have'} been moved to your archive — hidden from buyers, but safely stored. Subscribe to Pro and every one of them is restored instantly.`
                : ''),
              'View Plans →',
              `${BASE_URL}/dealer-dashboard/subscription`
            )
          );
        }
        break;

      // ── 7 days on the free tier with listings sitting in the archive ──────
      case 'dealer_archive_reminder':
        if (body.data?.email) {
          const d = body.data;
          await sendEmail(
            d.email,
            `${d.archived} of your listings are waiting in your archive`,
            approvedTemplate(
              'Your Archived Listings',
              `Hi ${d.name || 'there'}, you have ${d.archived} listing${d.archived === 1 ? '' : 's'} sitting in your archive where buyers can't see ${d.archived === 1 ? 'it' : 'them'}. They are safely stored and nothing has been deleted. Upgrading to Pro restores every one of them immediately, or you can restore them individually within your free tier allowance.`,
              'Restore My Listings →',
              `${BASE_URL}/dealer-dashboard/inventory`
            )
          );
        }
        break;

      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Notify API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}