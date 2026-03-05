import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-[#0D0F13] border-b border-white/5 sticky top-0 z-50 w-full">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        
        {/* LOGO AREA */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex flex-col">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black tracking-tighter text-[#F0EDE8] leading-none">
              CALIBRE<span className="text-[#C9922A]">ZA</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#8A8E99] mt-1">Classifieds Hub</span>
          </Link>

          {/* MAIN CATEGORY LINKS */}
          <div className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-8 h-8">
            <Link href="/wanted" className="text-[11px] font-bold uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] transition-colors">Wanted Bounties</Link>
            <Link href="/sport-shooting" className="text-[11px] font-bold uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] transition-colors">Clubs & Ranges</cite: _Sport shooting in South africa.pdf (p. 6, 7)>
          </div>
        </div>

        {/* RIGHT SIDE: USER & PRO ACTIONS */}
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* PRO ACCESS LINK */}
          <Link 
            href="/command-center" 
            className="hidden sm:flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C9922A] border border-[#C9922A]/30 px-4 py-2 rounded-sm hover:bg-[#C9922A] hover:text-black transition-all"
          >
            <span className="w-2 h-2 bg-[#C9922A] rounded-full animate-pulse"></span>
            Pro Command Center
          </Link>

          <div className="h-6 w-px bg-white/10 hidden md:block"></div>

          {/* USER DASHBOARD ACTIONS */}
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/messages" 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[#F0EDE8] relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#C9922A] rounded-full border-2 border-[#0D0F13]"></span>
            </Link>

            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 bg-[#191C23] border border-white/5 px-4 py-2 rounded-md hover:border-white/20 transition-all"
            >
              <div className="w-6 h-6 bg-[#C9922A] rounded-full flex items-center justify-center text-black text-[10px] font-black">JD</div>
              <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest text-[#F0EDE8]">Dashboard</span>
            </Link>
          </div>

          {/* MOBILE MENU TOGGLE (MOCKUP) */}
          <button className="lg:hidden text-[#F0EDE8]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
