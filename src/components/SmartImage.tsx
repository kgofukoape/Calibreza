'use client';

import React from 'react';

// ─── SMART IMAGE ─────────────────────────────────────────────────────────────
// Two mobile problems this solves.
//
// 1. FULL-SIZE DOWNLOADS
//    Dealers upload straight from a phone, so a single listing photo is often
//    3–5 MB. A browse page showing 20 of them pulled 60 MB+ at full resolution
//    to draw thumbnails a few hundred pixels wide. Supabase Storage can resize
//    on the fly, so we ask for the size we actually display.
//
// 2. EVERYTHING LOADING AT ONCE
//    Only one image on the whole site used lazy loading. Every photo below the
//    fold downloaded immediately, competing with the content the user can
//    actually see. Now anything not marked `priority` waits until it is near
//    the viewport.
//
// NOTE ON SUPABASE TRANSFORMS
// The `render/image` endpoint requires a paid Supabase plan. On the free tier
// the transform silently does nothing and the original is served — so this is
// safe to ship now, and starts saving bandwidth the moment you upgrade. Lazy
// loading works on every plan, immediately.

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Rendered width in CSS pixels — used to request a sensibly sized file */
  width?: number;
  /** Above-the-fold images load eagerly; everything else waits */
  priority?: boolean;
  quality?: number;
}

/** Rewrite a Supabase public URL to request a resized version. */
function transform(src: string, width: number, quality: number): string {
  if (!src || typeof src !== 'string') return src;
  if (!src.includes('/storage/v1/object/public/')) return src;      // not Supabase
  if (src.includes('/render/image/')) return src;                    // already transformed

  const url = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  const sep = url.includes('?') ? '&' : '?';
  // Ask for twice the CSS width so it stays sharp on high-density phone screens
  return `${url}${sep}width=${Math.round(width * 2)}&quality=${quality}&resize=cover`;
}

export default function SmartImage({
  src,
  alt,
  className = '',
  width = 400,
  priority = false,
  quality = 70,
}: SmartImageProps) {
  const finalSrc = transform(src, width, quality);

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      // Tells the browser this image is off the critical path
      fetchPriority={priority ? 'high' : 'low'}
      onError={(e) => {
        // If a transformed URL fails (e.g. transforms unavailable), fall back
        // to the original rather than showing a broken image.
        const img = e.currentTarget;
        if (img.src !== src) img.src = src;
      }}
    />
  );
}
