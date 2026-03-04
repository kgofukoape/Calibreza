import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

const DEMO_LISTINGS = [
  { id:'1', title:'CZ P-10 C 9mm Luger', make:'CZ', price:12500, province:'Gauteng', condition:'Brand New', category:'pistols', listingType:'dealer', sellerName:'Gunstore Centurion', featured:true, calibre:'9mm Luger' },
  { id:'2', title:'Tikka T3x Lite .308 Win', make:'Tikka', price:18000, province:'Western Cape', condition:'Good', category:'rifles', listingType:'private', sellerName:'Stellenbosch', calibre:'.308 Win' },
  { id:'3', title:'Beretta A400 Xcel Sporting 12ga', make:'Beretta', price:34900, province:'KZN', condition:'Brand New', category:'shotguns', listingType:'dealer', sellerName:'Firearm World DBN', calibre:'12 Gauge' },
  { id:'4', title:'Vortex Viper PST Gen II 5-25x50', make:'Vortex', price:14000, province:'Gauteng', condition:'Like New', category:'accessories', listingType:'private', sellerName:'Pretoria East', calibre:'34mm Tube' },
];

const CATEGORIES = [
  { slug:'pistols', label:'Pistols', icon:'🔫', count:'1,240' },
  { slug:'rifles', label:'Rifles', icon:'🎯', count:'1,820' },
  { slug:'shotguns', label:'Shotguns', icon:'💥', count:'540' },
  { slug:'revolvers', label:'Revolvers', icon:'🌀', count:'310' },
  { slug:'air-guns', label:'Air Guns', icon:'💨', count:'420' },
  { slug:'accessories', label:'Accessories', icon:'🎒', count:'2,100' },
];

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <div className="bg-[#1F2330] border-b border-white/5 py-3 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto flex items-center justify-center gap-4 md:gap-12 flex-wrap">
          {[['🛡','Verified Sellers'],['⚖️','FCA Compliant'],['🔔','Instant Alerts'],['📍','Local Search'],['🏪','Dealer Directory']].map(([icon, text], index) => (
            <div key={index} className="flex items-center gap-2 text-[11px] md:text-xs text-[#8A8E99] font-medium">
              <span className="w-5 h-5 md:w-6 md:h-6 bg-[#C9922A]/10 rounded-full flex items-center justify-center text-[10px] md:text-[13px]">{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

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
              <option>Pistols</option>
              <option>Rifles</option>
              <option>Shotguns</option>
              <option>Revolvers</option>
              <option>Air Guns</option>
              <option>Ammunition</option>
              <option>Accessories</option>
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
            <Link href="/listings" className="text-[#C9922A] text-xs md:text-[13px] font-medium tracking-wide uppercase hover:underline">All categories →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/listings?cat=${cat.slug}`} className="bg-[#111318] border border-white/5 rounded-md p-4 md:p-5 flex flex-col gap-2 hover:bg-[#1F2330] hover:-translate-y-1 transition-all duration-200 group">
                <span className="text-2xl md:text-[24px]">{cat.icon}</span>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-semibold text-sm md:text-[15px] tracking-wide text-[#F0EDE8] uppercase">{cat.label}</span>
                <span className="text-[11px] md:text-[12px] text-[#8A8E99]">{cat.count} listings</span>
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
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-3
