import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 gap-8">
        {/* PERSONAL DASHBOARD SIDEBAR */}
        <aside className="w-full lg:w-[280px] flex-shrink-0">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
              <div className="w-12 h-12 bg-[#C9922A] rounded-full flex items-center justify-center text-black font-bold text-xl">JD</div>
              <div>
                <h2 className="text-[#F0EDE8] font-bold leading-none mb-1">John Doe</h2>
                <span className="text-[11px] text-[#C9922A] uppercase tracking-widest font-semibold">Verified Member</span>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              {[
                { label: 'Overview', href: '/dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
                { label: 'My Listings', href: '/dashboard/listings', icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' },
                { label: 'Wanted Bounties', href: '/dashboard/wanted', icon: 'M11 8v2M11 14h.01M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' },
                { label: 'Messages', href: '/dashboard/messages', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
                { label: 'Settings', href: '/dashboard/settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
              ].map((item) => (
                <Link key={item.label} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-md text-[#8A8E99] hover:bg-[#C9922A]/10 hover:text-[#C9922A] transition-all group">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 transition-colors"><path d={item.icon} /></svg>
                  <span className="text-sm font-semibold uppercase tracking-wider">{item.label}</span>
                </Link>
              ))}
            </nav>

            <button className="w-full mt-12 flex items-center justify-center gap-2 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/20 py-3 rounded-md text-xs font-bold uppercase tracking-widest hover:bg-[#ff4d4d] hover:text-white transition-all">
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
