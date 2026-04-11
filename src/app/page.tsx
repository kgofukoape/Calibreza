'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { n: 'Pistols', slug: 'pistols', i: '🎯' },
  { n: 'Rifles', slug: 'rifles', i: '🔭' },
  { n: 'Shotguns', slug: 'shotguns', i: '♾️' },
  { n: 'Revolvers', slug: 'revolvers', i: '🎡' },
  { n: 'Air Guns', slug: 'air-guns', i: '💨' },
  { n: 'Airsoft', slug: 'airsoft', i: '⚡' },
  { n: 'Holsters & Carry', slug: 'holsters', i: '∪' },
  { n: 'Magazines', slug: 'magazines', i: '⋮' },
  { n: 'Ammunition', slug: 'ammunition', i: '⧊' },
  { n: 'Reloading', slug: 'reloading', i: '🔧' },
  { n: 'Knives & Blades', slug: 'knives', i: '🖋️' },
  { n: 'Services', slug: 'services', i: '🏠' },
  { n: 'Clubs & Ranges', slug: 'clubs', i: '⊕' },
  { n: 'Wanted', slug: 'wanted', i: '🔍' },
];

export default function HomePage() {
  const [reelListings, setReelListings] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [totalListings, setTotalListings] = useState(0);

  useEffect(() => {
    fetchReelListings();
    fetchCategoryCounts();
  }, []);

  const fetchReelListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, category_id, images, city, listing_type, is_featured')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(16);
    setReelListings(data || []);
  };

  const fetchCategoryCounts = async () => {
    const { data } = await supabase
      .from('listings')
      .select('category_id')
      .eq('status', 'active');

    if (!data) return;
    setTotalListings(data.length);

    const counts: Record<string, number> = {};
    data.forEach((l) => {
      if (l.category_id) {
        counts[l.category_id] = (counts[l.category_id] || 0) + 1;
      }
    });
    setCategoryCounts(counts);
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  const displayReel = reelListings.length > 0
    ? [...reelListings, ...reelListings]
    : [];

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] overflow-x-hidden flex flex-col">
      <Navbar />

      {/* 1. TOP LEADERBOARD AD */}
      <div className="w-full flex justify-center pt-4 pb-2 px-4">
        <div className="w-full max-w-[970px] h-[110px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Top Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20"></div>
        </div>
      </div>

      <main className="relative flex-1 w-full">

        {/* 2. SIDEBAR ADS */}
        <aside className="hidden xl:block absolute left-4 top-[-118px] w-[220px] h-[560px] bg-[#12141a] border border-white/5 z-0">
          <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-4">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[10px] text-[#3A3E49] leading-relaxed font-bold">
              180 x 570
            </div>
          </div>
        </aside>

        <aside className="hidden xl:block absolute right-4 top-[-118px] w-[220px] h-[560px] bg-[#12141a] border border-white/5 z-0">
          <div className="h-full w-full flex flex-col items-center justify-center p-4 text-center">
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-4">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[10px] text-[#3A3E49] leading-relaxed font-bold">
              180 x 570
            </div>
          </div>
        </aside>

        {/* 3. HERO */}
        <section className="relative pt-4 md:pt-6 pb-6 px-6 text-center max-w-[1050px] mx-auto z-10">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[30px] sm:text-[45px] md:text-[60px] lg:text-[75px] font-black uppercase tracking-tighter leading-[0.85] mb-6 md:mb-8">
            SOUTH AFRICA&apos;S <br className="hidden sm:block" />
            <span className="text-[#C9922A]">PREMIER FIREARMS</span> <br />
            CLASSIFIEDS
          </h1>

          {totalListings > 0 && (
            <p className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold mb-4">
              <span className="text-[#C9922A] font-black">{totalListings.toLocaleString()}</span> active listings across South Africa
            </p>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6 md:mb-8">
            <Link href="/browse" className="bg-[#C9922A] text-black px-8 py-3 font-black uppercase tracking-widest text-[13px] md:text-[14px] hover:brightness-110 transition-all shadow-[0_0_30px_rgba(201,146,42,0.2)]">
              BROWSE LISTINGS
            </Link>
            <Link href="/sell" className="border border-white/10 text-white px-8 py-3 font-black uppercase tracking-widest text-[13px] md:text-[14px] hover:bg-white/5 transition-all">
              POST FREE LISTING
            </Link>
          </div>

          {/* 4. REEL */}
          {displayReel.length > 0 && (
            <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] py-4 border-y border-white/5 bg-[#12141a]/50 overflow-hidden">
              <div className="flex gap-3 animate-scroll whitespace-nowrap px-4">
                {displayReel.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/listings/${item.id}`}
                    style={{ width: '250px', minWidth: '250px', maxWidth: '250px' }}
                    className="bg-[#191C23] border border-white/5 p-2 rounded-sm shrink-0 flex-none text-left hover:border-[#C9922A]/40 transition-colors block"
                  >
                    <div className="relative overflow-hidden bg-[#0D0F13] mb-1.5" style={{ height: '200px' }}>
                      {item.images?.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg opacity-20">🔫</div>
                      )}
                      <div className="absolute top-1 left-1 bg-[#C9922A] text-black text-[7px] font-black px-1 py-0.5 uppercase tracking-tighter z-10 leading-none">
                        {formatCategory(item.category_id)}
                      </div>
                      {item.is_featured && (
                        <div className="absolute top-1 right-1 text-[9px] z-10">⭐</div>
                      )}
                    </div>
                    <h4 className="font-bold text-[10px] uppercase mb-0.5 truncate text-[#F0EDE8] leading-tight">{item.title}</h4>
                    <p className="text-[#C9922A] font-black text-[11px] leading-none mb-0.5">R {item.price?.toLocaleString('en-ZA')}</p>
                    <p className="text-[8px] text-[#8A8E99] uppercase tracking-widest font-bold">
                      {item.listing_type === 'dealer' ? '🏪 Dealer' : '👤 Private'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 5. BROWSE BY CATEGORY */}
        <section className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3 text-[#F0EDE8]">
              Browse By <span className="text-[#C9922A]">Category</span>
            </h2>
            <p className="text-[#8A8E99] text-[11px] md:text-[12px] uppercase tracking-[0.3em] font-bold px-4">
              Explore listings across all firearm categories
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse/${cat.slug}`}
                className="bg-[#13151A] border border-white/5 p-4 md:p-5 flex flex-col items-center group hover:border-[#C9922A]/30 transition-all rounded-sm text-center"
              >
                <span className="text-lg md:text-xl mb-2 opacity-60 group-hover:opacity-100 transition-opacity">{cat.i}</span>
                <h3 className="font-bold uppercase tracking-widest text-[10px] md:text-[11px] mb-0.5">{cat.n}</h3>
                <p className="text-[8px] text-[#C9922A] font-black uppercase tracking-tighter">
                  {categoryCounts[cat.slug]
                    ? `${categoryCounts[cat.slug].toLocaleString()} listing${categoryCounts[cat.slug] !== 1 ? 's' : ''}`
                    : 'Browse'}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 6. WHY CHOOSE */}
        <section className="max-w-[1400px] mx-auto px-6 py-12 border-t border-white/5">
          <div className="text-center mb-10">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">
              Why Choose <span className="text-[#C9922A]">Gun X?</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { t: 'Verified Sellers', d: 'Every dealer and private seller goes through identity verification.', i: '🛡️' },
              { t: 'Provincial Search', d: 'Find firearms close to home. Filter by province and city.', i: '📍' },
              { t: 'FCA Compliant', d: 'All listings comply with the Firearms Control Act.', i: '📋' },
            ].map(item => (
              <div key={item.t} className="bg-[#13151A] p-6 border border-white/5 rounded-sm">
                <div className="w-10 h-10 bg-[#191C23] border border-[#C9922A]/20 flex items-center justify-center rounded-sm mb-4 text-lg">{item.i}</div>
                <h3 className="text-base font-bold uppercase tracking-tight mb-2">{item.t}</h3>
                <p className="text-[#8A8E99] text-sm leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. DEALER CTA */}
        <section className="max-w-[1400px] mx-auto px-6 py-12">
          <div className="bg-[#13151A] border border-[#C9922A]/20 p-8 md:p-14 rounded-sm flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="max-w-2xl text-center lg:text-left">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-5xl font-black uppercase leading-none mb-4">
                Grow Your <span className="text-[#C9922A]">Dealership</span> Online.
              </h2>
              <p className="text-[#8A8E99] text-sm md:text-base mb-6">
                List your inventory and reach thousands of buyers across SA.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-bold uppercase tracking-wider text-[#F0EDE8]">
                {['Dedicated storefront', 'Unlimited listings', 'Priority search', 'Lead analytics'].map(li => (
                  <div key={li} className="flex items-center gap-2">
                    <span className="text-[#C9922A]">✓</span> {li}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <Link href="/dealer/apply" className="bg-[#C9922A] text-black px-8 py-3 font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all text-center">
                Apply for Dealer Account
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#08090B] border-t border-white/5 pt-12 pb-8 px-6">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
              <div className="md:col-span-1">
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase block mb-4">
                  GUN <span className="text-[#C9922A]">X</span>
                </span>
                <p className="text-[13px] text-[#8A8E99] leading-relaxed mb-4">
                  South Africa's cleanest classified portal for legal firearms. Connecting licensed dealers and private sellers with buyers across all nine provinces.
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[#8A8E99] font-bold">
                  <span>FCA Compliant</span><span>·</span><span>POPI Act Registered</span>
                </div>
              </div>
              <div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-4">Browse</h3>
                <ul className="space-y-2">
                  {['Pistols', 'Rifles', 'Shotguns', 'Revolvers', 'Air Guns', 'Airsoft', 'Holsters', 'Magazines', 'Ammunition', 'Reloading', 'Knives'].map(item => (
                    <li key={item}>
                      <Link href={`/browse/${item.toLowerCase().replace(/ /g, '-')}`} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{item}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-4">Platform</h3>
                <ul className="space-y-2">
                  {[['How it Works', '/how-it-works'], ['Dealer Directory', '/dealers'], ['Post a Listing', '/sell'], ['Dealer Plans', '/dealer/pricing'], ['Price Guide', '/price-guide']].map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-4">Company</h3>
                <ul className="space-y-2">
                  {[['About Us', '/about'], ['Contact', '/contact'], ['FAQs', '/faqs'], ['Blog', '/blog'], ['Report a Listing', '/report']].map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[12px] text-[#8A8E99]">© 2026 Gun X — All rights reserved</p>
              <div className="flex items-center gap-5 text-[12px] text-[#8A8E99]">
                {[['Terms of Use', '/terms'], ['Privacy Policy', '/privacy'], ['POPI Act', '/popi'], ['Legal Disclaimer', '/legal']].map(([label, href]) => (
                  <Link key={label} href={href} className="hover:text-[#C9922A] transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-253px * 16)); }
        }
        .animate-scroll { animation: scroll 45s linear infinite; }
        .animate-scroll:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}