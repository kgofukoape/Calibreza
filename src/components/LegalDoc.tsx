'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── SHARED LEGAL DOCUMENT LAYOUT ────────────────────────────────────────────
// Used by /terms, /popi, /dealer-terms and /legal so every legal page looks and
// behaves the same. Each page supplies its own title and sections.

export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

interface LegalDocProps {
  eyebrow?: string;
  titleLead: string;
  titleAccent: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  draftNotice?: boolean;
}

export default function LegalDoc({
  eyebrow = 'Legal',
  titleLead,
  titleAccent,
  intro,
  updated,
  sections,
  draftNotice = false,
}: LegalDocProps) {
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-[800px] mx-auto">
          <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em] mb-3">{eyebrow}</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            {titleLead} <span className="text-[#C9922A]">{titleAccent}</span>
          </h1>
          <p className="text-[#8A8E99] text-sm leading-relaxed mb-2">
            GX SA (Pty) Ltd · Registration 2025/830094/07 · Last updated: {updated}
          </p>
          <p className="text-[#8A8E99] text-sm leading-relaxed">{intro}</p>
        </div>
      </div>

      <div className="flex-1 max-w-[800px] mx-auto w-full px-4 md:px-6 py-10 md:py-16">

        {draftNotice && (
          <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-4 mb-8">
            <p className="text-[12px] text-[#F59E0B] leading-relaxed">
              <strong className="font-black uppercase tracking-widest">Under legal review</strong><br />
              This document is a working version pending final sign-off by our attorneys. It reflects
              how we operate, but should not be relied on as final legal advice. Questions:{' '}
              <a href="mailto:support@gunx.co.za" className="underline hover:brightness-125">support@gunx.co.za</a>
            </p>
          </div>
        )}

        {/* QUICK NAV */}
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 mb-8">
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">
            Contents
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map(s => (
              <button key={s.id}
                onClick={() => { setOpenSection(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:border-[#C9922A]/40 hover:text-[#C9922A] transition-all">
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* SECTIONS */}
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={section.id} id={section.id}
              className={`border rounded-sm transition-all ${openSection === section.id ? 'border-[#C9922A]/30 bg-[#C9922A]/5' : 'border-white/5 bg-[#13151A] hover:border-white/10'}`}>
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4">
                <span className="flex items-baseline gap-3">
                  <span className="text-[#C9922A] font-black text-[13px]">{String(idx + 1).padStart(2, '0')}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="font-black uppercase tracking-tight text-[17px] md:text-[19px]">
                    {section.title}
                  </span>
                </span>
                <span className={`text-[#C9922A] text-lg flex-shrink-0 transition-transform ${openSection === section.id ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openSection === section.id && (
                <div className="px-5 pb-5 pl-[3.1rem]">
                  {section.content.split('\n\n').map((para, i) => (
                    <p key={i} className="text-[14px] text-[#8A8E99] leading-relaxed mb-3 whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER LINKS */}
        <div className="mt-10 pt-6 border-t border-white/5">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Related</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['Terms of Use', '/terms'],
              ['Privacy Policy', '/privacy'],
              ['POPI Act', '/popi'],
              ['Dealer Agreement', '/dealer-terms'],
              ['Legal Disclaimer', '/legal'],
              ['Advertising Policy', '/advertising-policy'],
            ].map(([label, href]) => (
              <Link key={href} href={href}
                className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:border-[#C9922A]/40 hover:text-[#C9922A] transition-all">
                {label}
              </Link>
            ))}
          </div>
          <p className="text-[12px] text-[#8A8E99] mt-5 leading-relaxed">
            GX SA (Pty) Ltd · 11 Howe Street, Observatory, Western Cape, 7925<br />
            <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-125">support@gunx.co.za</a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
