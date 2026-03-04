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
    case 'holsters': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>;
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
  { slug:'holsters', label:'Holsters & Carry', count:'950' },
  { slug:'accessories', label:'Accessories', count:'2,100' },
  { slug:'ammunition', label:'Ammunition', count:'850' },
  { slug:'reloading', label:'Reloading', count:'1,120' },
  { slug:'knives', label:'Knives & Blades', count:'670' },
  { slug:'services', label:'Services', count:'140' },
];

export default function HomePage() {
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
        <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(201,146,42,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(201,146,42,0.04) 0%, transparent 60%)'}} />
        <div style={{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'60px 60px'}} />

        {/* RESTORED: Left aligned Hero Wrapper */}
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

          {/* RESTORED: Full Search Bar with Categories & Provinces */}
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
            <select style={{fontFamily:"'Barlow', sans-serif"}} className="bg-[#1F2330] border-none md:border-l border-t md:border-t-0 border-white/10 text-[#8A8E99] text-[13px] px-5 py-4 md:py-0 md:min-w-[140px] cursor-pointer outline-none appearance-none">
              <option value="">All Provinces</option>
              {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(p => <option key={p}>{p}</option>)}
            </select>
            <button style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="bg-[#C9922A] border-none text-black font-bold text-[14px] tracking-[0.1em] uppercase px-7 py-4 md:py-0 cursor-pointer">
              Search
            </button>
          </div>

          {/* RESTORED: Statistics Row */}
          <div className="grid grid-cols-2 md:flex md:flex-row gap-6 md:gap-10 items-center">
            {[['4,200+','Active Listings'],['180+','Verified Dealers'],['9','Provinces'],['100%','FCA Compliant']].map(([num, label], i) => (
              <div key={label} className="flex items-center md:gap-10">
                {i > 0 && <div className="hidden md:block w-[1px] h-10 bg-white/10" />}
                <div className="flex flex-col gap-1">
                  <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[24px] md:text-[28px] text-[#F0EDE8]">{num}</span>
                  <span className="text-[10px] md:text-[12px] text-[#8A8E99] tracking-wider uppercase">{label}</span>
                </div>
              </div>
            ))}
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

          <div className="flex overflow-x-auto border-b border-white/5 mb-8" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {['All','🏪 Dealer Stock','👤 Private','🔔 Wanted'].map((tab, i) => (
              <button key={tab} style={{fontFamily:"'Barlow Condensed', sans-serif"}} className={`font-semibold text-[13px] md:text-[14px] tracking-widest uppercase px-4 md:px-6 py-3 border-b-2 whitespace-nowrap ${i === 0 ? 'text-[#C9922A] border-[#C9922A]' : 'text-[#8A8E99] border-transparent'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {DEMO_LISTINGS.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-8 md:py-20 bg-[#111318] border-t border-white/5">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-10">
            <span className="block text-[11px] text-[#C9922A] font-semibold tracking-[0.2em] uppercase mb-1">Simple &amp; Safe</span>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-3xl md:text-[32px] uppercase tracking-wide text-[#F0EDE8]">How it Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 border border-white/5 rounded-md overflow-hidden">
            {[
              ['01', <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#C9922A]"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, 'Browse Listings', 'Search by category, calibre, province, price and condition. Filter by dealer stock or private listings.'],
              ['02', <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#C9922A]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, 'Contact the Seller', 'Reach out through secure messaging. View verified seller profiles and licence confirmations.'],
              ['03', <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-[#C9922A]"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, 'Transact Legally', 'All transactions happen between buyer and seller in full compliance with the Firearms Control Act.'],
            ].map(([num, icon, title, desc], i) => (
              <div key={num as string} className={`p-8 md:p-10 relative ${i < 2 ? 'border-b md:border-b-0 md:border-r border-white/5' : ''}`}>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-[60px] md:text-[80px] text-[#C9922A]/5 leading-none absolute top-4 md:top-5 right-6">{num}</div>
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
              ['Browse', ['Pistols','Rifles','Shotguns','Revolvers','Air Guns','Airsoft Guns','Holsters','Accessories','Ammunition', 'Reloading', 'Knives & Blades']],
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
