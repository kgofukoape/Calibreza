'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { loadUser(); }, []);
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) { router.push('/login'); return; }
      setUser(currentUser);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard',          label: 'Overview',    icon: '📊' },
    { href: '/dashboard/listings', label: 'My Listings', icon: '📋' },
    { href: '/dashboard/messages', label: 'Messages',    icon: '💬' },
    { href: '/dashboard/wishlist', label: 'Wishlist',    icon: '⭐' },
  ];

  const SidebarContent = () => (
    <>
      {/* User info */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden flex-shrink-0">
            {user?.avatar_url?.startsWith('preset:')
              ? <span className="text-xl">{user.avatar_url.replace('preset:', '')}</span>
              : user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-bold text-black">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[14px] text-[#F0EDE8] truncate">
              {user?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[11px] text-[#8A8E99] truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[13px] font-bold transition-all ${
                pathname === item.href
                  ? 'bg-[#C9922A]/10 text-[#C9922A] border border-[#C9922A]/20'
                  : 'text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8]'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <Link href="/sell" onClick={() => setSidebarOpen(false)}
          className="block w-full bg-[#C9922A] text-black font-black text-[12px] uppercase tracking-widest py-3 rounded-sm text-center hover:brightness-110 transition-all">
          + Post Listing
        </Link>
        <Link href="/" onClick={() => setSidebarOpen(false)}
          className="block w-full border border-white/20 text-[#F0EDE8] font-bold text-[12px] uppercase tracking-widest py-3 rounded-sm text-center hover:bg-white/5 transition-all">
          ← Back to Site
        </Link>
        <button onClick={handleLogout}
          className="w-full border border-red-500/30 text-red-400 font-bold text-[12px] uppercase tracking-widest py-3 rounded-sm hover:bg-red-500/10 transition-all">
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col overflow-x-hidden">
      <Navbar />

      {/* Mobile top bar with menu button */}
      <div className="md:hidden bg-[#191C23] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-[15px] uppercase tracking-widest text-[#F0EDE8]">
          My Dashboard
        </span>
        <button onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 bg-[#0D0F13] border border-white/10 px-3 py-2 rounded-sm text-[12px] font-black uppercase tracking-widest text-[#8A8E99]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          Menu
        </button>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-[280px] bg-[#191C23] h-full overflow-y-auto border-r border-white/5 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-lg uppercase tracking-widest">My Account</span>
              <button onClick={() => setSidebarOpen(false)} className="text-[#8A8E99] hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 bg-[#191C23] border-r border-white/5 flex-col flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
