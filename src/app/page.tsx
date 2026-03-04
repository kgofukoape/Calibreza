import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

const DEMO_LISTINGS = [
  { id:'1', title:'CZ P-10 C 9mm Luger', make:'CZ', price:12500, province:'Gauteng', condition:'Brand New', category:'pistols', listingType:'dealer' as const, sellerName:'Gunstore Centurion', featured:true, calibre:'9mm Luger' },
  { id:'2', title:'Tikka T3x Lite .308 Win', make:'Tikka', price:18000, province:'Western Cape', condition:'Good', category:'rifles', listingType:'private' as const, sellerName:'Stellenbosch', calibre:'.308 Win' },
  { id:'3', title:'Beretta A400 Xcel Sporting 12ga', make:'Beretta', price:34900, province:'KZN', condition:'Brand New', category:'shotguns', listingType:'dealer' as const, sellerName:'Firearm World DBN', calibre:'12 Gauge' },
  { id:'4', title:'Vortex Viper PST Gen II 5-25x50', make:'Vortex', price:14000, province:'Gauteng', condition:'Like New', category:'accessories', listingType:'private' as const, sellerName:'Pretoria East', calibre:'34mm Tube' },
];

// Safe Icon Renderers to prevent Vercel Compiler errors
const getCategoryIcon = (slug: string) => {
  const baseClasses = "w-7 h-7 text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors";
  switch (slug) {
    case 'pistols': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case 'rifles': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="12" cy="12" r="8"/><path d="M12 2v20M2 12h20"/></svg>;
    case 'shotguns': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="7.5" cy="12" r="4.5"/><circle cx="16.5" cy="12" r="4.5"/><path d="M7.5 7.5h9M7.5 16.5h9M12 7.5v9"/></svg>;
    case 'revolvers': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><circle cx="6.8" cy="9" r="2.5"/><circle cx="17.2" cy="9" r="2.5"/><circle cx="6.8" cy="15" r="2.5"/><circle cx="17.2" cy="15" r="2.5"/><circle cx="12" cy="12" r="1"/></svg>;
    case 'air-guns': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>;
    case 'airsoft': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
    case 'accessories': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M8 10h8"/><path d="M8 14h8"/></svg>;
    case 'ammunition': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M8.5 9V5a3.5 3.5 0 0 1 7 0v4"/><rect x="8.5" y="9" width="7" height="12" rx="1"/><line x1="8.5" y1="18" x2="15.5" y2="18"/></svg>;
    case 'reloading': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
    case 'knives': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M3 21h5l13-13a1.5 1.5 0 0 0-2-2L6 19v2z"/><line x1="8" y1="16" x2="11" y2="19"/></svg>;
    case 'services': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
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
  { slug:'accessories', label:'Accessories', count:'2,100' },
  { slug:'ammunition', label:'Ammunition', count:'850' },
  { slug:'reloading', label:'Reloading', count:'1,120' },
  { slug:'knives', label:'Knives & Blades', count:'670' },
  { slug:'services', label:'Services', count:'140' },
  { slug:'wanted', label:'Wanted', count:'85' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <section className="min-h-[90vh] flex flex-col justify-center px-6 py-16 md:px-8 md:py-20 relative overflow-hidden">
        <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(201,146,42,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(201,146,42,0.04) 0%, transparent 60%)'}} />
        <div style={{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'60px 60px'}} />

        <div className="max-w-[1280px] mx-auto w-full relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A] text-[10px] md:text-[11px] font-semibold tracking-[0.2em] uppercase px-3 py-1.5 md:px-4 md:py-2 rounded-sm mb-6 md:mb-7">
            <span className="w-1.5 h-1.5 bg-[#C9922A] rounded-full" />
            South Africa&apos;s Freshest Firearms Classifieds
          </div>

          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-5xl md:text-7xl lg:text-[100px] leading-[1.1] md:leading-[0.93] tracking-tight uppercase mb-6 text-[#F0EDE8]">
            Buy &amp; Sell<br/>
            <span className="text-[#C9922A]">Legally.</span>{' '}
            Confidently.
          </h1>

          <p className="text-base md:text-[17px] text-[#8A8E99] leading-relaxed max-w-[520px] mb-8 md:mb-10 font-light">
            The cleanest classified portal for licensed firearms in South Africa.
            Connect directly with verified dealers and private sellers — no middlemen, no direct sales.
          </p>

          <div className="flex flex-col md:flex-row w-full max-w-[780px] bg-[#191C23] border border-[#C9922A]/15 rounded-md overflow-hidden mb-10">
            <select style={{fontFamily:"'Barlow', sans-serif"}} className="bg-[#1F2330] border-none md:border-r border-b md:border-b-0 border-white/10 text-[#F0EDE8] text-[13px] font-medium px-5 py-4 md:py-0 md:min-w-[160px] cursor-pointer outline-none appearance-none">
              <option>All Categories</option>
              {CATEGORIES.map(cat => <option key={cat.slug}>{cat.label}</option>)}
            </select>
            <input
              type="text"
              placeholder="Search by make, model, calibre..."
              style={{fontFamily:"'Barlow', sans-serif"}}
              className="flex-1 bg-transparent border-none outline-none text-[#F0EDE8] text-[15px] px-5 py-4"
            />
            <button style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="bg-[#C9922A] border-none text-black font-bold text-[14px] tracking-[0.1em] uppercase px-7 py-4 md:py-0 cursor-pointer">
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-20 bg-[#191C23] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="block text-[11px] text-[#C9922A] font-semibold tracking-[0.2em] uppercase mb-1">Browse by type</span>
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-3xl md:text-[32px] uppercase tracking-wide text-[#F0EDE8]">Categories</h2>
            </div>
            <div className="text-[#C9922A] text-xs md:text-[13px] font-medium tracking-wide uppercase">Select Below</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/${cat.slug}`} className="bg-[#111318] border border-white/5 rounded-md p-4 md:p-5 flex flex-col gap-3 hover:bg-[#1F2330] hover:-translate-y-1 transition-all duration-200 group">
                <div className="mb-1">{getCategoryIcon(cat.slug)}</div>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-semibold text-sm md:text-[15px] tracking-wide text-[#F0EDE8] uppercase group-hover:text-white transition-colors">{cat.label}</span>
                <span className="text-[11px] md:text-[12px] text-[#8A8E99] group-hover:text-[#C9922A] transition-colors">{cat.count} listings</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-20 bg-[#191C23] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="block text-[11px] text-[#C9922A] font-semibold tracking-[0.2em] uppercase mb-1">Just posted</span>
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-3xl md:text-[32px] uppercase tracking-wide text-[#F0EDE8]">Recent Listings</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {DEMO_LISTINGS.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
