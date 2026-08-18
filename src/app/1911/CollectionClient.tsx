'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';
import { COLLECTION_1911, matchesCollection } from '@/lib/collections';

// ─── 1911 COLLECTION ─────────────────────────────────────────────────────────
// Matching happens in the browser rather than in the query, because the rules
// are a two-tier test — an exclusive maker OR a pattern word across three
// fields — that does not express cleanly as a single PostgREST filter, and
// keeping it in one shared function means the page and any future count badge
// cannot disagree about what qualifies.
//
// The trade-off is that this fetches active listings and filters them. Fine at
// current volume; past a few thousand listings this wants moving to a
// materialised collection table with the tags written at listing creation.

const COLLECTION = COLLECTION_1911;

export default function CollectionClient() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('*, makes(name)')
        .eq('status', 'active')
        .order('is_featured', { ascending: false, nullsFirst: false })
        .order('dealer_tier_rank', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(500);

      const matched = (data || []).filter(l =>
        matchesCollection(COLLECTION, {
          title: l.title,
          model: l.model,
          description: l.description,
          makeName: l.makes?.name,
        }),
      );

      setListings(matched);
      setLoading(false);
    };
    load();
  }, []);

  const sorted = [...listings].sort((a, b) => {
    if (sortBy === 'price_asc')  return (a.price ?? 0) - (b.price ?? 0);
    if (sortBy === 'price_desc') return (b.price ?? 0) - (a.price ?? 0);
    return 0; // already in relevance order from the query
  });

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-14 md:py-20">
        <div className="max-w-[1100px] mx-auto">
          <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em] mb-3">
            Collection
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 leading-[0.9]">
            The <span className="text-[#C9922A]">1911</span>
          </h1>
          <p className="text-[#C4C0B8] text-[15px] md:text-[16px] leading-relaxed max-w-2xl">
            {COLLECTION.intro}
          </p>

          <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/5">
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl font-black text-[#C9922A] leading-none">
                {loading ? '—' : listings.length}
              </p>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">
                Listed now
              </p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <p className="text-[13px] text-[#8A8E99] leading-relaxed max-w-sm">
              Updated live as sellers list. Every transfer must be completed
              lawfully through a licensed dealer.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1100px] mx-auto w-full px-4 md:px-6 py-10 md:py-14">

        {/* ── LISTINGS ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-2xl md:text-3xl font-black uppercase tracking-tight">
            Available Now
          </h2>
          {listings.length > 0 && (
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="bg-[#13151A] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] outline-none focus:border-[#C9922A]">
              <option value="newest">Most relevant</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          )}
        </div>

        {loading ? (
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold py-16 text-center">
            Loading…
          </p>
        ) : listings.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-12 text-center">
            <p className="text-[#F0EDE8] text-lg mb-2">No 1911s listed at the moment.</p>
            <p className="text-[#8A8E99] text-sm mb-8">
              New listings appear here automatically. Have one to sell?
            </p>
            <Link href="/sell"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:brightness-110 transition-all">
              List Your 1911
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(listing => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                city={listing.city}
                province={listing.province}
                images={listing.images}
                featured={listing.is_featured}
              />
            ))}
          </div>
        )}

        {/* ── GLOSSARY ─────────────────────────────────────────────────── */}
        {/* Below the listings deliberately: buyers came to see guns. The words
            are for the person deciding whether a Commander suits them, and for
            search engines looking for a page that actually explains something. */}
        <section className="mt-16 pt-12 border-t border-white/5">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">
            Understanding the <span className="text-[#C9922A]">1911</span>
          </h2>
          <p className="text-[#8A8E99] text-[14px] leading-relaxed mb-10 max-w-2xl">
            The terms you will see in listings, explained plainly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
            {COLLECTION.glossary.map(section => (
              <div key={section.heading}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-[13px] font-black uppercase tracking-widest text-[#C9922A] mb-4 pb-2 border-b border-[#C9922A]/20">
                  {section.heading}
                </h3>
                <dl className="space-y-4">
                  {section.items.map(item => (
                    <div key={item.term}>
                      <dt className="text-[#F0EDE8] font-semibold text-[14px]">{item.term}</dt>
                      <dd className="text-[#8A8E99] text-[13.5px] leading-relaxed mt-0.5">
                        {item.meaning}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER CTA ───────────────────────────────────────────────── */}
        <section className="mt-16 bg-[#13151A] border border-white/5 rounded-sm p-8 md:p-10 text-center">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
            Selling a 1911?
          </h2>
          <p className="text-[#8A8E99] text-[14px] leading-relaxed mb-6 max-w-lg mx-auto">
            List it here and it appears on this page automatically, alongside
            every other 1911 on Gun X.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sell"
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:brightness-110 transition-all">
              List Your 1911
            </Link>
            <Link href="/browse"
              className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:bg-white/5 transition-all">
              Browse All Pistols
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}