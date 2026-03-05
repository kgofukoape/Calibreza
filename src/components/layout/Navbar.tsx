import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-[#0D0F13] border-b border-white/5 sticky top-0 z-50 w-full">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-24 flex items-center justify-between">
        
        {/* LOGO AREA - BOLDER & LARGER */}
        <div className="flex items-center">
          <Link href="/" className="flex flex-col">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black tracking-tighter text-[#F0EDE8] leading-none uppercase">
              GUN <span className="text-[#C9922A]">X</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#8A8E99] mt-1">
              Firearms Classifieds
            </span>
          </Link>
        </div>

        {/* RIGHT SIDE ACTIONS - LARGER BUTTONS */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link 
            href="/login" 
            className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#F0EDE8] hover:text-[#C9922A] transition-all"
          >
            Sign In
          </Link>

          <Link 
            href="/signup" 
            className="bg-[#191C23] border border-white/10 text-[#C9922A] text-[13px] font-bold uppercase tracking-[0.2em] px-8 py-3.5 rounded-sm hover:bg-white/5 transition-all"
          >
            Register
          </Link>

          <Link 
            href="/sell" 
            className="bg-[#C9922A] text-black text-[13px] font-bold uppercase tracking-[0.2em] px-8 py-3.5 rounded-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,146,42,0.3)]"
          >
            + Post Ad
          </Link>
        </div>

      </div>
    </nav>
  );
}
