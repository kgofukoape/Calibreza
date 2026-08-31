'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

// ─── ADVOCACY & ASSOCIATIONS ─────────────────────────────────────────────────
// /advocacy
//
// A visibility directory for South African firearm rights organisations.
// Deliberately not a membership system: people join on the organisation's own
// site, which is what the outbound link on each profile is for.
//
// The card mirrors ClubCard so the site does not acquire a second visual
// language for what is, to a visitor, the same kind of object — a listed
// organisation you can click into.

interface Group {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  mission_statement: string | null;
  website_url: string | null;
}

export default function AdvocacyPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from('advocacy_groups')
      .select('id, name, slug, logo_url, mission_statement, website_url')
      .eq('status', 'active')
      .order('name');

    setGroups((data || []) as Group[]);
    setLoading(false);
  };

  const filtered = groups.filter(g => {
    if (!search.trim()) return true;
    const hay = `${g.name} ${g.mission_statement || ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

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
                <span className="text-[#F0EDE8]">Advocacy & Associations</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tight">
                Advocacy & <span className="text-[#C9922A]">Associations</span>
              </h1>
              <p className="text-[#8A8E99] text-sm mt-2 uppercase tracking-widest font-bold">
                Organisations working on behalf of South Africa's licensed firearm community
              </p>
            </div>

            <Link href="/press"
              className="flex-shrink-0 bg-white/5 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/10 transition-all text-center">
              Press Releases →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-10">

        {/* WHAT THIS IS, AND WHAT IT IS NOT.
            Said plainly and up front, because a visitor seeing organisations
            listed on a commercial platform will reasonably wonder what the
            relationship is. */}
        <div className="bg-[#13151A] border-l-2 border-[#C9922A] rounded-sm px-4 py-3 mb-6">
          <p className="text-[12.5px] text-[#C4C0B8] leading-relaxed">
            These organisations are listed as a service to the shooting community.
            Gun X is not affiliated with them and does not handle memberships —
            joining happens on each organisation's own website.
          </p>
        </div>

        {/* SEARCH */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search organisations..."
            className="flex-1 min-w-[240px] bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
          />
        </div>

        {loading ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
            <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
            <div className="text-4xl mb-3 opacity-20">⚖️</div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-xl font-black uppercase text-[#F0EDE8] mb-1">
              {search ? 'No matches' : 'No organisations listed yet'}
            </p>
            <p className="text-[#8A8E99] text-sm">
              {search
                ? 'Try a different search term.'
                : 'Organisations will appear here as they are added.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(group => (
              <Link key={group.id} href={`/advocacy/${group.slug}`}
                className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden hover:border-[#C9922A]/30 transition-all group">

                <div className="relative h-[160px] bg-[#191C23] overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-[#1a1d24] to-[#0D0F13] flex items-center justify-center">
                    <span className="text-6xl opacity-5">⚖️</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#13151A] to-transparent" />

                  <div className="absolute bottom-3 left-4 w-14 h-14 rounded-sm bg-[#C9922A] border-2 border-[#13151A] overflow-hidden flex items-center justify-center shadow-lg">
                    {group.logo_url ? (
                      <img src={group.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-black font-black text-xl">
                        {group.name?.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 left-3 bg-white/10 text-[#F0EDE8] text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-wider">
                    ⚖️ Association
                  </div>
                </div>

                <div className="p-4 pt-3">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-xl font-black uppercase tracking-tight text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors mb-2">
                    {group.name}
                  </h3>

                  {group.mission_statement && (
                    <p className="text-[12.5px] text-[#8A8E99] leading-relaxed line-clamp-3">
                      {group.mission_statement}
                    </p>
                  )}

                  <p className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] mt-4">
                    View organisation →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}