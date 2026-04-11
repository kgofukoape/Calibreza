'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('gunx_admin_session');
      if (session !== 'authenticated') { router.push('/admin/login'); return; }
    }
    loadData();
  }, []);

  const loadData = async () => {
    const [listingsRes, dealersRes] = await Promise.all([
      supabase.from('listings').select('id, category_id, status, listing_type, views_count, price, created_at, is_featured'),
      supabase.from('dealers').select('id, status, subscription_tier, province, created_at'),
    ]);
    setListings(listingsRes.data || []);
    setDealers(dealersRes.data || []);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('gunx_admin_session');
    router.push('/admin/login');
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

  const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const totalValue = listings.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.price || 0), 0);
  const avgPrice = listings.length > 0 ? Math.round(listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length) : 0;

  const catBreakdown = listings.reduce((acc, l) => {
    acc[l.category_id] = (acc[l.category_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxCat = Math.max(...(Object.values(catBreakdown) as number[]), 1);

  const statusBreakdown = {
    active: listings.filter(l => l.status === 'active').length,
    inactive: listings.filter(l => l.status === 'inactive').length,
    sold: listings.filter(l => l.status === 'sold').length,
    'under-offer': listings.filter(l => l.status === 'under-offer').length,
  };

  const tierBreakdown = dealers.reduce((acc, d) => {
    if (d.status === 'approved') acc[d.subscription_tier] = (acc[d.subscription_tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenuePotential = {
    free: (tierBreakdown['free'] || 0) * 0,
    pay_per_ad: (tierBreakdown['pay_per_ad'] || 0) * 10,
    pro: (tierBreakdown['pro'] || 0) * 499,
    premium: (tierBreakdown['premium'] || 0) * 799,
  };
  const totalRevenue = Object.values(revenuePotential).reduce((a, b) => a + b, 0);

  const provinceBreakdown = dealers.filter(d => d.status === 'approved').reduce((acc, d) => {
    if (d.province) acc[d.province] = (acc[d.province] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxProv = Math.max(...(Object.values(provinceBreakdown) as number[]), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
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

        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs">K</div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Kgofu</p>
              <p className="text-[9px] text-[#E63946] font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Main</p>
          <ul className="space-y-1">
            {[
              { href: '/admin', icon: '⚡', label: 'Overview' },
              { href: '/admin/dealers', icon: '🏪', label: 'Dealers' },
              { href: '/admin/listings', icon: '📋', label: 'Listings' },
              { href: '/admin/users', icon: '👥', label: 'Users' },
              { href: '/admin/analytics', icon: '📈', label: 'Analytics', active: true },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                  item.active
                    ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

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

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all"
          >
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-[260px] overflow-y-auto">

        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
            Site <span className="text-[#E63946]">Analytics</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">Platform-wide performance overview</p>
        </header>

        <div className="p-8 space-y-8">

          {/* Top Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Listings', value: listings.length, icon: '📋', color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20' },
              { label: 'Total Views', value: totalViews.toLocaleString('en-ZA'), icon: '👁️', color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
              { label: 'Avg Listing Price', value: `R ${avgPrice.toLocaleString('en-ZA')}`, icon: '💰', color: 'text-[#C9922A]', border: 'border-[#C9922A]/20' },
              { label: 'Active Stock Value', value: `R ${totalValue.toLocaleString('en-ZA')}`, icon: '📦', color: 'text-[#E63946]', border: 'border-[#E63946]/20' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-[#0D1420] border ${stat.border} rounded-sm p-5`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{stat.label}</span>
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Potential */}
          <div className="bg-[#0D1420] border border-[#10B981]/20 rounded-sm p-6">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6 text-white">
              Revenue <span className="text-[#10B981]">Potential</span>
              <span className="ml-3 text-sm text-white/30 font-bold normal-case tracking-normal">(based on current dealer tiers)</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Free', count: tierBreakdown['free'] || 0, revenue: 0, color: 'text-white/40' },
                { label: 'Pay Per Ad', count: tierBreakdown['pay_per_ad'] || 0, revenue: revenuePotential.pay_per_ad, color: 'text-[#4CC9F0]' },
                { label: 'Pro', count: tierBreakdown['pro'] || 0, revenue: revenuePotential.pro, color: 'text-[#C9922A]' },
                { label: 'Premium', count: tierBreakdown['premium'] || 0, revenue: revenuePotential.premium, color: 'text-[#10B981]' },
                { label: 'Total MRR', count: dealers.filter(d => d.status === 'approved').length, revenue: totalRevenue, color: 'text-[#E63946]' },
              ].map((item) => (
                <div key={item.label} className="bg-[#080B12] rounded-sm p-4 text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{item.label}</p>
                  <p className={`text-2xl font-black ${item.color}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    R {item.revenue.toLocaleString('en-ZA')}
                  </p>
                  <p className="text-[10px] text-white/30 mt-1">{item.count} dealers</p>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* By Category */}
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
                        <div
                          className="h-full bg-[#4CC9F0] rounded-full"
                          style={{ width: `${((count as number) / maxCat) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                {Object.keys(catBreakdown).length === 0 && (
                  <p className="text-white/30 text-sm">No data yet</p>
                )}
              </div>
            </div>

            {/* By Status */}
            <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-6 text-white">
                By <span className="text-[#E63946]">Status</span>
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Active', count: statusBreakdown.active, color: 'bg-[#10B981]', text: 'text-[#10B981]' },
                  { label: 'Inactive', count: statusBreakdown.inactive, color: 'bg-white/30', text: 'text-white/40' },
                  { label: 'Sold', count: statusBreakdown.sold, color: 'bg-[#C9922A]', text: 'text-[#C9922A]' },
                  { label: 'Under Offer', count: statusBreakdown['under-offer'], color: 'bg-[#4CC9F0]', text: 'text-[#4CC9F0]' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-[11px] font-bold text-white">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30">
                          {listings.length > 0 ? Math.round((item.count / listings.length) * 100) : 0}%
                        </span>
                        <span className={`text-[13px] font-black ${item.text}`}>{item.count}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-[#080B12] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${listings.length > 0 ? (item.count / listings.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/5">
                {[
                  { label: 'Dealer Listings', value: listings.filter(l => l.listing_type === 'dealer').length, color: 'text-[#C9922A]' },
                  { label: 'Private Listings', value: listings.filter(l => l.listing_type === 'private').length, color: 'text-[#4CC9F0]' },
                  { label: 'Featured', value: listings.filter(l => l.is_featured).length, color: 'text-[#C9922A]' },
                  { label: 'Approved Dealers', value: dealers.filter(d => d.status === 'approved').length, color: 'text-[#10B981]' },
                ].map((item) => (
                  <div key={item.label} className="bg-[#080B12] rounded-sm p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{item.label}</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-2xl font-black ${item.color}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dealers by Province */}
          {Object.keys(provinceBreakdown).length > 0 && (
            <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
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
                        <div
                          className="h-full bg-[#C9922A] rounded-full"
                          style={{ width: `${((count as number) / maxProv) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}