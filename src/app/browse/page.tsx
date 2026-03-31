'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'pistols', label: 'Pistols' },
  { value: 'rifles', label: 'Rifles' },
  { value: 'shotguns', label: 'Shotguns' },
  { value: 'revolvers', label: 'Revolvers' },
  { value: 'air-guns', label: 'Air Guns' },
  { value: 'airsoft', label: 'Airsoft' },
  { value: 'holsters', label: 'Holsters' },
  { value: 'magazines', label: 'Magazines' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'ammunition', label: 'Ammunition' },
  { value: 'reloading', label: 'Reloading' },
  { value: 'knives', label: 'Knives' },
];

const PROVINCES = [
  { value: 'all', label: 'All Provinces' },
  { value: 'Gauteng', label: 'Gauteng' },
  { value: 'Western Cape', label: 'Western Cape' },
  { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
  { value: 'Eastern Cape', label: 'Eastern Cape' },
  { value: 'Free State', label: 'Free State' },
  { value: 'Limpopo', label: 'Limpopo' },
  { value: 'Mpumalanga', label: 'Mpumalanga' },
  { value: 'North West', label: 'North West' },
  { value: 'Northern Cape', label: 'Northern Cape' },
];

const CONDITIONS = [
  { value: 'all', label: 'All Conditions' },
  { value: 'Brand New', label: 'Brand New' },
  { value: 'Like New', label: 'Like New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
];

export default function BrowsePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [listingType, setListingType] = useState('all'); // all, dealer, private
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price_low, price_high, most_viewed

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, searchTerm, selectedCategory, selectedProvince, selectedCondition, listingType, priceMin, priceMax, sortBy]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          makes:make_id(name),
          calibres:calibre_id(name),
          users:seller_id(full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...listings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.makes?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.calibres?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
    }

    // Province filter
    if (selectedProvince !== 'all') {
      filtered = filtered.filter(listing => listing.province === selectedProvince);
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      filtered = filtered.filter(listing => listing.condition === selectedCondition);
    }

    // Listing type filter
    if (listingType !== 'all') {
      filtered = filtered.filter(listing => listing.listing_type === listingType);
    }

    // Price range filter
    if (priceMin) {
      filtered = filtered.filter(listing => listing.price >= parseInt(priceMin));
    }
    if (priceMax) {
      filtered = filtered.filter(listing => listing.price <= parseInt(priceMax));
    }

    // Sorting
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
      case 'most_viewed':
        filtered.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
        break;
    }

    setFilteredListings(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedProvince('all');
    setSelectedCondition('all');
    setListingType('all');
    setPriceMin('');
    setPriceMax('');
    setSortBy('newest');
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
              {filteredListings.length} listings available
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
                    Clear All
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8A8E99] mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search listings..."
                      className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99] focus:outline-none focus:border-[#C9922A]"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8A8E99] mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8A8E99] mb-2">
                      Province
                    </label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                    >
                      {PROVINCES.map(prov => (
                        <option key={prov.value} value={prov.value}>{prov.label}</option>
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
                      {CONDITIONS.map(cond => (
                        <option key={cond.value} value={cond.value}>{cond.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Listing Type */}
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#8A8E99] mb-2">
                      Seller Type
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: 'All Sellers' },
                        { value: 'dealer', label: 'Dealers Only' },
                        { value: 'private', label: 'Private Sellers' },
                      ].map(type => (
                        <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="listingType"
                            value={type.value}
                            checked={listingType === type.value}
                            onChange={(e) => setListingType(e.target.value)}
                            className="w-4 h-4 accent-[#C9922A]"
                          />
                          <span className="text-[14px] text-[#F0EDE8]">{type.label}</span>
                        </label>
                      ))}
                    </div>
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
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Sort Bar */}
              <div className="bg-[#191C23] border border-white/5 rounded-md p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-[14px] text-[#8A8E99]">
                  Showing <span className="text-[#F0EDE8] font-medium">{filteredListings.length}</span> results
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
                    <option value="most_viewed">Most Viewed</option>
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
              ) : filteredListings.length === 0 ? (
                <div className="bg-[#191C23] border border-white/5 rounded-md p-12 text-center">
                  <div className="text-6xl mb-4 opacity-20">🔍</div>
                  <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-2">
                    No Listings Found
                  </h3>
                  <p className="text-[14px] text-[#8A8E99] mb-6">
                    Try adjusting your filters or search terms
                  </p>
                  <button
                    onClick={clearFilters}
                    style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                    className="bg-[#C9922A] text-black font-bold text-[14px] tracking-[0.1em] uppercase px-6 py-3 rounded-[3px] hover:brightness-110 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
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
