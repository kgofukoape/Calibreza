'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Listing = {
  id: string;
  title: string;
  category_id: string;
  status: string;
  views_count: number;
  is_featured: boolean;
  images: string[];
  created_at: string;
  price: number;
};

type Dealer = {
  id: string;
  business_name: string;
  slug: string;
  subscription_tier: string;
  status: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  pistols: 'Pistols',
  rifles: 'Rifles',
  shotguns: 'Shotguns',
  revolvers: 'Revolvers',
  'air-guns': 'Air Guns',
  airsoft: 'Airsoft',
  knives: 'Knives',
  holsters: 'Holsters',
  magazines: 'Magazines',
  ammunition: 'Ammunition',
  reloading: 'Reloading',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#2A9C6E]',
  inactive: 'bg-[#8A8E99]',
  sold: 'bg-[#C9922A]',
  'under-offer': 'bg-blue-400',
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }

    const { data: dealerData } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!dealerData || dealerData.status !== 'approved') {
      router.push('/dealer/login');
      return;
    }

    setDealer(dealerData);

    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, title, category_id, status, views_count, is_featured, images, created_at, price')
      .eq('dealer_id', dealerData.id)
      .order('views_count', { ascending: false });

    setListings(listingsData || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  // Computed stats
  const totalListings = listings.length;
  const activeListings = listings.filter((l) => l.status === 'active').length;
  const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const featuredListings = listings.filter((l) => l.is_featured).length;
  const soldListings = listings.filter((l) => l.status === 'sold').length;
  const inactiveListings = listings.filter((l) => l.status === 'inactive').length;
  const underOfferListings = listings.filter((l) => l.status === 'under-offer').length;

  // Top 5 by views
  const topListings = [...listings].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);

  // Category breakdown
  const categoryBreakdown = listings.reduce((acc, l) => {
    const cat = l.category_id || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCategoryCount = Math.max(...Object.values(categoryBreakdown), 1);

  // Status breakdown
  const statusBreakdown = [
    { label: 'Active', count: activeListings, color: 'bg-[#2A9C6E]', textColor: 'text-[#2A9C6E]' },
    { label: 'Inactive', count: inactiveListings, color: 'bg-[#8A8E99]', textColor: 'text-[#8A8E99]' },
    { label: 'Sold', count: soldListings, color: 'bg-[#C9922A]', textColor: 'text-[#C9922A]' },
    { label: 'Under Offer', count: underOfferListings, color: 'bg-blue-400', textColor: 'text-blue-400' },
  ];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatCategory = (cat: string) =>
    CATEGORY_LABELS[cat] || cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-[#C9922A] text-xl font-bold">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#13151A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex flex-col items-start group">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase group-hover:text-[#C9922A] transition-colors">
              GUN <span className="text-[#C9922A] group-hover:text-[#F0EDE8]">X</span>
            </span>
            <span className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">Dealer Dashboard</span>
          </Link>
        </div>

        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C9922A] flex items-center justify-center text-black text-xl font-black rounded-sm">
              {dealer?.business_name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{dealer?.business_name}</h3>
              <p className="text-xs text-[#8A8E99] uppercase tracking-wider">{dealer?.subscription_tier || 'Free'} Plan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/dealer-dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📊</span><span>Overview</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📦</span><span>Inventory</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/add-listing" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>➕</span><span>Add Listing</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/bulk-upload" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📁</span><span>Bulk Upload</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/analytics" className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm">
                <span>📈</span><span>Analytics</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/subscription" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>💳</span><span>Subscription</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>⚙️</span><span>Profile</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/promote" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>⭐</span><span>Promote Listings</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href={`/dealers/${dealer?.slug}`} target="_blank" className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors">
            View Storefront
          </Link>
          <button onClick={handleLogout} className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight">
            Listing <span className="text-[#C9922A]">Analytics</span>
          </h1>
          <p className="text-[#8A8E99] text-sm mt-1">Performance overview for your dealer inventory.</p>
        </header>

        <div className="p-8 space-y-8">

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Total Listings</span>
                <span className="text-xl">📦</span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-[#F0EDE8]">
                {totalListings}
              </div>
            </div>

            <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Active</span>
                <span className="text-xl">✅</span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-[#2A9C6E]">
                {activeListings}
              </div>
            </div>

            <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Total Views</span>
                <span className="text-xl">👁️</span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-[#C9922A]">
                {totalViews.toLocaleString('en-ZA')}
              </div>
            </div>

            <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Featured</span>
                <span className="text-xl">⭐</span>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-[#C9922A]">
                {featuredListings}
              </div>
            </div>
          </div>

          {/* TOP PERFORMING LISTINGS */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase">
                Top <span className="text-[#C9922A]">Performing</span> Listings
              </h2>
              <p className="text-[#8A8E99] text-xs mt-1">Ranked by total views</p>
            </div>

            {topListings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-[#8A8E99] font-bold uppercase tracking-widest text-sm">No listings yet</p>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div className="grid grid-cols-[48px_1fr_120px_100px_80px_110px] px-6 py-3 bg-[#0D0F13] border-b border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Listing</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Category</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Status</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] text-right">Views</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] text-right">Added</span>
                </div>

                {topListings.map((listing, index) => (
                  <div
                    key={listing.id}
                    className="grid grid-cols-[48px_1fr_120px_100px_80px_110px] px-6 py-4 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all"
                  >
                    {/* Rank + thumbnail */}
                    <div className="relative w-10 h-10">
                      <div className="w-10 h-10 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm">🔫</span>
                        )}
                      </div>
                      <div className={`absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                        index === 0 ? 'bg-[#C9922A] text-black' : 'bg-white/10 text-[#8A8E99]'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="pr-4">
                      <p className="text-sm font-bold text-[#F0EDE8] truncate">{listing.title}</p>
                      <p className="text-[11px] text-[#C9922A] font-black">R {listing.price?.toLocaleString('en-ZA')}</p>
                    </div>

                    {/* Category */}
                    <span className="text-[11px] text-[#8A8E99] uppercase tracking-wider">
                      {formatCategory(listing.category_id)}
                    </span>

                    {/* Status */}
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${
                        listing.status === 'active'
                          ? 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/20'
                          : listing.status === 'sold'
                          ? 'bg-[#C9922A]/10 text-[#C9922A] border border-[#C9922A]/20'
                          : 'bg-white/5 text-[#8A8E99] border border-white/10'
                      }`}>
                        {listing.status}
                      </span>
                    </div>

                    {/* Views */}
                    <div className="text-right">
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black text-[#F0EDE8]">
                        {(listing.views_count || 0).toLocaleString('en-ZA')}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="text-right">
                      <span className="text-[11px] text-[#8A8E99]">{formatDate(listing.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM ROW — Category + Status breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Category Breakdown */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                By <span className="text-[#C9922A]">Category</span>
              </h2>

              {Object.keys(categoryBreakdown).length === 0 ? (
                <p className="text-[#8A8E99] text-sm">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(categoryBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[12px] font-bold text-[#F0EDE8]">{formatCategory(cat)}</span>
                          <span className="text-[12px] font-black text-[#C9922A]">{count}</span>
                        </div>
                        <div className="w-full h-2 bg-[#0D0F13] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#C9922A] rounded-full transition-all"
                            style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Status Breakdown */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                By <span className="text-[#C9922A]">Status</span>
              </h2>

              {totalListings === 0 ? (
                <p className="text-[#8A8E99] text-sm">No data yet.</p>
              ) : (
                <div className="space-y-4">
                  {statusBreakdown.map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                          <span className="text-[12px] font-bold text-[#F0EDE8]">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#8A8E99]">
                            {totalListings > 0 ? Math.round((s.count / totalListings) * 100) : 0}%
                          </span>
                          <span className={`text-[14px] font-black ${s.textColor}`}>{s.count}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-[#0D0F13] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} rounded-full transition-all`}
                          style={{ width: `${totalListings > 0 ? (s.count / totalListings) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Donut summary */}
                  <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-3">
                    {statusBreakdown.map((s) => (
                      <div key={s.label} className="bg-[#0D0F13] rounded-sm p-3 flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full ${s.color}`} />
                        <div>
                          <p className={`text-xl font-black ${s.textColor}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {s.count}
                          </p>
                          <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Views note */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <p className="text-[11px] text-[#8A8E99]">
              <strong className="text-[#F0EDE8]">Note:</strong> View counts are tracked each time a buyer opens a listing detail page. Inquiry tracking and conversion analytics are coming in a future update.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}