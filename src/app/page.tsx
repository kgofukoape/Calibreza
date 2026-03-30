import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';
import { supabase } from '@/lib/supabase';

// Fetch listings from Supabase
async function getFeaturedListings() {
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
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return data || [];
}

const getCategoryIcon = (slug: string) => {
  const baseClasses = "w-7 h-7 text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors";
  switch (slug) {
    case 'pistols': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case 'rifles': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="12" cy="12" r="8"/><path d="M12 2v20M2 12h20"/></svg>;
    case 'shotguns': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="7.5" cy="12" r="4.5"/><circle cx="16.5" cy="12" r="4.5"/><path d="M7.5 7.5h9M7.5 16.5h9M12 7.5v9"/></svg>;
    case 'revolvers': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><circle cx="6.8" cy="9" r="2.5"/><circle cx="17.2" cy="9" r="2.5"/><circle cx="6.8" cy="15" r="2.5"/><circle cx="17.2" cy="15" r="2.5"/><circle cx="12" cy="12" r="1"/></svg>;
    case 'air-guns': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>;
    case 'airsoft': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
    case 'holsters': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>;
    case 'magazines': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M12 6v.01"/><path d="M12 10v.01"/><path d="M12 14v.01"/><path d="M12 18v.01"/></svg>;
    case 'accessories': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>;
    case 'ammunition': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M8.5 9V5a3.5 3.5 0 0 1 7 0v4"/><rect x="8.5" y="9" width="7" height="12" rx="1"/><line x1="8.5" y1="18" x2="15.5" y2="18"/></svg>;
    case 'reloading': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
    case 'knives': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M3 21h5l13-13a1.5 1.5 0 0 0-2-2L6 19v2z"/><line x1="8" y1="16" x2="11" y2="19"/></svg>;
    case 'services': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'sport-shooting': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>;
    case 'wanted': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M11 8v2"/><path d="M11 14h.01"/></svg>;
    default: return null;
  }
};

const CATEGORIES = [
  { slug:'pistols', label:'Pistols', count:'1,240' },
  { slug:'rifles', label:'Rifles', count:'1,820' },
  { slug:'shotguns', label:'Shotguns', count:'540' },
  { slug:'revolvers', label:'Revolvers', count:'310' },
  { slug:'air-guns', label:'Air Guns', count:'420' },
  { slug:'airsoft', label:'Airsoft Guns', count:'280' },
  { slug:'holsters', label:'Holsters & Carry', count:'950' },
  { slug:'magazines', label:'Mags & Loaders', count:'1,420' },
  { slug:'accessories', label:'Accessories', count:'2,680' },
  { slug:'ammunition', label:'Ammunition', count:'850' },
  { slug:'reloading', label:'Reloading', count:'1,120' },
  { slug:'knives', label:'Knives & Blades', count:'670' },
  { slug:'services', label:'Services', count:'140' },
  { slug:'sport-shooting', label:'Clubs & Ranges', count:'215' },
  { slug:'wanted', label:'Wanted', count:'85' },
];

