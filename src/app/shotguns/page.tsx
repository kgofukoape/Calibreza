'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ListingCard from '@/components/listings/ListingCard';

const ITEMS_PER_PAGE = 12;

export default function ShotgunsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Active filter states (what's actually applied)
  const [activeBrands, setActiveBrands] = useState<string[]>([]);
  const [activeGauges, setActiveGauges] = useState<string[]>([]);
  const [activeProvinces, setActiveProvinces] = useState<string[]>([]);
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [activeMinPrice, setActiveMinPrice] = useState('');
  const [activeMaxPrice, setActiveMaxPrice] = useState('');
  const [activeSellerTypes, setActiveSellerTypes] = useState<string[]>([]);
  
  // Pending filter states (user selections before applying)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedGauges, setSelectedGauges] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sellerTypes, setSellerTypes] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState('newest');

  // Fetch listings when active filters change
  useEffect(() => {
    fetchListings();
  }, [currentPage, activeBrands, activeGauges, activeProvinces, activeConditions, activeMinPrice, activeMaxPrice, activeSellerTypes, sortBy]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Filter by category (shotguns)
      query = query.eq('firearm_type', 'shotgun');

      // Apply active filters
      if (activeBrands.length > 0) {
        query = query.in('make', activeBrands);
      }

      if (activeGauges.length > 0) {
        query = query.in('caliber', activeGauges);
      }

      if (activeProvinces.length > 0) {
        query = query.in('province', activeProvinces);
      }

      if (activeConditions.length > 0) {
        query = query.in('condition', activeConditions);
      }

      if (activeMinPrice) {
        query = query.gte('price', parseInt(activeMinPrice));
      }
      if (activeMaxPrice) {
        query = query.lte('price', parseInt(activeMaxPrice));
      }

      if (activeSellerTypes.length > 0) {
        query = query.in('listing_type', activeSellerTypes);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'condition':
          query = query.order('condition', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setListings(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleGaugeToggle = (gauge: string) => {
    setSelectedGauges(prev =>
      prev.includes(gauge) ? prev.filter(g => g !== gauge) : [...prev, gauge]
    );
  };

  const handleProvinceToggle = (province: string) => {
    setSelectedProvinces(prev =>
      prev.includes(province) ? prev.filter(p => p !== province) : [...prev, province]
    );
  };

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    );
  };

  const handleSellerTypeToggle = (type: string) => {
    setSellerTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Apply filters button handler
  const applyFilters = () => {
    setActiveBrands(selectedBrands);
    setActiveGauges(selectedGauges);
    setActiveProvinces(selectedProvinces);
    setActiveConditions(selectedConditions);
    setActiveMinPrice(minPrice);
    setActiveMaxPrice(maxPrice);
    setActiveSellerTypes(sellerTypes);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedGauges([]);
    setSelectedProvinces([]);
    setSelectedConditions([]);
    setMinPrice('');
    setMaxPrice('');
    setSellerTypes([]);
    
    setActiveBrands([]);
    setActiveGauges([]);
    setActiveProvinces([]);
    setActiveConditions([]);
    setActiveMinPrice('');
    setActiveMaxPrice('');
    setActiveSellerTypes([]);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Shotguns</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Shotguns</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTERS */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
          
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
              <button onClick={clearAllFilters} className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">
                Clear All
              </button>
            </div>

            {/* Brand Filter */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'ATA Arms', 'Benelli', 'Beretta', 'Breda', 'Browning', 
                  'Caesar Guerini', 'CZ', 'Escort', 'Fabarm', 'Franchi', 
                  'Hatsan', 'Huglu', 'Ithaca', 'Krieghoff', 'Lanber', 
                  'Merkel', 'Mossberg', 'Perazzi', 'Pointer', 'Remington', 
                  'Retay', 'Savage', 'Stoeger', 'TriStar', 'Turkish Firearms', 
                  'Weatherby', 'Winchester', 'Yildiz', 'Zabala'
                ].map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gauge Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Gauge</span>
              <div className="flex flex-col gap-2.5">
                {[
                  '12 Gauge', '20 Gauge', '16 Gauge', '28 Gauge', 
                  '.410 Bore', '10 Gauge'
                ].map(gauge => (
                  <label key={gauge} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedGauges.includes(gauge)}
                      onChange={() => handleGaugeToggle(gauge)}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{gauge}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Province Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Location</span>
              <div className="flex flex-col gap-2.5">
                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'].map(prov => (
                  <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedProvinces.includes(prov)}
                      onChange={() => handleProvinceToggle(prov)}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Condition</span>
              <div className="flex flex-col gap-2.5">
                {['Brand New', 'Like New', 'Good', 'Fair'].map(cond => (
                  <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedConditions.includes(cond)}
                      onChange={() => handleConditionToggle(cond)}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{cond}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Price Range</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min (R)" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] outline-none focus:border-[#C9922A]" 
                />
                <span className="text-[#8A8E99]">-</span>
                <input 
                  type="number" 
                  placeholder="Max (R)" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] outline-none focus:border-[#C9922A]" 
                />
              </div>
            </div>

            {/* Seller Type */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Seller Type</span>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={sellerTypes.includes('dealer')}
                    onChange={() => handleSellerTypeToggle('dealer')}
                    className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                  />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Dealer Stock (🏪)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={sellerTypes.includes('private')}
                    onChange={() => handleSellerTypeToggle('private')}
                    className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                  />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Private Licence (👤)</span>
                </label>
              </div>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={applyFilters}
              className="w-full bg-[#C9922A] text-black font-bold py-3 rounded-sm uppercase text-[13px] tracking-wider hover:brightness-110 transition-all mt-2"
            >
              Apply Filters
            </button>

          </div>
        </aside>

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">
              Showing <strong className="text-[#F0EDE8]">{totalCount}</strong> results for Shotguns
            </span>
            
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{fontFamily:"'Barlow', sans-serif"}} 
                className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] font-medium px-4 py-2 rounded-sm cursor-pointer outline-none focus:border-[#C9922A] appearance-none min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="condition">Condition: Best</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9922A]"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-[#191C23] border border-white/5 rounded-md p-12 text-center">
              <p className="text-[#8A8E99] text-lg">No listings found matching your filters.</p>
              <button 
                onClick={clearAllFilters}
                className="mt-4 text-[#C9922A] hover:underline text-sm font-semibold"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {listings.map(listing => (
                  <ListingCard key={listing.id} {...listing} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    &lt;
                  </button>
                  
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button 
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-sm font-bold transition-all ${
                          currentPage === pageNum
                            ? 'border-[#C9922A] bg-[#C9922A]/10 text-[#C9922A]'
                            : 'border-white/10 text-[#8A8E99] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && <span className="text-[#8A8E99] px-2">...</span>}
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
