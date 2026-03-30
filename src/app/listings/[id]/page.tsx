import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

// Fetch single listing from Supabase
async function getListing(id: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      makes:make_id(name, country),
      calibres:calibre_id(name),
      provinces:province_id(name),
      conditions:condition_id(name),
      users:seller_id(full_name, user_type, is_verified, avg_response_hours, total_listings, successful_sales, member_since)
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// Fetch similar listings
async function getSimilarListings(categoryId: string, currentId: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      makes:make_id(name),
      calibres:calibre_id(name),
      provinces:province_id(name),
      conditions:condition_id(name),
      users:seller_id(full_name, user_type)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .neq('id', currentId)
    .limit(4);

  if (error) {
    return [];
  }

  return data || [];
}

export default async function ListingDetailsPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);

  if (!listing) {
    notFound();
  }

  const similarListings = await getSimilarListings(listing.category_id, listing.id);

  // Transform similar listings for ListingCard component
  const transformedSimilarListings = similarListings.map((item: any) => ({
    id: item.id,
    title: item.title,
    make: item.makes?.name || '',
    price: item.price,
    province: item.provinces?.name || item.city,
    condition: item.conditions?.name || '',
    category: item.category_id,
    listingType: item.listing_type,
    sellerName: item.users?.full_name || item.city,
    calibre: item.calibres?.name || '',
    featured: item.is_featured,
  }));

  // Format price
  const formattedPrice = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(listing.price);

  // Calculate days since listing
  const daysSince = Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const daysText = daysSince === 0 ? 'today' : daysSince === 1 ? '1 day ago' : `${daysSince} days ago`;

  // Parse included items
  const includedItems = Array.isArray(listing.included_items) ? listing.included_items : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="bg-[#191C23] border-b border-white/5 py-4 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto text-[11px] text-[#8A8E99] tracking-widest uppercase flex items-center gap-2">
          <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
          <span>/</span> 
          <Link href={`/${listing.category_id}`} className="hover:text-[#C9922A] transition-colors">
            {listing.category_id.charAt(0).toUpperCase() + listing.category_id.slice(1)}
          </Link>
          <span>/</span>
          <span className="text-[#F0EDE8]">{listing.title}</span>
        </div>
      </div>

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-10">
        
        {/* LEFT COLUMN: Images & Description */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* Main Image Gallery */}
          <div className="flex flex-col gap-3">
            {/* Big Main Image */}
            <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-gradient-to-br from-[#1F2330] to-[#111318] border border-white/5 rounded-md flex items-center justify-center relative overflow-hidden group cursor-pointer">
              <span className="text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">🔫</span>
              {listing.is_featured && (
                <div className="absolute top-4 left-4 bg-[#C9922A] text-black text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-sm shadow-md">
                  Featured
                </div>
              )}
              {/* Zoom indicator */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                🔍 Click to zoom
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((thumb) => (
                <button key={thumb} className="aspect-square bg-[#191C23] border border-white/10 rounded-sm hover:border-[#C9922A] transition-colors flex items-center justify-center overflow-hidden">
                  <span className="text-2xl opacity-20">📷</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-6">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl tracking-wide uppercase text-[#F0EDE8] border-b border-white/5 pb-4">
              Description
            </h2>
            <div className="text-[14px] md:text-[15px] text-[#8A8E99] leading-relaxed">
              {listing.description || 'No description provided.'}
            </div>
          </div>

          {/* What's Included */}
          {includedItems.length > 0 && (
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-6">
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl tracking-wide uppercase text-[#F0EDE8] border-b border-white/5 pb-4">
                What&apos;s Included
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {includedItems.map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 text-[14px] text-[#F0EDE8]">
                    <span className="w-5 h-5 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm flex items-center justify-center text-[#2A9C6E] text-[10px] flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety & Compliance Notice */}
          <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-md p-5 flex gap-4">
            <div className="w-8 h-8 bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-full flex items-center justify-center flex-shrink-0 text-[#C9922A]">
              ⚠️
            </div>
            <div className="flex flex-col gap-2">
              <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[16px] uppercase text-[#F0EDE8]">
                Legal Compliance
              </h3>
              <p className="text-[13px] text-[#8A8E99] leading-relaxed">
                This firearm can only be transferred to a licensed buyer in compliance with the Firearms Control Act (FCA 60 of 2000). Valid competency certificate and clean SAPS record required. All transfers must be processed through SAPS or a licensed dealer.
              </p>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Specs, Price, Seller Info */}
        <aside className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6">
          
          {/* Main Pricing Box */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-6 sticky top-24">
            <div className="flex flex-col gap-1">
              <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-3xl md:text-4xl uppercase text-[#F0EDE8] leading-tight">
                {listing.title}
              </h1>
              <p className="text-[13px] text-[#8A8E99] flex items-center gap-2">
                📍 {listing.city}, {listing.provinces?.name} • Listed {daysText}
              </p>
            </div>

            <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-[40px] md:text-[48px] text-[#C9922A] leading-none">
              {formattedPrice}
            </div>

            <button style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="w-full bg-[#C9922A] text-black font-bold text-[18px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,146,42,0.3)]">
              Contact Seller
            </button>

            <div className="flex items-center justify-center gap-4 text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] border-t border-white/5 pt-6">
              <button className="hover:text-[#C9922A] transition-colors flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                Save
              </button>
              <span>|</span>
              <button className="hover:text-[#C9922A] transition-colors flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Share
              </button>
              <span>|</span>
              <button className="hover:text-red-400 transition-colors flex items-center gap-2 text-red-500/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                Report
              </button>
            </div>
          </div>

          {/* Seller Profile Box */}
          {listing.users && (
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-5">
              <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3">
                Seller Information
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#111318] border border-white/10 rounded-full flex items-center justify-center text-[20px]">
                  {listing.listing_type === 'dealer' ? '🏪' : '👤'}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-[#F0EDE8]">{listing.users.full_name}</span>
                  <span className="text-[12px] text-[#8A8E99]">
                    {listing.listing_type === 'dealer' ? 'Dealer' : 'Private Seller'} • Member since {new Date(listing.users.member_since).getFullYear()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                {listing.users.is_verified && (
                  <div className="flex items-center gap-3 text-[13px] text-[#F0EDE8]">
                    <span className="w-5 h-5 rounded-full bg-[#2A9C6E]/10 flex items-center justify-center text-[10px] border border-[#2A9C6E]/30 text-[#2A9C6E]">✓</span>
                    Identity Verified
                  </div>
                )}
                <div className="flex items-center gap-3 text-[13px] text-[#F0EDE8]">
                  <span className="w-5 h-5 rounded-full bg-[#2A9C6E]/10 flex items-center justify-center text-[10px] border border-[#2A9C6E]/30 text-[#2A9C6E]">✓</span>
                  Responsive (avg. {listing.users.avg_response_hours} hours)
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-2">
                <div className="text-[12px] text-[#8A8E99] mb-2">Seller Stats</div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#8A8E99]">Active Listings</span>
                  <span className="text-[#F0EDE8] font-medium">{listing.users.total_listings}</span>
                </div>
                <div className="flex items-center justify-between text-[13px] mt-2">
                  <span className="text-[#8A8E99]">Successful Sales</span>
                  <span className="text-[#F0EDE8] font-medium">{listing.users.successful_sales}</span>
                </div>
              </div>
            </div>
          )}

          {/* Specification Grid */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-5">
            <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3">
              Specifications
            </h3>
            
            <div className="flex flex-col gap-0">
              {[
                ['Make', listing.makes?.name],
                ['Model', listing.model],
                ['Calibre', listing.calibres?.name],
                ['Condition', listing.conditions?.name],
                listing.action_type && ['Action Type', listing.action_type],
                listing.capacity && ['Capacity', listing.capacity],
                listing.barrel_length && ['Barrel Length', listing.barrel_length],
                listing.overall_length && ['Overall Length', listing.overall_length],
                ['Category', listing.category_id.charAt(0).toUpperCase() + listing.category_id.slice(1)],
                listing.licence_type && ['Licence Type', listing.licence_type],
              ].filter(Boolean).map((item, i, arr) => {
                const [label, val] = item as [string, string];
                return (
                  <div key={label} className={`flex justify-between py-3 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <span className="text-[13px] text-[#8A8E99]">{label}</span>
                    <span className="text-[13px] font-medium text-[#F0EDE8] text-right">{val}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </aside>
      </main>

      {/* Similar Listings Section */}
      {transformedSimilarListings.length > 0 && (
        <section className="bg-[#191C23] border-t border-white/5 px-6 md:px-8 py-12 md:py-16">
          <div className="max-w-[1280px] mx-auto">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-3xl md:text-4xl uppercase text-[#F0EDE8] mb-8">
              Similar <span className="text-[#C9922A]">Listings</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {transformedSimilarListings.map((listing: any) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-[#0D0F13] border-t border-white/5 pt-16 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-12">
            <div>
              <div className="mb-4">
                <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-[22px] tracking-[0.15em] text-[#F0EDE8] uppercase">
                  GUN<span className="text-[#C9922A]"> X</span>
                </span>
              </div>
              <p className="text-[13px] text-[#8A8E99] leading-relaxed max-w-[280px]">South Africa&apos;s cleanest classified portal for legal firearms. Connecting licensed dealers and private sellers with buyers across all nine provinces.</p>
            </div>
            {[
              ['Browse', ['Pistols','Rifles','Shotguns','Revolvers']],
              ['Platform', ['How it Works','Dealer Directory','Post a Listing']],
              ['Company', ['About Us','Contact','FAQs']],
            ].map(([heading, links], index) => (
              <div key={index}>
                <h4 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[13px] tracking-[0.15em] uppercase text-[#F0EDE8] mb-4 md:mb-5">{heading as string}</h4>
                <ul className="flex flex-col gap-2.5 md:gap-3">
                  {(links as string[]).map((link, linkIndex) => (
                    <li key={linkIndex}><Link href="#" className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{link as string}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 md:pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[11px] md:text-[12px] text-[#8A8E99]">
            <div>© 2026 Gun X — All rights reserved</div>
            <div className="flex flex-wrap gap-4 md:gap-6">
              {['Terms of Use','Privacy Policy','POPI Act'].map((l, i) => (
                <Link key={i} href="#" className="hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
