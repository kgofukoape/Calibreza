'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalViews: 0,
    totalListings: 0,
  });

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);

    // Load user's listings
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

    // Calculate stats
    const activeCount = listingsData?.filter(l => l.status === 'active').length || 0;
    const totalViews = listingsData?.reduce((sum, l) => sum + (l.views_count || 0), 0) || 0;

    setStats({
      activeListings: activeCount,
      totalViews: totalViews,
      totalListings: listingsData?.length || 0,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-[280px] bg-[#191C23] border-r border-white/5 p-6">
          <div className="flex flex-col gap-8">
            {/* Profile Card */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-white/5">
              <div className="w-20 h-20 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
                {user?.avatar_url?.startsWith('preset:') ? (
                  <span className="text-4xl">{user.avatar_url.replace('preset:', '')}</span>
                ) : user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold text-black">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="text-center">
                <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl uppercase text-[#F0EDE8] mb-1">
                  {user?.full_name || 'John Doe'}
                </h2>
                <p className="text-[11px] font-bold tracking-widest uppercase text-[#C9922A]">Verified Member</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-2">
              {[
                { icon: '🏠', label: 'Overview', href: '/dashboard', active: true },
                { icon: '📋', label: 'My Listings', href: '/dashboard/listings', active: false },
                { icon: '❤️', label: 'Wishlist', href: '/dashboard/wishlist', active: false },
                { icon: '🔍', label: 'Wanted Bounties', href: '/dashboard/bounties', active: false },
                { icon: '💬', label: 'Messages', href: '/dashboard/messages', active: false },
                { icon: '⚙️', label: 'Settings', href: '/settings', active: false },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[14px] font-medium transition-colors ${
                    item.active
                      ? 'bg-[#C9922A]/10 text-[#C9922A] border-l-2 border-[#C9922A]'
                      : 'text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-2">
                Dashboard
              </h1>
              <p className="text-[14px] text-[#8A8E99]">Manage your listings and account</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] mb-2">Active Listings</div>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl font-bold text-[#C9922A]">
                  {stats.activeListings}
                </div>
              </div>
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] mb-2">Total Views</div>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl font-bold text-[#F0EDE8]">
                  {stats.totalViews}
                </div>
              </div>
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] mb-2">Total Listings</div>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl font-bold text-[#F0EDE8]">
                  {stats.totalListings}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 mb-8">
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/sell"
                  style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                  className="flex items-center justify-center gap-3 bg-[#C9922A] text-black font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,146,42,0.3)]"
                >
                  <span className="text-xl">+</span>
                  POST NEW LISTING
                </Link>
                <Link
                  href="/browse"
                  style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                  className="flex items-center justify-center gap-3 bg-transparent border border-white/20 text-[#F0EDE8] font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:bg-white/5 transition-all"
                >
                  <span className="text-xl">🔍</span>
                  BROWSE MARKETPLACE
                </Link>
              </div>
            </div>

            {/* My Listings Section */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8]">
                  My Listings
                </h2>
                <Link
                  href="/sell"
                  className="text-[13px] font-bold tracking-wider uppercase text-[#C9922A] hover:underline"
                >
                  + ADD NEW
                </Link>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 opacity-20">📦</div>
                  <p className="text-[14px] text-[#8A8E99] mb-6">You haven&apos;t posted any listings yet</p>
                  <Link
                    href="/sell"
                    style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                    className="inline-flex items-center gap-2 bg-[#C9922A] text-black font-bold text-[14px] tracking-[0.1em] uppercase px-6 py-3 rounded-[3px] hover:brightness-110 transition-all"
                  >
                    <span>+</span>
                    Create Your First Listing
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="flex items-center gap-4 p-4 bg-[#0D0F13] border border-white/5 rounded-sm hover:border-[#C9922A]/30 transition-colors">
                      <div className="w-20 h-20 bg-[#191C23] rounded-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl opacity-20">📷</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[16px] text-[#F0EDE8] mb-1">{listing.title}</h3>
                        <p className="text-[13px] text-[#8A8E99]">
                          {listing.makes?.name} • {listing.calibres?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold text-[#C9922A] mb-1">
                          R {listing.price.toLocaleString()}
                        </div>
                        <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-sm ${
                          listing.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {listing.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="px-4 py-2 bg-[#C9922A] text-black text-[13px] font-bold uppercase rounded-sm hover:brightness-110 transition-all"
                        >
                          View
                        </Link>
                        <button className="px-4 py-2 bg-transparent border border-white/20 text-[#F0EDE8] text-[13px] font-bold uppercase rounded-sm hover:bg-white/5 transition-all">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl uppercase text-[#F0EDE8] mb-4 border-b border-white/5 pb-3">
                  Profile
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
                    {user?.avatar_url?.startsWith('preset:') ? (
                      <span className="text-3xl">{user.avatar_url.replace('preset:', '')}</span>
                    ) : user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold text-black">
                        {user?.full_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[16px] text-[#F0EDE8]">{user?.full_name}</div>
                    <div className="text-[13px] text-[#8A8E99]">{user?.email}</div>
                  </div>
                </div>
                <Link
                  href="/settings"
                  style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                  className="block text-center bg-transparent border border-white/20 text-[#F0EDE8] font-bold text-[14px] tracking-[0.1em] uppercase py-3 rounded-sm hover:bg-white/5 transition-all"
                >
                  Edit Profile
                </Link>
              </div>

              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl uppercase text-[#F0EDE8] mb-4 border-b border-white/5 pb-3">
                  Account
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#8A8E99]">Account Type</span>
                    <span className="text-[#F0EDE8] font-medium">Private Seller</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#8A8E99]">Member Since</span>
                    <span className="text-[#F0EDE8] font-medium">Mar 2026</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#8A8E99]">Response Rate</span>
                    <span className="text-green-400 font-medium">Fast (24h)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
