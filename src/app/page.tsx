'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { n: 'Pistols',          slug: 'pistols',     i: '🎯', href: '/browse/pistols' },
  { n: 'Rifles',           slug: 'rifles',      i: '🔭', href: '/browse/rifles' },
  { n: 'Shotguns',         slug: 'shotguns',    i: '♾️', href: '/browse/shotguns' },
  { n: 'Revolvers',        slug: 'revolvers',   i: '🎡', href: '/browse/revolvers' },
  { n: 'Air Guns',         slug: 'air-guns',    i: '💨', href: '/browse/air-guns' },
  { n: 'Airsoft',          slug: 'airsoft',     i: '⚡', href: '/browse/airsoft' },
  { n: 'Optics',           slug: 'optics',      i: '🔬', href: '/browse/optics' },
  { n: 'Holsters & Carry', slug: 'holsters',    i: '∪',  href: '/browse/holsters' },
  { n: 'Magazines',        slug: 'magazines',   i: '⋮',  href: '/browse/magazines' },
  { n: 'Ammunition',       slug: 'ammunition',  i: '⦊',  href: '/browse/ammunition' },
  { n: 'Reloading',        slug: 'reloading',   i: '🔧', href: '/browse/reloading' },
  { n: 'Knives & Blades',  slug: 'knives',      i: '🖋️', href: '/browse/knives' },
  { n: 'Accessories',      slug: 'accessories', i: '🛠️', href: '/browse/accessories' },
  { n: 'Dealers',          slug: 'dealers',     i: '🏪', href: '/dealers' },
  { n: 'Clubs & Ranges',   slug: 'clubs',       i: '⊕',  href: '/clubs' },
  { n: 'Services',         slug: 'services',    i: '🏠', href: '/services' },
  { n: 'Wanted',           slug: 'wanted',      i: '🔍', href: '/wanted' },
  { n: 'Industry Jobs',    slug: 'jobs',        i: '💼', href: '/jobs' },
];

