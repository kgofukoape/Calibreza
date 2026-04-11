'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Listing = {
  id: string;
  title: string;
  category_id: string;
  price: number;
  is_negotiable: boolean;
  status: string;
  images: string[];
  views_count: number;
  created_at: string;
  city: string;
  province_id: string;
  is_featured: boolean;
};

type Dealer = {
  id: string;
  business_name: string;
  slug: string;
  subscription_tier: string;
  status: string;
};

const PLAN_LIMITS: Record<string, number | string> = {
  free: 5,
  pro: 50,
  premium: '∞',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/20',
  inactive: 'bg-white/5 text-[#8A8E99] border border-white/10',
  sold: 'bg-[#C9922A]/10 text-[#C9922A] border border-[#C9922A]/20',
  'under-offer': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  pending: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

export default function DealerInventoryPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFiltered(listings);
    } else {
      setFiltered(listings.filter((l) => l.status === activeFilter));
    }
  }, [activeFilter, listings]);

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
    await fetchListings(dealerData.id);
    setLoading(false);
  };

  const fetchListings = async (dealerId: string) => {
    const { data } = await supabase
      .from('listings')
      .select('id, title, category_id, price, is_negotiable, status, images, views_count, created_at, city, province_id, is_featured')
      .eq('dealer_id', dealerId)
      .order('created_at', { ascending: false });

    setListings(data || []);
    setFiltered(data || []);
  };

  const handleToggleStatus = async (listing: Listing) => {
    if (listing.status === 'sold') return;
    setTogglingId(listing.id);
    const newStatus = listing.status === 'active' ? 'inactive' : 'active';

    const { error } = await supabase
      .from('listings')
      .update({ status: newStatus })
      .eq('id', listing.id);

    if (!error) {
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: newStatus } : l))
      );
    }
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (!error) {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatPrice = (price: number, negotiable: boolean) =>
    `R ${price?.toLocaleString('en-ZA')}${negotiable ? ' ONO' : ''}`;

  const planLimit = dealer ? PLAN_LIMITS[dealer.subscription_tier?.toLowerCase()] ?? 5 : 5;
  const activeCount = listings.filter((l) => l.status === 'active').length;

  const filterCounts = {
    all: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    inactive: listings.filter((l) => l.status === 'inactive').length,
    sold: listings.filter((l) => l.status === 'sold').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-[#C9922A] text-xl font-bold">Loading Inventory...</div>
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#C9922A] flex items-center justify-center text-black text-xl font-black rounded-sm">
              {dealer?.business_name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{dealer?.business_name}</h3>
              <p className="text-xs text-[#8A8E99] uppercase tracking-wider">
                {dealer?.subscription_tier || 'Free'} Plan
              </p>
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
              <Link href="/dealer-dashboard/inventory" className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm">
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
              <Link href="/dealer-dashboard/analytics" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
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
          <Link href={`/dealers/${dealer?.slug}`} className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors">
            View Storefront
          </Link>
          <button onClick={handleLogout} className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">

        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight">
              Dealer <span className="text-[#C9922A]">Inventory</span>
            </h1>
            <p className="text-[#8A8E99] text-sm mt-1">
              {activeCount} active listing{activeCount !== 1 ? 's' : ''} ·{' '}
              <span className={activeCount >= Number(planLimit) && planLimit !== '∞' ? 'text-red-400' : 'text-[#8A8E99]'}>
                {activeCount} / {planLimit} on {dealer?.subscription_tier || 'Free'} plan
              </span>
            </p>
          </div>
          <Link
            href="/dealer-dashboard/add-listing"
            className="bg-[#C9922A] text-black px-6 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all"
          >
            + Add Listing
          </Link>
        </header>

        <div className="p-8">

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {(['all', 'active', 'inactive', 'sold'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === filter
                    ? 'bg-[#C9922A] text-black'
                    : 'bg-white/5 text-[#8A8E99] hover:bg-white/10 hover:text-[#F0EDE8]'
                }`}
              >
                {filter} ({filterCounts[filter]})
              </button>
            ))}
          </div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
              <div className="text-5xl mb-4">📦</div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">
                {activeFilter === 'all' ? 'No Listings Yet' : `No ${activeFilter} listings`}
              </h3>
              <p className="text-[#8A8E99] text-sm mb-6">
                {activeFilter === 'all'
                  ? 'Start building your inventory by adding your first listing.'
                  : `You have no listings with status "${activeFilter}".`}
              </p>
              {activeFilter === 'all' && (
                <Link
                  href="/dealer-dashboard/add-listing"
                  className="inline-block bg-[#C9922A] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all"
                >
                  + Add First Listing
                </Link>
              )}
            </div>
          )}

          {/* Listings Table */}
          {filtered.length > 0 && (
            <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">

              {/* Table Header */}
              <div className="grid grid-cols-[72px_1fr_150px_120px_130px] bg-[#0D0F13] px-6 py-3 border-b border-white/5">
                <span className="text-[10px] text-[#8A8E99] font-black uppercase tracking-widest"></span>
                <span className="text-[10px] text-[#8A8E99] font-black uppercase tracking-widest">Listing</span>
                <span className="text-[10px] text-[#8A8E99] font-black uppercase tracking-widest">Price</span>
                <span className="text-[10px] text-[#8A8E99] font-black uppercase tracking-widest">Status</span>
                <span className="text-[10px] text-[#8A8E99] font-black uppercase tracking-widest">Added</span>
              </div>

              {/* Rows */}
              {filtered.map((listing) => (
                <div key={listing.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">

                  {/* Top row — listing info */}
                  <div className="grid grid-cols-[72px_1fr_150px_120px_130px] px-6 pt-4 pb-2 items-center">

                    {/* Thumbnail */}
                    <div className="w-12 h-12 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🔫</span>
                      )}
                    </div>

                    {/* Title + Category */}
                    <div className="flex flex-col gap-1 pr-4">
                      <span className="text-sm font-bold text-[#F0EDE8] leading-tight line-clamp-1">
                        {listing.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8A8E99] uppercase tracking-wider">
                          {formatCategory(listing.category_id)}
                        </span>
                        {listing.is_featured && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-1.5 py-0.5 rounded-sm">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#8A8E99]">{listing.views_count || 0} views</span>
                    </div>

                    {/* Price */}
                    <div className="text-sm font-black text-[#C9922A] font-mono">
                      {formatPrice(listing.price, listing.is_negotiable)}
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${STATUS_COLORS[listing.status] || STATUS_COLORS.inactive}`}>
                        {listing.status}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="text-[11px] text-[#8A8E99]">
                      {formatDate(listing.created_at)}
                    </div>
                  </div>

                  {/* Bottom row — actions */}
                  <div className="px-6 pb-4 flex items-center gap-3 ml-[72px]">

                    {/* View */}
                    <Link
                      href={`/listings/${listing.id}`}
                      target="_blank"
                      className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-colors border border-white/10 px-3 py-1.5 rounded-sm hover:bg-white/5"
                    >
                      View
                    </Link>

                    {/* Edit */}
                    <Link
                      href={`/dealer-dashboard/add-listing?edit=${listing.id}`}
                      className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-colors border border-white/10 px-3 py-1.5 rounded-sm hover:bg-white/5"
                    >
                      Edit
                    </Link>

                    {/* Toggle Active/Inactive */}
                    {listing.status !== 'sold' && (
                      <button
                        onClick={() => handleToggleStatus(listing)}
                        disabled={togglingId === listing.id}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border rounded-sm transition-all disabled:opacity-40 ${
                          listing.status === 'active'
                            ? 'text-[#8A8E99] border-white/10 hover:text-red-400 hover:border-red-400/30'
                            : 'text-[#2A9C6E] border-[#2A9C6E]/30 hover:bg-[#2A9C6E]/10'
                        }`}
                      >
                        {togglingId === listing.id ? '...' : listing.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    )}

                    {/* Promote */}
                    {listing.status === 'active' && !listing.is_featured && (
                      <Link
                        href={`/dealer-dashboard/promote?id=${listing.id}`}
                        className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-3 py-1.5 rounded-sm hover:bg-[#C9922A]/10 transition-all"
                      >
                        Promote
                      </Link>
                    )}

                    {/* Delete */}
                    {confirmDeleteId === listing.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(listing.id)}
                          disabled={deletingId === listing.id}
                          className="text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-400/30 px-3 py-1.5 rounded-sm hover:bg-red-400/10 transition-all disabled:opacity-40"
                        >
                          {deletingId === listing.id ? '...' : 'Confirm Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-colors px-3 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(listing.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-red-400 transition-colors border border-white/10 px-3 py-1.5 rounded-sm hover:border-red-400/30"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Plan limit warning */}
          {planLimit !== '∞' && activeCount >= Number(planLimit) && (
            <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-sm flex items-center justify-between">
              <p className="text-sm text-red-400 font-bold">
                You've reached your {dealer?.subscription_tier || 'Free'} plan limit of {planLimit} active listings.
              </p>
              <Link
                href="/dealer-dashboard/subscription"
                className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-4 py-2 rounded-sm hover:bg-[#C9922A]/10 transition-all"
              >
                Upgrade Plan
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}