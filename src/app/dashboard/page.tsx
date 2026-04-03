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
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C9922A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8A8E99]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-extrabold uppercase text-[#F0EDE8] mb-2">
          Dashboard Overview
        </h1>
        <p className="text-[14px] text-[#8A8E99]">
          Welcome back, {user?.full_name || 'User'}
        </p>
      </div>

      {/* Stats Cards */}
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

      {/* Recent Listings */}
      <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
        <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold uppercase text-[#F0EDE8] mb-6">
          Your Recent Listings
        </h2>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 opacity-20">📦</div>
            <p className="text-[#8A8E99] mb-4">You haven't posted any listings yet</p>
            <Link
              href="/sell"
              className="inline-block bg-[#C9922A] text-black font-bold px-6 py-3 rounded-sm text-[14px] uppercase hover:brightness-110 transition-all"
            >
              Post Your First Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-[#0D0F13] border border-white/5 rounded-md p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* Image */}
                <div className="w-full md:w-24 h-24 bg-[#191C23] border border-white/10 rounded-sm overflow-hidden flex-shrink-0">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">
                      📷
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#F0EDE8] mb-1">
                    {listing.title}
                  </h3>
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

                {/* Actions */}
                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/listings/edit/${listing.id}`}
                    className="bg-[#C9922A] text-black font-bold px-4 py-2 rounded-sm text-[13px] uppercase hover:brightness-110 transition-all"
                  >
                    Edit
                  </Link>
                  
                  <Link
                    href={`/listings/${listing.id}`}
                    className="bg-transparent border border-white/20 text-[#F0EDE8] font-bold px-4 py-2 rounded-sm text-[13px] uppercase hover:bg-white/5 transition-all"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
