'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// ─── SLOT DIMENSIONS ────────────────────────────────────────────────────────
// leaderboard_top   970 × 90    R1,500/month (Tier 1) → R500/month (Tier 4)
// leaderboard_mid   728 × 90    R1,200/month (Tier 1) → not on all pages
// sidebar_left      160 × 600   R800/month  (Tier 1)
// sidebar_right     160 × 600   R800/month  (Tier 1)
// square_card       300 × 250   R500/month  (Tier 1) → R150/month (Tier 4)
// ────────────────────────────────────────────────────────────────────────────

export type AdSlot =
  | 'leaderboard_top'
  | 'leaderboard_mid'
  | 'sidebar_left'
  | 'sidebar_right'
  | 'square_card';

export type AdPage =
  | 'home'
  | 'browse_pistols'
  | 'browse_rifles'
  | 'browse_shotguns'
  | 'browse_revolvers'
  | 'browse_ammunition'
  | 'browse_optics'
  | 'browse_accessories'
  | 'browse_holsters'
  | 'browse_air_guns'
  | 'browse_airsoft'
  | 'browse_magazines'
  | 'browse_reloading'
  | 'browse_knives'
  | 'listings_detail'
  | 'dealers_directory'
  | 'dealers_profile'
  | 'clubs_directory'
  | 'clubs_profile'
  | 'services_directory'
  | 'services_profile'
  | 'jobs_board'
  | 'jobs_detail'
  | 'wanted'
  | 'search'
  | 'advisor'
  | 'sell'
  | 'faqs'
  | 'firearm_ownership'
  | 'about'
  | 'all';

const SLOT_DIMENSIONS: Record<AdSlot, { w: number; h: number; label: string }> = {
  leaderboard_top: { w: 970, h: 90,  label: '970 × 90' },
  leaderboard_mid: { w: 728, h: 90,  label: '728 × 90' },
  sidebar_left:    { w: 160, h: 600, label: '160 × 600' },
  sidebar_right:   { w: 160, h: 600, label: '160 × 600' },
  square_card:     { w: 300, h: 250, label: '300 × 250' },
};

interface Ad {
  id: string;
  title: string;
  file_url: string;
  click_url: string;
  ad_type: 'image' | 'gif' | 'video';
  slot: AdSlot;
  page: string;
  impressions: number;
  clicks: number;
}

interface AdBannerProps {
  slot: AdSlot;
  page: AdPage;
  className?: string;
  /** 'desktop' = sidebar column · 'infeed' = between listings on smaller screens */
  variant?: 'desktop' | 'infeed';
}


