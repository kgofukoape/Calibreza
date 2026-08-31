'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

// ─── PRESS RELEASES ──────────────────────────────────────────────────────────
// /press
//
// A chronological feed of statements from every listed organisation.
//
// EVERYTHING HERE IS WRITTEN BY SOMEBODY ELSE. That governs two decisions:
//
//   The disclaimer is the first thing on the page, above the feed rather than
//   below it. A disclaimer under the content is read after the reader has
//   already attributed what they read to whoever's domain they are on.
//
//   Content is rendered as text. Never dangerouslySetInnerHTML, no markdown-to-
//   HTML pass, no exceptions. A third party writing markup into a page served
//   from gunx.co.za can read your visitors' session — the feed is a text feed
//   precisely so that cannot happen.

interface FeedItem {
  id: string;
  title: string;
  content: string;
  published_at: string;
  advocacy_groups: {
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
}

const PAGE_SIZE = 20;

export default function PressPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => { load(0); }, []);

  const load = async (offset: number) => {
    const { data } = await supabase
      .from('press_releases')
      .select('id, title, content, published_at, advocacy_groups(name, slug, logo_url)')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const batch = (data || []) as unknown as FeedItem[];

    setItems(prev => offset === 0 ? batch : [...prev, ...batch]);
    setHasMore(batch.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  };

  const loadMore = () => {
    setLoadingMore(true);
    load(items.length);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      {/* PAGE HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
                <Link href="/" className="hover:text-[#C9922A]">Home</Link>
                <span>/</span>
                <span className="text-[#F0EDE8]">Press Releases</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tight">
                Press <span className="text-[#C9922A]">Releases</span>
              </h1>
              <p className="text-[#8A8E99] text-sm mt-2 uppercase tracking-widest font-bold">
                Statements from South Africa's firearm rights organisations
              </p>
            </div>

            <Link href="/advocacy"
              className="flex-shrink-0 bg-white/5 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/10 transition-all text-center">
              ← Organisations
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* ── COMMUNITY NOTICE ────────────────────────────────────────────────
            First thing on the page, before any content. A disclaimer placed
            after what it disclaims is read too late to do its job. */}
        <div className="bg-[#13151A] border border-[#C9922A]/40 rounded-sm p-5 md:p-6 mb-8">
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-[#C9922A] font-black uppercase tracking-widest text-[13px] mb-3">
            Community Notice
          </p>
          <p className="text-[13.5px] text-[#C4C0B8] leading-relaxed">
            The press releases, statements, and opinions published in this section
            belong solely to the respective advocacy organizations and authors. They
            do not reflect the official policy, position, or values of GX SA (Pty)
            Ltd. We provide this feed strictly as a neutral visibility service for
            the South African licensed firearm community.
          </p>
        </div>

          {loading ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
            <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
            <div className="text-4xl mb-3 opacity-20">📰</div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-xl font-black uppercase text-[#F0EDE8] mb-1">
              No press releases yet
            </p>
            <p className="text-[#8A8E99] text-sm mb-6">
              Statements from listed organisations will appear here.
            </p>
            <Link href="/advocacy"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
              Browse organisations
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map(item => {
                const g = item.advocacy_groups;
                return (
                  <article key={item.id} className="bg-[#13151A] border border-white/5 rounded-sm p-6 hover:border-[#C9922A]/20 transition-all">

                    {/* Attribution above the headline. The organisation that
                        wrote it should be the first thing read, not a footnote
                        under a statement the reader has already absorbed. */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                      <div className="w-10 h-10 rounded-sm bg-[#C9922A] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {g?.logo_url ? (
                          <img src={g.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                            className="text-black font-black text-lg">{g?.name?.charAt(0) || '?'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        {g ? (
                          <Link href={`/advocacy/${g.slug}`}
                            className="block text-[13px] font-bold text-[#F0EDE8] hover:text-[#C9922A] transition-colors truncate">
                            {g.name}
                          </Link>
                        ) : (
                          <span className="block text-[13px] font-bold text-[#8A8E99]">Unlisted organisation</span>
                        )}
                        <p className="text-[11px] text-[#8A8E99]">{fmt(item.published_at)}</p>
                      </div>
                    </div>

                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#F0EDE8] mb-3 leading-tight">
                      {item.title}
                    </h2>

                    {/* Text, not markup. See the note at the top of this file. */}
                    <div className="text-[14.5px] text-[#C4C0B8] leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button onClick={loadMore} disabled={loadingMore}
                  className="bg-white/5 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-8 py-3 rounded-sm hover:bg-white/10 transition-all disabled:opacity-40">
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}