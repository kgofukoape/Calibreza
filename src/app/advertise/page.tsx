'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/footer';

// ─── LOCKED PRICING — matches CLAUDE.md revenue table exactly ───────────────
// Zone Alpha   Leaderboard Top  970×90    R1,500/month
// Zone Bravo   Leaderboard Mid  728×90    R1,200/month
// Zone Charlie Sidebar L/R      160×600   R800/month
// Zone Delta   Square Card      300×250   R500/month
// ─────────────────────────────────────────────────────────────────────────────

interface AdZone {
  id: string;
  code: string;
  label: string;
  dimensions: string;
  dimensionsMobile?: string;
  rate: string;
  rateRaw: number;
  placement: string;
  pages: string[];
  audience: string;
  badge?: string;
}

const AD_ZONES: AdZone[] = [
  {
    id: 'zone-alpha',
    code: 'ZONE A',
    label: 'Leaderboard Top',
    dimensions: '970 × 90 px',
    dimensionsMobile: '320 × 50 px (mobile)',
    rate: 'R 1,500',
    rateRaw: 1500,
    placement: 'Absolute top of page — visible before any scroll on every primary marketplace page and browse category.',
    pages: ['Homepage', 'All browse pages', 'Listing detail', 'Dealers directory'],
    audience: 'National importers, firearm brands, and tier-one distributors seeking maximum platform authority.',
    badge: 'Highest Impact',
  },
  {
    id: 'zone-bravo',
    code: 'ZONE B',
    label: 'Leaderboard Mid',
    dimensions: '728 × 90 px',
    rate: 'R 1,200',
    rateRaw: 1200,
    placement: 'Injected inline between listing rows mid-page — captures buyers actively scanning inventory.',
    pages: ['Homepage', 'Browse categories'],
    audience: 'Ammunition distributors, optics brands, and dealers targeting active inventory browsers.',
  },
  {
    id: 'zone-charlie',
    code: 'ZONE C',
    label: 'Sidebar (Left / Right)',
    dimensions: '160 × 600 px',
    rate: 'R 800',
    rateRaw: 800,
    placement: 'Fixed alongside listing grids and item detail pages — persistent visibility throughout the browse session.',
    pages: ['Browse pages', 'Listing detail', 'Dealers directory'],
    audience: 'Custom holster manufacturers, localized accessory retailers, and regional ammunition suppliers.',
  },
  {
    id: 'zone-delta',
    code: 'ZONE D',
    label: 'Square Card',
    dimensions: '300 × 250 px',
    rate: 'R 500',
    rateRaw: 500,
    placement: 'Embedded in sidebar blocks and mobile feed positions — broad reach across all device types.',
    pages: ['Sidebar positions', 'Mobile feed', 'Club & services pages'],
    audience: 'Shooting clubs, training ranges, gunsmiths, and motivation writers targeting first-time applicants.',
  },
];

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-14 md:py-20">
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#C9922A] animate-pulse" />
            <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em]">
              Media Kit · Banner Advertising
            </p>
          </div>
          <h1
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-5"
          >
            Advertise on <span className="text-[#C9922A]">Gun X</span>
          </h1>
          <p className="text-[#8A8E99] text-base leading-relaxed max-w-2xl mb-8">
            Reach high-conviction South African buyers at the exact moment of acquisition. Four
            fixed ad zones. Flat monthly rates. No impression tracking, no hidden fees.
          </p>

          {/* Quick stat strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: '9', label: 'Provinces' },
              { value: '16+', label: 'Categories' },
              { value: '4', label: 'Ad Zones' },
              { value: '100%', label: 'FCA Compliant' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-[#0D0F13] border border-white/5 rounded-sm px-4 py-3 text-center"
              >
                <p
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black text-[#C9922A]"
                >
                  {s.value}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#8A8E99] mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RATE CARD ────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1000px] mx-auto w-full px-4 md:px-6 py-12 md:py-20 space-y-5">

        {AD_ZONES.map((zone, idx) => (
          <div
            key={zone.id}
            className="bg-[#13151A] border border-white/5 rounded-sm hover:border-[#C9922A]/30 transition-all duration-300 relative group overflow-hidden"
          >
            {/* Copper accent bar on left */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#C9922A]/20 group-hover:bg-[#C9922A]/60 transition-all duration-300" />

            {zone.badge && (
              <span className="absolute top-4 right-4 bg-[#C9922A]/10 border border-[#C9922A]/40 text-[#C9922A] text-[9px] font-black uppercase px-2 py-0.5 rounded-sm tracking-wider">
                {zone.badge}
              </span>
            )}

            <div className="pl-6 pr-5 py-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

              {/* Left: metadata */}
              <div className="md:col-span-3 space-y-4">
                <div className="flex items-start gap-4">
                  {/* Zone badge */}
                  <div className="flex-shrink-0 w-12 h-12 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm flex items-center justify-center">
                    <span
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-[#C9922A] font-black text-[11px] tracking-widest"
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9922A] mb-0.5">
                      {zone.code}
                    </p>
                    <h2
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-2xl md:text-3xl font-black uppercase tracking-wide text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors"
                    >
                      {zone.label}
                    </h2>
                    <p className="text-[11px] text-[#8A8E99] font-mono mt-0.5">
                      {zone.dimensions}
                      {zone.dimensionsMobile && (
                        <span className="text-[#5A5E69] ml-2">· {zone.dimensionsMobile}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-[13px] text-[#8A8E99] leading-relaxed">
                  <p>
                    <strong className="text-[#F0EDE8]">Placement:</strong>{' '}
                    {zone.placement}
                  </p>
                  <p>
                    <strong className="text-[#F0EDE8]">Audience:</strong>{' '}
                    {zone.audience}
                  </p>
                </div>

                {/* Pages tags */}
                <div className="flex flex-wrap gap-2">
                  {zone.pages.map((pg) => (
                    <span
                      key={pg}
                      className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-2 py-0.5 rounded-sm"
                    >
                      {pg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: price callout */}
              <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-5 flex flex-col items-center justify-center text-center h-full min-h-[100px]">
                <span className="text-[9px] font-black text-[#8A8E99] uppercase tracking-widest block mb-2">
                  Flat Monthly Rate
                </span>
                <div
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-4xl font-black text-[#C9922A]"
                >
                  {zone.rate}
                </div>
                <span className="text-[9px] text-[#5A5E69] block mt-1">
                  Excl. VAT · 30-Day Term
                </span>
              </div>

            </div>
          </div>
        ))}

        {/* ── WHAT YOU PROVIDE ───────────────────────────────────────────── */}
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 mt-4">
          <h3
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-xl font-black uppercase tracking-wide text-[#F0EDE8] mb-4"
          >
            What You Supply
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px] text-[#8A8E99]">
            {[
              {
                title: 'Creative Asset',
                body: 'A static image (JPG or PNG) or animated GIF at the exact pixel dimensions for your chosen zone.',
              },
              {
                title: 'Destination URL',
                body: 'Where the banner click should land — your website, WhatsApp line, or product page.',
              },
              {
                title: 'Billing',
                body: 'EFT payment upfront to GX SA (Pty) Ltd. Invoice issued within 24 hours of placement confirmation.',
              },
            ].map((item) => (
              <div key={item.title} className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#C9922A]">
                  {item.title}
                </p>
                <p className="leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black uppercase tracking-wide text-[#F0EDE8]"
            >
              Ready to secure your slot?
            </h3>
            <p className="text-[13px] text-[#8A8E99] max-w-lg leading-relaxed">
              Slots are limited per zone. Contact us with your chosen zone, creative asset, and
              destination URL to confirm availability and receive your invoice.
            </p>
          </div>
          <Link
            href="/contact?intent=advertising"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:brightness-110 transition-all text-center whitespace-nowrap w-full md:w-auto flex-shrink-0"
          >
            Enquire Now →
          </Link>
        </div>

        {/* ── COMPLIANCE NOTE ────────────────────────────────────────────── */}
        <div className="border-l-2 border-white/10 bg-white/2 p-4 rounded-sm">
          <p className="text-[11px] text-[#5A5E69] leading-relaxed">
            <strong className="text-[#8A8E99]">Compliance:</strong> All creative assets must
            comply with South African advertising codes. GX SA reserves the right to refuse
            placements from unverified operations or any content that contradicts the Firearms
            Control Act 60 of 2000.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
