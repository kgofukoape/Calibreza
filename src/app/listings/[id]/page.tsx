import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Similar listings for the carousel
const SIMILAR_LISTINGS = [
  { id:'4', title:'Glock 19 Gen 5', make:'Glock', price:13500, province:'Gauteng', condition:'Like New', category:'pistols', listingType:'private' as const, sellerName:'Pretoria East', calibre:'9mm Luger' },
  { id:'11', title:'Sig Sauer P365 XL', make:'Sig Sauer', price:21000, province:'Western Cape', condition:'Like New', category:'pistols', listingType:'dealer' as const, sellerName:'Cape Gunworks', calibre:'9mm Luger' },
  { id:'12', title:'Beretta 92FS 9mm', make:'Beretta', price:16500, province:'KZN', condition:'Good', category:'pistols', listingType:'private' as const, sellerName:'Durban Central', calibre:'9mm Luger' },
  { id:'13', title:'Smith & Wesson M&P9 M2.0', make:'Smith & Wesson', price:14800, province:'Eastern Cape', condition:'Brand New', category:'pistols', listingType:'dealer' as const, sellerName:'PE Firearms', calibre:'9mm Luger' },
];

export default function ListingDetailsPage({ params }: { params: { id: string } }) {
  // In the future, we will use params.id to fetch the exact gun from Supabase.
  // For now, we are just using a beautiful static layout.
  
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Breadcrumb Navigation */}
      <div className="bg-[#191C23] border-b border-white/5 py-4 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto text-[11px] text-[#8A8E99] tracking-widest uppercase flex items-center gap-2">
          <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
          <span>/</span> 
          <Link href="/pistols" className="hover:text-[#C9922A] transition-colors">Pistols</Link>
          <span>/</span>
          <span className="text-[#F0EDE8]">CZ P-10 C 9mm Luger</span>
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
              <div className="absolute top-4 left-4 bg-[#C9922A] text-black text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-sm shadow-md">
                Featured
              </div>
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
            <div className="text-[14px] md:text-[15px] text-[#8A8E99] leading-relaxed flex flex-col gap-4">
              <p>
                Selling my practically brand new CZ P-10 C. Only put about 150 rounds through it at the indoor range. It has been meticulously cleaned and stored in a climate-controlled safe.
              </p>
              <p>
                This is one of the most popular striker-fired 9mm compact pistols on the market. Extremely reliable, accurate, and comfortable to shoot. The ergonomics are excellent with the interchangeable backstraps allowing for a custom fit.
              </p>
              <p>
                <strong className="text-[#F0EDE8]">Reason for selling:</strong> Upgrading to a full-size competition rig. 
              </p>
              <p>
                <strong className="text-[#F0EDE8]">Transfer note:</strong> Currently on a Section 13 (Self-Defence) licence. Storage permit or dealer stock transfer can be arranged at buyer&apos;s expense. Clean SAPS record and valid competency certificate required.
              </p>
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-6">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl tracking-wide uppercase text-[#F0EDE8] border-b border-white/5 pb-4">
              What&apos;s Included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                '✓ Original CZ hard case',
                '✓ Two 15-round magazines',
                '✓ Three interchangeable backstraps',
                '✓ Cleaning rod and brush',
                '✓ Original manual and documentation',
                '✓ Factory test target',
                '✓ Magazine loader',
                '✓ Cable lock',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[14px] text-[#F0EDE8]">
                  <span className="w-5 h-5 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm flex items-center justify-center text-[#2A9C6E] text-[10px] flex-shrink-0">✓</span>
                  <span>{item.replace('✓ ', '')}</span>
                </div>
              ))}
            </div>
          </div>

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
                CZ P-10 C 9mm Luger
              </h1>
              <p className="text-[13px] text-[#8A8E99] flex items-center gap-2">
                📍 Pretoria, Gauteng • Listed 2 days ago
              </p>
            </div>

            <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-[40px] md:text-[48px] text-[#C9922A] leading-none">
              R 12,500
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
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-5">
            <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3">
              Seller Information
            </h3>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#111318] border border-white/10 rounded-full flex items-center justify-center text-[20px]">
                👤
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[16px] text-[#F0EDE8]">J. Van Der Merwe</span>
                <span className="text-[12px] text-[#8A8E99]">Private Seller • Member since 2024</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-3 text-[13px] text-[#F0EDE8]">
                <span className="w-5 h-5 rounded-full bg-[#2A9C6E]/10 flex items-center justify-center text-[10px] border border-[#2A9C6E]/30 text-[#2A9C6E]">✓</span>
                Identity Verified
              </div>
              <div className="flex items-center gap-3 text-[13px] text-[#F0EDE8]">
                <span className="w-5 h-5 rounded-full bg-[#2A9C6E]/10 flex items-center justify-center text-[10px] border border-[#2A9C6E]/30 text-[#2A9C6E]">✓</span>
                Responsive (avg. 2-3 hours)
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mt-2">
              <div className="text-[12px] text-[#8A8E99] mb-2">Seller Stats</div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#8A8E99]">Active Listings</span>
                <span className="text-[#F0EDE8] font-medium">3</span>
              </div>
              <div className="flex items-center justify-between text-[13px] mt-2">
                <span className="text-[#8A8E99]">Successful Sales</span>
                <span className="text-[#F0EDE8] font-medium">12</span>
              </div>
            </div>
          </div>

          {/* Specification Grid */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-5">
            <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-3">
              Specifications
            </h3>
            
            <div className="flex flex-col gap-0">
              {[
                ['Make', 'CZ'],
                ['Model', 'P-10 C'],
                ['Calibre', '9mm Luger (9x19mm)'],
                ['Condition', 'Like New'],
                ['Action Type', 'Striker-Fired'],
                ['Capacity', '15+1 rounds'],
                ['Barrel Length', '4.0" (102mm)'],
                ['Overall Length', '7.3" (185mm)'],
                ['Category', 'Pistols'],
                ['Licence Type', 'Section 13 (Self-Defence)'],
              ].map(([label, val], i, arr) => (
                <div key={label} className={`flex justify-between py-3 ${i !== arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-[13px] text-[#8A8E99]">{label}</span>
                  <span className="text-[13px] font-medium text-[#F0EDE8] text-right">{val}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </main>

      {/* Similar Listings Section */}
      <section className="bg-[#191C23] border-t border-white/5 px-6 md:px-8 py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto">
          <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-3xl md:text-4xl uppercase text-[#F0EDE8] mb-8">
            Similar <span className="text-[#C9922A]">Listings</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SIMILAR_LISTINGS.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        </div>
      </section>

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
