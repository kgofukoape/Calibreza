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
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=error&msg=Invalid+link`);
  }

  const { data: rsvp, error: rsvpErr } = await supabase
    .from('shoot_rsvps')
    .select('*, clubs(*)')
    .eq('confirmation_token', token)
    .single();

  if (rsvpErr || !rsvp) {
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=error&msg=Booking+not+found`);
  }

  if (rsvp.status === 'declined') {
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=already_declined&name=${encodeURIComponent(rsvp.user_name)}`);
  }

  if (rsvp.status === 'confirmed') {
    return NextResponse.redirect(`${BASE_URL}/rsvp-result?status=already&name=${encodeURIComponent(rsvp.user_name)}&range=${encodeURIComponent(rsvp.clubs?.name || '')}`);
  }

  // Update status to declined
  await supabase
    .from('shoot_rsvps')
    .update({ status: 'declined' })
    .eq('confirmation_token', token);

  const club = rsvp.clubs;
  const shootDate = rsvp.shoot_date
    ? new Date(rsvp.shoot_date + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : rsvp.day;

  // Send decline email to shooter
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Gun X <onboarding@resend.dev>',
      to: [rsvp.user_email],
      subject: `Booking Update — ${club?.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0F13; color: #F0EDE8; padding: 32px; border-radius: 8px;">
          <h1 style="color: #C9922A; font-size: 26px; margin-bottom: 4px;">Booking Update</h1>
          <p style="color: #8A8E99; margin-top: 0;">Hi ${rsvp.user_name}, regarding your visit to ${club?.name}</p>

          <div style="background: #13151A; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 20px; margin: 24px 0;">
            <p style="color: #8A8E99; font-size: 13px; line-height: 1.7; margin: 0;">
              Unfortunately ${club?.name} is unable to accommodate your booking for <strong style="color: #F0EDE8;">${shootDate}</strong>. 
              This could be due to capacity, scheduling, or availability on that day.
            </p>
          </div>

          <p style="color: #8A8E99; font-size: 13px; line-height: 1.6;">Please contact the range directly to find a suitable alternative date.</p>

          <div style="margin: 24px 0;">
            ${club?.phone ? `<a href="tel:${club.phone}" style="display: inline-block; background: #C9922A; color: #000; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-size: 13px; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin-right: 12px;">📞 Call Range</a>` : ''}
            ${club?.email ? `<a href="mailto:${club.email}" style="display: inline-block; border: 1px solid rgba(255,255,255,0.2); color: #F0EDE8; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-size: 13px; padding: 12px 24px; border-radius: 4px; text-decoration: none;">✉ Email Range</a>` : ''}
          </div>

          <p style="color: #5A5E69; font-size: 12px; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; text-align: center;">
            Sent by Gun X · <a href="${BASE_URL}" style="color: #C9922A; text-decoration: none;">calibreza.vercel.app</a>
          </p>
        </div>
      `,
    }),
  });

  return NextResponse.redirect(
    `${BASE_URL}/rsvp-result?status=declined&name=${encodeURIComponent(rsvp.user_name)}&email=${encodeURIComponent(rsvp.user_email)}&range=${encodeURIComponent(club?.name || '')}`
  );
}
