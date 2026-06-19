'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

  const handleBookingClick = () => {
    if (!user) {
      router.push('/dealer/login?redirect=/advertise/book');
    } else {
      router.push('/advertise/book');
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Advertise</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none mb-4">
            Advertise on <span className="text-[#C9922A]">Gun X</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#F0EDE8] max-w-2xl leading-relaxed mb-6">
            Premium ad placements on South Africa's cleanest firearms classifieds platform. Reach licensed firearm owners, dealers, clubs, and ranges across the country.
          </p>
          <div className="flex flex-wrap gap-6 text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">
            <span>🇿🇦 National Reach</span>
            <span>🎯 FCA-Verified Audience</span>
            <span>📊 Live Performance Tracking</span>
          </div>
        </div>
      </section>

      {/* WHY ADVERTISE */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-8 text-center">
            Why <span className="text-[#C9922A]">Gun X</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: '🎯',
                title: 'Qualified Audience',
                body: 'Every visitor is here for one reason: firearms. No tyre-kickers, no irrelevant traffic. Direct access to buyers, dealers, club members, and security professionals.',
              },
              {
                icon: '📈',
                title: 'Real Performance Tracking',
                body: 'Every ad logs impressions and clicks in real time. See exactly how your campaign performs through the advertiser dashboard.',
              },
              {
                icon: '🛡️',
                title: 'Industry-Aligned',
                body: 'Gun X is South Africa\'s premier firearms community marketplace. Your brand sits alongside trusted dealers and verified clubs — not in a noisy general classifieds.',
              },
            ].map((card, i) => (
              <div key={i} className="bg-[#13151A] border border-white/5 rounded-sm p-6 hover:border-[#C9922A]/20 transition-all">
                <div className="text-4xl mb-3">{card.icon}</div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-xl font-black uppercase tracking-tight mb-2 text-[#C9922A]">
                  {card.title}
                </h3>
                <p className="text-[13px] text-[#8A8E99] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RATE CARD */}
      <section className="bg-[#0A0C10] border-y border-white/5 px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-10">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-3">
              Rate Card — <span className="text-[#C9922A]">Per Month</span>
            </h2>
            <p className="text-[14px] text-[#8A8E99] max-w-xl mx-auto">
              Flat monthly rates per slot. Book 1, 2, or 3 months in a single booking. No surge pricing. No bidding wars.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {AD_ZONES.map(zone => (
              <div key={zone.id}
                className={`bg-[#13151A] border rounded-sm overflow-hidden flex flex-col ${
                  zone.badge ? 'border-[#C9922A]/40' : 'border-white/5'
                }`}>

                <div className="p-6 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 bg-[#C9922A]/5 px-2 py-1 rounded-sm">
                        {zone.code}
                      </span>
                      {zone.badge && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-black bg-[#C9922A] px-2 py-1 rounded-sm">
                          {zone.badge}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-2xl font-black uppercase tracking-tight leading-tight mb-1">
                      {zone.label}
                    </h3>
                    <p className="text-[12px] text-[#8A8E99] font-mono">{zone.dimensions}</p>
                    {zone.dimensionsMobile && (
                      <p className="text-[11px] text-[#8A8E99]/70 font-mono">{zone.dimensionsMobile}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-3xl md:text-4xl font-black text-[#C9922A] leading-none">
                      {zone.rate}
                    </p>
                    <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest mt-1 font-bold">per month</p>
                  </div>
                </div>

                <div className="px-6 pb-6 flex-1 flex flex-col gap-4 border-t border-white/5 pt-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Placement</p>
                    <p className="text-[13px] text-[#F0EDE8] leading-relaxed">{zone.placement}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Live On</p>
                    <div className="flex flex-wrap gap-1.5">
                      {zone.pages.map(p => (
                        <span key={p} className="text-[10px] bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Best For</p>
                    <p className="text-[12px] text-[#8A8E99] leading-relaxed italic">{zone.audience}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-[#13151A] border border-white/5 rounded-sm p-5 text-center">
            <p className="text-[13px] text-[#F0EDE8]">
              <strong className="text-[#C9922A]">Book 1, 2, or 3 months</strong> in a single booking · End date auto-calculated · Locked rates · No surge pricing
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-8 text-center">
            How <span className="text-[#C9922A]">It Works</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Choose Slot & Page', body: 'Pick a zone and a page (or all pages). View live availability before booking.' },
              { step: '02', title: 'Upload Creative', body: 'Static image, animated GIF, or video. JPG, PNG, WebP, GIF, MP4 supported.' },
              { step: '03', title: 'Pay & Submit for Review', body: 'Pay via PayFast or EFT. All ads are reviewed by our team before going live to keep the platform brand-safe.' },
              { step: '04', title: 'Track Performance', body: 'Once approved your ad goes live. Live impressions and clicks visible in the advertiser dashboard 24/7.' },
            ].map((item, i) => (
              <div key={i} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-3xl font-black text-[#C9922A]/30 mb-2 leading-none">
                  {item.step}
                </p>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-lg font-black uppercase tracking-tight mb-2">
                  {item.title}
                </h3>
                <p className="text-[12px] text-[#8A8E99] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* Content policy note */}
          <div className="mt-8 bg-[#13151A] border border-white/5 rounded-sm p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] mb-2">📋 Content Standards</p>
            <p className="text-[13px] text-[#8A8E99] leading-relaxed">
              Gun X reviews every ad before publication. We accept brands, products, and services aligned with the licensed firearms community — dealers, manufacturers, accessories, training, legal services, insurance, hunting, security, and adjacent industries. We reserve the right to decline ads that conflict with platform values, FCA compliance, POPI Act, or general community standards. Reviews typically take under 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* CTA — TWO PATHS */}
      <section className="bg-[#13151A] border-t border-white/5 px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">
            Ready to <span className="text-[#C9922A]">Launch</span>?
          </h2>

          {/* ── SIGNED-IN: self-service ─────────────────────────────────────── */}
          {authChecked && user && (
            <>
              <p className="text-[14px] text-[#8A8E99] mb-6">
                Signed in as <span className="text-[#C9922A] font-bold">{user.email}</span> — book and upload your ad in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <button onClick={handleBookingClick}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-4 rounded-sm hover:brightness-110 transition-all">
                  Book a Slot →
                </button>
                <a href="mailto:pewpew@gunx.co.za?subject=Advertising Enquiry"
                  className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:bg-white/5 transition-all inline-block text-center">
                  ✉ Email Sales
                </a>
              </div>
            </>
          )}

          {/* ── LOGGED OUT / OUTSIDE COMPANY: contact sales ─────────────────── */}
          {authChecked && !user && (
            <>
              <p className="text-[15px] text-[#F0EDE8] mb-2 leading-relaxed">
                Want to advertise your brand on Gun X?
              </p>
              <p className="text-[14px] text-[#8A8E99] mb-7 leading-relaxed">
                Whether you're a firearms business, an outdoor or automotive brand, an insurer, or any company that wants to reach South Africa's licensed shooting community — get in touch and our team will set you up.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                <a href="mailto:pewpew@gunx.co.za?subject=Advertising Enquiry — Gun X"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-4 rounded-sm hover:brightness-110 transition-all inline-block text-center">
                  ✉ Contact Sales — pewpew@gunx.co.za
                </a>
              </div>

              {/* Registered-user prompt */}
              <div className="bg-[#0D0F13] border border-[#C9922A]/20 rounded-sm p-5 max-w-xl mx-auto">
                <p className="text-[13px] text-[#F0EDE8] leading-relaxed">
                  <span className="text-[#C9922A] font-black">Already registered?</span> If you're a dealer, club, range, or service provider with a Gun X account,{' '}
                  <Link href="/dealer/login?redirect=/advertise/book" className="text-[#C9922A] underline hover:brightness-125 font-bold">
                    log in to your account
                  </Link>{' '}
                  to book and upload ads yourself — no need to email us.
                </p>
              </div>
            </>
          )}

          {/* Audience figures placeholder — real numbers added once available */}
          <div className="border-t border-white/5 pt-6 mt-8 text-[12px] text-[#8A8E99]">
            <p className="text-[#8A8E99]/80">
              Open to advertisers from any lawful industry · Premium placements from R500/month · Reviewed before going live
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