export default async function HomePage() {
  const listings = await getFeaturedListings();

  // Transform Supabase data to match ListingCard props
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

      <div className="bg-[#1F2330] border-b border-white/5 py-3 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto flex items-center justify-center gap-4 md:gap-12 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[#8A8E99] font-medium">
            <span className="w-5 h-5 md:w-6 md:h-6 bg-[#C9922A]/10 text-[#C9922A] rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></span>
            Verified Sellers
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[#8A8E99] font-medium">
            <span className="w-5 h-5 md:w-6 md:h-6 bg-[#C9922A]/10 text-[#C9922A] rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg></span>
            FCA Compliant
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[#8A8E99] font-medium">
            <span className="w-5 h-5 md:w-6 md:h-6 bg-[#C9922A]/10 text-[#C9922A] rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></span>
            Instant Alerts
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[#8A8E99] font-medium">
            <span className="w-5 h-5 md:w-6 md:h-6 bg-[#C9922A]/10 text-[#C9922A] rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
            Local Search
          </div>
          <div className="flex items-center gap-2 text-[11px] md:text-xs text-[#8A8E99] font-medium">
            <span className="w-5 h-5 md:w-6 md:h-6 bg-[#C9922A]/10 text-[#C9922A] rounded-full flex items-center justify-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 md:w-4 md:h-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
            Dealer Directory
          </div>
        </div>
      </div>

      <section className="min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-8 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C9922A]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-[1280px] mx-auto relative z-10 text-center">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase leading-[0.9] mb-6 md:mb-8 text-[#F0EDE8]">
            South Africa&apos;s<br/><span className="text-[#C9922A]">Premier</span> Firearms<br/>Classifieds
          </h1>
          <p className="text-[15px] md:text-[17px] text-[#8A8E99] max-w-[600px] mx-auto leading-relaxed mb-10 md:mb-12">
            The cleanest, most trusted platform for buying and selling licensed firearms. Connect with verified dealers and private sellers across all nine provinces.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-5">
            <Link href="/listings" style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="bg-[#C9922A] text-black font-bold text-[14px] md:text-[15px] tracking-[0.12em] uppercase px-10 md:px-12 py-4 md:py-5 rounded-[3px] hover:brightness-110 transition-all shadow-[0_0_30px_rgba(201,146,42,0.4)] w-full sm:w-auto">
              Browse Listings
            </Link>
            <Link href="/sell" style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="bg-transparent border border-[#C9922A]/40 text-[#C9922A] font-bold text-[14px] md:text-[15px] tracking-[0.12em] uppercase px-10 md:px-12 py-4 md:py-5 rounded-[3px] hover:bg-[#C9922A]/5 transition-all w-full sm:w-auto">
              Post Free Listing
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-20 bg-[#191C23] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 md:mb-12 text-center">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase mb-4 text-[#F0EDE8]">
              Browse by <span className="text-[#C9922A]">Category</span>
            </h2>
            <p className="text-[14px] md:text-[15px] text-[#8A8E99]">Explore thousands of listings across all firearm categories</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {CATEGORIES.map(({slug, label, count}) => {
              const icon = getCategoryIcon(slug);
              return (
                <Link key={slug} href={`/${slug}`} className="group bg-[#111318] border border-white/5 rounded-md p-5 md:p-6 flex flex-col items-center text-center hover:border-[#C9922A]/30 hover:bg-[#C9922A]/5 transition-all">
                  <div className="w-12 h-12 md:w-14 md:h-14 mb-4 md:mb-5">{icon}</div>
                  <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[15px] md:text-[16px] uppercase tracking-wider mb-2 text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{label}</div>
                  <div className="text-[12px] md:text-[13px] text-[#8A8E99]">{count} listings</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {transformedListings.length > 0 && (
        <section className="px-6 py-16 md:px-8 md:py-20 bg-[#0D0F13] border-t border-white/5">
          <div className="max-w-[1280px] mx-auto">
            <div className="mb-10 md:mb-12">
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-2">
                Featured <span className="text-[#C9922A]">Listings</span>
              </h2>
              <p className="text-[14px] md:text-[15px] text-[#8A8E99]">Handpicked firearms from verified sellers</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {transformedListings.map((listing: any) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-16 md:px-8 md:py-20 bg-[#191C23] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10 md:mb-12 text-center">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-4">
              Why Choose <span className="text-[#C9922A]">Gun X</span>?
            </h2>
            <p className="text-[14px] md:text-[15px] text-[#8A8E99]">The most trusted firearms marketplace in South Africa</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>, title:'Verified Sellers', desc:'Every dealer and private seller goes through identity verification. Buy and sell with confidence on a platform built for trust.'},
              {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title:'Provincial Search', desc:'Find firearms close to home. Filter by province and city to connect with sellers in your area for easy face-to-face transactions.'},
              {icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>, title:'FCA Compliant', desc:'Built with South African firearms law in mind. All listings comply with the Firearms Control Act to keep the community safe and legal.'},
            ].map(({icon, title, desc}) => (
              <div key={title} className="bg-[#111318] border border-white/5 rounded-md p-6 md:p-8 hover:border-[#C9922A]/20 transition-all">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#C9922A]/10 border border-[#C9922A]/15 rounded-md flex items-center justify-center mb-5 md:mb-6">{icon}</div>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl md:text-[22px] tracking-wide uppercase mb-3 text-[#F0EDE8]">{title}</div>
                <p className="text-[13px] md:text-[14px] text-[#8A8E99] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-20 bg-[#191C23] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="bg-gradient-to-br from-[#C9922A]/10 to-[#C9922A]/5 border border-[#C9922A]/15 rounded-md p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12">
            <div>
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-3xl md:text-[40px] uppercase leading-tight mb-3 text-[#F0EDE8]">
                Grow Your <span className="text-[#C9922A]">Dealership</span><br className="hidden md:block"/> Online.
              </h2>
              <p className="text-[14px] md:text-[15px] text-[#8A8E99] max-w-[480px] leading-relaxed mb-6">
                List your full inventory on Gun X and reach thousands of active buyers across South Africa every month.
              </p>
              <div className="flex flex-col gap-3">
                {['Dedicated dealer storefront with your branding','Unlimited listings with bulk upload tools','Priority search placement and featured badges','Lead analytics and enquiry tracking dashboard'].map(f => (
                  <div key={f} className="flex items-center gap-3 text-[13px] md:text-[14px] text-[#F0EDE8]">
                    <span className="w-3.5 h-3.5 md:w-4 md:h-4 bg-[#2A9C6E]/10 border border-[#2A9C6E]/40 rounded-full flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
              <Link href="/dealers/apply" style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="bg-[#C9922A] text-black font-bold text-[14px] tracking-[0.1em] uppercase px-7 py-4 rounded-[3px] text-center w-full md:min-w-[220px]">
                Apply for Dealer Account
              </Link>
              <Link href="/pricing" style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="bg-transparent border border-[#C9922A]/40 text-[#C9922A] font-bold text-[14px] tracking-[0.1em] uppercase px-7 py-4 rounded-[3px] text-center w-full md:min-w-[220px]">
                View Pricing Plans
              </Link>
              <p className="text-[11px] md:text-[12px] text-[#8A8E99] text-center leading-relaxed mt-2">Free 30-day trial for licensed dealers.<br className="hidden md:block"/>Cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>

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
              <div className="mt-6 inline-flex items-center gap-2 bg-[#C9922A]/5 border border-[#C9922A]/15 px-3 py-2 rounded-[3px] text-[11px] text-[#8A8E99]">
                <span className="text-[#C9922A] font-semibold">FCA</span> Compliant · POPI Act Registered
              </div>
            </div>
            {[
              ['Browse', ['Pistols','Rifles','Shotguns','Revolvers','Air Guns','Airsoft Guns','Holsters','Magazines','Accessories','Ammunition', 'Reloading', 'Sport Shooting']],
              ['Platform', ['How it Works','Dealer Directory','Post a Listing','Dealer Plans','Price Guide']],
              ['Company', ['About Us','Contact','FAQs','Blog','Report a Listing']],
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
              {['Terms of Use','Privacy Policy','POPI Act','Legal Disclaimer'].map((l, i) => (
                <Link key={i} href="#" className="hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
