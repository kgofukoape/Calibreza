'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
}

export default function AdBanner({ slot, page, className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  const dims = SLOT_DIMENSIONS[slot];

  const fetchAd = useCallback(async () => {
    // Try page-specific ad first, fall back to 'all' if none found
    const { data: pageAd } = await supabase
      .from('ads')
      .select('id, title, file_url, click_url, ad_type, slot, page, impressions, clicks')
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
      recordImpression(pageAd.id, pageAd.impressions);
      return;
    }

    // Fallback: sitewide 'all' ad for this slot
    const { data: allAd } = await supabase
      .from('ads')
      .select('id, title, file_url, click_url, ad_type, slot, page, impressions, clicks')
      .eq('slot', slot)
      .eq('page', 'all')
      .eq('status', 'active')
      .lte('starts_at', new Date().toISOString())
      .gte('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    setAd(allAd || null);
    setLoading(false);
    if (allAd) recordImpression(allAd.id, allAd.impressions);
  }, [slot, page]);

  useEffect(() => {
    fetchAd();
  }, [fetchAd]);

  const recordImpression = async (adId: string, current: number) => {
    await supabase
      .from('ads')
      .update({ impressions: (current || 0) + 1 })
      .eq('id', adId);
  };

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
        style={{ width: dims.w, maxWidth: '100%', height: dims.h }}
      />
    );
  }

  // ── NO ACTIVE AD — show placeholder (only visible in dev/staging) ───────
  if (!ad) {
    return (
      <div
        className={`bg-[#12141a] border border-dashed border-white/10 flex flex-col items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: dims.w, maxWidth: '100%', height: dims.h }}
      >
        <span className="text-[9px] text-[#3A3E49] font-black uppercase tracking-widest block">
          Ad Space — {dims.label}
        </span>
        <a
          href="/advertise"
          className="text-[8px] text-[#C9922A]/50 hover:text-[#C9922A] transition-colors mt-1 uppercase tracking-widest font-bold"
        >
          Advertise here →
        </a>
      </div>
    );
  }

  // ── ACTIVE AD ───────────────────────────────────────────────────────────
  return (
    <a
      href={ad.click_url || '#'}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={`block flex-shrink-0 overflow-hidden relative group ${className}`}
      style={{ width: dims.w, maxWidth: '100%', height: dims.h }}
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
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={ad.file_url}
          alt={ad.title}
          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      )}
    </a>
  );
}