export default function AdBanner({ slot, page, className = '' , variant = 'desktop' }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLAnchorElement | null>(null);
  const impressionLogged = useRef(false);

  // ── RESPONSIVE SIDEBAR RENDERING ────────────────────────────────────────
  // A sidebar booking is ONE product that appears everywhere: a 160×600
  // skyscraper on wide screens, and the same advertiser's mobile creative
  // in-feed between listings on phones. Nothing disappears on mobile, so the
  // slot can be sold at full price without a device caveat.
  //
  // `variant` is set by the page: 'desktop' for the sidebar column,
  // 'infeed' for the between-listings placement. Each renders on its own
  // breakpoint, and the viewability check means only the one actually seen
  // records an impression.
  const isSidebar = slot === 'sidebar_left' || slot === 'sidebar_right';
  const renderInFeed = isSidebar && variant === 'infeed';

  // In-feed sidebar creative uses a wide banner shape rather than a 160×600
  // skyscraper, which would be absurdly tall in a phone feed.
  const dims = renderInFeed
    ? { w: 320, h: 100, label: '320 × 100' }
    : SLOT_DIMENSIONS[slot];

  const fetchAd = useCallback(async () => {
    // Try page-specific ad first, fall back to 'all' if none found
    const { data: pageAd } = await supabase
      .from('ads')
      .select('id, title, file_url, mobile_file_url, click_url, ad_type, slot, page, impressions, clicks')
      .eq('slot', slot)
      .eq('page', page)
      .eq('status', 'active')
      .lte('starts_at', new Date().toISOString())
      .gte('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (pageAd) {
      setAd(pageAd);
      setLoading(false);
      return;
    }

    // Fallback: sitewide 'all' ad for this slot
    const { data: allAd } = await supabase
      .from('ads')
      .select('id, title, file_url, mobile_file_url, click_url, ad_type, slot, page, impressions, clicks')
      .eq('slot', slot)
      .eq('page', 'all')
      .eq('status', 'active')
      .lte('starts_at', new Date().toISOString())
      .gte('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    setAd(allAd || null);
    setLoading(false);
  }, [slot, page]);

  useEffect(() => {
    fetchAd();
  }, [fetchAd]);

  // ── VIEWABLE IMPRESSIONS ────────────────────────────────────────────────
  // Impressions were previously recorded the moment the ad DATA loaded, whether
  // or not the ad was ever on screen. Because the desktop sidebars sit inside a
  // `hidden 2xl:flex` wrapper, React still mounted them on phones and counted a
  // view that no mobile user could possibly have seen — inflating advertiser
  // numbers on a platform that promises "live performance tracking".
  //
  // Now an impression is only recorded when the element is actually visible in
  // the viewport, and only once per page view.
  const recordImpression = useCallback(async (adId: string, current: number) => {
    if (impressionLogged.current) return;
    impressionLogged.current = true;
    await supabase
      .from('ads')
      .update({ impressions: (current || 0) + 1 })
      .eq('id', adId);
  }, []);

  useEffect(() => {
    if (!ad || !containerRef.current) return;

    // No IntersectionObserver (very old browsers): fall back to counting it
    if (typeof IntersectionObserver === 'undefined') {
      recordImpression(ad.id, ad.impressions);
      return;
    }

    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Half the ad on screen counts as seen — the common industry bar
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            recordImpression(ad.id, ad.impressions);
            observer.disconnect();
          }
        });
      },
      { threshold: [0.5] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ad, recordImpression]);

  const handleClick = async () => {
    if (!ad) return;
    await supabase
      .from('ads')
      .update({ clicks: (ad.clicks || 0) + 1 })
      .eq('id', ad.id);
  };

  // ── LOADING STATE — maintain layout space ──────────────────────────────
  if (loading) {
    return (
      <div
        className={`bg-[#0D0F13] border border-white/5 flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: dims.w, maxWidth: '100%', aspectRatio: `${dims.w} / ${dims.h}` }}
      />
    );
  }

  // ── NO ACTIVE AD — show a self-promoting house ad (pure CSS, no images) ──
  if (!ad) {
    // Tall slots (sidebars) get a vertical layout; wide/short slots a horizontal one
    const isTall  = dims.h >= 400;            // sidebar skyscrapers
    const isWide  = dims.w >= 700;            // leaderboards
    const isSquare = !isTall && !isWide;      // square_card / leaderboard_mid-ish

    return (
      <a
        href="/advertise"
        className={`group relative block flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#15171d] to-[#0D0F13] border border-[#C9922A]/20 hover:border-[#C9922A]/50 transition-all duration-300 ${className}`}
        style={{ width: dims.w, maxWidth: '100%', aspectRatio: `${dims.w} / ${dims.h}` }}
        aria-label="Advertise on Gun X"
      >
        {/* faint copper glow on hover */}
        <span className="absolute inset-0 bg-[#C9922A]/0 group-hover:bg-[#C9922A]/5 transition-colors duration-300" />

        {/* corner tag */}
        <span className="absolute top-0 left-0 z-10 bg-[#C9922A]/10 text-[#C9922A] text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 leading-none">
          Your Ad Here
        </span>

        {isTall ? (
          /* ── SKYSCRAPER 160×600 — vertical stack ── */
          <div className="h-full flex flex-col items-center justify-center text-center px-2 py-6 gap-3 relative z-[1]">
            <span className="text-2xl">📢</span>
            <div style={{ writingMode: 'vertical-rl' }} className="rotate-180 flex items-center gap-3">
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[#F0EDE8] font-black uppercase tracking-widest text-lg leading-none">
                Advertise on Gun X
              </span>
            </div>
            <span className="text-[9px] text-[#8A8E99] uppercase tracking-widest font-bold">From R500/mo</span>
            <span className="mt-1 text-[8px] text-[#C9922A] font-black uppercase tracking-widest border border-[#C9922A]/30 px-2 py-1 group-hover:bg-[#C9922A] group-hover:text-black transition-all">
              Book →
            </span>
          </div>
        ) : isWide ? (
          /* ── LEADERBOARD 970×90 / 728×90 — horizontal row ── */
          <div className="h-full flex items-center justify-between px-6 relative z-[1]">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📢</span>
              <div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[#F0EDE8] font-black uppercase tracking-tight text-lg leading-none">
                  Advertise on <span className="text-[#C9922A]">Gun X</span>
                </p>
                <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold mt-0.5">
                  Reach SA's licensed firearm community · From R500/mo
                </p>
              </div>
            </div>
            <span className="text-[10px] text-[#C9922A] font-black uppercase tracking-widest border border-[#C9922A]/40 px-4 py-2 group-hover:bg-[#C9922A] group-hover:text-black transition-all whitespace-nowrap">
              View Rate Card →
            </span>
          </div>
        ) : (
          /* ── SQUARE 300×250 — centred block ── */
          <div className="h-full flex flex-col items-center justify-center text-center px-4 gap-2 relative z-[1]">
            <span className="text-3xl mb-1">📢</span>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[#F0EDE8] font-black uppercase tracking-tight text-xl leading-none">
              Advertise on <span className="text-[#C9922A]">Gun X</span>
            </p>
            <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold">
              From R500 / month
            </p>
            <span className="mt-2 text-[9px] text-[#C9922A] font-black uppercase tracking-widest border border-[#C9922A]/40 px-4 py-2 group-hover:bg-[#C9922A] group-hover:text-black transition-all">
              View Rate Card →
            </span>
          </div>
        )}
      </a>
    );
  }

  // ── ACTIVE AD ───────────────────────────────────────────────────────────
  // Sized by aspectRatio rather than a fixed height. A 970×90 leaderboard
  // squeezed onto a 380px phone previously kept its 90px height, and
  // object-cover then CROPPED the sides — cutting off the advertiser's message
  // for most of our traffic. Proportional scaling with object-contain shows the
  // whole creative on every screen.
  return (
    <a
      ref={containerRef}
      href={ad.click_url || '#'}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={`block flex-shrink-0 overflow-hidden relative group ${className}`}
      style={{ width: dims.w, maxWidth: '100%', aspectRatio: `${dims.w} / ${dims.h}` }}
      aria-label={`Advertisement: ${ad.title}`}
    >
      {/* Sponsored label */}
      <span className="absolute top-0 right-0 z-10 bg-black/60 text-[#5A5E69] text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 leading-none">
        Ad
      </span>

      {ad.ad_type === 'video' ? (
        <video
          src={ad.file_url}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-contain"
        />
      ) : (
        <img
          src={(renderInFeed && (ad as any).mobile_file_url) || ad.file_url}
          alt={ad.title}
          className="w-full h-full object-contain group-hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      )}
    </a>
  );
}
