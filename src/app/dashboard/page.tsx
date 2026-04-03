'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: listingsData } = await supabase
        .from('listings')
        .select(`
          *,
          makes:make_id(name),
          calibres:calibre_id(name)
        `)
        .eq('seller_id', currentUser.id)
        .order('created_at', { ascending: false });

      setListings(listingsData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const toggleUnderOffer = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'under_offer' ? 'active' : 'under_offer';
    
    try {
      const { data, error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId)
        .eq('seller_id', user.id);

      if (error) {
        console.error('Error:', error);
        alert(`Failed to update: ${error.message}`);
        return;
      }

      setListings(listings.map(l => 
        l.id === listingId ? { ...l, status: newStatus } : l
      ));

      alert(`Listing ${newStatus === 'under_offer' ? 'marked as Under Offer' : 'set back to Active'}!`);
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error?.message || 'Unknown error'}`);
    }
  };

  const toggleSold = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'sold' ? 'active' : 'sold';
    
    try {
      const { data, error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId)
        .eq('seller_id', user.id);

      if (error) {
        console.error('Error:', error);
        alert(`Failed to update: ${error.message}`);
        return;
      }

      setListings(listings.map(l => 
        l.id === listingId ? { ...l, status: newStatus } : l
      ));

      alert(`Listing ${newStatus === 'sold' ? 'marked as Sold' : 'set back to Active'}!`);
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error?.message || 'Unknown error'}`);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      setListings(listings.filter(l => l.id !== listingId));
      alert('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'sold') {
      return <span className="px-2 py-1 rounded-sm text-[11px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">Sold</span>;
    }
    if (status === 'under_offer') {
      return <span className="px-2 py-1 rounded-sm text-[11px] font-bold uppercase bg-[#C9922A]/20 text-[#C9922A] border border-[#C9922A]/30">Under Offer</span>;
    }
    return <span className="px-2 py-1 rounded-sm text-[11px] font-bold uppercase bg-[#2A9C6E]/20 text-[#2A9C6E] border border-[#2A9C6E]/30">Active</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C9922A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8A8E99]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] flex">
      <aside className="w-64 bg-[#191C23] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="block">
            <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black tracking-tighter text-[#F0EDE8] uppercase">
              GUN <span className="text-[#C9922A]">X</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.3em] font-bold text-[#8A8E99] mt-1">
              Dashboard
            </span>
          </Link>
        </div>

        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
              {user?.avatar_url?.startsWith('preset:') ? (
                <span className="text-xl">{user.avatar_url.replace('preset:', '')}</span>
              ) : user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-lg font-bold text-black">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[14px] text-[#F0EDE8] truncate">
                {user?.full_name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-[11px] text-[#8A8E99] truncate">
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-sm text-[14px] font-medium bg-[#C9922A]/10 text-[#C9922A] border border-[#C9922A]/20">
              <span className="text-xl">📊</span>
              Overview
            </Link>
            <Link href="/dashboard/listings" className="flex items-center gap-3 px-4 py-3 rounded-sm text-[14px] font-medium text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all">
              <span className="text-xl">📋</span>
              My Listings
            </Link>
            <Link href="/dashboard/messages" className="flex items-center gap-3 px-4 py-3 rounded-sm text-[14px] font-medium text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all">
              <span className="text-xl">💬</span>
              Messages
            </Link>
            <Link href="/dashboard/wishlist" className="flex items-center gap-3 px-4 py-3 rounded-sm text-[14px] font-medium text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all">
              <span className="text-xl">⭐</span>
              Wishlist
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href="/" className="block w-full bg-transparent border border-white/20 text-[#F0EDE8] font-bold text-[13px] uppercase py-3 rounded-sm text-center hover:bg-white/5 transition-all">
            Back to Site
          </Link>
          <button onClick={handleLogout} className="w-full bg-transparent border border-red-500/30 text-red-400 font-bold text-[13px] uppercase py-3 rounded-sm hover:bg-red-500/10 transition-all">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="bg-[#191C23] border-b border-white/5 p-8 flex items-center justify-between">
          <div>
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-extrabold uppercase text-[#F0EDE8] mb-2">
              Dashboard Overview
            </h1>
            <p className="text-[14px] text-[#8A8E99]">
              Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          <a href="/sell" className="bg-[#C9922A] text-black font-bold px-6 py-3 rounded-sm text-[14px] uppercase hover:brightness-110 transition-all shadow-lg flex items-center gap-2">
            <span className="text-[18px]">+</span>
            Post Listing
          </a>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="text-[13px] text-[#8A8E99] mb-2">Active Listings</div>
              <div className="text-3xl font-bold text-[#F0EDE8]">
                {listings.filter(l => l.status === 'active').length}
              </div>
            </div>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="text-[13px] text-[#8A8E99] mb-2">Total Views</div>
              <div className="text-3xl font-bold text-[#F0EDE8]">
                {listings.reduce((sum, l) => sum + (l.views_count || 0), 0)}
              </div>
            </div>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="text-[13px] text-[#8A8E99] mb-2">Under Offer</div>
              <div className="text-3xl font-bold text-[#C9922A]">
                {listings.filter(l => l.status === 'under_offer').length}
              </div>
            </div>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="text-[13px] text-[#8A8E99] mb-2">Sold</div>
              <div className="text-3xl font-bold text-red-400">
                {listings.filter(l => l.status === 'sold').length}
              </div>
            </div>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold uppercase text-[#F0EDE8] mb-6">
              Your Recent Listings
            </h2>

            {listings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4 opacity-20">📦</div>
                <p className="text-[#8A8E99] mb-4">You haven't posted any listings yet</p>
                <a href="/sell" className="inline-block bg-[#C9922A] text-black font-bold px-6 py-3 rounded-sm text-[14px] uppercase hover:brightness-110 transition-all">
                  Post Your First Listing
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-[#0D0F13] border border-white/5 rounded-md p-4 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="w-full md:w-24 h-24 bg-[#191C23] border border-white/10 rounded-sm overflow-hidden flex-shrink-0">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📷</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-lg font-bold text-[#F0EDE8]">{listing.title}</h3>
                          {getStatusBadge(listing.status || 'active')}
                        </div>
                        <div className="flex flex-wrap gap-3 text-[13px] text-[#8A8E99]">
                          <span>R {listing.price?.toLocaleString()}</span>
                          <span>•</span>
                          <span>{listing.condition || 'N/A'}</span>
                          <span>•</span>
                          <span>{listing.views_count || 0} views</span>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <a href={`/dashboard/listings/edit/${listing.id}`} className="bg-[#C9922A] text-black font-bold px-3 py-2 rounded-sm text-[12px] uppercase hover:brightness-110 transition-all">
                          EDIT
                        </a>
                        <a href={`/listings/${listing.id}`} className="bg-transparent border border-white/20 text-[#F0EDE8] font-bold px-3 py-2 rounded-sm text-[12px] uppercase hover:bg-white/5 transition-all">
                          VIEW
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => toggleUnderOffer(listing.id, listing.status || 'active')}
                        className={`px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          listing.status === 'under_offer'
                            ? 'bg-[#C9922A] text-black'
                            : 'bg-transparent border border-[#C9922A]/30 text-[#C9922A] hover:bg-[#C9922A]/10'
                        }`}
                      >
                        {listing.status === 'under_offer' ? '✓ Under Offer' : 'Mark Under Offer'}
                      </button>
                      <button
                        onClick={() => toggleSold(listing.id, listing.status || 'active')}
                        className={`px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                          listing.status === 'sold'
                            ? 'bg-red-500 text-white'
                            : 'bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10'
                        }`}
                      >
                        {listing.status === 'sold' ? '✓ Sold' : 'Mark as Sold'}
                      </button>
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase bg-transparent border border-white/20 text-[#8A8E99] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
