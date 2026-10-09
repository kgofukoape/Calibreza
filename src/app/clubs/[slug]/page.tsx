'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AdBanner from '@/components/AdBanner';
import { supabase } from '@/lib/supabase';
import {
  TYPE_LABEL, PERIOD_LABEL, sastDate, fmtWhen, waLink, safeUrl, mapsLink, recordClubView,
} from '@/components/clubs/clubPublic';

const ProfileMap = dynamic(() => import('@/components/ProfileMap'), { ssr: false });

// --- SHOOTING CLUB PUBLIC PAGE -----------------------------------------------
// Clubs only (shooting_clubs_public). Ranges live at /ranges/[slug].
// No booking, live status or weather: clubs show who they are, their
// calendar, membership, photos and how to reach them.

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ClubPublicPage() {
  const { slug } = useParams() as { slug: string };
  const [club, setClub] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');
  const today = sastDate(new Date().toISOString());
  const [month, setMonth] = useState(today.slice(0, 7));
  const [day, setDay] = useState<string | null>(null);
  const [photo, setPhoto] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('shooting_clubs_public').select('*').eq('slug', slug).maybeSingle();
      if (!c) { setStatus('missing'); return; }
      setClub(c);
      const { data: ev } = await supabase.from('club_events').select('*')
        .eq('club_id', c.id).gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true }).limit(80);
      setEvents(ev || []);
      setStatus('ok');
      recordClubView(c.id);
    })();
  }, [slug]);

  const byDay = useMemo(() => {
    const m = new Map<string, any[]>();
    events.forEach((e) => {
      const k = sastDate(e.starts_at);
      m.set(k, [...(m.get(k) || []), e]);
    });
    return m;
  }, [events]);

  const grid = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const startDow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells: Array<string | null> = Array(startDow).fill(null);
    for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [month]);

  const shift = (n: number) => {
    const [y, m] = month.split('-').map(Number);
    setMonth(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7));
    setDay(null);
  };
  const maxMonth = (() => {
    const [y, m] = today.slice(0, 7).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1 + 11, 1)).toISOString().slice(0, 7);
  })();

  if (status !== 'ok') {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          {status === 'loading' ? <p className="text-[#8A8E99] text-sm">Loading...</p> : (
            <>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase">Club not found</h1>
              <Link href="/clubs" className="text-[#C9922A] font-black uppercase tracking-widest text-[13px]">Back to all clubs</Link>
            </>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  const images: string[] = club.images || [];
  const options: any[] = club.membership_options || [];
  const site = safeUrl(club.website);
  const fb = safeUrl(club.facebook_url);
  const ig = safeUrl(club.instagram_url);
  const ps = safeUrl(club.practiscore_url);
  const map = mapsLink(club);
  const list = day ? (byDay.get(day) || []) : events.slice(0, 12);
  const monthLabel = new Date(month + '-01T00:00:00Z').toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  const section = 'bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-7 scroll-mt-24';
  const h2 = (a: string, b: string) => (
    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl md:text-3xl font-black uppercase mb-5">
      {a} <span className="text-[#C9922A]">{b}</span>
    </h2>
  );
  const btn = 'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-black uppercase tracking-widest text-[11px] md:text-[12px] transition-all';

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <AdBanner slot="leaderboard_top" page="clubs_profile" />

      {/* HEADER */}
      <header className="relative">
        <div className="h-44 md:h-72 bg-[#13151A] overflow-hidden">
          {club.cover_url && <img src={club.cover_url} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] via-[#0D0F13]/40 to-transparent" />
        </div>
        <div className="max-w-[1100px] mx-auto px-4 -mt-16 md:-mt-20 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {club.logo_url
              ? <img src={club.logo_url} alt="" className="w-24 h-24 md:w-32 md:h-32 rounded-sm object-cover border-4 border-[#0D0F13] bg-[#13151A]" />
              : <div className="w-24 h-24 md:w-32 md:h-32 rounded-sm bg-[#C9922A] text-black text-4xl font-black flex items-center justify-center border-4 border-[#0D0F13]">{club.name.charAt(0)}</div>}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-white/10">Shooting club</span>
                {club.is_verified && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-[#2A9C6E]/20 text-[#2A9C6E]">Verified</span>}
                {club.compliance_status === 'accredited' && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-[#C9922A]/20 text-[#C9922A]">SAPS-accredited</span>}
                {(club.associations || []).map((a: string) => (
                  <span key={a} className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-[#C9922A]/20 text-[#C9922A]">{a.replace(/^Other: /, '')}</span>
                ))}
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-5xl font-black uppercase leading-none">{club.name}</h1>
              <p className="text-[#8A8E99] text-[13px] mt-2">{[club.city, club.province].filter(Boolean).join(', ')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-5">
            {club.phone && <a href={`tel:${club.phone}`} className={`${btn} bg-[#C9922A] text-black hover:brightness-110`}>Call</a>}
            {club.whatsapp && <a href={waLink(club.whatsapp, `Hi ${club.name}, I found you on Gun X.`)} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#25D366] text-black hover:brightness-110`}>WhatsApp</a>}
            {club.email && <a href={`mailto:${club.email}`} className={`${btn} border border-white/15 hover:bg-white/5`}>Email</a>}
            {site && <a href={site} target="_blank" rel="noopener noreferrer" className={`${btn} border border-white/15 hover:bg-white/5`}>Website</a>}
          </div>
        </div>
      </header>

      {/* SECTION NAV */}
      <nav className="sticky top-0 z-30 bg-[#0D0F13]/95 backdrop-blur border-b border-white/5 mt-6">
        <div className="max-w-[1100px] mx-auto px-4 flex gap-5 overflow-x-auto">
          {[['about', 'About'], ['events', 'Events'], ['membership', 'Membership'], ['gallery', 'Gallery'], ['contact', 'Contact']].map(([id, l]) => (
            <a key={id} href={`#${id}`} className="py-3 whitespace-nowrap text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A]">{l}</a>
          ))}
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto w-full px-4 py-6 md:py-8 flex gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* ABOUT */}
          <section id="about" className={section}>
            {h2('About', 'the club')}
            <p className="text-[14px] leading-relaxed text-[#C9CCD3] whitespace-pre-wrap">{club.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {club.founded_year && (
                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Founded</p><p className="font-black">{club.founded_year}</p></div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Where we shoot</p>
                <p className="font-black">
                  {club.shoots_at === 'own'
                    ? `Our own ${club.range_setting === 'both' ? 'indoor and outdoor' : club.range_setting || ''} range`
                    : club.shoots_at_range || '-'}
                </p>
              </div>
              <div className="sm:col-span-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Disciplines</p>
                <div className="flex flex-wrap gap-2">
                  {(club.disciplines || []).map((d: string) => (
                    <span key={d} className="text-[12px] font-bold px-3 py-1.5 rounded-sm bg-[#0D0F13] border border-white/10">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* EVENTS */}
          <section id="events" className={section}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              {h2('Upcoming', 'events')}
              {ps && <a href={ps} target="_blank" rel="noopener noreferrer" className={`${btn} border border-[#C9922A]/40 text-[#C9922A] hover:bg-[#C9922A]/10 -mt-5`}>Register on PractiScore</a>}
            </div>

            <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-3 md:p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => shift(-1)} disabled={month <= today.slice(0, 7)} className="px-3 py-1 text-[#C9922A] font-black disabled:opacity-20">&lt;</button>
                <p className="font-black uppercase tracking-widest text-[12px]">{monthLabel}</p>
                <button onClick={() => shift(1)} disabled={month >= maxMonth} className="px-3 py-1 text-[#C9922A] font-black disabled:opacity-20">&gt;</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEK.map((w) => <div key={w} className="text-[9px] font-black uppercase tracking-widest text-[#8A8E99] py-1">{w}</div>)}
                {grid.map((d, i) => {
                  if (!d) return <div key={`b${i}`} />;
                  const has = byDay.has(d);
                  const sel = day === d;
                  return (
                    <button key={d} disabled={!has} onClick={() => setDay(sel ? null : d)}
                      className={`aspect-square rounded-sm text-[12px] font-bold flex flex-col items-center justify-center ${
                        sel ? 'bg-[#C9922A] text-black' : has ? 'bg-[#C9922A]/15 text-[#C9922A] hover:bg-[#C9922A]/25' : d < today ? 'text-white/15' : 'text-[#8A8E99]'}`}>
                      {Number(d.slice(8))}
                      {has && !sel && <span className="w-1 h-1 rounded-full bg-[#C9922A] mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {day && (
              <button onClick={() => setDay(null)} className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] mb-3">Show all upcoming events</button>
            )}
            {list.length === 0 ? (
              <p className="text-[13px] text-[#8A8E99]">No upcoming events yet. Contact the club for their next shoot.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {list.map((e) => (
                  <Link key={e.id} href={`/clubs/${club.slug}/events/${e.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-sm bg-[#0D0F13] border border-white/5 hover:border-[#C9922A]/40">
                    <div className="min-w-0">
                      <p className={`font-black text-[14px] ${e.is_cancelled ? 'line-through text-[#8A8E99]' : ''}`}>{e.title}</p>
                      <p className="text-[12px] text-[#8A8E99]">
                        {TYPE_LABEL[e.event_type] || e.event_type}{e.discipline ? ` . ${e.discipline}` : ''} . {fmtWhen(e.starts_at, e.ends_at)}
                      </p>
                    </div>
                    {e.is_cancelled
                      ? <span className="text-[10px] font-black uppercase tracking-widest text-[#E63946] flex-shrink-0">Cancelled</span>
                      : <span className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] flex-shrink-0">Details</span>}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* MEMBERSHIP */}
          <section id="membership" className={section}>
            {h2('Join', 'the club')}
            {options.length === 0 ? (
              <p className="text-[13px] text-[#8A8E99]">Contact the club for membership details.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((o, i) => (
                  <div key={i} className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                    <p className="font-black text-[14px]">{o.name}</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A] mt-1">
                      R{Number(o.price).toLocaleString('en-ZA')}
                      <span className="text-[13px] text-[#8A8E99] font-bold ml-1">{PERIOD_LABEL[o.period] || ''}</span>
                    </p>
                    {o.notes && <p className="text-[12px] text-[#8A8E99] mt-2 leading-relaxed">{o.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* GALLERY */}
          {images.length > 0 && (
            <section id="gallery" className={section}>
              {h2('Club', 'gallery')}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {images.map((u, i) => (
                  <button key={u} onClick={() => setPhoto(i)} className="aspect-square overflow-hidden rounded-sm bg-[#0D0F13]">
                    <img src={u} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* CONTACT */}
          <section id="contact" className={section}>
            {h2('Contact and', 'location')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              {club.address && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Address</p>
                  <p>{club.address}</p>
                  {map && <a href={map} target="_blank" rel="noopener noreferrer" className="text-[#C9922A] text-[12px] font-black uppercase tracking-widest">Open in Google Maps</a>}
                </div>
              )}
              {club.phone && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Phone</p><a href={`tel:${club.phone}`} className="text-[#C9922A] font-bold">{club.phone}</a></div>}
              {club.email && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Email</p><a href={`mailto:${club.email}`} className="text-[#C9922A] font-bold break-all">{club.email}</a></div>}
              {(fb || ig || site) && (
                <div className="sm:col-span-2 flex flex-wrap gap-4">
                  {site && <a href={site} target="_blank" rel="noopener noreferrer" className="text-[#C9922A] text-[12px] font-black uppercase tracking-widest">Website</a>}
                  {fb && <a href={fb} target="_blank" rel="noopener noreferrer" className="text-[#C9922A] text-[12px] font-black uppercase tracking-widest">Facebook</a>}
                  {ig && <a href={ig} target="_blank" rel="noopener noreferrer" className="text-[#C9922A] text-[12px] font-black uppercase tracking-widest">Instagram</a>}
                </div>
              )}
            </div>
            {club.lat != null && club.lng != null && (
              <div className="mt-5 h-64 rounded-sm overflow-hidden border border-white/5">
                <ProfileMap lat={Number(club.lat)} lng={Number(club.lng)} name={club.name} address={club.address} />
              </div>
            )}
          </section>

          <Link href="/clubs" className="text-[#C9922A] font-black uppercase tracking-widest text-[12px]">Back to all clubs</Link>
        </div>

        <aside className="hidden lg:block w-[300px] flex-shrink-0">
          <div className="sticky top-16"><AdBanner slot="sidebar_right" page="clubs_profile" /></div>
        </aside>
      </main>

      {/* PHOTO VIEWER */}
      {photo !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPhoto(null)}>
          <img src={images[photo]} alt="" className="max-w-full max-h-[85vh] object-contain" />
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setPhoto((photo + images.length - 1) % images.length); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-3xl font-black px-3">&lt;</button>
              <button onClick={(e) => { e.stopPropagation(); setPhoto((photo + 1) % images.length); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white text-3xl font-black px-3">&gt;</button>
            </>
          )}
          <button onClick={() => setPhoto(null)} className="absolute top-4 right-4 text-white text-[12px] font-black uppercase tracking-widest">Close</button>
        </div>
      )}

      <Footer />
    </div>
  );
}
