'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AdBanner from '@/components/AdBanner';
import { supabase } from '@/lib/supabase';
import { sastDate } from '@/components/clubs/clubPublic';

// --- SHOOTING CLUB DIRECTORY -------------------------------------------------
// Approved clubs only (shooting_clubs_public). Ranges have their own list
// at /ranges. "Near me" uses the visitor's location in the browser only;
// it is never sent to Gun X.

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function ClubDirectoryPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [assoc, setAssoc] = useState('');
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [locMsg, setLocMsg] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: ev }] = await Promise.all([
        supabase.from('shooting_clubs_public').select('*').order('name', { ascending: true }),
        supabase.from('club_events').select('id, club_id, title, starts_at')
          .eq('is_cancelled', false).gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true }).limit(500),
      ]);
      const first: Record<string, any> = {};
      (ev || []).forEach((e) => { if (!first[e.club_id]) first[e.club_id] = e; });
      setClubs(c || []);
      setNextEvent(first);
      setLoading(false);
    })();
  }, []);

  const disciplines = useMemo(
    () => Array.from(new Set(clubs.flatMap((c) => c.disciplines || []))).sort(), [clubs]);
  const associations = useMemo(
    () => Array.from(new Set(clubs.flatMap((c) => (c.associations || []).map((a: string) => a.replace(/^Other: /, ''))))).sort(), [clubs]);

  const nearMe = () => {
    setLocMsg('');
    if (!navigator.geolocation) {
      setLocMsg('Your browser cannot share its location.');
      return;
    }
    setLocMsg('Finding you...');
    navigator.geolocation.getCurrentPosition(
      (p) => { setMe({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocMsg(''); },
      () => setLocMsg('Location not shared. Allow location for this site, or filter by province instead.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = clubs
      .filter((c) => !s || `${c.name} ${c.city} ${c.province}`.toLowerCase().includes(s))
      .filter((c) => !province || c.province === province)
      .filter((c) => !discipline || (c.disciplines || []).includes(discipline))
      .filter((c) => !assoc || (c.associations || []).some((a: string) => a.replace(/^Other: /, '') === assoc))
      .map((c) => ({
        ...c,
        distance: me && c.lat != null && c.lng != null ? km(me, { lat: Number(c.lat), lng: Number(c.lng) }) : null,
      }));
    if (me) rows.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
    return rows;
  }, [clubs, q, province, discipline, assoc, me]);

  const select = 'bg-[#13151A] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60';

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <div className="flex w-full justify-center py-3 px-4">
        <AdBanner slot="leaderboard_top" page="clubs_directory" />
      </div>

      {/* 3-COLUMN LAYOUT: side ads on wide screens, as on other profile pages */}
      <div className="flex w-full items-start flex-1">
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[180px] pl-2 pt-6">
          <div className="sticky top-[57px]"><AdBanner slot="sidebar_left" page="clubs_directory" /></div>
        </aside>
        <main className="flex-1 min-w-0 max-w-[1200px] mx-auto px-4 py-8">
          <div className="xl:hidden w-full flex justify-center pb-6">
            <AdBanner slot="sidebar_left" page="clubs_directory" variant="infeed" />
          </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl font-black uppercase leading-none">
                Shooting <span className="text-[#C9922A]">clubs</span>
              </h1>
              <p className="text-[#8A8E99] text-[13px] mt-2 leading-relaxed">
                Accredited and affiliated clubs across South Africa. Looking for somewhere to shoot?{' '}
                <Link href="/ranges" className="text-[#C9922A] font-bold">See ranges</Link>.
              </p>
            </div>
            <Link href="/clubs/apply" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm hover:brightness-110 text-center">
              List your club, free
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or town" className={select} />
            <select value={province} onChange={(e) => setProvince(e.target.value)} className={select}>
              <option value="">All provinces</option>
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className={select}>
              <option value="">All disciplines</option>
              {disciplines.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={assoc} onChange={(e) => setAssoc(e.target.value)} className={select}>
              <option value="">All affiliations</option>
              {associations.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {me ? (
              <button onClick={() => setMe(null)} className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm bg-[#C9922A]/15 text-[#C9922A]">
                Sorted by distance (clear)
              </button>
            ) : (
              <button onClick={nearMe} className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border border-[#C9922A]/40 text-[#C9922A] hover:bg-[#C9922A]/10">
                Clubs near me
              </button>
            )}
            {locMsg && <span className="text-[12px] text-[#8A8E99]">{locMsg}</span>}
            <span className="text-[12px] text-[#8A8E99] ml-auto">{loading ? 'Loading...' : `${list.length} club${list.length === 1 ? '' : 's'}`}</span>
          </div>

          {!loading && list.length === 0 && (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-8 text-center">
              <p className="text-[#8A8E99] text-[14px]">No clubs match. Try fewer filters.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((c) => {
              const ev = nextEvent[c.id];
              return (
                <Link key={c.id} href={`/clubs/${c.slug}`}
                  className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden hover:border-[#C9922A]/40 transition-all flex flex-col">
                  <div className="h-28 bg-[#0D0F13] relative">
                    {c.cover_url && <img src={c.cover_url} alt="" loading="lazy" className="w-full h-full object-cover opacity-80" />}
                    {c.distance != null && (
                      <span className="absolute top-2 right-2 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-black/70">
                        {c.distance < 10 ? c.distance.toFixed(1) : Math.round(c.distance)} km away
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3 -mt-10">
                      {c.logo_url
                        ? <img src={c.logo_url} alt="" className="w-14 h-14 rounded-sm object-cover border-2 border-[#13151A] bg-[#13151A]" />
                        : <div className="w-14 h-14 rounded-sm bg-[#C9922A] text-black font-black text-xl flex items-center justify-center border-2 border-[#13151A]">{c.name.charAt(0)}</div>}
                    </div>
                    <p className="font-black text-[16px] leading-tight">{c.name}</p>
                    <p className="text-[12px] text-[#8A8E99]">{[c.city, c.province].filter(Boolean).join(', ')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.is_verified && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[#2A9C6E]/20 text-[#2A9C6E]">Verified</span>}
                      {(c.associations || []).map((a: string) => (
                        <span key={a} className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[#C9922A]/20 text-[#C9922A]">{a.replace(/^Other: /, '')}</span>
                      ))}
                    </div>
                    <p className="text-[12px] text-[#C9CCD3]">
                      {(c.disciplines || []).slice(0, 3).join(' . ')}{(c.disciplines || []).length > 3 ? ` +${c.disciplines.length - 3}` : ''}
                    </p>
                    <div className="mt-auto pt-3 border-t border-white/5 text-[12px]">
                      {ev ? (
                        <p><span className="text-[#8A8E99]">Next: </span><span className="font-bold">
                          {new Date(ev.starts_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })}
                          {sastDate(ev.starts_at) === sastDate(new Date().toISOString()) ? ' (today)' : ''} . {ev.title}
                        </span></p>
                      ) : (
                        <p className="text-[#8A8E99]">No upcoming events listed</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </main>
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[180px] pr-2 pt-6">
          <div className="sticky top-[57px]"><AdBanner slot="sidebar_right" page="clubs_directory" /></div>
        </aside>
      </div>
      <Footer />
    </div>
  );
}
