'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';

const PROVINCES = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'];
const ITEM_TYPES = ['Pistols & Revolvers','Rifles','Shotguns','Reloading Components','Ammunition','Optics','Magazines','Holsters','Knives','Air Guns','Other'];

export default function WantedPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchListings();
  }, [sortBy]);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select(`
        *,
        makes:make_id(name),
        calibres:calibre_id(name),
        conditions:condition_id(name),
        provinces:province_id(name)
      `)
      .eq('category_id', 'wanted')
      .eq('status', 'active');

    if (sortBy === 'highest') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full text-[#F0EDE8]">
      <Navbar />

      {/* PAGE HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
                <Link href="/" className="hover:text-[#C9922A]">Home</Link>
                <span>/</span>
                <span className="text-[#F0EDE8]">Wanted</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tight">
                Community <span className="text-[#C9922A]">Bounty Board</span>
              </h1>
              <p className="text-[#8A8E99] text-sm mt-2 max-w-[600px]">
                Buyers with cash in hand looking for specific firearms, parts, ammo, and reloading components.
              </p>
            </div>
            <Link href="/wanted/post"
              className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
              + Post Wanted Ad
            </Link>
          </div>
        </div>
      </div>

      {/* LEADERBOARD AD */}
      <div className="w-full flex justify-center py-3 px-4 md:px-6">
        <div className="w-full max-w-[970px] h-[120px] md:h-[160px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* MAIN — 3 col layout */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 flex gap-6">

        {/* LEFT AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6 p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>

        {/* CENTRE */}
        <div className="flex-1 min-w-0 flex flex-col lg:flex-row gap-6">

          {/* SIDEBAR FILTERS */}
          <aside className="w-full lg:w-[240px] flex-shrink-0">
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 flex flex-col gap-5 sticky top-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-lg uppercase tracking-widest">Filters</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-black tracking-widest uppercase text-[#8A8E99]">Item Sought</span>
                {ITEM_TYPES.map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 accent-[#C9922A]" />
                    <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{type}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 border-t border-white/5 pt-4">
                <span className="text-[11px] font-black tracking-widest uppercase text-[#8A8E99]">Province</span>
                {PROVINCES.map(p => (
                  <label key={p} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 accent-[#C9922A]" />
                    <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{p}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 border-t border-white/5 pt-4">
                <span className="text-[11px] font-black tracking-widest uppercase text-[#8A8E99]">Budget Range (R)</span>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50" />
                  <span className="text-[#8A8E99]">—</span>
                  <input type="number" placeholder="Max" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50" />
                </div>
              </div>
            </div>
          </aside>

          {/* LISTINGS */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[12px] text-[#8A8E99] uppercase tracking-widest font-bold">
                <span className="text-[#F0EDE8] font-black">{listings.length}</span> wanted ads
              </p>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-[#13151A] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none appearance-none cursor-pointer">
                <option value="newest">Newest First</option>
                <option value="highest">Highest Budget</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">No Wanted Ads Yet</h3>
                <p className="text-[#8A8E99] mb-6">Be the first to post what you're looking for.</p>
                <Link href="/wanted/post" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
                  Post Wanted Ad
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    make={listing.makes?.name || 'N/A'}
                    calibre={listing.calibres?.name || 'N/A'}
                    price={listing.price}
                    province={listing.provinces?.name || listing.city || 'N/A'}
                    condition={listing.conditions?.name || 'N/A'}
                    category={formatCategory(listing.category_id)}
                    listingType={listing.listing_type}
                    sellerName={listing.city || 'N/A'}
                    images={listing.images}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

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
