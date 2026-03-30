'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, signOut } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      setProfile(profileData);

      const { data: listingsData } = await supabase
        .from('listings')
        .select(`
          *,
          makes:make_id(name),
          calibres:calibre_id(name),
          provinces:province_id(name),
          conditions:condition_id(name)
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

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#8A8E99] text-[15px]">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count || 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      {/* Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-2">
                Welcome Back, <span className="text-[#C9922A]">{profile?.full_name?.split(' ')[0]}</span>
              </h1>
              <p className="text-[14px] text-[#8A8E99]">Manage your listings and account</p>
            </div>
            <button
              onClick={handleSignOut}
              className="hidden md:block bg-transparent border border-white/20 text-[#F0EDE8] text-[13px] font-bold uppercase tracking-wider px-6 py-2.5 rounded-sm hover:bg-white/5 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] mb-2">Active Listings</div>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-bold text-[#C9922A]">
                  {activeListings}
                </div>
              </div>

              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] mb-2">Total Views</div>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-bold text-[#F0EDE8]">
                  {totalViews}
                </div>
              </div>

              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] mb-2">Total Listings</div>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-bold text-[#F0EDE8]">
                  {listings.length}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-5">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/sell"
                  className="bg-[#C9922A] text-black font-bold text-[14px] tracking-wider uppercase py-4 rounded-sm hover:brightness-110 transition-all text-center"
                >
                  + Post New Listing
                </Link>
                <Link
                  href="/"
                  className="bg-transparent border border-white/20 text-[#F0EDE8] font-bold text-[14px] tracking-wider uppercase py-4 rounded-sm hover:bg-white/5 transition-all text-center"
                >
                  Browse Marketplace
                </Link>
              </div>
            </div>

            {/* My Listings */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8]">
                  My Listings
                </h2>
                <Link href="/sell" className="text-[#C9922A] text-[13px] font-bold uppercase tracking-wider hover:underline">
                  + Add New
                </Link>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-[#8A8E99] text-[15px] mb-4">You haven&apos;t posted any listings yet</div>
                  <Link
                    href="/sell"
                    className="inline-block bg-[#C9922A] text-black font-bold text-[14px] tracking-wider uppercase px-8 py-3 rounded-sm hover:brightness-110 transition-all"
                  >
                    Post Your First Listing
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="bg-[#0D0F13] border border-white/10 rounded-md p-4 hover:border-[#C9922A]/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link href={`/listings/${listing.id}`} className="font-bold text-[16px] text-[#F0EDE8] hover:text-[#C9922A] transition-colors">
                              {listing.title}
                            </Link>
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-sm border ${getStatusBadge(listing.status)}`}>
                              {listing.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#8A8E99] mb-3">
                            <span>{listing.makes?.name} {listing.model}</span>
                            <span>•</span>
                            <span>{listing.calibres?.name}</span>
                            <span>•</span>
                            <span>{listing.provinces?.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[12px]">
                            <span className="text-[#8A8E99]">Views: <strong className="text-[#F0EDE8]">{listing.view_count || 0}</strong></span>
                            <span className="text-[#8A8E99]">Posted: <strong className="text-[#F0EDE8]">{new Date(listing.created_at).toLocaleDateString()}</strong></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold text-[#C9922A] mb-2">
                            R {listing.price.toLocaleString()}
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/listings/${listing.id}`}
                              className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline"
                            >
                              View
                            </Link>
                            <span className="text-white/20">|</span>
                            <button className="text-[11px] text-[#8A8E99] uppercase tracking-wider hover:text-[#F0EDE8]">
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            
            {/* Profile Card */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl uppercase text-[#F0EDE8] mb-5 border-b border-white/5 pb-3">
                Profile
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url?.startsWith('preset:') ? (
                      <span className="text-5xl">{profile.avatar_url.replace('preset:', '')}</span>
                    ) : profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold text-black">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-[16px] text-[#F0EDE8] mb-1">{profile?.full_name}</div>
                  <div className="text-[13px] text-[#8A8E99] mb-3">{profile?.email}</div>
                  <div className="inline-block bg-[#C9922A]/20 border border-[#C9922A]/30 text-[#C9922A] text-[11px] font-bold uppercase px-3 py-1 rounded-sm">
                    {profile?.user_type || 'Private'} Seller
                  </div>
                </div>
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#8A8E99]">Member Since</span>
                    <span className="text-[#F0EDE8] font-bold">
                      {new Date(profile?.created_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#8A8E99]">Response Rate</span>
                    <span className="text-green-400 font-bold">Fast (24h)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl uppercase text-[#F0EDE8] mb-4">
                Account
              </h3>
              <div className="flex flex-col gap-2">
                <Link href="/settings" className="text-left text-[14px] text-[#F0EDE8] hover:text-[#C9922A] py-2 transition-colors">
                  Edit Profile
                </Link>
                <Link href="/settings" className="text-left text-[14px] text-[#F0EDE8] hover:text-[#C9922A] py-2 transition-colors">
                  Settings
                </Link>
                <button className="text-left text-[14px] text-[#F0EDE8] hover:text-[#C9922A] py-2 transition-colors">
                  Help & Support
                </button>
                <div className="border-t border-white/5 mt-2 pt-3">
                  <button
                    onClick={handleSignOut}
                    className="text-left text-[14px] text-red-400 hover:text-red-300 py-2 transition-colors w-full"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
