'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const CATEGORIES = [
  { id: 'pistols', label: 'Pistols' },
  { id: 'rifles', label: 'Rifles' },
  { id: 'shotguns', label: 'Shotguns' },
  { id: 'revolvers', label: 'Revolvers' },
  { id: 'air-guns', label: 'Air Guns' },
  { id: 'airsoft', label: 'Airsoft' },
  { id: 'knives', label: 'Knives' },
  { id: 'holsters', label: 'Holsters & Carry' },
  { id: 'magazines', label: 'Magazines' },
  { id: 'ammunition', label: 'Ammunition' },
  { id: 'reloading', label: 'Reloading' },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';

  const [listings, setListings] = useState<any[]>([]);
  const [dealers, setDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'dealers'>('listings');

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [listingType, setListingType] = useState('all');

  // Search input in page
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
    if (query) fetchResults(query);
    else setLoading(false);
  }, [query]);

  const fetchResults = async (q: string) => {
    setLoading(true);

    let listingsQuery = supabase
      .from('listings')
      .select(`
        *,
        makes:make_id(name),
        calibres:calibre_id(name),
        conditions:condition_id(name),
        provinces:province_id(name)
      `)
      .eq('status', 'active')
      .ilike('title', `%${q}%`)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    const [listingsRes, dealersRes] = await Promise.all([
      listingsQuery,
      supabase
        .from('dealers')
        .select('*')
        .eq('status', 'approved')
        .or(`business_name.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(20),
    ]);

    setListings(listingsRes.data || []);
    setDealers(dealersRes.data || []);
    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  const toggleFilter = (value: string, current: string[], setter: (v: string[]) => void) => {
    setter(current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  const filteredListings = listings.filter((l) => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(l.category_id)) return false;
    if (selectedProvinces.length > 0 && !selectedProvinces.includes(l.provinces?.name)) return false;
    if (minPrice && l.price < parseFloat(minPrice)) return false;
    if (maxPrice && l.price > parseFloat(maxPrice)) return false;
    if (listingType !== 'all' && l.listing_type !== listingType) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedProvinces([]);
    setMinPrice('');
    setMaxPrice('');
    setListingType('all');
  };

  const activeFilterCount = selectedCategories.length + selectedProvinces.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (listingType !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      {/* Search Header */}
      <div className="bg-[#13151A] border-b border-white/5 px-6 py-6">
        <div className="max-w-[1400px] mx-auto">
          <form onSubmit={handleSearchSubmit} className="flex gap-3 mb-4">
            <div className="flex-1 flex items-center gap-3 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 focus-within:border-[#C9922A]/50 transition-all">
              <svg className="w-4 h-4 text-[#8A8E99] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search listings, dealers, makes..."
                className="flex-1 bg-transparent text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="bg-[#C9922A] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[14px] hover:brightness-110 transition-all"
            >
              Search
            </button>
          </form>

          {query && !loading && (
            <div className="flex items-center justify-between">
              <p className="text-[#8A8E99] text-sm">
                <span className="text-[#F0EDE8] font-bold">{filteredListings.length} listings</span>
                {dealers.length > 0 && <span> · <span className="text-[#F0EDE8] font-bold">{dealers.length} dealers</span></span>}
                {' '}found for <span className="text-[#C9922A] font-bold">"{query}"</span>
              </p>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('listings')}
                  className={`px-4 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'listings' ? 'bg-[#C9922A] text-black' : 'bg-white/5 text-[#8A8E99] hover:bg-white/10'
                  }`}
                >
                  Listings ({filteredListings.length})
                </button>
                <button
                  onClick={() => setActiveTab('dealers')}
                  className={`px-4 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'dealers' ? 'bg-[#C9922A] text-black' : 'bg-white/5 text-[#8A8E99] hover:bg-white/10'
                  }`}
                >
                  Dealers ({dealers.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {!query ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔍</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-3">
              What are you looking for?
            </h2>
            <p className="text-[#8A8E99] text-sm">Search for firearms, accessories, dealers and more</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Searching...</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-8">

            {/* FILTER SIDEBAR — only for listings tab */}
            {activeTab === 'listings' && (
              <aside className="w-[260px] flex-shrink-0">
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 sticky top-6">
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-lg uppercase tracking-widest">Filters</span>
                      {activeFilterCount > 0 && (
                        <span className="bg-[#C9922A] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-[11px] text-[#C9922A] font-bold uppercase tracking-wider hover:brightness-125">
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Category */}
                  <div className="mb-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Category</p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {CATEGORIES.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.id)}
                            onChange={() => toggleFilter(cat.id, selectedCategories, setSelectedCategories)}
                            className="w-4 h-4 accent-[#C9922A]"
                          />
                          <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{cat.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Province */}
                  <div className="mb-5 pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Province</p>
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {PROVINCES.map((prov) => (
                        <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedProvinces.includes(prov)}
                            onChange={() => toggleFilter(prov, selectedProvinces, setSelectedProvinces)}
                            className="w-4 h-4 accent-[#C9922A]"
                          />
                          <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="mb-5 pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Price Range (R)</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                      />
                      <span className="text-[#8A8E99]">—</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                      />
                    </div>
                  </div>

                  {/* Seller Type */}
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Seller Type</p>
                    <div className="space-y-2">
                      {[
                        { id: 'all', label: 'All Sellers' },
                        { id: 'dealer', label: 'Dealers Only' },
                        { id: 'private', label: 'Private Only' },
                      ].map((type) => (
                        <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name="listingType"
                            checked={listingType === type.id}
                            onChange={() => setListingType(type.id)}
                            className="w-4 h-4 accent-[#C9922A]"
                          />
                          <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* RESULTS */}
            <div className="flex-1 min-w-0">

              {/* LISTINGS TAB */}
              {activeTab === 'listings' && (
                <>
                  {filteredListings.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="text-5xl mb-4">🔍</div>
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">
                        No listings found
                      </h3>
                      <p className="text-[#8A8E99] text-sm mb-4">
                        {activeFilterCount > 0 ? 'Try adjusting your filters' : `No results for "${query}"`}
                      </p>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-[#C9922A] text-sm font-bold uppercase tracking-widest hover:brightness-125"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredListings.map((listing) => (
                        <ListingCard
                          key={listing.id}
                          id={listing.id}
                          title={listing.title}
                          make={listing.makes?.name || 'Unknown'}
                          calibre={listing.calibres?.name || 'N/A'}
                          price={listing.price}
                          province={listing.provinces?.name || 'N/A'}
                          condition={listing.conditions?.name || 'N/A'}
                          category={listing.category_id}
                          listingType={listing.listing_type}
                          sellerName={listing.city || 'N/A'}
                          images={listing.images}
                          featured={listing.is_featured}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* DEALERS TAB */}
              {activeTab === 'dealers' && (
                <>
                  {dealers.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="text-5xl mb-4">🏪</div>
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">
                        No dealers found
                      </h3>
                      <p className="text-[#8A8E99] text-sm">No dealers match "{query}"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {dealers.map((d) => (
                        <Link
                          key={d.id}
                          href={`/dealers/${d.slug}`}
                          className="group bg-[#13151A] border border-white/5 p-6 rounded-sm hover:border-[#C9922A]/40 transition-all flex flex-col items-center text-center relative"
                        >
                          {d.subscription_tier === 'premium' && (
                            <span className="absolute top-3 right-3 bg-[#C9922A] text-black text-[9px] font-black px-2 py-0.5 uppercase rounded-full">⭐ Premium</span>
                          )}
                          {d.subscription_tier === 'pro' && (
                            <span className="absolute top-3 right-3 bg-[#C9922A] text-black text-[9px] font-black px-2 py-0.5 uppercase rounded-full">✓ Pro</span>
                          )}
                          <div className="w-16 h-16 bg-[#191C23] border border-white/10 mb-4 flex items-center justify-center overflow-hidden rounded-sm">
                            {d.logo_url ? (
                              <img src={d.logo_url} alt={d.business_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl font-black text-[#C9922A]">{d.business_name?.charAt(0)}</span>
                            )}
                          </div>
                          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-1 group-hover:text-[#C9922A] transition-colors">
                            {d.business_name}
                          </h3>
                          <p className="text-[#8A8E99] text-xs font-bold uppercase tracking-widest">
                            📍 {d.city}, {d.province}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}