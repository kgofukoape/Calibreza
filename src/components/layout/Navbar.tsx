'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'kgofu.koape@gmail.com';

type Stats = {
  totalUsers: number;
  totalListings: number;
  totalDealers: number;
  pendingApplications: number;
  totalViews: number;
  activeListings: number;
};

type RecentActivity = {
  id: string;
  type: 'listing' | 'dealer' | 'user';
  title: string;
  subtitle: string;
  time: string;
  status?: string;
};

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalListings: 0,
    totalDealers: 0,
    pendingApplications: 0,
    totalViews: 0,
    activeListings: 0,
  });
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [recentDealers, setRecentDealers] = useState<any[]>([]);
  const [pendingDealers, setPendingDealers] = useState<any[]>([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/');
      return;
    }
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const [
      listingsRes,
      dealersRes,
      pendingRes,
      recentListingsRes,
      recentDealersRes,
    ] = await Promise.all([
      supabase.from('listings').select('id, status, views_count', { count: 'exact' }),
      supabase.from('dealers').select('id, status', { count: 'exact' }),
      supabase.from('dealers').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('listings').select('id, title, status, created_at, category_id, price').order('created_at', { ascending: false }).limit(5),
      supabase.from('dealers').select('id, business_name, status, created_at, city, province').order('created_at', { ascending: false }).limit(5),
    ]);

    const listings = listingsRes.data || [];
    const dealers = dealersRes.data || [];

    setStats({
      totalListings: listings.length,
      activeListings: listings.filter((l) => l.status === 'active').length,
      totalViews: listings.reduce((sum, l) => sum + (l.views_count || 0), 0),
      totalDealers: dealers.filter((d) => d.status === 'approved').length,
      pendingApplications: dealers.filter((d) => d.status === 'pending').length,
      totalUsers: 0,
    });

    setRecentListings(recentListingsRes.data || []);
    setRecentDealers(recentDealersRes.data || []);
    setPendingDealers(pendingRes.data || []);
  };

  const handleQuickApprove = async (dealerId: string) => {
    await supabase.from('dealers').update({ status: 'approved' }).eq('id', dealerId);
    setPendingDealers((prev) => prev.filter((d) => d.id !== dealerId));
    setStats((prev) => ({
      ...prev,
      pendingApplications: prev.pendingApplications - 1,
      totalDealers: prev.totalDealers + 1,
    }));
  };

  const handleQuickReject = async (dealerId: string) => {
    await supabase.from('dealers').update({ status: 'rejected' }).eq('id', dealerId);
    setPendingDealers((prev) => prev.filter((d) => d.id !== dealerId));
    setStats((prev) => ({
      ...prev,
      pendingApplications: prev.pendingApplications - 1,
    }));
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#E63946] font-black uppercase tracking-widest text-sm">Loading Command Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">

        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center">
              <span className="text-white font-black text-sm">GX</span>
            </div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">
                Command Center
              </p>
              <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
            </div>
          </div>
        </div>

        {/* Admin badge */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs">K</div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Kgofu</p>
              <p className="text-[9px] text-[#E63946] font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <div className="mb-2">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Main</p>
            <ul className="space-y-1">
              <li>
                <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-sm bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946] font-black text-[11px] uppercase tracking-widest">
                  <span>⚡</span><span>Overview</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/dealers" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>🏪</span>
                  <span>Dealers</span>
                  {stats.pendingApplications > 0 && (
                    <span className="ml-auto bg-[#F59E0B] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {stats.pendingApplications}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link href="/admin/listings" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>📋</span><span>Listings</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>👥</span><span>Users</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>📈</span><span>Analytics</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Quick Links</p>
            <ul className="space-y-1">
              <li>
                <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>🌐</span><span>View Site</span>
                </Link>
              </li>
              <li>
                <Link href="https://supabase.com/dashboard/project/xklyirzvbjncedymrjqj" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                  <span>🗄️</span><span>Supabase</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all"
          >
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] overflow-y-auto">

        {/* Header */}
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
              System <span className="text-[#E63946]">Overview</span>
            </h1>
            <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {stats.pendingApplications > 0 && (
            <Link href="/admin/dealers" className="flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-4 py-2 rounded-sm text-[#F59E0B] font-black text-[11px] uppercase tracking-widest hover:bg-[#F59E0B]/20 transition-all">
              <span className="animate-pulse">●</span>
              {stats.pendingApplications} Pending Application{stats.pendingApplications !== 1 ? 's' : ''}
            </Link>
          )}
        </header>

        <div className="p-8 space-y-8">

          {/* STATS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Listings', value: stats.totalListings, icon: '📋', color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20' },
              { label: 'Active Listings', value: stats.activeListings, icon: '✅', color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
              { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20' },
              { label: 'Approved Dealers', value: stats.totalDealers, icon: '🏪', color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
              { label: 'Pending Applications', value: stats.pendingApplications, icon: '⏳', color: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
              { label: 'Total Users', value: 'N/A', icon: '👥', color: 'text-white/40', border: 'border-white/10' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-[#0D1420] border ${stat.border} rounded-sm p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{stat.label}</span>
                  <span className="text-lg">{stat.icon}</span>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* PENDING APPLICATIONS — Priority Section */}
          {pendingDealers.length > 0 && (
            <div className="bg-[#0D1420] border border-[#F59E0B]/20 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F59E0B]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-[#F59E0B]">
                    Pending Dealer Applications
                  </h2>
                </div>
                <Link href="/admin/dealers" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {pendingDealers.map((dealer) => (
                  <div key={dealer.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-sm flex items-center justify-center text-[#F59E0B] font-black flex-shrink-0">
                      {dealer.business_name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-white truncate">{dealer.business_name}</p>
                      <p className="text-[11px] text-white/40 uppercase tracking-wider">
                        {dealer.city}, {dealer.province} · Applied {formatDate(dealer.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/admin/dealers`}
                        className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 px-3 py-1.5 rounded-sm hover:bg-[#4CC9F0]/10 transition-all"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleQuickApprove(dealer.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#10B981] border border-[#10B981]/30 px-3 py-1.5 rounded-sm hover:bg-[#10B981]/10 transition-all"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleQuickReject(dealer.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 px-3 py-1.5 rounded-sm hover:bg-[#E63946]/10 transition-all"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOTTOM ROW — Recent Listings + Recent Dealers */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Recent Listings */}
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-white">
                  Recent <span className="text-[#4CC9F0]">Listings</span>
                </h2>
                <Link href="/admin/listings" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentListings.map((listing) => (
                  <div key={listing.id} className="px-6 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{listing.title}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                        {formatCategory(listing.category_id)} · R {listing.price?.toLocaleString('en-ZA')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${
                        listing.status === 'active'
                          ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                          : 'bg-white/5 text-white/40 border border-white/10'
                      }`}>
                        {listing.status}
                      </span>
                      <span className="text-[10px] text-white/30">{formatDate(listing.created_at)}</span>
                    </div>
                  </div>
                ))}
                {recentListings.length === 0 && (
                  <div className="px-6 py-8 text-center text-white/30 text-sm">No listings yet</div>
                )}
              </div>
            </div>

            {/* Recent Dealers */}
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-white">
                  Recent <span className="text-[#E63946]">Dealers</span>
                </h2>
                <Link href="/admin/dealers" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                  View All →
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentDealers.map((dealer) => (
                  <div key={dealer.id} className="px-6 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 bg-[#E63946]/10 border border-[#E63946]/20 rounded-sm flex items-center justify-center text-[#E63946] font-black text-xs flex-shrink-0">
                      {dealer.business_name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{dealer.business_name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                        {dealer.city}, {dealer.province}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${
                        dealer.status === 'approved'
                          ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                          : dealer.status === 'pending'
                          ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
                          : 'bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20'
                      }`}>
                        {dealer.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentDealers.length === 0 && (
                  <div className="px-6 py-8 text-center text-white/30 text-sm">No dealers yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}