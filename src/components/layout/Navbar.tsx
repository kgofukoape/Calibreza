'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type SearchResult = {
  listings: any[];
  dealers: any[];
};

const POPULAR_SEARCHES = [
  'Glock 17', 'Beretta', 'Remington 700', 'CZ P-10',
  'Smith & Wesson', '9mm Ammo', 'Holster', 'Tikka',
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [dealer, setDealer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ listings: [], dealers: [] });
  const [searchLoading, setSearchLoading] = useState(false);

  // Mode A — inline expand (click)
  const [inlineMode, setInlineMode] = useState(false);
  // Mode B — dropdown below navbar (hover)
  const [hoverMode, setHoverMode] = useState(false);

  const searchIconRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const hoverInputRef = useRef<HTMLInputElement>(null);
  const hoverBarRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); checkDealer(session.user.id); }
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); checkDealer(session.user.id); }
      else { setUser(null); setDealer(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (
        searchIconRef.current && !searchIconRef.current.contains(e.target as Node) &&
        hoverBarRef.current && !hoverBarRef.current.contains(e.target as Node)
      ) {
        setInlineMode(false);
        setHoverMode(false);
        setSearchQuery('');
        setSearchResults({ listings: [], dealers: [] });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setInlineMode(false);
    setHoverMode(false);
    setSearchQuery('');
    setSearchResults({ listings: [], dealers: [] });
  }, [pathname]);

  useEffect(() => {
    if (inlineMode && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [inlineMode]);

  useEffect(() => {
    if (hoverMode && hoverInputRef.current) {
      hoverInputRef.current.focus();
    }
  }, [hoverMode]);

  const checkDealer = async (userId: string) => {
    const { data } = await supabase
      .from('dealers')
      .select('id, business_name, slug, subscription_tier, status')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .single();
    setDealer(data || null);
    setLoading(false);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults({ listings: [], dealers: [] });
      return;
    }
    setSearchLoading(true);

    const [listingsRes, dealersRes] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, price, category_id, images, city, is_negotiable')
        .eq('status', 'active')
        .ilike('title', `%${query}%`)
        .limit(6),
      supabase
        .from('dealers')
        .select('id, business_name, slug, city, province, logo_url, subscription_tier')
        .eq('status', 'approved')
        .ilike('business_name', `%${query}%`)
        .limit(3),
    ]);

    setSearchResults({
      listings: listingsRes.data || [],
      dealers: dealersRes.data || [],
    });
    setSearchLoading(false);
  }, []);

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setInlineMode(false);
      setHoverMode(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInlineMode(false);
      setHoverMode(false);
      setSearchQuery('');
      setSearchResults({ listings: [], dealers: [] });
    }
  };

  const handleIconMouseEnter = () => {
    if (inlineMode) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (!inlineMode) setHoverMode(true);
    }, 150);
  };

  const handleIconMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleHoverBarMouseLeave = () => {
    if (inlineMode) return;
    hoverTimeoutRef.current = setTimeout(() => {
      if (!inlineMode) {
        setHoverMode(false);
        if (!searchQuery) setSearchResults({ listings: [], dealers: [] });
      }
    }, 300);
  };

  const handleHoverBarMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleIconClick = () => {
    setHoverMode(false);
    setInlineMode(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ listings: [], dealers: [] });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    router.push('/');
  };

  const getInitial = () => {
    if (dealer) return dealer.business_name?.charAt(0) || 'D';
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.charAt(0);
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    if (dealer) return dealer.business_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
    return user?.email?.split('@')[0] || 'Account';
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  const totalResults = searchResults.listings.length + searchResults.dealers.length;
  const showResults = searchQuery.length >= 2;

  const ResultsDropdown = ({ inputQuery }: { inputQuery: string }) => (
    <div className="absolute top-full mt-2 left-0 right-0 bg-[#13151A] border border-white/10 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[300] overflow-hidden">
      {!inputQuery || inputQuery.length < 2 ? (
        // Popular searches
        <div className="p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8A8E99] mb-3">Popular Searches</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => {
                  handleQueryChange(term);
                }}
                className="flex items-center gap-1.5 bg-[#0D0F13] border border-white/10 px-3 py-1.5 rounded-sm text-[11px] font-bold text-[#8A8E99] hover:border-[#C9922A]/40 hover:text-[#C9922A] transition-all"
              >
                <svg className="w-3 h-3 text-[#C9922A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : searchLoading ? (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="w-4 h-4 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">Searching...</span>
        </div>
      ) : totalResults === 0 ? (
        <div className="py-8 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-[#8A8E99] text-xs font-bold uppercase tracking-widest">No results for "{inputQuery}"</p>
          <Link
            href={`/search?q=${encodeURIComponent(inputQuery)}`}
            className="mt-3 inline-block text-[11px] text-[#C9922A] font-bold uppercase tracking-widest hover:brightness-125"
            onClick={() => { setInlineMode(false); setHoverMode(false); }}
          >
            Search all listings →
          </Link>
        </div>
      ) : (
        <>
          {searchResults.listings.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-[#0D0F13] border-b border-white/5">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8A8E99]">
                  Listings ({searchResults.listings.length})
                </span>
              </div>
              {searchResults.listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                  onClick={() => { setInlineMode(false); setHoverMode(false); clearSearch(); }}
                >
                  <div className="w-10 h-10 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                    {listing.images?.length > 0 ? (
                      <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm">🔫</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#F0EDE8] truncate">{listing.title}</p>
                    <p className="text-[10px] text-[#8A8E99] uppercase tracking-wider">
                      {formatCategory(listing.category_id)} · {listing.city || 'N/A'}
                    </p>
                  </div>
                  <span className="text-sm font-black text-[#C9922A] flex-shrink-0">
                    R {listing.price?.toLocaleString('en-ZA')}
                    {listing.is_negotiable && <span className="text-[9px] text-[#8A8E99] ml-1">ONO</span>}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {searchResults.dealers.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-[#0D0F13] border-b border-white/5 border-t border-t-white/5">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8A8E99]">
                  Dealers ({searchResults.dealers.length})
                </span>
              </div>
              {searchResults.dealers.map((d) => (
                <Link
                  key={d.id}
                  href={`/dealers/${d.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                  onClick={() => { setInlineMode(false); setHoverMode(false); clearSearch(); }}
                >
                  <div className="w-10 h-10 bg-[#C9922A] rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                    {d.logo_url ? (
                      <img src={d.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-black font-black text-sm">{d.business_name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#F0EDE8] truncate">{d.business_name}</p>
                    <p className="text-[10px] text-[#8A8E99] uppercase tracking-wider">{d.city}, {d.province}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-2 py-0.5 rounded-sm flex-shrink-0">
                    {d.subscription_tier}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="px-4 py-3 bg-[#0D0F13] border-t border-white/5">
            <Link
              href={`/search?q=${encodeURIComponent(inputQuery)}`}
              className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125 transition-all"
              onClick={() => { setInlineMode(false); setHoverMode(false); }}
            >
              View all {totalResults} results for "{inputQuery}" →
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <nav className="w-full bg-[#0D0F13] border-b border-white/5 z-[100] relative">
        <div className="max-w-[1400px] mx-auto px-6 h-[80px] flex items-center justify-between gap-4">

          {/* LOGO */}
          <Link href="/" className="flex flex-col items-start group flex-shrink-0">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase group-hover:text-[#C9922A] transition-colors">
              GUN <span className="text-[#C9922A] group-hover:text-[#F0EDE8]">X</span>
            </span>
            <span className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">Classifieds</span>
          </Link>

          {/* NAVIGATION LINKS */}
          <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
            <div className="relative group h-[80px] flex items-center">
              <Link
                href="/browse"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="flex items-center gap-2 text-[#8A8E99] font-bold uppercase tracking-widest text-[13px] group-hover:text-[#C9922A] transition-colors"
              >
                Browse <span className="text-[10px] opacity-40 group-hover:rotate-180 transition-transform duration-300">▼</span>
              </Link>
              <div className="absolute top-[80px] left-[-20px] w-[950px] bg-[#191C23] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[110] p-10 grid grid-cols-5 gap-8">
                <div className="flex flex-col gap-3">
                  <h3 className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.3em] mb-2 border-b border-white/5 pb-2">Firearms</h3>
                  <Link href="/browse/pistols" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Pistols</Link>
                  <Link href="/browse/rifles" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Rifles</Link>
                  <Link href="/browse/shotguns" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Shotguns</Link>
                  <Link href="/browse/revolvers" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Revolvers</Link>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href="/browse/knives" className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.3em] mb-2 border-b border-white/5 pb-2 hover:brightness-125 transition-all">Knives</Link>
                  <Link href="/browse/knives?type=folding" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Folding Knives</Link>
                  <Link href="/browse/knives?type=fixed" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Fixed Blades</Link>
                  <Link href="/browse/knives?type=tactical" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Tactical Gear</Link>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.3em] mb-2 border-b border-white/5 pb-2">Air Guns</h3>
                  <Link href="/browse/air-guns" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Air Rifles</Link>
                  <Link href="/browse/airsoft" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Airsoft</Link>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.3em] mb-2 border-b border-white/5 pb-2">Accessories</h3>
                  <Link href="/browse/holsters" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Holsters & Carry</Link>
                  <Link href="/browse/magazines" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Magazines</Link>
                  <Link href="/browse/ammunition" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Ammunition</Link>
                  <Link href="/browse/reloading" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Reloading</Link>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.3em] mb-2 border-b border-white/5 pb-2">Other</h3>
                  <Link href="/services" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Services</Link>
                  <Link href="/clubs" className="text-[13px] text-[#8A8E99] hover:text-white transition-colors">Clubs & Ranges</Link>
                </div>
                <div className="col-span-5 mt-4 pt-6 border-t border-white/5 text-center">
                  <Link href="/browse" className="text-[11px] text-[#C9922A] font-bold uppercase tracking-[0.3em] hover:brightness-150 transition-all">
                    View Full Category Directory <span className="ml-2">→</span>
                  </Link>
                </div>
              </div>
            </div>
            <Link href="/dealers" className="text-[#8A8E99] font-bold uppercase tracking-widest text-[13px] hover:text-[#C9922A] transition-colors">Dealers</Link>
            <Link href="/wanted" className="text-[#8A8E99] font-bold uppercase tracking-widest text-[13px] hover:text-[#C9922A] transition-colors">Wanted</Link>
            <Link href="/clubs" className="text-[#8A8E99] font-bold uppercase tracking-widest text-[13px] hover:text-[#C9922A] transition-colors">Clubs & Ranges</Link>
            <Link href="/services" className="text-[#8A8E99] font-bold uppercase tracking-widest text-[13px] hover:text-[#C9922A] transition-colors">Services</Link>
            <Link href="/firearm-ownership" className="text-[#8A8E99] font-bold uppercase tracking-widest text-[13px] hover:text-[#C9922A] transition-colors">Firearm Ownership</Link>
          </div>

          {/* RIGHT — Search Icon + Auth */}
          <div className="flex items-center gap-4 flex-shrink-0">

            {/* SEARCH — Icon + Inline Expand */}
            <div ref={searchIconRef} className="relative flex items-center">

              {/* MODE A — Inline expand on click */}
              {inlineMode ? (
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-center gap-2 bg-[#13151A] border border-[#C9922A]/50 rounded-sm px-3 py-1.5 w-[280px] transition-all">
                    <svg className="w-3.5 h-3.5 text-[#C9922A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      ref={inlineInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search..."
                      className="bg-transparent text-[12px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none w-full"
                    />
                    <button
                      type="button"
                      onClick={() => { setInlineMode(false); clearSearch(); }}
                      className="text-[#8A8E99] hover:text-white transition-colors flex-shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Inline dropdown */}
                  <div className="absolute top-full mt-2 right-0 w-[420px]">
                    <ResultsDropdown inputQuery={searchQuery} />
                  </div>
                </form>
              ) : (
                /* Gold search icon */
                <button
                  onClick={handleIconClick}
                  onMouseEnter={handleIconMouseEnter}
                  onMouseLeave={handleIconMouseLeave}
                  className="flex items-center justify-center w-8 h-8 group"
                  title="Search"
                >
                  <svg
                    className="w-4 h-4 text-[#C9922A] group-hover:scale-110 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* + Post Ad */}
            <Link
              href="/sell"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="bg-[#C9922A] text-black px-6 py-3 rounded-[2px] font-black uppercase tracking-widest text-[14px] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,146,42,0.2)] flex-shrink-0"
            >
              + Post Ad
            </Link>

            {/* AUTH STATE */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-black text-sm flex-shrink-0">
                    {getInitial()}
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-[11px] font-black text-[#F0EDE8] uppercase tracking-widest leading-none">
                      {getDisplayName()}
                    </span>
                    {dealer && (
                      <span className="text-[9px] text-[#C9922A] font-bold uppercase tracking-widest">
                        {dealer.subscription_tier} dealer
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] text-[#8A8E99] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-[220px] bg-[#191C23] border border-white/10 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[200] overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-[11px] font-black uppercase tracking-widest text-[#F0EDE8] truncate">{getDisplayName()}</p>
                      <p className="text-[10px] text-[#8A8E99] truncate">{user.email}</p>
                    </div>
                    {dealer ? (
                      <>
                        <Link href="/dealer-dashboard" className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>📊</span> Dashboard</Link>
                        <Link href="/dealer-dashboard/inventory" className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>📦</span> Inventory</Link>
                        <Link href="/dealer-dashboard/add-listing" className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>➕</span> Add Listing</Link>
                        <Link href={`/dealers/${dealer.slug}`} className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>🏪</span> My Storefront</Link>
                        <Link href="/dealer-dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>⚙️</span> Profile</Link>
                      </>
                    ) : (
                      <>
                        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>📊</span> My Dashboard</Link>
                        <Link href="/dashboard/listings" className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>📋</span> My Listings</Link>
                        <Link href="/dashboard/wishlist" className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>❤️</span> Wishlist</Link>
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all"><span>⚙️</span> Settings</Link>
                      </>
                    )}
                    <div className="border-t border-white/5">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all">
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-[#8A8E99] font-bold uppercase tracking-widest text-[12px] hover:text-white transition-colors flex-shrink-0">Sign In</Link>
                <Link href="/signup" className="text-[#8A8E99] border border-white/10 px-4 py-2 rounded-[2px] font-bold uppercase tracking-widest text-[11px] hover:bg-white/5 transition-all flex-shrink-0">Register</Link>
                <Link href="/dealer/login" className="flex items-center gap-2 text-[#C9922A] font-bold uppercase tracking-widest text-[12px] hover:brightness-110 transition-all flex-shrink-0">
                  <span className="text-[16px]">🏪</span>Dealer Login
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* MODE B — Hover dropdown bar below navbar */}
      {hoverMode && !inlineMode && (
        <div
          ref={hoverBarRef}
          onMouseEnter={handleHoverBarMouseEnter}
          onMouseLeave={handleHoverBarMouseLeave}
          className="fixed top-[80px] left-0 right-0 z-[99] bg-[#0D0F13] border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-all"
        >
          <div className="max-w-[1400px] mx-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center gap-3 bg-[#13151A] border border-white/10 focus-within:border-[#C9922A]/50 rounded-sm px-4 py-3 transition-all">
                <svg className="w-4 h-4 text-[#C9922A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={hoverInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search listings, dealers, makes, calibres..."
                  className="flex-1 bg-transparent text-sm text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={clearSearch} className="text-[#8A8E99] hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="bg-[#C9922A] text-black px-6 py-2 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all flex-shrink-0"
                >
                  Search
                </button>
              </div>

              {/* Hover bar results dropdown */}
              <ResultsDropdown inputQuery={searchQuery} />
            </form>
          </div>
        </div>
      )}
    </>
  );
}