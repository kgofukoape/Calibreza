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
              <div className="text-[13px] text-[#8A8E99] mb-2">Messages</div>
              <div className="text-3xl font-bold text-[#F0EDE8]">0</div>
            </div>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="text-[13px] text-[#8A8E99] mb-2">Saved Items</div>
              <div className="text-3xl font-bold text-[#F0EDE8]">0</div>
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
                  <div key={listing.id} className="bg-[#0D0F13] border border-white/5 rounded-md p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-full md:w-24 h-24 bg-[#191C23] border border-white/10 rounded-sm overflow-hidden flex-shrink-0">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📷</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#F0EDE8] mb-1">{listing.title}</h3>
                      <div className="flex flex-wrap gap-3 text-[13px] text-[#8A8E99]">
                        <span>R {listing.price?.toLocaleString()}</span>
                        <span>•</span>
                        <span>{listing.condition || 'N/A'}</span>
                        <span>•</span>
                        <span>{listing.views_count || 0} views</span>
                        <span>•</span>
                        <span className={`font-bold ${listing.status === 'active' ? 'text-[#2A9C6E]' : 'text-[#8A8E99]'}`}>
                          {listing.status === 'active' ? 'Active' : 'Sold'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <a href={`/dashboard/listings/edit/${listing.id}`} className="bg-[#C9922A] text-black font-bold px-4 py-2 rounded-sm text-[13px] uppercase hover:brightness-110 transition-all">
                        EDIT
                      </a>
                      <a href={`/listings/${listing.id}`} className="bg-transparent border border-white/20 text-[#F0EDE8] font-bold px-4 py-2 rounded-sm text-[13px] uppercase hover:bg-white/5 transition-all">
                        VIEW
                      </a>
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
