'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HERO */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-14 md:py-20">
        <div className="max-w-[800px] mx-auto">
          <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em] mb-4">The Vision</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-6">
            Inside <span className="text-[#C9922A]">GX SA</span>
          </h1>
          <p className="text-[#8A8E99] text-base md:text-lg leading-relaxed max-w-2xl">
            GX SA (originally developed under the Calibreza project framework) is an elite digital infrastructure platform engineered to establish the cleanest classified ecosystem for the South African firearms industry.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <main className="flex-1 max-w-[800px] mx-auto w-full px-4 md:px-6 py-12 md:py-20 space-y-16">

        {/* SECTION 1 */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-[#C9922A] font-black text-[11px]">01</span>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl md:text-3xl font-black uppercase tracking-wide">
              Our Infrastructure
            </h2>
          </div>
          <p className="text-[#8A8E99] text-[15px] leading-relaxed">
            The traditional local market has long suffered from fragmented listing networks, administrative friction and insecure communication loops. We built GX SA to completely collapse those inefficiencies, providing a secure, unified workspace connecting licensed civilian owners, accredited shooting clubs, verified dealers and professional industry service providers nationwide.
          </p>
        </section>

        {/* DIVIDER */}
        <div className="h-px bg-white/5" />

        {/* SECTION 2 */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-[#C9922A] font-black text-[11px]">02</span>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl md:text-3xl font-black uppercase tracking-wide">
              Regulatory Compliance & Precision
            </h2>
          </div>
          <p className="text-[#8A8E99] text-[15px] leading-relaxed mb-4">
            Operating in a highly regulated landscape under the Firearms Control Act 60 of 2000 (FCA), absolute transparency is not just a technical preference. It is a foundational baseline. Every asset interface, listing workflow and automated system on our platform is built to uphold institutional safety boundaries.
          </p>
          <p className="text-[#8A8E99] text-[15px] leading-relaxed">
            From the GX Match Advisor, engineered to intelligently align civilian profiles with correct statutory pathways such as Section 13, Section 15 and Section 16, to our direct ecosystem links, we prioritise verified legal safety. We provide active buyers with direct click-through lanes to professional Motivation Writers and accredited live-fire ranges, ensuring a secure, structured compliance portfolio from day one.
          </p>
        </section>

        {/* DIVIDER */}
        <div className="h-px bg-white/5" />

        {/* SECTION 3 */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-[#C9922A] font-black text-[11px]">03</span>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl md:text-3xl font-black uppercase tracking-wide">
              Operational Excellence
            </h2>
          </div>
          <p className="text-[#8A8E99] text-[15px] leading-relaxed">
            We believe high-conviction decisions require premium tools. GX SA bypasses the noise of unmoderated social groups and outdated forum scripts, delivering precision category navigation, real-time engagement metrics, verified dealer storefronts and accredited club directories. Whether you are searching for a flat-shooting competition platform to optimise your IDPA splits, an everyday carry solution or a licensed gunsmith for custom work, GX SA delivers a seamless experience across the full firearm ownership lifecycle.
          </p>
        </section>

        {/* DIVIDER */}
        <div className="h-px bg-white/5" />

        {/* SECTION 4 */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-8 bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-[#C9922A] font-black text-[11px]">04</span>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl md:text-3xl font-black uppercase tracking-wide">
              The Ecosystem
            </h2>
          </div>
          <p className="text-[#8A8E99] text-[15px] leading-relaxed mb-4">
            At the core of GX SA is a living community layer, the dealers who know their stock, the clubs who develop competitive shooters, the ranges that provide safe live-fire environments and the service professionals who keep platforms running.
          </p>
          <p className="text-[#8A8E99] text-[15px] leading-relaxed">
            We did not build a classifieds board. We built the infrastructure that connects every layer of South Africa's legal firearms community in one verified, high-performance space.
          </p>
        </section>

        {/* DIVIDER */}
        <div className="h-px bg-white/5" />

        {/* STATS ROW */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '9',      label: 'Provinces Covered'      },
            { value: '4',      label: 'User Tiers'             },
            { value: '16+',    label: 'Listing Categories'     },
            { value: '100%',   label: 'FCA Compliant'          },
          ].map(stat => (
            <div key={stat.label} className="bg-[#13151A] border border-white/5 rounded-sm p-5 text-center">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl font-black text-[#C9922A] mb-1">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* CTA STRIP */}
        <section className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black uppercase mb-1">Ready to get started?</p>
            <p className="text-[#8A8E99] text-[13px]">Join South Africa's cleanest firearms marketplace.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link href="/browse" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
              Browse Listings
            </Link>
            <Link href="/dealer/apply"
              className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all text-center">
              Apply as Dealer
            </Link>
          </div>
        </section>

        {/* FOOTER NOTE */}
        <p className="text-center text-[11px] text-[#8A8E99]/50 pb-4">
          GX SA (Pty) Ltd · Registered in South Africa
        </p>

      </main>
    </div>
  );
}
