'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full relative z-50">
      {/* Top Warning Banner */}
      <div className="bg-[#EAE5D9] text-[#191C23] py-2 px-4 text-center text-[10px] md:text-xs font-medium">
        🔒 All firearm listings require verified licence information — <Link href="#" className="underline font-bold">Learn how it works</Link>
      </div>

      {/* Main Navbar */}
      <div className="bg-[#191C23] border-b border-white/5 relative z-50">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16 md:h-20 px-6 md:px-8">

          {/* Logo */}
          <Link href="/" className="flex flex-col">
            <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-2xl md:text-[28px] tracking-[0.15em] text-[#F0EDE8] leading-none uppercase">
              CALIBRE<span className="text-[#C9922A]">.</span>ZA
            </span>
            <span className="text-[8px] md:text-[10px] text-[#8A8E99] tracking-[0.3em] uppercase mt-1">Firearms Classifieds</span>
          </Link>

          {/* Desktop Links (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-8">
            {['Browse', 'Dealers', 'Listings', 'Services'].map((item) => (
              <Link key={item} href="#" className="text-[13px] font-bold tracking-widest text-[#8A8E99] hover:text-[#C9922A] uppercase transition-colors">
                {item}
              </Link>
            ))}
          </nav>

          {/* Desktop Buttons (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-[13px] font-bold tracking-widest text-[#F0EDE8] hover:text-[#C9922A] uppercase transition-colors px-4">
              Sign In
            </Link>
            <Link href="/post" style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="bg-[#C9922A] text-black font-bold text-[14px] tracking-[0.1em] uppercase px-6 py-2.5 rounded-[3px] hover:bg-[#b58325] transition-colors">
              + Post Ad
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={`bg-[#F0EDE8] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isOpen ? 'rotate-45 translate-y-2' : '-translate-y-0.5'}`}></span>
            <span className={`bg-[#F0EDE8] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`bg-[#F0EDE8] block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isOpen ? '-rotate-45 -translate-y-2' : 'translate-y-0.5'}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#1F2330] border-b border-white/5 shadow-2xl flex flex-col z-40">
          {['Browse', 'Dealers', 'Listings', 'Services'].map((item) => (
            <Link key={item} href="#" className="p-4 border-b border-white/5 text-[14px] font-bold tracking-widest text-[#F0EDE8] uppercase text-center hover:bg-white/5">
              {item}
            </Link>
          ))}
          <div className="p-6 flex flex-col gap-3">
            <Link href="/login" className="text-center py-3 text-[14px] font-bold tracking-widest text-[#F0EDE8] border border-white/10 uppercase rounded-[3px]">
              Sign In
            </Link>
            <Link href="/post" style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-center bg-[#C9922A] text-black font-bold text-[15px] tracking-[0.1em] uppercase py-3 rounded-[3px]">
              + Post Ad
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
