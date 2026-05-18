'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingAdvisor() {
  const pathname = usePathname();
  const [visible, setVisible]     = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isHovered = useRef(false);

  const hidden = pathname === '/advisor' ||
                 pathname?.startsWith('/admin') ||
                 pathname?.startsWith('/dealer-dashboard') ||
                 pathname?.startsWith('/service-dashboard') ||
                 pathname?.startsWith('/club-dashboard');

  useEffect(() => {
    if (hidden) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [hidden]);

  useEffect(() => {
    if (!visible || dismissed) return;
    const t1 = setTimeout(() => { if (!isHovered.current) setExpanded(true); }, 4000);
    const t2 = setTimeout(() => { if (!isHovered.current) setExpanded(false); }, 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, dismissed]);

  if (hidden || !visible || dismissed) return null;

  const handleMouseEnter = () => {
    isHovered.current = true;
    setExpanded(true);
  };

  const handleMouseLeave = () => {
    isHovered.current = false;
  };

  const toggleManual = () => {
    setExpanded(!expanded);
  };

  return (
    <div
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[200] flex flex-col items-end gap-2 font-sans"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>

      {/* TOOLTIP DIALOGUE BOX */}
      <div className={`bg-[#13151A] border border-red-500/40 rounded-sm p-4 shadow-[0_12px_40px_rgba(0,0,0,0.7)] max-w-[240px] transition-all duration-300 transform origin-bottom-right ${
        expanded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-[12px] font-black uppercase tracking-widest text-red-400">
            GX Match Advisor
          </p>
        </div>
        <p className="text-[11px] text-[#8A8E99] leading-relaxed mb-3">
          Not sure which frame size, calibre, or FCA licence section fits your lifestyle profile? Run a quick customized assessment.
        </p>
        <div className="pt-2 border-t border-white/5">
          <Link href="/advisor" onClick={() => setExpanded(false)}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="block text-center bg-red-600 text-white font-black uppercase tracking-widest text-[11px] px-3 py-2 rounded-sm hover:bg-red-500 transition-all">
            Start Assessment →
          </Link>
        </div>
      </div>

      {/* CORE CONTROL EMBLEM */}
      <div className="flex items-center gap-1.5 group">
        {/* Dismiss */}
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="w-5 h-5 rounded-full bg-[#191C23] border border-white/10 flex items-center justify-center text-[#8A8E99] hover:text-red-400 hover:border-red-500/30 transition-all text-[11px] font-bold shadow-md opacity-0 group-hover:opacity-100 duration-200"
          title="Dismiss">
          ×
        </button>

        {/* Main button */}
        <button onClick={toggleManual}
          className={`flex items-center gap-2.5 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-sm shadow-[0_6px_24px_rgba(220,38,38,0.4)] transition-all duration-200 ${expanded ? 'ring-2 ring-red-400/30' : ''}`}>
          <span className={`text-base transition-transform duration-300 ${expanded ? 'rotate-12 scale-110' : ''}`}>🎯</span>
          <div className="flex flex-col items-start text-left">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="font-black uppercase tracking-widest text-[12px] leading-none">
              Firearm Advisor
            </span>
            <span className="text-[9px] font-bold text-white/70 leading-none mt-0.5">
              FCA Assessment · Free
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse ml-0.5 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}
