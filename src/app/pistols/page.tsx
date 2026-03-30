import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import FilterSidebar from '@/components/filters/FilterSidebar';
import { supabase } from '@/lib/supabase';

async function getFilteredListings(searchParams: any) {
  let query = supabase
    .from('listings')
    .select(`
      *,
      makes:make_id(name),
      calibres:calibre_id(name),
      provinces:province_id(name),
      conditions:condition_id(name),
      users:seller_id(full_name, user_type)
    `)
    .eq('category_id', 'pistols')
    .eq('status', 'active');

  // Apply filters
  if (searchParams.brands) {
    const brands = searchParams.brands.split(',');
    query = query.in('makes.name', brands);
  }

  if (searchParams.calibres) {
    const calibres = searchParams.calibres.split(',');
    query = query.in('calibres.name', calibres);
  }

  if (searchParams.provinces) {
    const provinces = searchParams.provinces.split(',');
    query = query.in('provinces.name', provinces);
  }

  if (searchParams.conditions) {
    const conditions = searchParams.conditions.split(',');
    query = query.in('conditions.name', conditions);
  }

  if (searchParams.minPrice) {
    query = query.gte('price', parseFloat(searchParams.minPrice));
  }

  if (searchParams.maxPrice) {
    query = query.lte('price', parseFloat(searchParams.maxPrice));
  }

  if (searchParams.sellerTypes) {
    const types = searchParams.sellerTypes.split(',');
    query = query.in('listing_type', types);
  }

  // Sorting
  const sortBy = searchParams.sort || 'newest';
  switch (sortBy) {
    case 'price_low':
      query = query.order('price', { ascending: true });
      break;
    case 'price_high':
      query = query.order('price', { ascending: false });
      break;
    case 'condition':
      query = query.order('condition_id', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return data || [];
}

async function getFilterOptions() {
  // Get unique brands for pistols
  const { data: brandsData } = await supabase
    .from('listings')
    .select('makes:make_id(name)')
    .eq('category_id', 'pistols')
    .eq('status', 'active');

  const brands = [...new Set(brandsData?.map((item: any) => item.makes?.name).filter(Boolean))].sort();

  // Get unique calibres for pistols
  const { data: calibresData } = await supabase
    .from('calibres')
    .select('name')
    .eq('category', 'pistol')
    .order('name');

  const calibres = calibresData?.map((item: any) => item.name) || [];

  // Get provinces
  const { data: provincesData } = await supabase
    .from('provinces')
    .select('name')
    .order('name');

  const provinces = provincesData?.map((item: any) => item.name) || [];

  return { brands, calibres, provinces };
}

export default async function PistolsPage({ searchParams }: { searchParams: any }) {
  const listings = await getFilteredListings(searchParams);
  const { brands, calibres, provinces } = await getFilterOptions();

  // Transform listings for ListingCard
  const transformedListings = listings.map((listing: any) => ({
    id: listing.id,
    title: listing.title,
    make: listing.makes?.name || '',
    price: listing.price,
    province: listing.provinces?.name || listing.city,
    condition: listing.conditions?.name || '',
    category: listing.category_id,
    listingType: listing.listing_type,
    sellerName: listing.users?.full_name || listing.city,
    calibre: listing.calibres?.name || '',
    featured: listing.is_featured,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Pistols</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Pistols</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTERS */}
        <FilterSidebar brands={brands} calibres={calibres} provinces={provinces} />

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">
              Showing <strong className="text-[#F0EDE8]">{transformedListings.length}</strong> results for Pistols
            </span>
            
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Sort by:</span>
              <select
                style={{fontFamily:"'Barlow', sans-serif"}}
                className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] font-medium px-4 py-2 rounded-sm cursor-pointer outline-none focus:border-[#C9922A] appearance-none min-w-[140px]"
                onChange={(e) => {
                  const params = new URLSearchParams(window.location.search);
                  params.set('sort', e.target.value);
                  window.location.search = params.toString();
                }}
                defaultValue={searchParams.sort || 'newest'}
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="condition">Condition: Best</option>
              </select>
            </div>
          </div>

          {transformedListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {transformedListings.map((listing: any) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          ) : (
            <div className="bg-[#191C23] border border-white/5 rounded-md p-12 text-center">
              <p className="text-[#8A8E99] text-[15px] mb-4">No listings match your filters</p>
              <Link href="/pistols" className="text-[#C9922A] text-[13px] uppercase tracking-wider font-bold hover:underline">
                Clear all filters
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
