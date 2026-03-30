import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
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
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return data || [];
}

async function getFilterOptions() {
  const { data: brandsData } = await supabase
    .from('listings')
    .select('makes:make_id(name)')
    .eq('category_id', 'pistols')
    .eq('status', 'active');

  const brandNames = brandsData?.map((item: any) => item.makes?.name).filter(Boolean) || [];
  const brands = Array.from(new Set(brandNames)).sort();

  const { data: calibresData } = await supabase
    .from('calibres')
    .select('name')
    .eq('category', 'pistol')
    .order('name');

  const calibres = calibresData?.map((item: any) => item.name) || [];

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
        
        <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
              <Link href="/pistols" className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">
                Clear All
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2">
                {brands.slice(0, 10).map(brand => (
                  <div key={brand} className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10" />
                    <span className="text-[14px] text-[#F0EDE8]">{brand}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Calibre</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2">
                {calibres.slice(0, 10).map(calibre => (
                  <div key={calibre} className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10" />
                    <span className="text-[14px] text-[#F0EDE8]">{calibre}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Location</span>
              <div className="flex flex-col gap-2.5">
                {provinces.map(prov => (
                  <div key={prov} className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10" />
                    <span className="text-[14px] text-[#F0EDE8]">{prov}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Condition</span>
              <div className="flex flex-col gap-2.5">
                {['Brand New', 'Like New', 'Good', 'Fair'].map(cond => (
                  <div key={cond} className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10" />
                    <span className="text-[14px] text-[#F0EDE8]">{cond}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Price Range</span>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min (R)" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8]" />
                <span className="text-[#8A8E99]">-</span>
                <input type="number" placeholder="Max (R)" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8]" />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">
              Showing <strong className="text-[#F0EDE8]">{transformedListings.length}</strong> results for Pistols
            </span>
            
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Sort by:</span>
              <select className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] px-4 py-2 rounded-sm">
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
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
              <p className="text-[#8A8E99] text-[15px]">No pistols available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
