'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Shows "N of 50 founding dealer spots left".
//
// The count comes from founding_slots_used(), which counts the trial ledger,
// not the dealers table - a deleted account does not hand its slot back. A
// slot is only used once PayFast has confirmed the card, so browsing the
// pricing page costs nothing.
//
// Renders nothing when the offer is gone, when the count cannot be read, or
// before it arrives. A pricing page saying "0 spots left" sells nothing.
//
// NOTE: if you change the limit, set BOTH FOUNDING_DEALER_LIMIT (used by the
// checkout, which decides who actually gets it) and
// NEXT_PUBLIC_FOUNDING_DEALER_LIMIT (used here, for display only).

const LIMIT = parseInt(process.env.NEXT_PUBLIC_FOUNDING_DEALER_LIMIT || '50', 10);

export default function FoundingSpots() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('founding_slots_used');
        if (cancelled || error || typeof data !== 'number') return;
        setLeft(Math.max(0, LIMIT - data));
      } catch {
        // Silent: the countdown is a nudge, not information the page needs.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (left === null || left <= 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-8">
      <div className="border border-[#C9922A] bg-[#C9922A]/10 rounded-sm px-5 py-4 text-center">
        <p
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="text-[#C9922A] text-xl font-black uppercase tracking-widest"
        >
          {left} of {LIMIT} founding dealer spots left
        </p>
        <p className="text-[#8A8E99] text-[13px] mt-1">
          Founding dealers get 2 months free instead of 1. No charge today - your
          card is only billed on the 1st after your free months end, and you can
          cancel any time before that.
        </p>
      </div>
    </div>
  );
}
