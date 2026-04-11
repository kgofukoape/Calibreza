'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';

function LeaderboardAd() {
  return (
    <div className="w-full bg-[#0D0F13] py-3">
      <div className="max-w-[1400px] mx-auto px-6 flex justify-end">
        <div className="w-[calc(100%-160px)] h-[120px] bg-[#13151A] border border-dashed border-white/10 rounded-sm flex flex-col items-center justify-center gap-1">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8E99]/50">Advertisement</span>
          <span className="text-[11px] font-bold text-[#8A8E99]/30">970 × 120 — Leaderboard</span>
        </div>
      </div>
    </div>
  );
}

const CONDITIONS = ['Brand New', 'Like New', 'Good', 'Fair'];

function DealerFilterSidebar({
  brands,
  calibres,
  onFiltersChange,
}: {
  brands: string[];
  calibres: string[];
  onFiltersChange: (filters: any) => void;
}) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCalibres, setSelectedCalibres] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const toggleFilter = (
    value: string,
    current: string[],
    setter: (v: string[]) => void
  ) => {
    setter(current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    );
  };

  const handleApply = () => {
    onFiltersChange({
      brands: selectedBrands,
      calibres: selectedCalibres,
      conditions: selectedConditions,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
    });
  };

  const handleClear = () => {
    setSelectedBrands([]);
    setSelectedCalibres([]);
    setSelectedConditions([]);
    setMinPrice('');
    setMaxPrice('');
    onFiltersChange({ brands: [], calibres: [], conditions: [], minPrice: null, maxPrice: null });
  };

  const activeCount =
    selectedBrands.length +
    selectedCalibres.length +
    selectedConditions.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  return (
    <aside className="w-full lg:w-[260px] flex-shrink-0">
      <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 flex flex-col gap-5 sticky top-[160px]">

        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-lg uppercase tracking-widest text-[#F0EDE8]">
              Filters
            </span>
            {activeCount > 0 && (
              <span className="bg-[#C9922A] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button onClick={handleClear} className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:brightness-125 font-bold">
              Clear All
            </button>
          )}
        </div>

        {brands.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black tracking-widest uppercase text-[#8A8E99]">Brand / Make</span>
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)}
                    className="w-4 h-4 accent-[#C9922A] cursor-pointer"
                  />
                  <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {calibres.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
            <span className="text-[10px] font-black tracking-widest uppercase text-[#8A8E99]">Calibre</span>
            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
              {calibres.map((cal) => (
                <label key={cal} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCalibres.includes(cal)}
                    onChange={() => toggleFilter(cal, selectedCalibres, setSelectedCalibres)}
                    className="w-4 h-4 accent-[#C9922A] cursor-pointer"
                  />
                  <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">
                    {cal}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
          <span className="text-[10px] font-black tracking-widest uppercase text-[#8A8E99]">Condition</span>
          <div className="flex flex-col gap-2">
            {CONDITIONS.map((cond) => (
              <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(cond)}
                  onChange={() => toggleFilter(cond, selectedConditions, setSelectedConditions)}
                  className="w-4 h-4 accent-[#C9922A] cursor-pointer"
                />
                <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">
                  {cond}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
          <span className="text-[10px] font-black tracking-widest uppercase text-[#8A8E99]">Price Range (R)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
            />
            <span className="text-[#8A8E99] text-sm">—</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
            />
          </div>
        </div>

        <button
          onClick={handleApply}
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="w-full bg-[#C9922A] text-black font-black text-[14px] tracking-widest uppercase py-3 rounded-sm hover:brightness-110 transition-all mt-1"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}

function DealerStorefrontContent() {
  const params = useParams();
  const [dealer, setDealer] = useState<any>(null);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [filters, setFilters] = useState<any>({
    brands: [],
    calibres: [],
    conditions: [],
    minPrice: null,
    maxPrice: null,
  });

  useEffect(() => {
    fetchDealerData();
  }, [params.slug]);

  const fetchDealerData = async () => {
    if (!params.slug) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealers')
        .select('*')
        .eq('slug', params.slug)
        .eq('status', 'approved')
        .single();

      if (dealerError || !dealerData) {
        setDealer(null);
        setLoading(false);
        return;
      }

      setDealer(dealerData);

      const { data: listingsData } = await supabase
        .from('listings')
        .select(`
          *,
          makes:make_id(name),
          calibres:calibre_id(name),
          conditions:condition_id(name),
          provinces:province_id(name)
        `)
        .eq('dealer_id', dealerData.id)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      setAllListings(listingsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setDealer(null);
      setLoading(false);
    }
  };

  // Fixed: use Array.from instead of spread operator on Set
  const filterBrands = useMemo(() => {
    const names = allListings.map((l) => l.makes?.name).filter(Boolean);
    return Array.from(new Set(names)) as string[];
  }, [allListings]);

  const filterCalibres = useMemo(() => {
    const names = allListings.map((l) => l.calibres?.name).filter(Boolean);
    return Array.from(new Set(names)) as string[];
  }, [allListings]);

  const filteredListings = useMemo(() => {
    return allListings.filter((l) => {
      if (filters.brands.length > 0 && !filters.brands.includes(l.makes?.name)) return false;
      if (filters.calibres.length > 0 && !filters.calibres.includes(l.calibres?.name)) return false;
      if (filters.conditions.length > 0 && !filters.conditions.includes(l.conditions?.name)) return false;
      if (filters.minPrice !== null && l.price < filters.minPrice) return false;
      if (filters.maxPrice !== null && l.price > filters.maxPrice) return false;
      return true;
    });
  }, [allListings, filters]);

  const handleContactClick = () => {
    setActiveTab('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9922A]"></div>
        </div>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#8A8E99] text-lg mb-4">Dealer storefront not found</p>
            <Link href="/dealers" className="text-[#C9922A] font-bold uppercase tracking-widest text-sm hover:brightness-125">
              ← Back to Dealer Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13]">
      <Navbar />

      <LeaderboardAd />

      {/* COVER SECTION */}
      <div className="relative h-[320px] bg-[#12141a] overflow-hidden">
        {dealer.banner_url ? (
          <img src={dealer.banner_url} alt="Storefront Banner" className="w-full h-full object-cover opacity-40" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#191C23] to-[#0D0F13] opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full pb-8">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-end gap-6">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-[#191C23] border-4 border-[#0D0F13] rounded-sm overflow-hidden shadow-2xl shrink-0">
              {dealer.logo_url ? (
                <img src={dealer.logo_url} alt={dealer.business_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#C9922A] text-black text-5xl font-black">
                  {dealer.business_name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-6xl font-black uppercase text-[#F0EDE8] tracking-tighter">
                  {dealer.business_name}
                </h1>
                {dealer.subscription_tier === 'premium' && (
                  <span className="bg-[#C9922A] text-black text-[10px] font-black px-3 py-1 uppercase rounded-full">⭐ Premium Partner</span>
                )}
                {dealer.subscription_tier === 'pro' && (
                  <span className="bg-[#C9922A] text-black text-[10px] font-black px-3 py-1 uppercase rounded-full">✓ Verified Dealer</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">
                <span>📍 {dealer.city || 'Location'}, {dealer.province || 'South Africa'}</span>
                {dealer.rating && (
                  <span>⭐ {dealer.rating.toFixed(1)} ({dealer.review_count || 0} reviews)</span>
                )}
                <span>📦 {allListings.length} Active Listing{allListings.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex gap-3 mb-2">
              <button
                onClick={handleContactClick}
                className="bg-[#C9922A] text-black font-black px-8 py-4 uppercase tracking-widest text-[14px] hover:brightness-110 transition-all rounded-sm"
              >
                Contact Dealer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-[#0D0F13] border-b border-white/5 sticky top-[72px] z-40">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'inventory', label: `Inventory (${allListings.length})` },
              { id: 'about', label: 'About' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'contact', label: 'Contact & Hours' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className={`py-5 text-[15px] font-black uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#C9922A] text-[#C9922A]'
                    : 'border-transparent text-[#8A8E99] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="w-full max-w-[1400px] mx-auto px-6 py-10">
        <main className="w-full">

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="flex flex-col lg:flex-row gap-6">
              <DealerFilterSidebar
                brands={filterBrands}
                calibres={filterCalibres}
                onFiltersChange={setFilters}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] text-[#8A8E99] font-bold uppercase tracking-widest">
                    {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
                    {filteredListings.length !== allListings.length && (
                      <span className="text-[#C9922A] ml-1">(filtered from {allListings.length})</span>
                    )}
                  </p>
                </div>
                {filteredListings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredListings.map((item) => (
                      <ListingCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        make={item.makes?.name || 'Unknown'}
                        calibre={item.calibres?.name || 'N/A'}
                        price={item.price}
                        province={item.provinces?.name || dealer.province || 'N/A'}
                        condition={item.conditions?.name || 'N/A'}
                        category={item.category_id}
                        listingType="dealer"
                        sellerName={dealer.business_name}
                        images={item.images}
                        featured={item.is_featured}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-[#13151A] border border-dashed border-white/10 rounded-sm">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-[#8A8E99] uppercase font-bold tracking-widest text-sm mb-3">
                      No listings match your filters
                    </p>
                    <button
                      onClick={() => setFilters({ brands: [], calibres: [], conditions: [], minPrice: null, maxPrice: null })}
                      className="text-[#C9922A] text-sm font-bold uppercase tracking-widest hover:brightness-125"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="max-w-4xl bg-[#13151A] border border-white/5 p-10 rounded-sm">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-6 text-[#C9922A]">Our Story</h2>
              <p className="text-[#F0EDE8] leading-relaxed whitespace-pre-wrap text-lg">
                {dealer.description || `Welcome to ${dealer.business_name}. We are proud to serve the ${dealer.city || 'community'} area with professional expertise and quality firearms.`}
              </p>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="max-w-[800px]">
              <div className="bg-[#13151A] border border-white/5 p-10 rounded-sm">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-8 text-[#C9922A]">Customer Reviews</h2>
                <div className="flex items-center gap-8 mb-8 pb-8 border-b border-white/5">
                  <div className="text-center">
                    <div className="text-5xl font-black text-[#C9922A] mb-2">{dealer.rating?.toFixed(1) || '0.0'}</div>
                    <div className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">{dealer.review_count || 0} reviews</div>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-3 mb-2">
                        <span className="text-[13px] text-[#8A8E99] w-12 font-bold">{stars} ⭐</span>
                        <div className="flex-1 h-2 bg-[#0D0F13] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9922A]" style={{ width: '0%' }}></div>
                        </div>
                        <span className="text-[13px] text-[#8A8E99] w-8 font-bold">0</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[#8A8E99] text-center py-8 uppercase font-bold tracking-widest">No reviews yet</p>
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#13151A] border border-white/5 p-10 rounded-sm">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-8 text-[#C9922A]">Get In Touch</h2>
                <div className="space-y-6">
                  {dealer.email && (
                    <div>
                      <p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Email Address</p>
                      <a href={`mailto:${dealer.email}`} className="text-xl font-bold hover:text-[#C9922A] transition-colors">{dealer.email}</a>
                    </div>
                  )}
                  {dealer.phone && (
                    <div>
                      <p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Phone Number</p>
                      <a href={`tel:${dealer.phone}`} className="text-xl font-bold text-[#C9922A] hover:brightness-110 transition-all">{dealer.phone}</a>
                    </div>
                  )}
                  {dealer.alternate_phone && (
                    <div>
                      <p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Alternate Phone</p>
                      <a href={`tel:${dealer.alternate_phone}`} className="text-xl font-bold hover:text-[#C9922A] transition-colors">{dealer.alternate_phone}</a>
                    </div>
                  )}
                  <div>
                    <p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Physical Address</p>
                    <p className="text-xl font-bold leading-tight">{dealer.address || `${dealer.city}, ${dealer.province}`}</p>
                  </div>
                  {dealer.website && (
                    <div>
                      <p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Website</p>
                      <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-[#C9922A] hover:underline">Visit Website →</a>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-[#13151A] border border-white/5 p-10 rounded-sm">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-8 text-[#F0EDE8]">Business Hours</h2>
                <div className="space-y-3">
                  {dealer.business_hours ? (
                    Object.entries(dealer.business_hours).map(([day, hours]: any) => (
                      <div key={day} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0">
                        <span className="text-[#8A8E99] uppercase font-black text-[11px] tracking-widest">{day}</span>
                        {hours.open ? (
                          <span className="font-bold text-sm text-[#F0EDE8]">{hours.from} — {hours.to}</span>
                        ) : (
                          <span className="font-bold text-sm text-[#8A8E99]">Closed</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[#8A8E99]">Contact dealer for operating hours.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="py-10 border-t border-white/5 text-center">
        <p className="text-[10px] text-[#8A8E99] uppercase tracking-[0.4em] font-bold">
          Gun X Classifieds &bull; South Africa&apos;s Premier Marketplace
        </p>
      </footer>
    </div>
  );
}

export default function DealerStorefrontPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-[#0D0F13]">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9922A]"></div>
        </div>
      </div>
    }>
      <DealerStorefrontContent />
    </Suspense>
  );
}