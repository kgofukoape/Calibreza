import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://calibreza.vercel.app';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=error&msg=Invalid+confirmation+link`);
  }

  // Fetch RSVP
  const { data: rsvp, error: rsvpErr } = await supabase
    .from('shoot_rsvps')
    .select('*, clubs(*)')
    .eq('confirmation_token', token)
    .single();

  if (rsvpErr || !rsvp) {
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=error&msg=Booking+not+found`);
  }

  if (rsvp.status === 'confirmed') {
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=already&name=${encodeURIComponent(rsvp.user_name)}&range=${encodeURIComponent(rsvp.clubs?.name || '')}`);
  }

  if (rsvp.status === 'declined') {
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=already_declined&name=${encodeURIComponent(rsvp.user_name)}`);
  }

  // Update status to confirmed
  const { error: updateErr } = await supabase
    .from('shoot_rsvps')
    .update({ status: 'confirmed' })
    .eq('confirmation_token', token);

  if (updateErr) {
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=error&msg=Could+not+update+booking`);
  }

  const club = rsvp.clubs;
  const shootDate = rsvp.shoot_date
    ? new Date(rsvp.shoot_date + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : rsvp.day;

  // Send confirmation email to shooter
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Gun X <onboarding@resend.dev>',
      to: [rsvp.user_email],
      subject: `✅ Booking Confirmed — ${club?.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0F13; color: #F0EDE8; padding: 32px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="width: 64px; height: 64px; background: rgba(42,156,110,0.15); border: 2px solid #2A9C6E; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">✅</div>
          </div>
          <h1 style="color: #2A9C6E; font-size: 28px; margin-bottom: 4px; text-align: center;">Booking Confirmed!</h1>
          <p style="color: #8A8E99; margin-top: 0; text-align: center;">Your visit to ${club?.name} has been approved</p>

          <div style="background: #13151A; border: 1px solid rgba(42,156,110,0.3); border-radius: 6px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #8A8E99; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Range</td><td style="color: #F0EDE8; font-weight: bold; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${club?.name}</td></tr>
              <tr><td style="color: #8A8E99; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Date</td><td style="color: #C9922A; font-weight: bold; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${shootDate}</td></tr>
              ${rsvp.time_slot_id ? '' : ''}
              <tr><td style="color: #8A8E99; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">People</td><td style="color: #F0EDE8; font-weight: bold; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${rsvp.pax} person${rsvp.pax > 1 ? 's' : ''}</td></tr>
              <tr><td style="color: #8A8E99; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; padding: 10px 0;">Status</td><td style="padding: 10px 0; text-align: right;"><span style="background: rgba(42,156,110,0.15); color: #2A9C6E; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Confirmed ✓</span></td></tr>
            </table>
          </div>

          <div style="background: #13151A; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #8A8E99; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Contact the range</p>
            ${club?.phone ? `<p style="margin: 4px 0;"><a href="tel:${club.phone}" style="color: #C9922A; font-weight: bold; text-decoration: none;">${club.phone}</a></p>` : ''}
            ${club?.email ? `<p style="margin: 4px 0;"><a href="mailto:${club.email}" style="color: #C9922A; text-decoration: none;">${club.email}</a></p>` : ''}
            ${club?.address ? `<p style="margin: 4px 0; color: #8A8E99; font-size: 13px;">${club.address}</p>` : ''}
          </div>

          <p style="color: #8A8E99; font-size: 13px; line-height: 1.6; background: rgba(201,146,42,0.08); border: 1px solid rgba(201,146,42,0.2); border-radius: 6px; padding: 12px 16px;">
            <strong style="color: #C9922A;">📋 Remember to bring:</strong> Valid SA ID, firearm licence, eye & ear protection, and appropriate footwear.
          </p>

          <p style="color: #5A5E69; font-size: 12px; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; text-align: center;">
            Sent by Gun X · <a href="${BASE_URL}" style="color: #C9922A; text-decoration: none;">calibreza.vercel.app</a>
          </p>
        </div>
      `,
    }),
  });

  return NextResponse.redirect(
    `${BASE_URL}/rsvp-result?status=confirmed&name=${encodeURIComponent(rsvp.user_name)}&email=${encodeURIComponent(rsvp.user_email)}&range=${encodeURIComponent(club?.name || '')}&date=${encodeURIComponent(shootDate)}`
  );
}
