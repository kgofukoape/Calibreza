'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ListingCard from '@/components/listings/ListingCard';
import AdBanner from '@/components/AdBanner';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const ProfileMap = dynamic(() => import('@/components/ProfileMap'), { ssr: false });

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
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
  const [selectedBrands, setSelectedBrands]         = useState<string[]>([]);
  const [selectedCalibres, setSelectedCalibres]     = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const toggleFilter = (value: string, current: string[], setter: (v: string[]) => void) => {
    setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
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
    setSelectedBrands([]); setSelectedCalibres([]); setSelectedConditions([]);
    setMinPrice(''); setMaxPrice('');
    onFiltersChange({ brands: [], calibres: [], conditions: [], minPrice: null, maxPrice: null });
  };

  const activeCount =
    selectedBrands.length + selectedCalibres.length + selectedConditions.length +
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  return (
    <aside className="w-full lg:w-[260px] flex-shrink-0">
      <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 flex flex-col gap-5 sticky top-[160px]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-lg uppercase tracking-widest text-[#F0EDE8]">Filters</span>
            {activeCount > 0 && <span className="bg-[#C9922A] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{activeCount}</span>}
          </div>
          {activeCount > 0 && <button onClick={handleClear} className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:brightness-125 font-bold">Clear All</button>}
        </div>

        {brands.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black tracking-widest uppercase text-[#8A8E99]">Brand / Make</span>
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {brands.map(brand => (
                <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)} className="w-4 h-4 accent-[#C9922A] cursor-pointer" />
                  <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {calibres.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
            <span className="text-[10px] font-black tracking-widest uppercase text-[#8A8E99]">Calibre</span>
            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
              {calibres.map(cal => (
                <label key={cal} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={selectedCalibres.includes(cal)} onChange={() => toggleFilter(cal, selectedCalibres, setSelectedCalibres)} className="w-4 h-4 accent-[#C9922A] cursor-pointer" />
                  <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{cal}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
          <span className="text-[10px] font-black tracking-widest uppercase text-[#8A8E99]">Condition</span>
          <div className="flex flex-col gap-2">
            {CONDITIONS.map(cond => (
              <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={selectedConditions.includes(cond)} onChange={() => toggleFilter(cond, selectedConditions, setSelectedConditions)} className="w-4 h-4 accent-[#C9922A] cursor-pointer" />
                <span className="text-[13px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{cond}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
          <span className="text-[10px] font-black tracking-widest uppercase text-[#8A8E99]">Price Range (R)</span>
          <div className="flex items-center gap-2">
            <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50" />
            <span className="text-[#8A8E99] text-sm">—</span>
            <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50" />
          </div>
        </div>

        <button onClick={handleApply} style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="w-full bg-[#C9922A] text-black font-black text-[14px] tracking-widest uppercase py-3 rounded-sm hover:brightness-110 transition-all mt-1">
          Apply Filters
        </button>
      </div>
    </aside>
  );
}

function DealerStorefrontContent() {
  const params = useParams();
  const [dealer, setDealer]           = useState<any>(null);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('inventory');
  const [filters, setFilters]         = useState<any>({ brands: [], calibres: [], conditions: [], minPrice: null, maxPrice: null });
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteSent, setQuoteSent]           = useState(false);
  const [quoteForm, setQuoteForm]           = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => { fetchDealerData(); }, [params.slug]);

  const fetchDealerData = async () => {
    if (!params.slug) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data: dealerData, error } = await supabase.from('dealers').select('*').eq('slug', params.slug).eq('status', 'approved').single();
      if (error || !dealerData) { setDealer(null); setLoading(false); return; }
      setDealer(dealerData);
      const { data: listingsData } = await supabase.from('listings')
        .select('*, makes:make_id(name), calibres:calibre_id(name), conditions:condition_id(name), provinces:province_id(name)')
        .eq('dealer_id', dealerData.id).eq('status', 'active')
        .order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      setAllListings(listingsData || []);
      setLoading(false);
    } catch { setDealer(null); setLoading(false); }
  };

  const filterBrands     = useMemo(() => Array.from(new Set(allListings.map(l => l.makes?.name).filter(Boolean))) as string[], [allListings]);
  const filterCalibres   = useMemo(() => Array.from(new Set(allListings.map(l => l.calibres?.name).filter(Boolean))) as string[], [allListings]);
  const featuredListings = allListings.filter(l => l.is_featured);

  const filteredListings = useMemo(() => allListings.filter(l => {
    if (filters.brands.length > 0 && !filters.brands.includes(l.makes?.name)) return false;
    if (filters.calibres.length > 0 && !filters.calibres.includes(l.calibres?.name)) return false;
    if (filters.conditions.length > 0 && !filters.conditions.includes(l.conditions?.name)) return false;
    if (filters.minPrice !== null && l.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && l.price > filters.maxPrice) return false;
    return true;
  }), [allListings, filters]);

  const waNumber = dealer?.phone ? (() => {
    const d = dealer.phone.replace(/\D/g, '');
    return d.startsWith('27') ? d : d.startsWith('0') ? '27' + d.slice(1) : '27' + d;
  })() : null;
  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${dealer?.business_name}, I found your dealership on Gun X and would like to enquire about your stock.`)}` : null;

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSent(true);
    setTimeout(() => { setShowQuoteModal(false); setQuoteSent(false); setQuoteForm({ name: '', email: '', phone: '', message: '' }); }, 2500);
  };

  const handleContactClick = () => { setActiveTab('contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (loading) return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9922A]" />
      </div>
    </div>
  );

  if (!dealer) return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#8A8E99] text-lg mb-4">Dealer storefront not found</p>
          <Link href="/dealers" className="text-[#C9922A] font-bold uppercase tracking-widest text-sm hover:brightness-125">← Back to Dealer Directory</Link>
        </div>
      </div>
    </div>
  );

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 placeholder-[#8A8E99]/40";
  const lbl = "block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13]">
      <Navbar />

      {/* LEADERBOARD TOP */}
      <div className="w-full flex justify-center py-3 px-4">
        <AdBanner slot="leaderboard_top" page="dealers_profile" />
      </div>

      {dealer.saps_dealer_number && (
        <div className="bg-blue-500/5 border-b border-blue-500/10 px-6 py-2">
          <div className="max-w-[1400px] mx-auto flex items-center gap-2 text-[12px]">
            <span className="text-blue-400 font-black uppercase tracking-widest">🛡️ Licensed Firearm Dealer</span>
            <span className="text-[#8A8E99]">·</span>
            <span className="text-[#8A8E99]">SAPS Dealer Licence No: {dealer.saps_dealer_number}</span>
          </div>
        </div>
      )}

      {/* COVER */}
      <div className="relative h-[320px] bg-[#12141a] overflow-hidden">
        {dealer.banner_url
          ? <img src={dealer.banner_url} alt="Storefront Banner" className="w-full h-full object-cover opacity-40" />
          : <div className="w-full h-full bg-gradient-to-b from-[#191C23] to-[#0D0F13] opacity-50" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full pb-8">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-end gap-6">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-[#191C23] border-4 border-[#0D0F13] rounded-sm overflow-hidden shadow-2xl shrink-0">
              {dealer.logo_url
                ? <img src={dealer.logo_url} alt={dealer.business_name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-[#C9922A] text-black text-5xl font-black">{dealer.business_name?.charAt(0) || '?'}</div>}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-6xl font-black uppercase text-[#F0EDE8] tracking-tighter">
                  {dealer.business_name}
                </h1>
                {dealer.subscription_tier === 'premium' && <span className="bg-[#C9922A] text-black text-[10px] font-black px-3 py-1 uppercase rounded-full">⭐ Premium Partner</span>}
                {dealer.subscription_tier === 'pro' && <span className="bg-[#C9922A] text-black text-[10px] font-black px-3 py-1 uppercase rounded-full">✓ Verified Dealer</span>}
                {dealer.is_verified && <span className="bg-[#2A9C6E] text-white text-[10px] font-black px-3 py-1 uppercase rounded-full">🛡️ Verified</span>}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">
                <span>📍 {dealer.city || 'Location'}, {dealer.province || 'South Africa'}</span>
                {dealer.rating && <span>⭐ {dealer.rating.toFixed(1)} ({dealer.review_count || 0} reviews)</span>}
                <span>📦 {allListings.length} Active Listing{allListings.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-2 flex-shrink-0">
              <button onClick={() => setShowQuoteModal(true)}
                className="bg-[#C9922A] text-black font-black px-6 py-3.5 uppercase tracking-widest text-[13px] hover:brightness-110 transition-all rounded-sm">
                Request Quote
              </button>
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#25D366] text-white font-black px-5 py-3.5 uppercase tracking-widest text-[12px] hover:brightness-110 transition-all rounded-sm">
                  <WaIcon /> WhatsApp
                </a>
              )}
              <button onClick={handleContactClick}
                className="border border-white/20 text-[#F0EDE8] font-black px-5 py-3.5 uppercase tracking-widest text-[12px] hover:bg-white/5 transition-all rounded-sm">
                📞 Call
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
              { id: 'about',     label: 'About' },
              { id: 'reviews',   label: 'Reviews' },
              { id: 'contact',   label: 'Contact & Hours' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className={`py-5 text-[15px] font-black uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === tab.id ? 'border-[#C9922A] text-[#C9922A]' : 'border-transparent text-[#8A8E99] hover:text-white'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="w-full max-w-[1400px] mx-auto px-6 py-10">
        <main className="w-full">

          {/* ── INVENTORY ── */}
          {activeTab === 'inventory' && (
            <div className="flex flex-col lg:flex-row gap-6">
              <DealerFilterSidebar brands={filterBrands} calibres={filterCalibres} onFiltersChange={setFilters} />
              <div className="flex-1 min-w-0">
                {featuredListings.length > 0 && (
                  <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[#C9922A] text-lg">⭐</span>
                      <h3 style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="text-xl font-black uppercase text-[#C9922A]">Featured Stock</h3>
                      <span className="text-[#8A8E99] text-[12px]">· {featuredListings.length} listing{featuredListings.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {featuredListings.slice(0, 3).map(item => (
                        <ListingCard key={item.id} id={item.id} title={item.title}
                          make={item.makes?.name || ''} calibre={item.calibres?.name || ''} price={item.price}
                          province={item.provinces?.name || dealer.province || ''} condition={item.conditions?.name || ''}
                          category={item.category_id} listingType="dealer" sellerName={dealer.business_name}
                          images={item.images} featured={true} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] text-[#8A8E99] font-bold uppercase tracking-widest">
                    <span className="text-[#F0EDE8] font-black">{filteredListings.length}</span> listing{filteredListings.length !== 1 ? 's' : ''}
                    {filteredListings.length !== allListings.length && <span className="text-[#C9922A] ml-1">(filtered from {allListings.length})</span>}
                  </p>
                </div>

                {filteredListings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredListings.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        <ListingCard id={item.id} title={item.title}
                          make={item.makes?.name || 'Unknown'} calibre={item.calibres?.name || 'N/A'} price={item.price}
                          province={item.provinces?.name || dealer.province || 'N/A'} condition={item.conditions?.name || 'N/A'}
                          category={item.category_id} listingType="dealer" sellerName={dealer.business_name}
                          images={item.images} featured={item.is_featured} />
                        {/* LEADERBOARD MID — after every 6th listing */}
                        {(idx + 1) % 6 === 0 && idx < filteredListings.length - 1 && (
                          <div className="col-span-full flex justify-center py-2">
                            <AdBanner slot="leaderboard_mid" page="dealers_profile" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-[#13151A] border border-dashed border-white/10 rounded-sm">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-[#8A8E99] uppercase font-bold tracking-widest text-sm mb-3">No listings match your filters</p>
                    <button onClick={() => setFilters({ brands: [], calibres: [], conditions: [], minPrice: null, maxPrice: null })} className="text-[#C9922A] text-sm font-bold uppercase tracking-widest hover:brightness-125">Clear Filters</button>
                  </div>
                )}

                {/* SQUARE CARD — below inventory on mobile */}
                <div className="flex justify-center mt-6 lg:hidden">
                  <AdBanner slot="square_card" page="dealers_profile" />
                </div>
              </div>

              {/* RIGHT SIDEBAR AD — desktop only */}
              <div className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
                <div className="sticky top-[160px]">
                  <AdBanner slot="sidebar_right" page="dealers_profile" />
                </div>
              </div>
            </div>
          )}

          {/* ── ABOUT ── */}
          {activeTab === 'about' && (
            <div className="max-w-4xl bg-[#13151A] border border-white/5 p-10 rounded-sm">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-6 text-[#C9922A]">Our Story</h2>
              <p className="text-[#F0EDE8] leading-relaxed whitespace-pre-wrap text-lg">
                {dealer.description || `Welcome to ${dealer.business_name}. We are proud to serve the ${dealer.city || 'community'} area with professional expertise and quality firearms.`}
              </p>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setShowQuoteModal(true)} style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                  className="bg-[#C9922A] text-black font-black px-6 py-2.5 uppercase tracking-widest text-[12px] rounded-sm hover:brightness-110 transition-all">
                  Request Quote
                </button>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-[#25D366] text-white font-black px-5 py-2.5 uppercase tracking-widest text-[12px] rounded-sm hover:brightness-110 transition-all">
                    <WaIcon /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ── REVIEWS ── */}
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
                    {[5,4,3,2,1].map(stars => (
                      <div key={stars} className="flex items-center gap-3 mb-2">
                        <span className="text-[13px] text-[#8A8E99] w-12 font-bold">{stars} ⭐</span>
                        <div className="flex-1 h-2 bg-[#0D0F13] rounded-full overflow-hidden"><div className="h-full bg-[#C9922A]" style={{ width: '0%' }} /></div>
                        <span className="text-[13px] text-[#8A8E99] w-8 font-bold">0</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[#8A8E99] text-center py-8 uppercase font-bold tracking-widest">No reviews yet</p>
              </div>
            </div>
          )}

          {/* ── CONTACT ── */}
          {activeTab === 'contact' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#13151A] border border-white/5 p-10 rounded-sm">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-8 text-[#C9922A]">Get In Touch</h2>
                <div className="space-y-6">
                  {dealer.email && <div><p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Email Address</p><a href={`mailto:${dealer.email}`} className="text-xl font-bold hover:text-[#C9922A] transition-colors">{dealer.email}</a></div>}
                  {dealer.phone && <div><p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Phone Number</p><a href={`tel:${dealer.phone}`} className="text-xl font-bold text-[#C9922A] hover:brightness-110">{dealer.phone}</a></div>}
                  {dealer.alternate_phone && <div><p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Alternate Phone</p><a href={`tel:${dealer.alternate_phone}`} className="text-xl font-bold hover:text-[#C9922A]">{dealer.alternate_phone}</a></div>}
                  <div><p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Physical Address</p><p className="text-xl font-bold leading-tight">{dealer.address || `${dealer.city}, ${dealer.province}`}</p></div>
                  {dealer.website && <div><p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-1">Website</p><a href={dealer.website} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-[#C9922A] hover:underline">Visit Website →</a></div>}
                </div>

                {dealer.lat && dealer.lng && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <p className="text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-3">📍 Find Us</p>
                    <ProfileMap
                      lat={parseFloat(dealer.lat)}
                      lng={parseFloat(dealer.lng)}
                      name={dealer.business_name}
                      address={dealer.address}
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
                  <button onClick={() => setShowQuoteModal(true)} style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                    className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:brightness-110 transition-all">
                    Request Quote
                  </button>
                  {waUrl && (
                    <a href={waUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-[#25D366] text-white font-black px-5 py-3 uppercase tracking-widest text-[12px] rounded-sm hover:brightness-110 transition-all">
                      <WaIcon /> WhatsApp
                    </a>
                  )}
                </div>

                {/* SQUARE CARD AD — below contact details */}
                <div className="mt-6 pt-6 border-t border-white/5 flex justify-center">
                  <AdBanner slot="square_card" page="dealers_profile" />
                </div>
              </div>

              <div className="bg-[#13151A] border border-white/5 p-10 rounded-sm">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-8 text-[#F0EDE8]">Business Hours</h2>
                <div className="space-y-3">
                  {dealer.business_hours ? (
                    Object.entries(dealer.business_hours).map(([day, hours]: any) => (
                      <div key={day} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0">
                        <span className="text-[#8A8E99] uppercase font-black text-[11px] tracking-widest">{day}</span>
                        {hours.open ? <span className="font-bold text-sm text-[#F0EDE8]">{hours.from} — {hours.to}</span> : <span className="font-bold text-sm text-[#8A8E99]">Closed</span>}
                      </div>
                    ))
                  ) : <p className="text-[#8A8E99]">Contact dealer for operating hours.</p>}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      <Footer />

      {/* QUOTE MODAL */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#191C23] border border-white/10 rounded-sm p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase">Request a Quote</h3>
              <button onClick={() => { setShowQuoteModal(false); setQuoteSent(false); }} className="text-[#8A8E99] hover:text-white text-2xl leading-none">×</button>
            </div>
            {quoteSent ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-[#2A9C6E] mb-2">Quote Request Sent!</p>
                <p className="text-[#8A8E99] text-[13px]">{dealer.business_name} will be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-[#0D0F13] border border-white/5 rounded-sm p-3 mb-1">
                  <div className="w-10 h-10 rounded-sm bg-[#C9922A] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {dealer.logo_url ? <img src={dealer.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-black font-black">{dealer.business_name?.charAt(0)}</span>}
                  </div>
                  <div>
                    <p className="font-black text-[13px] text-[#F0EDE8]">{dealer.business_name}</p>
                    <p className="text-[11px] text-[#8A8E99]">Licensed Dealer · {dealer.city}</p>
                  </div>
                </div>
                <div><label className={lbl}>Your Name *</label><input required value={quoteForm.name} onChange={e => setQuoteForm(p => ({ ...p, name: e.target.value }))} className={inp} placeholder="Full name" /></div>
                <div><label className={lbl}>Email *</label><input required type="email" value={quoteForm.email} onChange={e => setQuoteForm(p => ({ ...p, email: e.target.value }))} className={inp} placeholder="you@email.com" /></div>
                <div><label className={lbl}>Phone</label><input type="tel" value={quoteForm.phone} onChange={e => setQuoteForm(p => ({ ...p, phone: e.target.value }))} className={inp} placeholder="082 123 4567" /></div>
                <div><label className={lbl}>Message *</label><textarea required rows={4} value={quoteForm.message} onChange={e => setQuoteForm(p => ({ ...p, message: e.target.value }))} className={`${inp} resize-none`} placeholder={`Hi ${dealer.business_name}, I'd like a quote on...`} /></div>
                <button type="submit" style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-3.5 rounded-sm hover:brightness-110 transition-all">
                  Send Quote Request
                </button>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:brightness-110 transition-all">
                    <WaIcon /> Or chat on WhatsApp
                  </a>
                )}
                <p className="text-[11px] text-[#8A8E99] text-center">All transactions must comply with the Firearms Control Act</p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealerStorefrontPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-[#0D0F13]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9922A]" />
        </div>
      </div>
    }>
      <DealerStorefrontContent />
    </Suspense>
  );
}
