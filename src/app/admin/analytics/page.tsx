'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin',           icon: '⚡', label: 'Overview'  },
  { href: '/admin/dealers',   icon: '🏪', label: 'Dealers'   },
  { href: '/admin/clubs',     icon: '⊕',  label: 'Clubs'     },
  { href: '/admin/services',  icon: '🔧', label: 'Services'  },
  { href: '/admin/jobs',      icon: '💼', label: 'Jobs'      },
  { href: '/admin/listings',  icon: '📋', label: 'Listings'  },
  { href: '/admin/users',     icon: '👥', label: 'Users'     },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics', active: true },
  { href: '/admin/crm',       icon: '💰', label: 'CRM'       },
  { href: '/admin/sentinel',  icon: '👁️', label: 'Tokoloshe' },
];

export default function AdminAnalyticsPage() {
  const router       = useRouter();
  const printRef     = useRef<HTMLDivElement>(null);
  const [loading, setLoading]           = useState(true);
  const [exporting, setExporting]       = useState(false);
  const [listings, setListings]         = useState<any[]>([]);
  const [dealers, setDealers]           = useState<any[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [todayViews, setTodayViews]     = useState(0);
  const [weekViews, setWeekViews]       = useState<number[]>([]);
  const [topPages, setTopPages]         = useState<{ path: string; count: number }[]>([]);
  const [lastUpdated, setLastUpdated]   = useState<Date>(new Date());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    loadAll();

    // Refresh active visitors every 15 seconds
    const interval = setInterval(() => {
      loadActiveVisitors();
      setLastUpdated(new Date());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    await Promise.all([
      loadListingsAndDealers(),
      loadTrafficData(),
      loadActiveVisitors(),
    ]);
    setLoading(false);
  };

  const loadListingsAndDealers = async () => {
    const [listingsRes, dealersRes] = await Promise.all([
      supabase.from('listings').select('id, category_id, status, listing_type, views_count, price, created_at, is_featured'),
      supabase.from('dealers').select('id, status, subscription_tier, province, created_at'),
    ]);
    setListings(listingsRes.data || []);
    setDealers(dealersRes.data || []);
  };

  const loadTrafficData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's views
      const { count: todayCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
      setTodayViews(todayCount || 0);

      // Last 7 days
      const weekData: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const { count } = await supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        weekData.push(count || 0);
      }
      setWeekViews(weekData);

      // Top pages today
      const { data: pageData } = await supabase
        .from('page_views')
        .select('path')
        .gte('created_at', today.toISOString());

      if (pageData) {
        const pageCounts: Record<string, number> = {};
        pageData.forEach(p => { pageCounts[p.path] = (pageCounts[p.path] || 0) + 1; });
        const sorted = Object.entries(pageCounts)
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setTopPages(sorted);
      }
    } catch {}
  };

  const loadActiveVisitors = async () => {
    try {
      // Clean up stale visitors (older than 2 minutes)
      const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      await supabase.from('active_visitors').delete().lt('last_seen', cutoff);

      const { data } = await supabase
        .from('active_visitors')
        .select('*')
        .gte('last_seen', cutoff)
        .order('last_seen', { ascending: false });
      setActiveVisitors(data || []);
    } catch {}
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gunx_admin_session');
    router.push('/admin/login');
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

  const formatPath = (path: string) => {
    if (path === '/') return 'Home';
    return path.replace(/\//g, ' / ').replace(/\b\w/g, c => c.toUpperCase()).trim();
  };

  const totalViews    = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const totalValue    = listings.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.price || 0), 0);
  const avgPrice      = listings.length > 0 ? Math.round(listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length) : 0;

  const catBreakdown = listings.reduce((acc, l) => {
    acc[l.category_id] = (acc[l.category_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxCat = Math.max(...(Object.values(catBreakdown) as number[]), 1);

  const statusBreakdown = {
    active:      listings.filter(l => l.status === 'active').length,
    sold:        listings.filter(l => l.status === 'sold').length,
    under_offer: listings.filter(l => l.status === 'under_offer').length,
  };

  const tierBreakdown = dealers.reduce((acc, d) => {
    if (d.status === 'approved') acc[d.subscription_tier] = (acc[d.subscription_tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenuePro     = (tierBreakdown['pro']     || 0) * 499;
  const revenuePremium = (tierBreakdown['premium'] || 0) * 799;
  const totalMRR       = revenuePro + revenuePremium;

  const provinceBreakdown = dealers.filter(d => d.status === 'approved').reduce((acc, d) => {
    if (d.province) acc[d.province] = (acc[d.province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxProv = Math.max(...(Object.values(provinceBreakdown) as number[]), 1);

  const maxWeek    = Math.max(...weekViews, 1);
  const weekLabels = ['6d', '5d', '4d', '3d', '2d', 'Yest', 'Today'];

  if (loading) return (
    <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          aside, header { display: none !important; }
          main { margin: 0 !important; }
          .no-print { display: none !important; }
          .print-section { break-inside: avoid; }
          * { color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

        {/* SIDEBAR */}
        <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50 no-print">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">GX</span>
            </div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
              <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs flex-shrink-0">K</div>
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
                    <span>{item.icon}</span><span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
              <span>🚪</span><span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 ml-[260px] overflow-y-auto" ref={printRef}>

          <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40 no-print flex items-center justify-between">
            <div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
                Site <span className="text-[#E63946]">Analytics</span>
              </h1>
              <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
                Last updated: {lastUpdated.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <button onClick={handleExportPDF} disabled={exporting}
              className="flex items-center gap-2 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
              {exporting ? '⏳ Preparing...' : '📄 Export PDF'}
            </button>
          </header>

          {/* PRINT HEADER — only shows when printing */}
          <div className="hidden print:block p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black uppercase text-black">GUN X — Analytics Report</h1>
                <p className="text-gray-500 text-sm">Generated: {new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-black">GX SA (Pty) Ltd</p>
                <p className="text-gray-500 text-sm">calibreza.vercel.app</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">

            {/* ── LIVE TRAFFIC ───────────────────────────────────────────── */}
            <div className="print-section">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">
                  Live <span className="text-green-400">Traffic</span>
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 border border-white/10 px-2 py-0.5 rounded-sm">
                  Auto-refreshes every 15s
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Active right now */}
                <div className="bg-[#0D1420] border border-green-500/30 rounded-sm p-6 col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-400/70 mb-2">Active Right Now</p>
                  <div className="flex items-end gap-3">
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-6xl font-black text-green-400">
                      {activeVisitors.length}
                    </p>
                    <div className="pb-2">
                      <p className="text-[11px] text-white/40">live visitor{activeVisitors.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {activeVisitors.length > 0 && (
                    <div className="mt-4 space-y-1 max-h-[120px] overflow-y-auto">
                      {activeVisitors.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                          <span className="text-white/60 truncate">{formatPath(v.path || '/')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Today's views */}
                <div className="bg-[#0D1420] border border-[#4CC9F0]/20 rounded-sm p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0]/70 mb-2">Page Views Today</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-6xl font-black text-[#4CC9F0]">{todayViews.toLocaleString()}</p>
                  <p className="text-[11px] text-white/40 mt-2">sessions tracked today</p>
                </div>

                {/* Total listing views */}
                <div className="bg-[#0D1420] border border-[#C9922A]/20 rounded-sm p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#C9922A]/70 mb-2">Total Listing Views</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-6xl font-black text-[#C9922A]">{totalViews.toLocaleString()}</p>
                  <p className="text-[11px] text-white/40 mt-2">across all listings</p>
                </div>
              </div>

              {/* 7-day bar chart */}
              {weekViews.some(v => v > 0) && (
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Page Views — Last 7 Days</p>
                  <div className="flex items-end gap-3 h-[120px]">
                    {weekViews.map((views, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <p className="text-[9px] text-white/40 font-bold">{views > 0 ? views : ''}</p>
                        <div className="w-full rounded-sm bg-[#4CC9F0]/20 relative overflow-hidden" style={{ height: '80px' }}>
                          <div
                            className="absolute bottom-0 w-full bg-[#4CC9F0] rounded-sm transition-all duration-500"
                            style={{ height: `${maxWeek > 0 ? (views / maxWeek) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-white/40 font-bold">{weekLabels[i]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top pages today */}
              {topPages.length > 0 && (
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6 mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Top Pages Today</p>
                  <div className="space-y-3">
                    {topPages.map((page, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-white/30 w-4">{i + 1}.</span>
                            <span className="text-[12px] font-bold text-white truncate max-w-[300px]">{page.path}</span>
                          </div>
                          <span className="text-[12px] font-black text-[#4CC9F0] flex-shrink-0">{page.count}</span>
                        </div>
                        <div className="w-full h-1 bg-[#080B12] rounded-full overflow-hidden">
                          <div className="h-full bg-[#4CC9F0] rounded-full" style={{ width: `${(page.count / topPages[0].count) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── PLATFORM STATS ─────────────────────────────────────────── */}
            <div className="print-section">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white mb-4">
                Platform <span className="text-[#E63946]">Stats</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Listings',    value: listings.length,                      color: 'text-[#4CC9F0]',  border: 'border-[#4CC9F0]/20',  icon: '📋' },
                  { label: 'Avg Listing Price', value: `R ${avgPrice.toLocaleString()}`,      color: 'text-[#C9922A]',  border: 'border-[#C9922A]/20',  icon: '💰' },
                  { label: 'Active Stock Value',value: `R ${totalValue.toLocaleString()}`,    color: 'text-[#10B981]',  border: 'border-[#10B981]/20',  icon: '📦' },
                  { label: 'Approved Dealers',  value: dealers.filter(d => d.status === 'approved').length, color: 'text-[#E63946]', border: 'border-[#E63946]/20', icon: '🏪' },
                ].map(stat => (
                  <div key={stat.label} className={`bg-[#0D1420] border ${stat.border} rounded-sm p-5`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{stat.label}</span>
                      <span className="text-lg">{stat.icon}</span>
                    </div>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── REVENUE ────────────────────────────────────────────────── */}
            <div className="bg-[#0D1420] border border-[#10B981]/20 rounded-sm p-6 print-section">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6 text-white">
                Revenue <span className="text-[#10B981]">Overview</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Free Dealers',    count: tierBreakdown['free']     || 0, revenue: 0,            color: 'text-white/40' },
                  { label: 'Pro (R499/mo)',   count: tierBreakdown['pro']      || 0, revenue: revenuePro,   color: 'text-[#C9922A]' },
                  { label: 'Premium (R799)',  count: tierBreakdown['premium']  || 0, revenue: revenuePremium, color: 'text-[#10B981]' },
                  { label: 'Est. MRR',        count: dealers.filter(d => d.status === 'approved').length, revenue: totalMRR, color: 'text-[#E63946]' },
                ].map(item => (
                  <div key={item.label} className="bg-[#080B12] rounded-sm p-4 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{item.label}</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${item.color}`}>
                      R {item.revenue.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/30 mt-1">{item.count} dealers</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CATEGORY + STATUS ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-section">

              <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-6 text-white">
                  By <span className="text-[#4CC9F0]">Category</span>
                </h2>
                <div className="space-y-3">
                  {Object.entries(catBreakdown)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([cat, count]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-white">{formatCategory(cat)}</span>
                          <span className="text-[11px] font-black text-[#4CC9F0]">{count as number}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#080B12] rounded-full overflow-hidden">
                          <div className="h-full bg-[#4CC9F0] rounded-full" style={{ width: `${((count as number) / maxCat) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  {Object.keys(catBreakdown).length === 0 && <p className="text-white/30 text-sm">No data yet</p>}
                </div>
              </div>

              <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-6 text-white">
                  Listing <span className="text-[#E63946]">Status</span>
                </h2>
                <div className="space-y-4">
                  {[
                    { label: 'Active',      count: statusBreakdown.active,      color: 'bg-[#10B981]', text: 'text-[#10B981]' },
                    { label: 'Under Offer', count: statusBreakdown.under_offer, color: 'bg-[#4CC9F0]', text: 'text-[#4CC9F0]' },
                    { label: 'Sold',        count: statusBreakdown.sold,        color: 'bg-[#C9922A]', text: 'text-[#C9922A]' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-[11px] font-bold text-white">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/30">{listings.length > 0 ? Math.round((item.count / listings.length) * 100) : 0}%</span>
                          <span className={`text-[13px] font-black ${item.text}`}>{item.count}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[#080B12] rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${listings.length > 0 ? (item.count / listings.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/5">
                  {[
                    { label: 'Dealer Listings',  value: listings.filter(l => l.listing_type === 'dealer').length,  color: 'text-[#C9922A]' },
                    { label: 'Private Listings', value: listings.filter(l => l.listing_type === 'private').length, color: 'text-[#4CC9F0]' },
                    { label: 'Featured',         value: listings.filter(l => l.is_featured).length,                color: 'text-[#C9922A]' },
                    { label: 'Total Dealers',    value: dealers.filter(d => d.status === 'approved').length,       color: 'text-[#10B981]' },
                  ].map(item => (
                    <div key={item.label} className="bg-[#080B12] rounded-sm p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{item.label}</p>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── DEALERS BY PROVINCE ────────────────────────────────────── */}
            {Object.keys(provinceBreakdown).length > 0 && (
              <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6 print-section">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-6 text-white">
                  Dealers by <span className="text-[#C9922A]">Province</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(provinceBreakdown)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([prov, count]) => (
                      <div key={prov}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-white">{prov}</span>
                          <span className="text-[11px] font-black text-[#C9922A]">{count as number}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#080B12] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9922A] rounded-full" style={{ width: `${((count as number) / maxProv) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* PRINT FOOTER */}
            <div className="hidden print:block pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-400 text-xs">GX SA (Pty) Ltd · Gun X Classifieds · calibreza.vercel.app · Confidential</p>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