export default function HomePage() {
  const [reelListings, setReelListings]             = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts]         = useState<Record<string, number>>({});
  const [totalListings, setTotalListings]           = useState(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  useEffect(() => { fetchReelListings(); fetchCategoryCounts(); }, []);

  const fetchReelListings = async () => {
    const { data } = await supabase.from('listings')
      .select('id, title, price, category_id, images, city, listing_type, is_featured')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(16);
    setReelListings(data || []);
  };

  const fetchCategoryCounts = async () => {
    const { data } = await supabase.from('listings').select('category_id').eq('status', 'active');
    if (!data) return;
    setTotalListings(data.length);
    const counts: Record<string, number> = {};
    data.forEach(l => { if (l.category_id) counts[l.category_id] = (counts[l.category_id] || 0) + 1; });
    setCategoryCounts(counts);
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  const displayReel = reelListings.length > 0 ? [...reelListings, ...reelListings] : [];

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] overflow-x-hidden flex flex-col">

      {/* ANNOUNCEMENT BAR */}
      {announcementVisible && (
        <div className="bg-[#C9922A] text-black relative z-50">
          <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm">🎯</span>
            <p className="text-[12px] font-black uppercase tracking-widest">Shooting Ranges — List Free for 2 Months</p>
            <span className="hidden sm:inline text-black/40">·</span>
            <p className="text-[12px] font-bold text-black/80 hidden sm:block">
              Booking system, live status &amp; results board. R399/month after trial.
            </p>
            <Link href="/clubs/pricing" className="text-[11px] font-black uppercase tracking-widest underline hover:text-black/70 whitespace-nowrap">
              Start Free →
            </Link>
            <button onClick={() => setAnnouncementVisible(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/50 hover:text-black text-lg leading-none font-bold">×</button>
          </div>
        </div>
      )}

      <Navbar />

      {/* TOP LEADERBOARD AD */}
      <div className="w-full flex justify-center pt-3 pb-2 px-4">
        <div className="w-full max-w-[970px] h-[90px] lg:h-[120px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Top Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      <main className="flex-1 w-full">
        <div className="flex w-full items-start">

          {/* LEFT AD */}
          <aside className="hidden xl:flex flex-col flex-shrink-0 w-[180px] pl-2">
            <div className="sticky top-4 w-full h-[600px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center p-3 text-center">
              <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
              <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 x 600</div>
            </div>
          </aside>

          {/* CENTER */}
          <div className="flex-1 min-w-0">

            {/* HERO */}
            <section className="relative pt-3 pb-2 px-4 md:px-6 text-center max-w-[900px] mx-auto">
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-[28px] sm:text-[38px] md:text-[48px] lg:text-[54px] xl:text-[60px] font-black uppercase tracking-tighter leading-[0.85] mb-2 lg:mb-3">
                SOUTH AFRICA&apos;S <br className="hidden sm:block" />
                <span className="text-[#C9922A]">PREMIER FIREARMS</span> <br />
                CLASSIFIEDS
              </h1>
              {totalListings > 0 && (
                <p className="text-[#8A8E99] text-[11px] uppercase tracking-widest font-bold mb-3">
                  <span className="text-[#C9922A] font-black">{totalListings.toLocaleString()}</span> active listings across South Africa
                </p>
              )}
              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-3 lg:mb-4">
                <Link href="/browse" className="bg-[#C9922A] text-black px-7 py-3 font-black uppercase tracking-widest text-[13px] lg:text-[14px] hover:brightness-110 transition-all shadow-[0_0_30px_rgba(201,146,42,0.2)]">
                  BROWSE LISTINGS
                </Link>
                <Link href="/sell" className="border border-white/10 text-white px-7 py-3 font-black uppercase tracking-widest text-[13px] lg:text-[14px] hover:bg-white/5 transition-all">
                  POST FREE LISTING
                </Link>
                <Link href="/advisor" className="border border-[#C9922A]/40 text-[#C9922A] px-7 py-3 font-black uppercase tracking-widest text-[13px] lg:text-[14px] hover:bg-[#C9922A]/10 transition-all">
                  🎯 FIND MY GUN
                </Link>
              </div>
            </section>

            {/* REEL */}
            {displayReel.length > 0 && (
              <div className="relative w-full py-3 border-y border-white/5 bg-[#12141a]/50 overflow-hidden">
                <div className="flex gap-3 animate-scroll whitespace-nowrap px-4">
                  {displayReel.map((item, idx) => (
                    <Link key={idx} href={`/listings/${item.id}`}
                      style={{ width: '250px', minWidth: '250px', maxWidth: '250px' }}
                      className="bg-[#191C23] border border-white/5 p-2 rounded-sm shrink-0 flex-none text-left hover:border-[#C9922A]/40 transition-colors block">
                      <div className="relative overflow-hidden bg-[#0D0F13] mb-1.5" style={{ height: '160px' }}>
                        {item.images?.length > 0
                          ? <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg opacity-20">🔫</div>}
                        <div className="absolute top-1 left-1 bg-[#C9922A] text-black text-[7px] font-black px-1 py-0.5 uppercase tracking-tighter z-10 leading-none">
                          {formatCategory(item.category_id)}
                        </div>
                        {item.is_featured && <div className="absolute top-1 right-1 text-[9px] z-10">⭐</div>}
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

            {/* RANGE CTA STRIP */}
            <div className="px-4 md:px-6 py-4">
              <div className="bg-gradient-to-r from-[#C9922A]/10 via-[#C9922A]/5 to-transparent border border-[#C9922A]/20 rounded-sm px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="font-black text-[16px] uppercase">Own a Shooting Range?</p>
                    <p className="text-[11px] text-[#8A8E99]">Online booking · Live status · Results board · 2 months free · Then R399/month</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href="/clubs/pricing" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                    className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[11px] px-4 py-2 rounded-sm hover:brightness-110 whitespace-nowrap">
                    Start 2 Months Free
                  </Link>
                  <Link href="/clubs" className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[11px] px-4 py-2 rounded-sm hover:bg-white/5 whitespace-nowrap">
                    Browse Ranges
                  </Link>
                </div>
              </div>
            </div>

            {/* AI ADVISOR CTA */}
            <div className="px-4 md:px-6 py-2">
              <div className="bg-[#191C23] border border-[#C9922A]/30 rounded-sm px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm flex items-center justify-center text-xl flex-shrink-0">🎯</div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9922A] animate-pulse" />
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#C9922A]">AI-Powered</p>
                    </div>
                    <p style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="font-black text-[18px] uppercase leading-tight">Not Sure Which Firearm to Buy?</p>
                    <p className="text-[11px] text-[#8A8E99]">Answer 4 questions · Claude analyses your profile · Live listings matched to you</p>
                  </div>
                </div>
                <Link href="/advisor" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all whitespace-nowrap flex-shrink-0">
                  Start Free Assessment →
                </Link>
              </div>
            </div>

            {/* BROWSE BY CATEGORY */}
            <section className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 lg:py-12">
              <div className="text-center mb-6 lg:mb-10">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2 text-[#F0EDE8]">
                  Browse By <span className="text-[#C9922A]">Category</span>
                </h2>
                <p className="text-[#8A8E99] text-[11px] uppercase tracking-[0.3em] font-bold">Explore listings across all firearm categories</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {CATEGORIES.map(cat => (
                  <Link key={cat.slug} href={cat.href}
                    className="bg-[#13151A] border border-white/5 p-3 lg:p-4 flex flex-col items-center group hover:border-[#C9922A]/30 transition-all rounded-sm text-center">
                    <span className="text-lg mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">{cat.i}</span>
                    <h3 className="font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mb-0.5 leading-tight">{cat.n}</h3>
                    <p className="text-[8px] text-[#C9922A] font-black uppercase tracking-tighter">
                      {categoryCounts[cat.slug] ? `${categoryCounts[cat.slug].toLocaleString()} listing${categoryCounts[cat.slug] !== 1 ? 's' : ''}` : 'Browse'}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* WHY CHOOSE */}
            <section className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 lg:py-12 border-t border-white/5">
              <div className="text-center mb-6 lg:mb-10">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2">
                  Why Choose <span className="text-[#C9922A]">Gun X?</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { t: 'Verified Sellers',  d: 'Every dealer and private seller goes through identity verification before listing.', i: '🛡️' },
                  { t: 'Provincial Search', d: 'Find firearms close to home. Filter by province and city across all 9 provinces.',   i: '📍' },
                  { t: 'FCA Compliant',     d: 'All listings comply with the Firearms Control Act. We take legal responsibility seriously.', i: '📋' },
                ].map(item => (
                  <div key={item.t} className="bg-[#13151A] p-5 lg:p-6 border border-white/5 rounded-sm">
                    <div className="w-10 h-10 bg-[#191C23] border border-[#C9922A]/20 flex items-center justify-center rounded-sm mb-4 text-lg">{item.i}</div>
                    <h3 className="text-base font-bold uppercase tracking-tight mb-2">{item.t}</h3>
                    <p className="text-[#8A8E99] text-sm leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* DEALER CTA */}
            <section className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 lg:py-12">
              <div className="bg-[#13151A] border border-[#C9922A]/20 p-6 md:p-10 lg:p-14 rounded-sm flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-10">
                <div className="max-w-2xl text-center lg:text-left">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-3xl md:text-4xl lg:text-5xl font-black uppercase leading-none mb-3">
                    Grow Your <span className="text-[#C9922A]">Dealership</span> Online.
                  </h2>
                  <p className="text-[#8A8E99] text-sm md:text-base mb-5">List your inventory and reach thousands of buyers across South Africa.</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold uppercase tracking-wider text-[#F0EDE8]">
                    {['Dedicated storefront', 'Unlimited listings', 'Priority search', 'Lead analytics'].map(li => (
                      <div key={li} className="flex items-center gap-2"><span className="text-[#C9922A]">✓</span> {li}</div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <Link href="/dealer/apply" className="bg-[#C9922A] text-black px-8 py-3 font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all text-center whitespace-nowrap">
                    Apply for Dealer Account
                  </Link>
                  <Link href="/dealer/pricing" className="border border-white/10 text-white px-8 py-3 font-black uppercase tracking-widest text-[13px] hover:bg-white/5 transition-all text-center whitespace-nowrap">
                    View Pricing
                  </Link>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-[#08090B] border-t border-white/5 pt-10 pb-6 px-4 md:px-6">
              <div className="max-w-[1280px] mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                  <div className="col-span-2 md:col-span-1">
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase block mb-3">
                      GUN <span className="text-[#C9922A]">X</span>
                    </span>
                    <p className="text-[13px] text-[#8A8E99] leading-relaxed mb-3">South Africa's cleanest classified portal for legal firearms.</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#8A8E99] font-bold">
                      <span>FCA Compliant</span><span>·</span><span>POPI Act</span>
                    </div>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-3">Browse</h3>
                    <ul className="space-y-2">
                      {['Pistols','Rifles','Shotguns','Revolvers','Air Guns','Optics','Ammunition','Knives','Accessories'].map(item => (
                        <li key={item}><Link href={`/browse/${item.toLowerCase().replace(/ /g,'-')}`} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{item}</Link></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-3">Platform</h3>
                    <ul className="space-y-2">
                      {[['Dealer Directory','/dealers'],['Post a Listing','/sell'],['Clubs & Ranges','/clubs'],['Services','/services'],['Industry Jobs','/jobs'],['Wanted Ads','/wanted'],['🎯 Firearm Advisor','/advisor']].map(([label,href]) => (
                        <li key={label}><Link href={href} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{label}</Link></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-3">Company</h3>
                    <ul className="space-y-2">
                      {[['About Us','/about'],['Contact','/contact'],['FAQs','/faqs'],['FA Ownership','/firearm-ownership'],['Report a Listing','/report'],['Privacy Policy','/privacy']].map(([label,href]) => (
                        <li key={label}><Link href={href} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{label}</Link></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-[12px] text-[#8A8E99]">© 2026 GX SA (Pty) Ltd — All rights reserved</p>
                  <div className="flex flex-wrap justify-center items-center gap-4 text-[12px] text-[#8A8E99]">
                    {[['Terms of Use','/terms'],['Privacy Policy','/privacy'],['POPI Act','/popi'],['Legal Disclaimer','/legal']].map(([label,href]) => (
                      <Link key={label} href={href} className="hover:text-[#C9922A] transition-colors">{label}</Link>
                    ))}
                  </div>
                </div>
              </div>
            </footer>

          </div>

          {/* RIGHT AD */}
          <aside className="hidden xl:flex flex-col flex-shrink-0 w-[180px] pr-2">
            <div className="sticky top-4 w-full h-[600px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center p-3 text-center">
              <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
              <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 x 600</div>
            </div>
          </aside>

        </div>
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
