import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { token, rsvp, club } = await req.json();

    if (!rsvp?.user_email || !club?.email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const confirmUrl = `${BASE_URL}/api/rsvp/confirm?token=${token}`;
    const declineUrl = `${BASE_URL}/api/rsvp/decline?token=${token}`;

    const shootDate = rsvp.shoot_date
      ? new Date(rsvp.shoot_date + 'T12:00:00').toLocaleDateString('en-ZA', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
      : rsvp.day;

    const sendEmail = async (to: string, subject: string, html: string) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: 'Gun X <onboarding@resend.dev>', to: [to], subject, html }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('Resend error:', err);
        throw new Error(`Resend failed: ${err}`);
      }
      return res.json();
    };

    // ── EMAIL 1: To the RANGE — with Confirm / Decline buttons ──
    await sendEmail(
      club.email,
      `New Booking Request — ${rsvp.user_name} · ${shootDate}`,
      `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">
        <h1 style="color:#C9922A;font-size:26px;margin-bottom:4px;">New Booking Request</h1>
        <p style="color:#8A8E99;margin-top:0;">Someone wants to visit ${club.name}</p>

        <div style="background:#13151A;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:20px;margin:24px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Name</td><td style="color:#F0EDE8;font-weight:bold;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${rsvp.user_name}</td></tr>
            <tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Email</td><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;"><a href="mailto:${rsvp.user_email}" style="color:#C9922A;text-decoration:none;">${rsvp.user_email}</a></td></tr>
            ${rsvp.user_phone ? `<tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Phone</td><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;"><a href="tel:${rsvp.user_phone}" style="color:#C9922A;font-weight:bold;text-decoration:none;">${rsvp.user_phone}</a></td></tr>` : ''}
            <tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Date</td><td style="color:#C9922A;font-weight:bold;font-size:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${shootDate}</td></tr>
            ${rsvp.time_slot ? `<tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Time</td><td style="color:#F0EDE8;font-weight:bold;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">⏰ ${rsvp.time_slot}</td></tr>` : ''}
            <tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">People</td><td style="color:#F0EDE8;font-weight:bold;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${rsvp.pax} person${rsvp.pax > 1 ? 's' : ''}</td></tr>
            ${rsvp.notes ? `<tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;">Notes</td><td style="color:#F0EDE8;padding:10px 0;text-align:right;">${rsvp.notes}</td></tr>` : ''}
          </table>
        </div>

        <p style="color:#8A8E99;font-size:13px;text-align:center;margin-bottom:16px;">Review this booking and take action:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:0 8px 0 0;width:50%;">
              <a href="${confirmUrl}" style="display:block;background:#2A9C6E;color:#fff;font-weight:bold;text-transform:uppercase;letter-spacing:2px;font-size:14px;padding:16px;border-radius:4px;text-decoration:none;text-align:center;">✓ Confirm Booking</a>
            </td>
            <td style="padding:0 0 0 8px;width:50%;">
              <a href="${declineUrl}" style="display:block;background:transparent;border:1px solid rgba(239,68,68,0.4);color:#f87171;font-weight:bold;text-transform:uppercase;letter-spacing:2px;font-size:14px;padding:16px;border-radius:4px;text-decoration:none;text-align:center;">✕ Decline</a>
            </td>
          </tr>
        </table>

        <p style="color:#5A5E69;font-size:12px;text-align:center;margin-bottom:4px;">Clicking Confirm sends ${rsvp.user_name} a confirmation email automatically.</p>
        <p style="color:#5A5E69;font-size:12px;text-align:center;">These links are single-use and unique to this booking.</p>

        <p style="color:#5A5E69;font-size:12px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;text-align:center;">
          Sent by Gun X · <a href="${BASE_URL}" style="color:#C9922A;text-decoration:none;">calibreza.vercel.app</a>
        </p>
      </div>
      `
    );

    // ── EMAIL 2: To the SHOOTER — pending confirmation ──
    await sendEmail(
      rsvp.user_email,
      `Booking Request Received — ${club.name}`,
      `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0D0F13;color:#F0EDE8;padding:32px;border-radius:8px;">
        <h1 style="color:#C9922A;font-size:26px;margin-bottom:4px;">Request Received!</h1>
        <p style="color:#8A8E99;margin-top:0;">Hi ${rsvp.user_name}, your booking request has been sent to ${club.name}</p>

        <div style="background:#13151A;border:1px solid rgba(201,146,42,0.3);border-radius:6px;padding:20px;margin:24px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Range</td><td style="color:#F0EDE8;font-weight:bold;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${club.name}</td></tr>
            <tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Date</td><td style="color:#C9922A;font-weight:bold;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${shootDate}</td></tr>
            ${rsvp.time_slot ? `<tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">Time</td><td style="color:#F0EDE8;font-weight:bold;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">⏰ ${rsvp.time_slot}</td></tr>` : ''}
            <tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">People</td><td style="color:#F0EDE8;font-weight:bold;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">${rsvp.pax}</td></tr>
            <tr><td style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;padding:10px 0;">Status</td><td style="padding:10px 0;text-align:right;"><span style="background:rgba(201,146,42,0.15);color:#C9922A;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:bold;text-transform:uppercase;">Awaiting Confirmation</span></td></tr>
          </table>
        </div>

        <div style="background:rgba(201,146,42,0.08);border:1px solid rgba(201,146,42,0.2);border-radius:6px;padding:14px 16px;margin-bottom:24px;">
          <p style="color:#C9922A;font-weight:bold;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">⏳ Awaiting Range Confirmation</p>
          <p style="color:#8A8E99;font-size:13px;margin:0;line-height:1.6;">${club.name} will confirm your booking shortly. You'll receive another email once approved. <strong style="color:#C9922A;">Please don't arrive until confirmed.</strong></p>
        </div>

        <div style="background:#13151A;border:1px solid rgba(255,255,255,0.05);border-radius:6px;padding:14px 16px;">
          <p style="color:#8A8E99;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Contact the range directly</p>
          ${club.phone ? `<p style="margin:4px 0;"><a href="tel:${club.phone}" style="color:#C9922A;font-weight:bold;text-decoration:none;">${club.phone}</a></p>` : ''}
          ${club.email ? `<p style="margin:4px 0;"><a href="mailto:${club.email}" style="color:#C9922A;text-decoration:none;">${club.email}</a></p>` : ''}
        </div>

        <p style="color:#5A5E69;font-size:12px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.05);padding-top:16px;text-align:center;">
          Sent by Gun X · <a href="${BASE_URL}" style="color:#C9922A;text-decoration:none;">calibreza.vercel.app</a>
        </p>
      </div>
      `
    );

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Notify RSVP error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
