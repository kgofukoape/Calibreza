'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DisclaimerModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = sessionStorage.getItem('gunx_disclaimer_accepted');
    if (!accepted) setShow(true);
  }, []);

  const accept = () => {
    sessionStorage.setItem('gunx_disclaimer_accepted', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#13151A] border border-[#C9922A]/30 rounded-sm max-w-[560px] w-full shadow-[0_30px_80px_rgba(0,0,0,0.9)] overflow-hidden">

        <div className="bg-[#C9922A]/10 border-b border-[#C9922A]/20 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-xl font-black uppercase tracking-tight text-[#F0EDE8]">
              Important Notice
            </h2>
            <p className="text-[11px] text-[#C9922A] font-bold uppercase tracking-widest">
              Please read before continuing
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 text-[13px] text-[#8A8E99] leading-relaxed">
          <p>
            <strong className="text-[#F0EDE8]">Gun X is a classified advertising platform</strong> — we do not sell, transfer, or deal in firearms. We provide a platform for licensed dealers and private individuals to advertise firearms and related items.
          </p>
          <p>
            All transactions must be conducted in accordance with the{' '}
            <strong className="text-[#F0EDE8]">Firearms Control Act (Act 60 of 2000)</strong> and any other applicable South African legislation. Transfers of ownership of firearms must be done through a{' '}
            <strong className="text-[#F0EDE8]">SAPS-registered dealer</strong>.
          </p>
          <p>
            Gun X does not facilitate, oversee, or take responsibility for any transactions conducted between buyers and sellers.{' '}
            <strong className="text-[#F0EDE8]">We will not be held liable for any deals, disputes, or illegal transactions conducted off this platform</strong>{' '}
            or in contravention of the law.
          </p>
          <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-3 text-[12px]">
            By continuing, you confirm that you are over 18 and agree to our{' '}
            <Link href="/terms" className="text-[#C9922A] hover:underline">Terms of Use</Link>,{' '}
            <Link href="/legal" className="text-[#C9922A] hover:underline">Legal Disclaimer</Link> and{' '}
            <Link href="/privacy" className="text-[#C9922A] hover:underline">Privacy Policy</Link>.
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button onClick={accept}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-3 rounded-sm hover:brightness-110 transition-all">
            I Understand — Continue
          </button>
          <a href="https://www.google.com"
            className="flex-1 border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">
            Leave Site
          </a>
        </div>
      </div>
    </div>
  );
}