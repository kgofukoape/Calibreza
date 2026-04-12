'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';

const ITEMS_PER_PAGE = 12;

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

type CategoryConfig = {
  label: string;
  showMakes: boolean;
  showCalibres: boolean;
  showLicence: boolean;
  description: string;
};

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  pistols:    { label: 'Pistols',          showMakes: true,  showCalibres: true,  showLicence: true,  description: 'Browse semi-automatic pistols and handguns' },
  rifles:     { label: 'Rifles',           showMakes: true,  showCalibres: true,  showLicence: true,  description: 'Browse bolt-action, semi-auto and lever-action rifles' },
  shotguns:   { label: 'Shotguns',         showMakes: true,  showCalibres: true,  showLicence: true,  description: 'Browse pump, semi-auto and over-under shotguns' },
  revolvers:  { label: 'Revolvers',        showMakes: true,  showCalibres: true,  showLicence: true,  description: 'Browse single and double-action revolvers' },
  'air-guns': { label: 'Air Guns',         showMakes: true,  showCalibres: true,  showLicence: false, description: 'Browse air rifles and air pistols' },
  airsoft:    { label: 'Airsoft',          showMakes: true,  showCalibres: false, showLicence: false, description: 'Browse airsoft rifles, pistols and gear' },
  knives:     { label: 'Knives & Blades',  showMakes: true,  showCalibres: false, showLicence: false, description: 'Browse folding knives, fixed blades and tactical gear' },
  holsters:   { label: 'Holsters & Carry', showMakes: true,  showCalibres: false, showLicence: false, description: 'Browse IWB, OWB and duty holsters' },
  magazines:  { label: 'Magazines',        showMakes: true,  showCalibres: true,  showLicence: false, description: 'Browse factory and aftermarket magazines' },
  ammunition: { label: 'Ammunition',       showMakes: true,  showCalibres: true,  showLicence: false, description: 'Browse FMJ, HP, hunting and specialty ammo' },
  reloading:  { label: 'Reloading',        showMakes: true,  showCalibres: false, showLicence: false, description: 'Browse presses, dies, brass and reloading components' },
};

