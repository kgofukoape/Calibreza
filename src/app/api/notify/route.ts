import { NextRequest, NextResponse } from 'next/server';

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
      case 'ad_submitted':
        await sendEmail(
          ADMIN_EMAIL,
          `📢 New Ad Submission — ${body.data?.company || body.data?.title || 'Advertiser'}`,
          adminAlert(
            'Ad Submission',
            body.data?.title || 'Untitled campaign',
            `${body.data?.slot || ''} on ${body.data?.page || ''} · R${(body.data?.total || 0).toLocaleString()} · awaiting review`,
            `${BASE_URL}/admin/ads`
          )
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

      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Notify API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
