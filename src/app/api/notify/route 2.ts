import { NextRequest, NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const ADMIN_EMAIL    = 'kgofu.koape@gmail.com';
const FROM_EMAIL     = 'notifications@gunx.co.za'; // Change to your verified Resend domain

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  return res.ok;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://calibreza.co.za';

// ── Email templates ────────────────────────────────────────────────────────────

const adminAlert = (entity: string, name: string, detail: string, link: string) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:4px;">
  <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:24px;">
    <span style="background:#E63946;color:white;font-weight:900;font-size:14px;padding:4px 10px;border-radius:2px;letter-spacing:2px;text-transform:uppercase;">GUN X</span>
    <span style="font-size:12px;color:#8A8E99;margin-left:12px;text-transform:uppercase;letter-spacing:2px;">Command Center Alert</span>
  </div>
  <h1 style="font-size:24px;font-weight:900;text-transform:uppercase;color:#C9922A;margin:0 0 8px;">New ${entity} Application</h1>
  <p style="font-size:16px;color:#F0EDE8;margin:0 0 4px;"><strong>${name}</strong></p>
  <p style="font-size:13px;color:#8A8E99;margin:0 0 24px;">${detail}</p>
  <a href="${link}" style="display:inline-block;background:#C9922A;color:black;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:2px;padding:12px 24px;border-radius:2px;text-decoration:none;">
    Review in Command Center →
  </a>
  <p style="font-size:11px;color:#8A8E99;margin-top:24px;">Gun X Command Center · Automated Alert</p>
</div>`;

const providerApproved = (name: string, contact: string, type: string, profileUrl: string) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:4px;">
  <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:24px;">
    <span style="background:#C9922A;color:black;font-weight:900;font-size:14px;padding:4px 10px;border-radius:2px;letter-spacing:2px;text-transform:uppercase;">GUN X</span>
  </div>
  <h1 style="font-size:28px;font-weight:900;text-transform:uppercase;color:#10B981;margin:0 0 8px;">You're Live! ✓</h1>
  <p style="font-size:15px;color:#F0EDE8;margin:0 0 16px;">Hi <strong>${contact || name}</strong>, your ${type} listing on Gun X has been approved and is now live.</p>
  <p style="font-size:13px;color:#8A8E99;margin:0 0 24px;">Your public profile is now visible to thousands of licensed firearm owners across South Africa.</p>
  <a href="${profileUrl}" style="display:inline-block;background:#C9922A;color:black;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:2px;padding:12px 24px;border-radius:2px;text-decoration:none;">
    View Your Profile →
  </a>
  <p style="font-size:11px;color:#8A8E99;margin-top:32px;">To manage your listing, log in and visit your dashboard. — Gun X Team</p>
</div>`;

const dealerApproved = (name: string, contact: string, slug: string) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:4px;">
  <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:16px;margin-bottom:24px;">
    <span style="background:#C9922A;color:black;font-weight:900;font-size:14px;padding:4px 10px;border-radius:2px;letter-spacing:2px;text-transform:uppercase;">GUN X</span>
  </div>
  <h1 style="font-size:28px;font-weight:900;text-transform:uppercase;color:#10B981;margin:0 0 8px;">Dealer Account Approved ✓</h1>
  <p style="font-size:15px;color:#F0EDE8;margin:0 0 16px;">Hi <strong>${contact || name}</strong>, your dealer account on Gun X has been approved!</p>
  <p style="font-size:13px;color:#8A8E99;margin:0 0 24px;">You can now log in to your dealer dashboard, add inventory, and start reaching thousands of buyers.</p>
  <a href="${BASE_URL}/dealers/${slug}" style="display:inline-block;background:#C9922A;color:black;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:2px;padding:12px 24px;border-radius:2px;text-decoration:none;margin-right:12px;">
    View Storefront →
  </a>
  <a href="${BASE_URL}/dealer-dashboard" style="display:inline-block;background:transparent;color:#C9922A;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:2px;padding:12px 24px;border-radius:2px;text-decoration:none;border:1px solid #C9922A;">
    Go to Dashboard →
  </a>
  <p style="font-size:11px;color:#8A8E99;margin-top:32px;">Welcome to the Gun X dealer network. — Gun X Team</p>
</div>`;

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    switch (type) {

      // ── New dealer application → ping admin ──────────────────────────
      case 'dealer_applied': {
        await sendEmail(
          ADMIN_EMAIL,
          `🏪 New Dealer Application — ${body.name}`,
          adminAlert('Dealer', body.name, `${body.city}, ${body.province} · ${body.email}`, `${BASE_URL}/admin/dealers`)
        );
        break;
      }

      // ── Dealer approved → notify dealer ─────────────────────────────
      case 'dealer_approved': {
        if (body.email) {
          await sendEmail(
            body.email,
            `✓ Your Gun X Dealer Account is Approved — ${body.name}`,
            dealerApproved(body.name, body.contact, body.slug)
          );
        }
        break;
      }

      // ── New club application → ping admin ───────────────────────────
      case 'club_applied': {
        await sendEmail(
          ADMIN_EMAIL,
          `⊕ New Club/Range Application — ${body.name}`,
          adminAlert('Club / Range', body.name, `${body.city}, ${body.province} · ${body.email}`, `${BASE_URL}/admin/clubs`)
        );
        break;
      }

      // ── New service provider application → ping admin ────────────────
      case 'service_applied': {
        await sendEmail(
          ADMIN_EMAIL,
          `🔧 New Service Provider — ${body.name}`,
          adminAlert('Service Provider', body.name, `${body.type} · ${body.city}, ${body.province} · ${body.email}`, `${BASE_URL}/admin/services`)
        );
        break;
      }

      // ── Service provider approved → notify provider ──────────────────
      case 'service_approved': {
        if (body.to) {
          await sendEmail(
            body.to,
            `✓ Your Gun X Service Listing is Live — ${body.name}`,
            providerApproved(body.name, body.contact, 'service provider', `${BASE_URL}/services/${body.slug}`)
          );
        }
        break;
      }

      // ── New job posting → ping admin ─────────────────────────────────
      case 'job_posted': {
        await sendEmail(
          ADMIN_EMAIL,
          `💼 New Job Posted — ${body.title} @ ${body.company}`,
          adminAlert('Job Listing', `${body.title} @ ${body.company}`, `${body.location} · ${body.category} · ${body.employer_email}`, `${BASE_URL}/admin/jobs`)
        );
        break;
      }

      default:
        return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Notify API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
