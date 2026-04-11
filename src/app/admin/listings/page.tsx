'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const STATUS_FILTERS = ['all', 'active', 'inactive', 'sold', 'under-offer'];

const CATEGORIES = [
  'all', 'pistols', 'rifles', 'shotguns', 'revolvers',
  'air-guns', 'airsoft', 'knives', 'holsters', 'magazines',
  'ammunition', 'reloading',
];

type Listing = {
  id: string;
  title: string;
  price: number;
  category_id: string;
  status: string;
  listing_type: string;
  is_featured: boolean;
  featured_until: string | null;
  views_count: number;
  images: string[];
  created_at: string;
  city: string;
  dealer_id: string | null;
  seller_id: string | null;
  dealers?: { business_name: string } | null;
};

export default function AdminListingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [filtered, setFiltered] = useState<Listing[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('gunx_admin_session');
      if (session !== 'authenticated') { router.push('/admin/login'); return; }
    }
    loadListings();
  }, []);

  useEffect(() => {
    let result = listings;
    if (statusFilter !== 'all') result = result.filter((l) => l.status === statusFilter);
    if (categoryFilter !== 'all') result = result.filter((l) => l.category_id === categoryFilter);
    if (typeFilter !== 'all') result = result.filter((l) => l.listing_type === typeFilter);
    if (search) result = result.filter((l) => l.title?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [statusFilter, categoryFilter, typeFilter, search, listings]);

  const loadListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, dealers:dealer_id(business_name)')
      .order('created_at', { ascending: false });
    setListings(data || []);
    setFiltered(data || []);
    setLoading(false);
  };

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    setActionLoading(listingId);
    const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', listingId);
    if (!error) {
      setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: newStatus } : l));
      if (selectedListing?.id === listingId) setSelectedListing((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
    setActionLoading(null);
  };

  const handleToggleFeatured = async (listing: Listing) => {
    setActionLoading(listing.id);
    const newFeatured = !listing.is_featured;
    const featuredUntil = newFeatured
      ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const { error } = await supabase
      .from('listings')
      .update({ is_featured: newFeatured, featured_until: featuredUntil })
      .eq('id', listing.id);
    if (!error) {
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, is_featured: newFeatured, featured_until: featuredUntil } : l));
      if (selectedListing?.id === listing.id) setSelectedListing((prev) => prev ? { ...prev, is_featured: newFeatured, featured_until: featuredUntil } : prev);
    }
    setActionLoading(null);
  };

  const handleDelete = async (listingId: string) => {
    setActionLoading(listingId);
    await supabase.from('listings').delete().eq('id', listingId);
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    if (selectedListing?.id === listingId) setSelectedListing(null);
    setConfirmDelete(null);
    setActionLoading(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('gunx_admin_session');
    router.push('/admin/login');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatCategory = (cat: string) => cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

  const counts = {
    all: listings.length,
    active: listings.filter((l) => l.status === 'active').length,
    inactive: listings.filter((l) => l.status === 'inactive').length,
    sold: listings.filter((l) => l.status === 'sold').length,
    'under-offer': listings.filter((l) => l.status === 'under-offer').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Sidebar = () => (
    <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
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
            { href: '/admin/listings', icon: '📋', label: 'Listings', active: true },
            { href: '/admin/users', icon: '👥', label: 'Users' },
            { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                item.active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}>
                <span>{item.icon}</span><span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Quick Links</p>
          <ul className="space-y-1">
            <li><Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"><span>🌐</span><span>View Site</span></Link></li>
            <li><Link href="https://supabase.com/dashboard/project/xklyirzvbjncedymrjqj" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"><span>🗄️</span><span>Supabase</span></Link></li>
          </ul>
        </div>
      </nav>
      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
          <span>🚪</span><span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] overflow-y-auto">

        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
            Listings <span className="text-[#E63946]">Management</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            {listings.length} total · {counts.active} active · {listings.filter(l => l.is_featured).length} featured
          </p>
        </header>

        <div className="flex h-[calc(100vh-73px)]">

          {/* LEFT — List */}
          <div className="w-[440px] flex-shrink-0 border-r border-white/5 flex flex-col">

            {/* Filters */}
            <div className="p-4 border-b border-white/5 space-y-3">
              <input
                type="text"
                placeholder="Search listings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#080B12] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E63946]/50"
              />
              <div className="flex gap-1 flex-wrap">
                {STATUS_FILTERS.map((f) => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all ${
                      statusFilter === f ? 'bg-[#E63946] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}>
                    {f} ({counts[f as keyof typeof counts] ?? 0})
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="flex-1 bg-[#080B12] border border-white/10 rounded-sm px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#E63946]/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c === 'all' ? 'All Categories' : formatCategory(c)}</option>
                  ))}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="flex-1 bg-[#080B12] border border-white/10 rounded-sm px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#E63946]/50"
                >
                  <option value="all">All Types</option>
                  <option value="dealer">Dealer</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filtered.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListing(listing)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-all ${
                    selectedListing?.id === listing.id ? 'bg-[#E63946]/5 border-l-2 border-[#E63946]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#080B12] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                      {listing.images?.length > 0 ? (
                        <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">🔫</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-black text-white truncate">{listing.title}</p>
                        {listing.is_featured && <span className="text-[#C9922A] text-xs flex-shrink-0">⭐</span>}
                      </div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider truncate">
                        {formatCategory(listing.category_id)} · R {listing.price?.toLocaleString('en-ZA')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                        listing.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' :
                        listing.status === 'sold' ? 'bg-[#C9922A]/10 text-[#C9922A]' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {listing.status}
                      </span>
                      <span className="text-[8px] text-white/20 uppercase">{listing.listing_type}</span>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-white/30 text-sm">No listings found</div>
              )}
            </div>
          </div>

          {/* RIGHT — Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedListing ? (
              <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-[#0D1420] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                      {selectedListing.images?.length > 0 ? (
                        <img src={selectedListing.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">🔫</span>
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white leading-tight">
                        {selectedListing.title}
                      </h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest mt-1">
                        {formatCategory(selectedListing.category_id)} · R {selectedListing.price?.toLocaleString('en-ZA')} · {selectedListing.views_count || 0} views
                      </p>
                      <p className="text-white/30 text-xs mt-1">Listed {formatDate(selectedListing.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/listings/${selectedListing.id}`}
                      target="_blank"
                      className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 px-3 py-2 rounded-sm hover:bg-[#4CC9F0]/10 transition-all"
                    >
                      View Live
                    </Link>
                    {confirmDelete === selectedListing.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(selectedListing.id)}
                          disabled={actionLoading === selectedListing.id}
                          className="text-[10px] font-black uppercase tracking-widest text-white bg-[#E63946] px-3 py-2 rounded-sm hover:brightness-110 transition-all disabled:opacity-40"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-3 py-2 rounded-sm hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(selectedListing.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 px-3 py-2 rounded-sm hover:bg-[#E63946]/10 transition-all"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Control */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Listing Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {['active', 'inactive', 'sold', 'under-offer'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedListing.id, status)}
                        disabled={actionLoading === selectedListing.id || selectedListing.status === status}
                        className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                          selectedListing.status === status
                            ? status === 'active' ? 'bg-[#10B981] text-white'
                              : status === 'sold' ? 'bg-[#C9922A] text-black'
                              : 'bg-white/30 text-white'
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Featured Control */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Featured Status</p>
                      {selectedListing.is_featured ? (
                        <p className="text-sm font-bold text-[#C9922A]">
                          ⭐ Featured until {selectedListing.featured_until ? formatDate(selectedListing.featured_until) : 'N/A'}
                        </p>
                      ) : (
                        <p className="text-sm text-white/30">Not featured</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleFeatured(selectedListing)}
                      disabled={actionLoading === selectedListing.id}
                      className={`px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                        selectedListing.is_featured
                          ? 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                          : 'bg-[#C9922A] text-black hover:brightness-110'
                      }`}
                    >
                      {selectedListing.is_featured ? 'Remove Featured' : '⭐ Feature for 5 Days'}
                    </button>
                  </div>
                </div>

                {/* Listing Info */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-4">
                    Listing <span className="text-[#4CC9F0]">Details</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Listing ID', value: selectedListing.id.slice(0, 8) + '...' },
                      { label: 'Type', value: selectedListing.listing_type },
                      { label: 'Category', value: formatCategory(selectedListing.category_id) },
                      { label: 'Price', value: `R ${selectedListing.price?.toLocaleString('en-ZA')}` },
                      { label: 'City', value: selectedListing.city || '—' },
                      { label: 'Views', value: selectedListing.views_count?.toString() || '0' },
                      { label: 'Images', value: selectedListing.images?.length?.toString() || '0' },
                      { label: 'Dealer', value: (selectedListing.dealers as any)?.business_name || 'Private Seller' },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">{item.label}</p>
                        <p className="text-sm font-bold text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Images */}
                {selectedListing.images?.length > 0 && (
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-4">
                      Images <span className="text-white/30">({selectedListing.images.length})</span>
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      {selectedListing.images.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                          <img src={img} alt="" className="w-20 h-20 object-cover rounded-sm border border-white/10 hover:border-[#4CC9F0]/50 transition-all" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-white/30 font-black uppercase tracking-widest text-sm">Select a listing to manage it</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}