export default function BrowseCategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const config = CATEGORY_CONFIG[slug];

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);

  const [selectedMakeIds, setSelectedMakeIds] = useState<string[]>([]);
  const [selectedCalibreIds, setSelectedCalibreIds] = useState<string[]>([]);
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSellerTypes, setSelectedSellerTypes] = useState<string[]>([]);

  const [activeMakeIds, setActiveMakeIds] = useState<string[]>([]);
  const [activeCalibreIds, setActiveCalibreIds] = useState<string[]>([]);
  const [activeConditionIds, setActiveConditionIds] = useState<string[]>([]);
  const [activeProvinces, setActiveProvinces] = useState<string[]>([]);
  const [activeMinPrice, setActiveMinPrice] = useState('');
  const [activeMaxPrice, setActiveMaxPrice] = useState('');
  const [activeSellerTypes, setActiveSellerTypes] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!slug || !config) return;
    loadLookups();
  }, [slug]);

  useEffect(() => {
    if (!slug || !config) return;
    fetchListings();
  }, [slug, currentPage, activeMakeIds, activeCalibreIds, activeConditionIds, activeProvinces, activeMinPrice, activeMaxPrice, activeSellerTypes, sortBy]);

  // Lock scroll when filter drawer open on mobile
  useEffect(() => {
    if (filtersOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  const loadLookups = async () => {
    const [makesRes, calibresRes, conditionsRes] = await Promise.all([
      supabase.from('makes').select('id, name').order('name'),
      supabase.from('calibres').select('id, name').order('name'),
      supabase.from('conditions').select('id, name').order('name'),
    ]);
    setMakes(makesRes.data || []);
    setCalibres(calibresRes.data || []);
    setConditions(conditionsRes.data || []);
  };

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select(`*, makes:make_id(name), calibres:calibre_id(name), conditions:condition_id(name), dealers:dealer_id(business_name, slug)`, { count: 'exact' })
      .eq('status', 'active')
      .eq('category_id', slug);

    if (activeMakeIds.length > 0) query = query.in('make_id', activeMakeIds);
    if (activeCalibreIds.length > 0) query = query.in('calibre_id', activeCalibreIds);
    if (activeConditionIds.length > 0) query = query.in('condition_id', activeConditionIds);
    if (activeProvinces.length > 0) query = query.in('city', activeProvinces);
    if (activeMinPrice) query = query.gte('price', parseFloat(activeMinPrice));
    if (activeMaxPrice) query = query.lte('price', parseFloat(activeMaxPrice));
    if (activeSellerTypes.length > 0) query = query.in('listing_type', activeSellerTypes);

    query = query.order('is_featured', { ascending: false });
    switch (sortBy) {
      case 'price_asc':  query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      default:           query = query.order('created_at', { ascending: false });
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    query = query.range(from, from + ITEMS_PER_PAGE - 1);

    const { data, count } = await query;
    setListings(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  const applyFilters = () => {
    setActiveMakeIds(selectedMakeIds);
    setActiveCalibreIds(selectedCalibreIds);
    setActiveConditionIds(selectedConditionIds);
    setActiveProvinces(selectedProvinces);
    setActiveMinPrice(minPrice);
    setActiveMaxPrice(maxPrice);
    setActiveSellerTypes(selectedSellerTypes);
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  const clearAllFilters = () => {
    setSelectedMakeIds([]); setSelectedCalibreIds([]); setSelectedConditionIds([]);
    setSelectedProvinces([]); setMinPrice(''); setMaxPrice(''); setSelectedSellerTypes([]);
    setActiveMakeIds([]); setActiveCalibreIds([]); setActiveConditionIds([]);
    setActiveProvinces([]); setActiveMinPrice(''); setActiveMaxPrice(''); setActiveSellerTypes([]);
    setCurrentPage(1);
  };

  const toggleItem = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const activeFilterCount = activeMakeIds.length + activeCalibreIds.length + activeConditionIds.length + activeProvinces.length + (activeMinPrice ? 1 : 0) + (activeMaxPrice ? 1 : 0) + activeSellerTypes.length;

  const CheckboxItem = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 flex-shrink-0 accent-[#C9922A]" />
      <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{label}</span>
    </label>
  );

  const FilterPanel = () => (
    <div className="bg-[#13151A] border border-white/5 rounded-sm p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-lg uppercase tracking-widest text-[#F0EDE8]">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#C9922A] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="text-[11px] text-[#C9922A] font-bold uppercase tracking-wider hover:brightness-125">Clear All</button>
        )}
      </div>

      {config.showMakes && makes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Brand / Make</span>
          <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
            {makes.map(make => (
              <CheckboxItem key={make.id} label={make.name} checked={selectedMakeIds.includes(make.id)} onChange={() => toggleItem(make.id, selectedMakeIds, setSelectedMakeIds)} />
            ))}
          </div>
        </div>
      )}

      {config.showCalibres && calibres.length > 0 && (
        <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Calibre</span>
          <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
            {calibres.map(calibre => (
              <CheckboxItem key={calibre.id} label={calibre.name} checked={selectedCalibreIds.includes(calibre.id)} onChange={() => toggleItem(calibre.id, selectedCalibreIds, setSelectedCalibreIds)} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Condition</span>
        <div className="flex flex-col gap-2">
          {conditions.map(cond => (
            <CheckboxItem key={cond.id} label={cond.name} checked={selectedConditionIds.includes(cond.id)} onChange={() => toggleItem(cond.id, selectedConditionIds, setSelectedConditionIds)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Province</span>
        <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
          {PROVINCES.map(prov => (
            <CheckboxItem key={prov} label={prov} checked={selectedProvinces.includes(prov)} onChange={() => toggleItem(prov, selectedProvinces, setSelectedProvinces)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Price Range (R)</span>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
            className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50" />
          <span className="text-[#8A8E99] flex-shrink-0">—</span>
          <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50" />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Seller Type</span>
        <div className="flex flex-col gap-2">
          <CheckboxItem label="🏪 Dealer Stock" checked={selectedSellerTypes.includes('dealer')} onChange={() => toggleItem('dealer', selectedSellerTypes, setSelectedSellerTypes)} />
          <CheckboxItem label="👤 Private Seller" checked={selectedSellerTypes.includes('private')} onChange={() => toggleItem('private', selectedSellerTypes, setSelectedSellerTypes)} />
        </div>
      </div>

      <button onClick={applyFilters} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        className="w-full bg-[#C9922A] text-black font-black py-3 rounded-sm uppercase tracking-widest text-[14px] hover:brightness-110 transition-all">
        Apply Filters
      </button>
    </div>
  );

  if (!config) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="text-5xl">🔍</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase">Category Not Found</h1>
          <Link href="/browse" className="text-[#C9922A] font-bold uppercase tracking-widest text-sm hover:brightness-125">← Back to Browse</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* PAGE HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-5 md:py-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-[#C9922A] transition-colors">Browse</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">{config.label}</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight">
            Browse <span className="text-[#C9922A]">{config.label}</span>
          </h1>
          <p className="text-[#8A8E99] text-sm mt-1 uppercase tracking-widest font-bold">{config.description}</p>
        </div>
      </div>

      {/* LEADERBOARD AD */}
      <div className="w-full flex justify-center py-3 px-4 md:px-6 bg-[#0D0F13]">
        <div className="w-full max-w-[970px] h-[70px] md:h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* MOBILE FILTER TOGGLE BAR */}
      <div className="lg:hidden sticky top-[68px] z-40 bg-[#0D0F13] border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 bg-[#13151A] border border-white/10 px-4 py-2 rounded-sm text-[12px] font-black uppercase tracking-widest text-[#F0EDE8] hover:border-[#C9922A]/40 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters {activeFilterCount > 0 && <span className="bg-[#C9922A] text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold">Sort:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-[#13151A] border border-white/10 text-[#F0EDE8] text-[11px] px-2 py-1.5 rounded-sm focus:outline-none appearance-none">
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 z-[150] flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFiltersOpen(false)} />
          <div className="relative w-[85%] max-w-[320px] bg-[#0D0F13] h-full overflow-y-auto border-r border-white/10 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest">Filters</span>
              <button onClick={() => setFiltersOpen(false)} className="w-8 h-8 flex items-center justify-center text-[#8A8E99] hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 flex gap-5">

        {/* LEFT SIDEBAR AD — 2xl only */}
        <div className="hidden 2xl:flex flex-col items-center flex-shrink-0 w-[160px]">
          <div className="w-[160px] h-[600px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6">
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-2">Ad</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 x 600</div>
          </div>
        </div>

        {/* DESKTOP FILTER SIDEBAR */}
        <aside className="hidden lg:block w-[240px] xl:w-[260px] flex-shrink-0">
          <div className="sticky top-6">
            <FilterPanel />
          </div>
        </aside>

        {/* RESULTS */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Results bar — desktop only (mobile uses top bar) */}
          <div className="hidden lg:flex items-center justify-between bg-[#13151A] border border-white/5 rounded-sm px-5 py-3">
            <span className="text-[13px] text-[#8A8E99]">
              {loading ? 'Loading...' : (
                <>
                  <strong className="text-[#F0EDE8]">{totalCount}</strong> listing{totalCount !== 1 ? 's' : ''} in{' '}
                  <span className="text-[#C9922A] font-bold">{config.label}</span>
                  {activeFilterCount > 0 && <span className="text-[#8A8E99]"> · {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>}
                </>
              )}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Sort:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[12px] px-3 py-2 rounded-sm cursor-pointer focus:outline-none focus:border-[#C9922A]/50 appearance-none">
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Mobile results count */}
          <div className="lg:hidden text-[12px] text-[#8A8E99]">
            {!loading && <><strong className="text-[#F0EDE8]">{totalCount}</strong> listing{totalCount !== 1 ? 's' : ''} in <span className="text-[#C9922A]">{config.label}</span></>}
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">Loading listings...</span>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">No listings found</h3>
              <p className="text-[#8A8E99] text-sm mb-6">{activeFilterCount > 0 ? 'Try adjusting or clearing your filters' : `No ${config.label} listings yet`}</p>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-[#C9922A] font-bold text-sm uppercase tracking-widest hover:brightness-125">Clear All Filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {listings.map(listing => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  make={listing.makes?.name || ''}
                  calibre={listing.calibres?.name || ''}
                  price={listing.price}
                  province={listing.city || ''}
                  condition={listing.conditions?.name || ''}
                  category={listing.category_id}
                  listingType={listing.listing_type}
                  sellerName={listing.dealers?.business_name || 'Private Seller'}
                  images={listing.images}
                  featured={listing.is_featured}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                ‹
              </button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 flex items-center justify-center border rounded-sm font-bold text-sm transition-all ${
                      currentPage === pageNum ? 'border-[#C9922A] bg-[#C9922A]/10 text-[#C9922A]' : 'border-white/10 text-[#8A8E99] hover:bg-white/5 hover:text-white'
                    }`}>
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 7 && <span className="text-[#8A8E99]">...</span>}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                ›
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR AD — 2xl only */}
        <div className="hidden 2xl:flex flex-col items-center flex-shrink-0 w-[160px]">
          <div className="w-[160px] h-[600px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6">
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-2">Ad</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 x 600</div>
          </div>
        </div>

      </div>
    </div>
  );
}