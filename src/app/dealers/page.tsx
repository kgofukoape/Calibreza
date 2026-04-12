'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const PROVINCES = [
  'All Provinces', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

export default function DealersDirectoryPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDealers = async () => {
      const { data } = await supabase
        .from('dealers')
        .select('*')
        .eq('status', 'approved')
        .order('subscription_tier', { ascending: false })
        .order('business_name');
      setDealers(data || []);
      setLoading(false);
    };
    fetchDealers();
  }, []);

  const filtered = dealers.filter(d => {
    if (selectedProvince !== 'All Provinces' && d.province !== selectedProvince) return false;
    if (search && !d.business_name?.toLowerCase().includes(search.toLowerCase()) &&
      !d.city?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* PAGE HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Dealers</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
            Official <span className="text-[#C9922A]">Dealers</span>
          </h1>
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">
            Verified firearm dealers across South Africa
          </p>
        </div>
      </div>

      {/* LEADERBOARD AD */}
      <div className="w-full flex justify-center py-3 px-4 md:px-6">
        <div className="w-full max-w-[970px] h-[70px] md:h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 flex gap-6">

        {/* LEFT AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6 p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input type="text" placeholder="Search dealers or city..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50" />
            <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
              className="bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50 appearance-none cursor-pointer">
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <p className="text-[12px] text-[#8A8E99] mb-4 uppercase tracking-widest font-bold">
            <span className="text-[#F0EDE8] font-black">{filtered.length}</span> dealer{filtered.length !== 1 ? 's' : ''} found
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
              <div className="text-5xl mb-4">🏪</div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">No dealers found</h3>
              <p className="text-[#8A8E99] text-sm">Try a different province or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(dealer => (
                <Link key={dealer.id} href={`/dealers/${dealer.slug}`}
                  className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden hover:border-[#C9922A]/30 transition-all group">

                  {/* Cover / Banner */}
                  <div className="relative h-[140px] bg-[#191C23] overflow-hidden">
                    {dealer.banner_url ? (
                      <img src={dealer.banner_url} alt="" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a1d24] to-[#0D0F13]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13151A] to-transparent" />

                    {/* Logo overlaid */}
                    <div className="absolute bottom-3 left-4 w-14 h-14 rounded-sm border-2 border-[#13151A] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg"
                      style={{ background: dealer.logo_url ? 'transparent' : '#C9922A' }}>
                      {dealer.logo_url ? (
                        <img src={dealer.logo_url} alt={dealer.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-xl">
                          {dealer.business_name?.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Tier badge */}
                    {(dealer.subscription_tier === 'premium' || dealer.subscription_tier === 'pro') && (
                      <div className="absolute top-3 right-3 bg-[#C9922A] text-black text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-wider">
                        {dealer.subscription_tier === 'premium' ? '⭐ Premium' : '✓ Pro'}
                      </div>
                    )}
                  </div>

                  {/* Card content */}
                  <div className="p-4 pt-3">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-xl font-black uppercase tracking-tight text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors mb-1">
                      {dealer.business_name}
                    </h2>
                    <p className="text-[12px] text-[#8A8E99] mb-3">
                      📍 {dealer.city}, {dealer.province}
                    </p>
                    {dealer.description && (
                      <p className="text-[12px] text-[#8A8E99] line-clamp-2 mb-3 leading-relaxed">
                        {dealer.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      {dealer.rating ? (
                        <span className="text-[12px] text-[#8A8E99]">
                          ⭐ {dealer.rating.toFixed(1)} <span className="text-[#8A8E99]/60">({dealer.review_count || 0})</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#8A8E99] font-bold uppercase tracking-widest">Licensed Dealer</span>
                      )}
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#C9922A]">View Store →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* RIGHT AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6 p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>
      </div>
    </div>
  );
}