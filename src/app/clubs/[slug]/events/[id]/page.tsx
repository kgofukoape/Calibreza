'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AdBanner from '@/components/AdBanner';
import { supabase } from '@/lib/supabase';
import { TYPE_LABEL, fmtWhen, waLink, safeUrl } from '@/components/clubs/clubPublic';

// One club event, shareable on its own link. Registration happens on the
// club's own link (usually PractiScore); Gun X does not take bookings.

export default function ClubEventPage() {
  const { slug, id } = useParams() as { slug: string; id: string };
  const [club, setClub] = useState<any>(null);
  const [ev, setEv] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('shooting_clubs_public')
        .select('id, name, slug, logo_url, phone, whatsapp').eq('slug', slug).maybeSingle();
      if (!c) { setStatus('missing'); return; }
      const { data: e } = await supabase.from('club_events').select('*')
        .eq('id', id).eq('club_id', c.id).maybeSingle();
      if (!e) { setStatus('missing'); return; }
      setClub(c);
      setEv(e);
      setStatus('ok');
    })();
  }, [slug, id]);

  if (status !== 'ok') {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          {status === 'loading' ? <p className="text-[#8A8E99] text-sm">Loading...</p> : (
            <>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase">Event not found</h1>
              <Link href={`/clubs/${slug}`} className="text-[#C9922A] font-black uppercase tracking-widest text-[13px]">Back to the club</Link>
            </>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const reg = safeUrl(ev.registration_url);
  const past = new Date(ev.ends_at || ev.starts_at).getTime() < Date.now();
  const share = `${ev.title} (${club.name}), ${fmtWhen(ev.starts_at, ev.ends_at, true)}. ${url}`;

  const addToCalendar = () => {
    const dt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const end = ev.ends_at || new Date(new Date(ev.starts_at).getTime() + 2 * 3600000).toISOString();
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Gun X//Club events//EN', 'BEGIN:VEVENT',
      `UID:${ev.id}@gunx.co.za`, `DTSTAMP:${dt(new Date().toISOString())}`,
      `DTSTART:${dt(ev.starts_at)}`, `DTEND:${dt(end)}`,
      `SUMMARY:${esc(`${ev.title} (${club.name})`)}`,
      `LOCATION:${esc(ev.venue || '')}`,
      `DESCRIPTION:${esc(`${ev.details || ''}\n\n${url}`)}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'gunx-event.ics';
    a.click();
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  const row = (k: string, v: React.ReactNode) => v ? (
    <div className="py-3 border-b border-white/5">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">{k}</p>
      <div className="text-[14px]">{v}</div>
    </div>
  ) : null;
  const btn = 'inline-flex items-center justify-center px-5 py-3 rounded-sm font-black uppercase tracking-widest text-[12px] transition-all';

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <AdBanner slot="leaderboard_top" page="clubs_profile" />
      <main className="max-w-[820px] mx-auto w-full px-4 py-8 flex flex-col gap-5">
        <Link href={`/clubs/${club.slug}`} className="flex items-center gap-3 text-[#8A8E99] hover:text-[#F0EDE8]">
          {club.logo_url && <img src={club.logo_url} alt="" className="w-9 h-9 rounded-sm object-cover" />}
          <span className="text-[12px] font-black uppercase tracking-widest">{club.name}</span>
        </Link>

        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-[#C9922A]/20 text-[#C9922A]">{TYPE_LABEL[ev.event_type] || ev.event_type}</span>
            {ev.discipline && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-white/10">{ev.discipline}</span>}
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl md:text-5xl font-black uppercase leading-none ${ev.is_cancelled ? 'line-through text-[#8A8E99]' : ''}`}>{ev.title}</h1>
          <p className="text-[#C9922A] font-black mt-3">{fmtWhen(ev.starts_at, ev.ends_at, true)}</p>
        </div>

        {ev.is_cancelled && (
          <div className="p-4 rounded-sm border bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946] font-black text-[13px]">
            This event has been cancelled. Contact the club for details.
          </div>
        )}
        {!ev.is_cancelled && past && (
          <div className="p-4 rounded-sm border bg-white/5 border-white/10 text-[#8A8E99] font-bold text-[13px]">This event has already taken place.</div>
        )}

        <div className="flex flex-wrap gap-2">
          {reg && !ev.is_cancelled && !past && (
            <a href={reg} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#C9922A] text-black hover:brightness-110`}>Register</a>
          )}
          <a href={waLink(null, share)} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#25D366] text-black hover:brightness-110`}>Share on WhatsApp</a>
          {!ev.is_cancelled && !past && <button onClick={addToCalendar} className={`${btn} border border-white/15 hover:bg-white/5`}>Add to my calendar</button>}
          <button onClick={copy} className={`${btn} border border-white/15 hover:bg-white/5`}>{copied ? 'Link copied' : 'Copy link'}</button>
        </div>

        <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-7">
          {row('Venue', ev.venue)}
          {row('Fees', ev.fee_text)}
          {row('Contact', ev.contact)}
          {ev.details && (
            <div className="pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Details</p>
              <p className="text-[14px] leading-relaxed text-[#C9CCD3] whitespace-pre-wrap">{ev.details}</p>
            </div>
          )}
        </div>

        <Link href={`/clubs/${club.slug}#events`} className="text-[#C9922A] font-black uppercase tracking-widest text-[12px]">All events from {club.name}</Link>
      </main>
      <Footer />
    </div>
  );
}
