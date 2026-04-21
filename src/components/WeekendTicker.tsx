'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const getWeekendState = () => {
  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 5 || day === 6;

  if (isWeekend) {
    const endOfSunday = new Date(now);
    const daysUntilEnd = day === 0 ? 0 : day === 5 ? 2 : 1;
    endOfSunday.setDate(endOfSunday.getDate() + daysUntilEnd);
    endOfSunday.setHours(23, 59, 59, 999);
    const diff = endOfSunday.getTime() - now.getTime();
    return {
      isWeekend: true,
      hoursRemaining: Math.floor(diff / (1000 * 60 * 60)),
      minutesRemaining: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      isComingSoon: false,
      hoursUntilStart: 0,
    };
  }

  if (day === 4) {
    const nextFriday = new Date(now);
    nextFriday.setDate(nextFriday.getDate() + 1);
    nextFriday.setHours(0, 0, 0, 0);
    const diff = nextFriday.getTime() - now.getTime();
    return {
      isWeekend: false,
      hoursRemaining: 0,
      minutesRemaining: 0,
      isComingSoon: true,
      hoursUntilStart: Math.ceil(diff / (1000 * 60 * 60)),
    };
  }

  return { isWeekend: false, hoursRemaining: 0, minutesRemaining: 0, isComingSoon: false, hoursUntilStart: 0 };
};

export default function WeekendTicker() {
  const [state, setState] = useState(getWeekendState());
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setState(getWeekendState()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!state.isWeekend && !state.isComingSoon) return null;

  // THURSDAY — coming soon teaser
  if (state.isComingSoon) {
    return (
      <div className="w-full bg-[#13151A] border-b border-[#C9922A]/20 py-2 px-4 flex items-center justify-center gap-3">
        <span className="text-[#C9922A] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          ⏳ Coming Tomorrow
        </span>
        <span className="text-[#8A8E99] text-[9px] font-bold uppercase tracking-widest">—</span>
        <span className="text-[#F0EDE8] text-[10px] font-black uppercase tracking-widest">
          R10 Listing Boost Weekend — promote your ad for the price of a Coke
        </span>
        <span className="text-[#8A8E99] text-[9px] font-bold uppercase tracking-widest">—</span>
        <Link href="/sell" className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125 transition-all">
          Get your listing ready →
        </Link>
      </div>
    );
  }

  // WEEKEND — live aggressive ticker
  return (
    <div className="w-full bg-[#E63946]/10 border-b border-[#E63946]/30 py-2 overflow-hidden relative">
      <div className="flex items-center animate-ticker whitespace-nowrap gap-12 px-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-8 flex-shrink-0">

            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#E63946]">
              <span className="w-2 h-2 rounded-full bg-[#E63946] animate-pulse inline-block" />
              🔥 LIVE: R10 BOOST WEEKEND
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F0EDE8]">
              🚀 PUSH YOUR LISTING TO THE TOP FOR JUST R10
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C9922A]">
              ⏱ {state.hoursRemaining}H {state.minutesRemaining}M TO LOCK IN THE DEAL
            </span>

            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8E99]">
              NORMALLY R29 — NOW 65% OFF
            </span>

            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-[9px] font-black uppercase tracking-widest bg-[#E63946] text-white px-3 py-1 rounded-sm hover:brightness-110 transition-all"
              >
                HOW IT WORKS ℹ️
              </button>
              {showTooltip && (
                <div className="absolute top-8 left-0 z-50 bg-[#0D0F13] border border-[#E63946]/30 rounded-sm p-4 w-[240px] shadow-xl">
                  <p className="text-[11px] font-black uppercase text-[#E63946] mb-3">Boost in 3 Steps</p>
                  <div className="space-y-2">
                    {[
                      ['1', 'Post your listing for free'],
                      ['2', 'Click "Boost" on your dashboard'],
                      ['3', 'Watch your views climb all weekend'],
                    ].map(([num, text]) => (
                      <div key={num} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#E63946] text-white text-[8px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{num}</span>
                        <p className="text-[11px] text-[#F0EDE8]">{text}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#8A8E99] mt-3 italic border-t border-white/10 pt-2">
                    A R10 Boost puts your listing in front of more eyes than a 50-round box of 9mm puts holes in paper.
                  </p>
                </div>
              )}
            </div>

            <Link href="/sell"
              className="bg-[#E63946] text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all rounded-sm">
              BOOST NOW →
            </Link>

            <span className="text-[#8A8E99]/30 text-lg">|</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-ticker {
          animation: ticker 25s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}