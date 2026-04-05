'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ListingCard from '@/components/listings/ListingCard';

const ITEMS_PER_PAGE = 12;

export default function ServicesPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Active filter states
  const [activeServiceTypes, setActiveServiceTypes] = useState<string[]>([]);
  const [activeProvinces, setActiveProvinces] = useState<string[]>([]);
  const [activeMinPrice, setActiveMinPrice] = useState('');
  const [activeMaxPrice, setActiveMaxPrice] = useState('');
  const [activeSellerTypes, setActiveSellerTypes] = useState<string[]>([]);
  
  // Pending filter states
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sellerTypes, setSellerTypes] = useState<string[]>([]);
  
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchListings();
  }, [currentPage, activeServiceTypes, activeProvinces, activeMinPrice, activeMaxPrice, activeSellerTypes, sortBy]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
        .eq('category', 'services');

      if (activeServiceTypes.length > 0) query = query.in('service_type', activeServiceTypes);
      if (activeProvinces.length > 0) query = query.in('province', activeProvinces);
      if (activeMinPrice) query = query.gte('price', parseInt(activeMinPrice));
      if (activeMaxPrice) query = query.lte('price', parseInt(activeMaxPrice));
      if (activeSellerTypes.length > 0) query = query.in('listing_type', activeSellerTypes);

      switch (sortBy) {
        case 'price_asc': query = query.order('price', { ascending: true }); break;
        case 'price_desc': query = query.order('price', { ascending: false }); break;
        default: query = query.order('created_at', { ascending: false });
      }

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

  const applyFilters = () => {
    setActiveServiceTypes(selectedServiceTypes);
    setActiveProvinces(selectedProvinces);
    setActiveMinPrice(minPrice);
    setActiveMaxPrice(maxPrice);
    setActiveSellerTypes(sellerTypes);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedServiceTypes([]);
    setSelectedProvinces([]);
    setMinPrice('');
    setMaxPrice('');
    setSellerTypes([]);
    setActiveServiceTypes([]);
    setActiveProvinces([]);
    setActiveMinPrice('');
    setActiveMaxPrice('');
    setActiveSellerTypes([]);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Services</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Services</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
              <button onClick={clearAllFilters} className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">Clear All</button>
            </div>

            {/* Service Type Filter */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Service Type</span>
              <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Gunsmithing', 'Custom Builds', 'Firearm Repair', 'Cerakote / Coating', 
                  'Engraving', 'Blueing / Refinishing', 'Stock Work', 'Barrel Threading', 
                  'Sight Installation', 'Trigger Work', 'Action Tuning', 'Rebarreling',
                  'Training / Courses', 'Competency Training', 'Advanced Shooting Course', 
                  'Tactical Training', 'Long Range Training', 'Defensive Shooting',
                  'Firearm Licence Application', 'Licence Renewal Assistance', 
                  'Competency Application', 'Dedicated Status Application',
                  'Safety / Storage', 'Safe Installation', 'Gun Safe Sales',
                  'Appraisal / Valuation', 'Consignment Services', 'FFL Transfer',
                  'Custom Holsters', 'Leather Work', 'Kydex Work'
                ].map(serviceType => (
                  <label key={serviceType} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedServiceTypes.includes(serviceType)}
                      onChange={() => setSelectedServiceTypes(prev => prev.includes(serviceType) ? prev.filter(s => s !== serviceType) : [...prev, serviceType])}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{serviceType}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Province */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Location</span>
              <div className="flex flex-col gap-2.5">
                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'].map(prov => (
                  <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedProvinces.includes(prov)}
                      onChange={() => setSelectedProvinces(prev => prev.includes(prov) ? prev.filter(p => p !== prov) : [...prev, prov])}
                      className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                    />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
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

            {/* Provider Type */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Provider Type</span>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={sellerTypes.includes('dealer')}
                    onChange={() => setSellerTypes(prev => prev.includes('dealer') ? prev.filter(t => t !== 'dealer') : [...prev, 'dealer'])}
                    className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                  />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Business / Professional (🏪)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={sellerTypes.includes('private')}
                    onChange={() => setSellerTypes(prev => prev.includes('private') ? prev.filter(t => t !== 'private') : [...prev, 'private'])}
                    className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" 
                  />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Individual (👤)</span>
                </label>
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="w-full bg-[#C9922A] text-black font-bold py-3 rounded-sm uppercase text-[13px] tracking-wider hover:brightness-110 transition-all mt-2"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">
              Showing <strong className="text-[#F0EDE8]">{totalCount}</strong> results for Services
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
