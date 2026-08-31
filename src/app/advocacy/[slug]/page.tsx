'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

// ─── ADVOCACY GROUP PROFILE ──────────────────────────────────────────────────
// /advocacy/[slug]
//
// The organisation's profile and its own press releases. Membership happens on
// their site, not here — the outbound button is the whole of that journey.

interface Group {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  mission_statement: string | null;
  about_text: string | null;
  website_url: string | null;
  contact_email: string | null;
}

interface Release {
  id: string;
  title: string;
  content: string;
  published_at: string;
}

/**
 * A link to somewhere else on the internet, written by somebody else.
 *
 * rel="noopener" stops the destination reaching back into this tab through
 * window.opener; "nofollow" keeps Gun X from passing search authority to a site
 * it does not control and has not vetted. Neither is paranoia — these are
 * third-party URLs stored in a database row.
 */
function safeExternal(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    // Anything that is not http(s) — javascript:, data: — is refused rather
    // than rendered as a link.
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export default function AdvocacyProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { if (slug) load(); }, [slug]);

  const load = async () => {
    const { data: g } = await supabase
      .from('advocacy_groups')
      .select('id, name, slug, logo_url, mission_statement, about_text, website_url, contact_email')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();

    if (!g) { setNotFound(true); setLoading(false); return; }
    setGroup(g as Group);

    const { data: r } = await supabase
      .from('press_releases')
      .select('id, title, content, published_at')
      .eq('group_id', (g as Group).id)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });

    setReleases((r || []) as Release[]);
    setLoading(false);
  };

  const website = safeExternal(group?.website_url ?? null);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-24 text-center">
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !group) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-24 text-center">
          <div className="text-5xl mb-4 opacity-20">⚖️</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl font-black uppercase mb-2">Organisation not found</h1>
          <p className="text-[#8A8E99] text-sm mb-6">
            This organisation is not listed, or its profile is not currently active.
          </p>
          <Link href="/advocacy"
            className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
            All organisations
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-4 flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <Link href="/advocacy" className="hover:text-[#C9922A]">Advocacy</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">{group.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="w-20 h-20 rounded-sm bg-[#C9922A] flex items-center justify-center overflow-hidden flex-shrink-0">
              {group.logo_url ? (
                <img src={group.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-black font-black text-3xl">{group.name.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">
                {group.name}
              </h1>
              {group.mission_statement && (
                <p className="text-[#C4C0B8] text-[15px] mt-3 leading-relaxed max-w-2xl">
                  {group.mission_statement}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* JOIN — the outbound link, and the only membership journey there is */}
        {website && (
          <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase text-[#F0EDE8] mb-1">
                  Support this organisation
                </h2>
                <p className="text-[13px] text-[#8A8E99] leading-relaxed">
                  Membership, donations and enquiries are handled on their own website.
                  Gun X does not process memberships.
                </p>
              </div>
              <a href={website} target="_blank" rel="noopener noreferrer nofollow"
                className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
                Visit Website →
              </a>
            </div>
          </div>
        )}

        {/* ABOUT */}
        {group.about_text && (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black uppercase text-[#F0EDE8] mb-4 pb-3 border-b border-white/5">
              About
            </h2>
            {/* Rendered as text, never as markup. This is a third party writing
                into a page served from your domain. */}
            <div className="text-[14.5px] text-[#C4C0B8] leading-relaxed whitespace-pre-wrap">
              {group.about_text}
            </div>
          </div>
        )}

        {group.contact_email && (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Contact</p>
            <a href={`mailto:${group.contact_email}`} className="text-[#C9922A] text-[14px] hover:underline">
              {group.contact_email}
            </a>
          </div>
        )}

        {/* PRESS RELEASES */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black uppercase text-[#F0EDE8]">
              Press <span className="text-[#C9922A]">Releases</span>
            </h2>
            <Link href="/press" className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A]">
              All releases →
            </Link>
          </div>

          {/* Attribution sits with the releases, where the statements are —
              not only on the global feed. Someone arriving here from a shared
              link never sees that page. */}
          <div className="bg-[#13151A] border-l-2 border-[#C9922A] rounded-sm px-4 py-3 mb-4">
            <p className="text-[12px] text-[#C4C0B8] leading-relaxed">
              Statements below are published by {group.name} and are their own.
              They do not reflect the position of GX SA (Pty) Ltd.
            </p>
          </div>

          {releases.length === 0 ? (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-10 text-center">
              <p className="text-[#8A8E99] text-sm">No press releases published yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {releases.map(r => (
                <article key={r.id} className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">
                    {fmt(r.published_at)}
                  </p>
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-2xl font-black uppercase tracking-tight text-[#F0EDE8] mb-3">
                    {r.title}
                  </h3>
                  <div className="text-[14.5px] text-[#C4C0B8] leading-relaxed whitespace-pre-wrap">
                    {r.content}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}