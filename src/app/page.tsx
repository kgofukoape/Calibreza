import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

const DEMO_LISTINGS = [
  { id:'1', title:'CZ P-10 C 9mm Luger', make:'CZ', price:12500, province:'Gauteng', condition:'Brand New', category:'pistols', listingType:'dealer' as const, sellerName:'Gunstore Centurion', featured:true, calibre:'9mm Luger' },
  { id:'2', title:'Tikka T3x Lite .308 Win', make:'Tikka', price:18000, province:'Western Cape', condition:'Good', category:'rifles', listingType:'private' as const, sellerName:'Stellenbosch', calibre:'.308 Win' },
  { id:'3', title:'Beretta A400 Xcel Sporting 12ga', make:'Beretta', price:34900, province:'KZN', condition:'Brand New', category:'shotguns', listingType:'dealer' as const, sellerName:'Firearm World DBN', calibre:'12 Gauge' },
  { id:'4', title:'Vortex Viper PST Gen II 5-25x50', make:'Vortex Optics', price:14000, province:'Gauteng', condition:'Like New', category:'accessories', listingType:'private' as const, sellerName:'Pretoria East', calibre:'34mm Tube' },
];

const CATEGORIES = [
  { slug:'pistols', label:'Pistols', count:'1,240', iconPath:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { slug:'rifles', label:'Rifles', count:'1,820', iconPath:'M12 2v20M2 12h20' },
  { slug:'shotguns', label:'Shotguns', count:'540', iconPath:'M7.5 7.5h9M7.5 16.5h9M12 7.5v9' },
  { slug:'revolvers', label:'Revolvers', count:'310', iconPath:'M12 12c-5.52 0-10-4.48-10-10h20c0 5.52-4.48 10-10 10z' },
  { slug:'air-guns', label:'Air Guns', count:'420', iconPath:'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2' },
  { slug:'airsoft', label:'Airsoft Guns', count:'280', iconPath:'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { slug:'holsters', label:'Holsters & Carry', count:'950', iconPath:'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' },
  { slug:'accessories', label:'Accessories', count:'2,100', iconPath:'M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z' },
  { slug:'ammunition', label:'Ammunition', count:'850', iconPath:'M8.5 9V5a3.5 3.5 0 0 1 7 0v4' },
  { slug:'reloading', label:'Reloading', count:'1,120', iconPath:'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
  { slug:'knives', label:'Knives & Blades', count:'670', iconPath:'M3 21h5l13-13a1.5 1.5 0 0 0-2-2L6 19v2z' },
  { slug:'services', label:'Services', count:'140', iconPath:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <section className="min-h-[85vh] flex flex-col justify-center px-6 py-16 relative overflow-hidden">
        <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(201,146,42,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(201,146,42,0.04) 0%, transparent 60%)'}} />
        
        <div className="max-w-[1280px] mx-auto w-full relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A] text-[11px] font-semibold tracking-[0.2em] uppercase px-4 py-2 rounded-sm mb-7">
            <span className="w-1.5 h-1.5 bg-[#C9922A] rounded-full" /> South Africa&apos;s Freshest Firearms Classifieds
          </div>

          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-5xl md:text-7xl lg:text-[90px] leading-[1.1] md:leading-[0.93] tracking-tight uppercase mb-6 text-[#F0EDE8]">
            Buy &amp; Sell<br/><span className="text-[#C9922A]">Legally.</span> Confidently.
          </h1>

          <p className="text-[17px] text-[#8A8E99] leading-relaxed max-w-[520px] mx-auto mb-10 font-light">
            Connect directly with verified dealers and private sellers across South Africa. No middlemen, no direct sales.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 bg-[#191C23] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-8">
            <span className="block text-[11px] text-[#C9922A] font-semibold tracking-[0.2em] uppercase mb-1">Browse by type</span>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[32px] uppercase tracking-wide text-[#F0EDE8]">Categories</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/${cat.slug}`} className="bg-[#111318] border border-white/5 rounded-md p-5 flex flex-col gap-3 hover:bg-[#1F2330] hover:-translate-y-1 transition-all group">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">
                  <path d={cat.iconPath} />
                </svg>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-semibold text-[15px] tracking-wide text-[#F0EDE8] uppercase group-hover:text-white">{cat.label}</span>
                <span className="text-[12px] text-[#8A8E99]">{cat.count} listings</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 bg-[#0D0F13] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-8">
            <span className="block text-[11px] text-[#C9922A] font-semibold tracking-[0.2em] uppercase mb-1">Just posted</span>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[32px] uppercase tracking-wide text-[#F0EDE8]">Recent Listings</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEMO_LISTINGS.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
