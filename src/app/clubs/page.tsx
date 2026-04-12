'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const PROVINCES = [
  'All Provinces', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const DISCIPLINES = [
  'IPSC', 'IDPA', 'Practical Shooting', 'Target Shooting', 'Hunting',
  'Long Range', 'Skeet', 'Trap', 'Air Gun', 'Airsoft',
];

export default function ClubsPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchClubs(); }, []);

  const fetchClubs = async () => {
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .eq('status', 'active')
      .order('is_verified', { ascending: false })
      .order('name');
    setClubs(data || []);
    setLoading(false);
  };

  const filtered = clubs.filter(c => {
    if (selectedProvince !== 'All Provinces' && c.province !== selectedProvince) return false;
    if (selectedDiscipline && !(c.disciplines || []).includes(selectedDiscipline)) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.city?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* PAGE HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
                <Link href="/" className="hover:text-[#C9922A]">Home</Link>
                <span>/</span>
                <span className="text-[#F0EDE8]">Clubs & Ranges</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tight">
                Clubs & <span className="text-[#C9922A]">Ranges</span>
              </h1>
              <p className="text-[#8A8E99] text-sm mt-2 uppercase tracking-widest font-bold">
                Find shooting clubs and ranges across South Africa
              </p>
            </div>
            <Link href="/clubs/apply"
              className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
              + List Your Club
            </Link>
          </div>
        </div>
      </div>

      {/* LEADERBOARD AD */}
      <div className="w-full flex justify-center py-3 px-4 md:px-6">
        <div className="w-full max-w-[970px] h-[70px] md:h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* MAIN — 3 column layout with side ads on xl */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 flex gap-6">

        {/* LEFT SIDEBAR AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6 p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">
              160 × 600
            </div>
          </div>
        </aside>

        {/* CENTRE CONTENT */}
        <main className="flex-1 min-w-0">

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input
              type="text"
              placeholder="Search clubs or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
            />
            <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
              className="bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50 appearance-none cursor-pointer">
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={selectedDiscipline} onChange={e => setSelectedDiscipline(e.target.value)}
              className="bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50 appearance-none cursor-pointer">
              <option value="">All Disciplines</option>
              {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          {/* RESULTS COUNT */}
          <p className="text-[12px] text-[#8A8E99] mb-4 uppercase tracking-widest font-bold">
            <span className="text-[#F0EDE8] font-black">{filtered.length}</span> club{filtered.length !== 1 ? 's' : ''} found
          </p>

          {/* CLUBS GRID */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
              <div className="text-5xl mb-4">⊕</div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">No clubs found</h3>
              <p className="text-[#8A8E99] text-sm mb-6">Be the first to list your club in this area</p>
              <Link href="/clubs/apply" className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
                List Your Club
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
              {filtered.map(club => (
                <Link key={club.id} href={`/clubs/${club.slug}`}
                  className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden hover:border-[#C9922A]/30 transition-all group">

                  {/* Cover Photo */}
                  <div className="relative h-[160px] bg-[#191C23] overflow-hidden">
                    {club.cover_url ? (
                      <img src={club.cover_url} alt={club.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a1d24] to-[#0D0F13] flex items-center justify-center">
                        <span className="text-6xl opacity-5">⊕</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13151A] to-transparent" />

                    {/* Logo */}
                    <div className="absolute bottom-3 left-4 w-14 h-14 rounded-sm bg-[#C9922A] border-2 border-[#13151A] overflow-hidden flex items-center justify-center shadow-lg">
                      {club.logo_url ? (
                        <img src={club.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-xl">
                          {club.name?.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Verified Badge */}
                    {club.is_verified && (
                      <div className="absolute top-3 right-3 bg-[#2A9C6E] text-white text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-wider">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 pt-3">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-xl font-black uppercase tracking-tight text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors mb-1">
                      {club.name}
                    </h3>
                    <p className="text-[12px] text-[#8A8E99] mb-3">
                      📍 {club.city}{club.province ? `, ${club.province}` : ''}
                    </p>

                    {club.disciplines?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {club.disciplines.slice(0, 3).map((d: string) => (
                          <span key={d} className="bg-[#0D0F13] border border-white/10 text-[#8A8E99] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                            {d}
                          </span>
                        ))}
                        {club.disciplines.length > 3 && (
                          <span className="text-[#8A8E99] text-[9px] font-bold self-center">+{club.disciplines.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="text-[11px] text-[#8A8E99] font-bold uppercase tracking-widest">
                        {club.membership_fee ? `From R${Number(club.membership_fee).toLocaleString('en-ZA')}/yr` : 'Contact for pricing'}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#C9922A]">
                        View Club →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6 p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">
              160 × 600
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}