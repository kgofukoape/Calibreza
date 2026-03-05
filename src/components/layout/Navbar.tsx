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
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link 
            href="/command-center" 
            className="hidden sm:flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#C9922A] border border-[#C9922A]/30 px-4 py-2 rounded-sm hover:bg-[#C9922A] hover:text-black transition-all"
          >
            Pro Command Center
          </Link>

          <div className="flex items-center gap-3">
            <Link 
              href="/signup" 
              className="bg-[#191C23] border border-white/10 text-[#F0EDE8] text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm hover:bg-white/10 transition-all"
            >
              Sign Up
            </Link>
            <Link 
              href="/login" 
              className="bg-[#C9922A] text-black text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm hover:brightness-110 transition-all"
            >
              Login
            </Link>
          </div>
        </div>

      </div>
    </nav>
  );
}
