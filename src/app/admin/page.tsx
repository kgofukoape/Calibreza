'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalDealers: 0,
    pendingApplications: 0,
    totalClubs: 0,
    unverifiedClubs: 0,
    totalServices: 0,
  });
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [recentDealers, setRecentDealers] = useState<any[]>([]);
  const [pendingDealers, setPendingDealers] = useState<any[]>([]);
  const [recentClubs, setRecentClubs] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<any[]>([]);

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = () => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
      router.push('/admin/login'); return;
    }
    loadData();
  };

  const loadData = async () => {
    const [
      listingsRes, dealersRes, pendingRes,
      recentListingsRes, recentDealersRes,
      clubsRes, servicesRes,
    ] = await Promise.all([
      supabase.from('listings').select('id, status, views_count'),
      supabase.from('dealers').select('id, status'),
      supabase.from('dealers').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('listings').select('id, title, status, created_at, category_id, price').order('created_at', { ascending: false }).limit(5),
      supabase.from('dealers').select('id, business_name, status, created_at, city, province').order('created_at', { ascending: false }).limit(5),
      supabase.from('clubs').select('id, name, status, is_verified, city, province, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('services').select('id, name, type, status, is_verified, city, province, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const listings = listingsRes.data || [];
    const dealers = dealersRes.data || [];
    const clubs = clubsRes.data || [];
    const services = servicesRes.data || [];

    setStats({
      totalListings: listings.length,
      activeListings: listings.filter(l => l.status === 'active').length,
      totalViews: listings.reduce((sum, l) => sum + (l.views_count || 0), 0),
      totalDealers: dealers.filter(d => d.status === 'approved').length,
      pendingApplications: dealers.filter(d => d.status === 'pending').length,
      totalClubs: clubs.length,
      unverifiedClubs: clubs.filter(c => !c.is_verified).length,
      totalServices: services.filter(s => s.status === 'active').length,
    });

    setRecentListings(recentListingsRes.data || []);
    setRecentDealers(recentDealersRes.data || []);
    setPendingDealers(pendingRes.data || []);
    setRecentClubs(clubs);
    setRecentServices(services);
    setLoading(false);
  };

  const quickApprove = async (id: string) => {
    await supabase.from('dealers').update({ status: 'approved' }).eq('id', id);
    setPendingDealers(prev => prev.filter(d => d.id !== id));
    setStats(prev => ({ ...prev, pendingApplications: prev.pendingApplications - 1, totalDealers: prev.totalDealers + 1 }));
  };

  const quickReject = async (id: string) => {
    await supabase.from('dealers').update({ status: 'rejected' }).eq('id', id);
    setPendingDealers(prev => prev.filter(d => d.id !== id));
    setStats(prev => ({ ...prev, pendingApplications: prev.pendingApplications - 1 }));
  };

  const handleLogout = () => {
    localStorage.removeItem('gunx_admin_session');
    router.push('/admin/login');
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtCat = (c: string) => c ? c.replace(/-/g, ' ').replace(/\b\w/g, x => x.toUpperCase()) : '—';

  const SERVICE_TYPE_COLORS: Record<string, string> = {
    gunsmith: 'text-[#C9922A]', instructor: 'text-[#4CC9F0]',
    range: 'text-[#10B981]', storage: 'text-[#8B5CF6]',
    legal: 'text-[#F59E0B]', other: 'text-white/40',
  };

  const NAV = [
    { href: '/admin', icon: '⚡', label: 'Overview', active: true },
    { href: '/admin/dealers', icon: '🏪', label: 'Dealers', badge: stats.pendingApplications },
    { href: '/admin/clubs', icon: '⊕', label: 'Clubs & Ranges', badge: stats.unverifiedClubs },
    { href: '/admin/listings', icon: '📋', label: 'Listings' },
    { href: '/admin/users', icon: '👥', label: 'Users' },
    { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
  ];

  const STATS = [
    { label: 'Total Listings', value: stats.totalListings, icon: '📋', color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20' },
    { label: 'Active Listings', value: stats.activeListings, icon: '✅', color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20' },
    { label: 'Dealers', value: stats.totalDealers, icon: '🏪', color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
    { label: 'Pending Dealers', value: stats.pendingApplications, icon: '⏳', color: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
    { label: 'Clubs', value: stats.totalClubs, icon: '⊕', color: 'text-[#C9922A]', border: 'border-[#C9922A]/20' },
    { label: 'Unverified Clubs', value: stats.unverifiedClubs, icon: '🔍', color: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
    { label: 'Services', value: stats.totalServices, icon: '🔧', color: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#E63946] font-black uppercase tracking-widest text-sm">Loading Command Center...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs">K</div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">Kgofu</p>
            <p className="text-[9px] text-[#E63946] font-bold uppercase tracking-widest">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Main</p>
          <ul className="space-y-1">
            {NAV.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                  item.active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}>
                  <span>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="bg-[#F59E0B] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Quick Links</p>
            <ul className="space-y-1">
              {[
                ['🌐', 'View Site', '/'],
                ['⊕', 'Clubs Page', '/clubs'],
                ['🔧', 'Services Page', '/services'],
                ['🗄️', 'Supabase', 'https://supabase.com/dashboard/project/xklyirzvbjncedymrjqj'],
              ].map(([icon, label, href]) => (
                <li key={label}>
                  <Link href={href} target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                    <span>{icon}</span><span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-[260px] overflow-y-auto">
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
            <Link href="/admin/dealers" className="flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-4 py-2 rounded-sm text-[#F59E0B] font-black text-[11px] uppercase tracking-widest hover:bg-[#F59E0B]/20 transition-all animate-pulse">
              ● {stats.pendingApplications} Pending Dealer{stats.pendingApplications !== 1 ? 's' : ''}
            </Link>
          )}
        </header>

        <div className="p-8 space-y-8">

          {/* 8 STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {STATS.map(stat => (
              <div key={stat.label} className={`bg-[#0D1420] border ${stat.border} rounded-sm p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-tight">{stat.label}</span>
                  <span className="text-base">{stat.icon}</span>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-2xl font-black ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* PENDING DEALERS */}
          {pendingDealers.length > 0 && (
            <div className="bg-[#0D1420] border border-[#F59E0B]/20 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F59E0B]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-[#F59E0B]">
                    Pending Dealer Applications
                  </h2>
                </div>
                <Link href="/admin/dealers" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">View All →</Link>
              </div>
              <div className="divide-y divide-white/5">
                {pendingDealers.map(dealer => (
                  <div key={dealer.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-sm flex items-center justify-center text-[#F59E0B] font-black flex-shrink-0">
                      {dealer.business_name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-white truncate">{dealer.business_name}</p>
                      <p className="text-[11px] text-white/40 uppercase tracking-wider">{dealer.city}, {dealer.province} · {fmt(dealer.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href="/admin/dealers" className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 px-3 py-1.5 rounded-sm hover:bg-[#4CC9F0]/10 transition-all">View</Link>
                      <button onClick={() => quickApprove(dealer.id)} className="text-[10px] font-black uppercase tracking-widest text-[#10B981] border border-[#10B981]/30 px-3 py-1.5 rounded-sm hover:bg-[#10B981]/10 transition-all">✓ Approve</button>
                      <button onClick={() => quickReject(dealer.id)} className="text-[10px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 px-3 py-1.5 rounded-sm hover:bg-[#E63946]/10 transition-all">✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RECENT ACTIVITY — 4 columns */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

            {/* Listings */}
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white">
                  <span className="text-[#4CC9F0]">Listings</span>
                </h2>
                <Link href="/admin/listings" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">All →</Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentListings.map(l => (
                  <div key={l.id} className="px-5 py-3">
                    <p className="text-sm font-bold text-white truncate mb-0.5">{l.title}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">{fmtCat(l.category_id)}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${l.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white/40'}`}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))}
                {recentListings.length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">No listings yet</div>}
              </div>
            </div>

            {/* Dealers */}
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white">
                  <span className="text-[#E63946]">Dealers</span>
                </h2>
                <Link href="/admin/dealers" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">All →</Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentDealers.map(d => (
                  <div key={d.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#E63946]/10 border border-[#E63946]/20 rounded-sm flex items-center justify-center text-[#E63946] font-black text-xs flex-shrink-0">
                      {d.business_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{d.business_name}</p>
                      <p className="text-[10px] text-white/40">{d.city}, {d.province}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                      d.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' :
                      d.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                      'bg-[#E63946]/10 text-[#E63946]'
                    }`}>{d.status}</span>
                  </div>
                ))}
                {recentDealers.length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">No dealers yet</div>}
              </div>
            </div>

            {/* Clubs */}
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white">
                  <span className="text-[#C9922A]">Clubs</span>
                </h2>
                <Link href="/admin/clubs" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">All →</Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentClubs.map(c => (
                  <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm flex items-center justify-center text-[#C9922A] font-black text-xs flex-shrink-0">
                      {c.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{c.name}</p>
                      <p className="text-[10px] text-white/40">{c.city}, {c.province}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                      c.is_verified ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                    }`}>{c.is_verified ? '✓ Verified' : 'Pending'}</span>
                  </div>
                ))}
                {recentClubs.length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">No clubs yet</div>}
              </div>
            </div>

            {/* Services */}
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white">
                  <span className="text-[#8B5CF6]">Services</span>
                </h2>
                <Link href="/services" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">View →</Link>
              </div>
              <div className="divide-y divide-white/5">
                {recentServices.map(s => (
                  <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-sm flex items-center justify-center text-[#8B5CF6] font-black text-xs flex-shrink-0">
                      {s.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{s.name}</p>
                      <p className={`text-[10px] uppercase font-bold ${SERVICE_TYPE_COLORS[s.type] || 'text-white/40'}`}>{s.type}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                      s.is_verified ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white/40'
                    }`}>{s.is_verified ? '✓' : 'Unverified'}</span>
                  </div>
                ))}
                {recentServices.length === 0 && <div className="px-5 py-8 text-center text-white/30 text-sm">No services yet</div>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}