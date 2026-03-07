import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 gap-10">
        
        {/* MEMBER SIDEBAR */}
        <aside className="w-full lg:w-[320px] flex-shrink-0">
          <div className="bg-[#191C23] border border-white/5 rounded-sm p-8 sticky top-28 shadow-xl">
            <div className="flex items-center gap-5 mb-10 pb-8 border-b border-white/5">
              <div className="w-14 h-14 bg-[#C9922A] rounded-sm flex items-center justify-center text-black font-black text-2xl shadow-[0_0_20px_rgba(201,146,42,0.2)]">JD</div>
              <div>
                <h2 className="text-[#F0EDE8] font-black uppercase tracking-tight text-lg leading-none mb-2">John Doe</h2>
                <span className="text-[10px] text-[#C9922A] uppercase tracking-[0.2em] font-black">Verified Member</span>
              </div>
            </div>

            <nav className="flex flex-col gap-3">
              {[
                { label: 'Overview', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { label: 'My Listings', href: '/dashboard/listings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                { label: 'Wishlist', href: '/dashboard/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                { label: 'Wanted Bounties', href: '/dashboard/wanted', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
                { label: 'Messages', href: '/dashboard/messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
                { label: 'Settings', href: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center gap-4 px-5 py-4 rounded-sm text-[#8A8E99] hover:bg-[#C9922A]/10 hover:text-[#C9922A] transition-all group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 transition-colors"><path d={item.icon} /></svg>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                </Link>
              ))}
            </nav>

            <button className="w-full mt-12 flex items-center justify-center gap-3 bg-[#ff4d4d]/5 text-[#ff4d4d] border border-[#ff4d4d]/10 py-4 rounded-sm text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#ff4d4d] hover:text-white transition-all">
              Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
