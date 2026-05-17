'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]         = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { loadUserData(); }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) { router.push('/login'); return; }
      setUser(currentUser);

      const { data } = await supabase
        .from('listings')
        .select(`*, makes:make_id(name), conditions:condition_id(name)`)
        .eq('seller_id', currentUser.id)
        .order('created_at', { ascending: false });

      setListings(data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUnderOffer = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'under_offer' ? 'active' : 'under_offer';
    try {
      const { data, error } = await supabase.rpc('update_listing_status', {
        listing_id: listingId, user_id: user.id, new_status: newStatus
      });
      if (error || (data && !data.success)) { alert(`Failed to update status`); return; }
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
    } catch (error: any) {
      alert(`Error: ${error?.message}`);
    }
  };

  const toggleSold = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'sold' ? 'active' : 'sold';
    try {
      const { data, error } = await supabase.rpc('update_listing_status', {
        listing_id: listingId, user_id: user.id, new_status: newStatus
      });
      if (error || (data && !data.success)) { alert(`Failed to update status`); return; }
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
    } catch (error: any) {
      alert(`Error: ${error?.message}`);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('listings').delete().eq('id', listingId);
      if (error) throw error;
      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (error) {
      alert('Failed to delete listing');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'sold')        return <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30">Sold</span>;
    if (status === 'under_offer') return <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase bg-[#C9922A]/20 text-[#C9922A] border border-[#C9922A]/30">Under Offer</span>;
    return <span className="px-2 py-0.5 rounded-sm text-[10px] font-black uppercase bg-green-500/20 text-green-400 border border-green-500/30">Active</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeCount     = listings.filter(l => l.status === 'active').length;
  const totalViews      = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const underOfferCount = listings.filter(l => l.status === 'under_offer').length;
  const soldCount       = listings.filter(l => l.status === 'sold').length;

  return (
    <div className="flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl md:text-4xl font-black uppercase tracking-wide text-[#F0EDE8]">
            Dashboard <span className="text-[#C9922A]">Overview</span>
          </h1>
          <p className="text-[#8A8E99] text-[13px] mt-1">
            Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'User'}
          </p>
        </div>
        <Link href="/sell"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center flex-shrink-0">
          + Post Listing
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Listings', value: activeCount,     color: 'text-[#F0EDE8]', border: 'border-white/10' },
          { label: 'Total Views',     value: totalViews,      color: 'text-[#F0EDE8]', border: 'border-white/10' },
          { label: 'Under Offer',     value: underOfferCount, color: 'text-[#C9922A]', border: 'border-[#C9922A]/20' },
          { label: 'Sold',            value: soldCount,       color: 'text-red-400',   border: 'border-red-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`bg-[#191C23] border ${stat.border} rounded-sm p-4`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">{stat.label}</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'My Listings', href: '/dashboard/listings', icon: '📋' },
          { label: 'Messages',    href: '/dashboard/messages', icon: '💬' },
          { label: 'Wishlist',    href: '/dashboard/wishlist', icon: '⭐' },
          { label: 'Post Ad',     href: '/sell',               icon: '➕' },
        ].map(action => (
          <Link key={action.href} href={action.href}
            className="bg-[#191C23] border border-white/5 rounded-sm p-4 flex flex-col items-center gap-2 hover:border-[#C9922A]/30 hover:bg-[#C9922A]/5 transition-all text-center group">
            <span className="text-2xl">{action.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] group-hover:text-[#C9922A] transition-colors">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* RECENT LISTINGS */}
      <div className="bg-[#191C23] border border-white/5 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-xl font-black uppercase text-[#F0EDE8]">
            Your Recent <span className="text-[#C9922A]">Listings</span>
          </h2>
          <Link href="/dashboard/listings"
            className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] transition-colors">
            View All →
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4 opacity-20">📦</div>
            <p className="text-[#8A8E99] mb-6 text-sm">You haven't posted any listings yet.</p>
            <Link href="/sell"
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
              Post Your First Listing
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {listings.slice(0, 5).map(listing => (
              <div key={listing.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-[#13151A] border border-white/10 rounded-sm overflow-hidden flex-shrink-0">
                    {listing.images?.[0]
                      ? <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📷</div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <h3 className="font-black text-[14px] text-[#F0EDE8] truncate">{listing.title}</h3>
                      {getStatusBadge(listing.status || 'active')}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[12px] text-[#8A8E99]">
                      <span>R {listing.price?.toLocaleString()}</span>
                      <span>·</span>
                      <span>{listing.conditions?.name || 'N/A'}</span>
                      <span>·</span>
                      <span>{listing.views_count || 0} views</span>
                    </div>
                  </div>

                  {/* Desktop actions */}
                  <div className="hidden sm:flex gap-2 flex-shrink-0">
                    <Link href={`/dashboard/listings/edit/${listing.id}`}
                      className="bg-[#C9922A] text-black font-black text-[11px] uppercase tracking-widest px-3 py-2 rounded-sm hover:brightness-110 transition-all">
                      Edit
                    </Link>
                    <Link href={`/listings/${listing.id}`}
                      className="border border-white/20 text-[#F0EDE8] font-black text-[11px] uppercase tracking-widest px-3 py-2 rounded-sm hover:bg-white/5 transition-all">
                      View
                    </Link>
                  </div>
                </div>

                {/* Status actions */}
                <div className="flex gap-2 flex-wrap pt-2 border-t border-white/5">
                  {/* Mobile view/edit */}
                  <div className="flex gap-2 sm:hidden">
                    <Link href={`/dashboard/listings/edit/${listing.id}`}
                      className="bg-[#C9922A] text-black font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm hover:brightness-110">
                      Edit
                    </Link>
                    <Link href={`/listings/${listing.id}`}
                      className="border border-white/20 text-[#F0EDE8] font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-white/5">
                      View
                    </Link>
                  </div>

                  <button onClick={() => toggleUnderOffer(listing.id, listing.status || 'active')}
                    className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      listing.status === 'under_offer'
                        ? 'bg-[#C9922A] text-black'
                        : 'border border-[#C9922A]/30 text-[#C9922A] hover:bg-[#C9922A]/10'
                    }`}>
                    {listing.status === 'under_offer' ? '✓ Under Offer' : 'Under Offer'}
                  </button>

                  <button onClick={() => toggleSold(listing.id, listing.status || 'active')}
                    className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                      listing.status === 'sold'
                        ? 'bg-red-500 text-white'
                        : 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
                    }`}>
                    {listing.status === 'sold' ? '✓ Sold' : 'Mark Sold'}
                  </button>

                  <button onClick={() => deleteListing(listing.id)}
                    className="px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest border border-white/10 text-[#8A8E99] hover:border-red-500/30 hover:text-red-400 transition-all">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA STRIP */}
      <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-[16px] uppercase">
            Got more to sell?
          </p>
          <p className="text-[#8A8E99] text-[12px]">First 5 listings free · No subscription needed</p>
        </div>
        <Link href="/sell"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all whitespace-nowrap flex-shrink-0">
          Post Another Listing →
        </Link>
      </div>
    </div>
  );
}
