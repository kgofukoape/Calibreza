'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';

export default function BrowsePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [displayedListings, setDisplayedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [makes, setMakes] = useState<any[]>([]);

  // Filter states (not applied until user clicks Apply)
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedSellerType, setSelectedSellerType] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all makes for brand filter
      const { data: makesData } = await supabase
        .from('makes')
        .select('*')
        .order('name');
      setMakes(makesData || []);

      // Load all active listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select(`
          *,
          makes:make_id(name),
          calibres:calibre_id(name),
          users:seller_id(full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      setListings(listingsData || []);
      setDisplayedListings(listingsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(listing => listing.make_id === selectedBrand);
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(listing => listing.condition === selectedCondition);
    }

    // Seller type filter
    if (selectedSellerType !== 'all') {
      filtered = filtered.filter(listing => listing.listing_type === selectedSellerType);
    }

    // Price range filter
    if (priceMin) {
      filtered = filtered.filter(listing => listing.price >= parseInt(priceMin));
    }
    if (priceMax) {
      filtered = filtered.filter(listing => listing.price <= parseInt(priceMax));
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    setDisplayedListings(filtered);
  };

  const clearFilters = () => {
    setSelectedBrand('all');
    setSelectedCondition('all');
    setSelectedSellerType('all');
    setPriceMin('');
    setPriceMax('');
    setSortBy('newest');
    setDisplayedListings(listings);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-2">
              Browse <span className="text-[#C9922A]">Marketplace</span>
            </h1>
            <p className="text-[14px] text-[#8A8E99]">
              {displayedListings.length} listings available
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="w-full lg:w-[280px] flex-shrink-0">
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl uppercase text-[#F0EDE8]">
                    Filters
                  </h2>
                  <button
                    onClick={clearFilters}
                    className="text-[12px] text-[#C9922A] hover:underline font-medium"
                  >
                    Clear
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Brand */}
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8A8E99] mb-2">
                      Brand
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                    >
                      <option value="all">All Brands</option>
                      {makes.map(make => (
                        <option key={make.id} value={make.id}>{make.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8A8E99] mb-2">
                      Condition
                    </label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                    >
                      <option value="all">All Conditions</option>
                      <option value="Brand New">Brand New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>

                  {/* Seller Type */}
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8A8E99] mb-2">
                      Seller Type
                    </label>
                    <select
                      value={selectedSellerType}
                      onChange={(e) => setSelectedSellerType(e.target.value)}
                      className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                    >
                      <option value="all">All Sellers</option>
                      <option value="dealer">Dealers Only</option>
                      <option value="private">Private Sellers</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8A8E99] mb-2">
                      Price Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        placeholder="Min"
                        className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99] focus:outline-none focus:border-[#C9922A]"
                      />
                      <input
                        type="number"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        placeholder="Max"
                        className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99] focus:outline-none focus:border-[#C9922A]"
                      />
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={applyFilters}
                    style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                    className="w-full bg-[#C9922A] text-black font-bold text-[14px] tracking-[0.1em] uppercase px-6 py-3 rounded-[3px] hover:brightness-110 transition-all"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Sort Bar */}
              <div className="bg-[#191C23] border border-white/5 rounded-md p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-[14px] text-[#8A8E99]">
                  Showing <span className="text-[#F0EDE8] font-medium">{displayedListings.length}</span> results
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-[#8A8E99]">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Listings Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#C9922A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[14px] text-[#8A8E99]">Loading listings...</p>
                  </div>
                </div>
              ) : displayedListings.length === 0 ? (
                <div className="bg-[#191C23] border border-white/5 rounded-md p-12 text-center">
                  <div className="text-6xl mb-4 opacity-20">🔍</div>
                  <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-2">
                    No Listings Found
                  </h3>
                  <p className="text-[14px] text-[#8A8E99] mb-6">
                    Try adjusting your filters
                  </p>
                  <button
                    onClick={clearFilters}
                    style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                    className="bg-[#C9922A] text-black font-bold text-[14px] tracking-[0.1em] uppercase px-6 py-3 rounded-[3px] hover:brightness-110 transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayedListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      id={listing.id}
                      title={listing.title}
                      make={listing.makes?.name || 'Unknown'}
                      calibre={listing.calibres?.name || 'N/A'}
                      price={listing.price}
                      province={listing.province}
                      condition={listing.condition}
                      category={listing.category}
                      listingType={listing.listing_type}
                      sellerName={listing.users?.full_name || listing.city || 'Private'}
                      images={listing.images}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
