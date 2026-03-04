import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

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
          <Link href="/listings" className="hover:text-[#C9922A] transition-colors">Pistols</Link>
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
            <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-gradient-to-br from-[#1F2330] to-[#111318] border border-white/5 rounded-md flex items-center justify-center relative overflow-hidden group">
              <span className="text-7xl opacity-10 group-hover:scale-110 transition-transform duration-500">🔫</span>
              <div className="absolute top-4 left-4 bg-[#C9922A] text-black text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-sm shadow-md">
                Featured
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4].map((thumb) => (
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
                Comes with the original hard case, two 15-round magazines, different sized backstraps, cleaning rod, and all original documentation. 
              </p>
              <p>
                <strong>Reason for selling:</strong> Upgrading to a full-size competition rig. 
                <br/><strong>Note:</strong> Currently on a Section 13 (Self-Defence) licence. Storage permit or dealer stock transfer can be arranged at buyer's expense.
              </p>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Specs, Price, Seller Info */}
        <aside className="w-full lg:w-[400px] flex-shrink-0 flex flex-col gap-6">
          
          {/* Main Pricing Box */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8 flex flex-col gap-6">
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

            <button style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="w-full bg-[#C9922A] text-black font-bold text-[18px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:bg-[#b58325] transition-colors shadow-lg">
              Contact Seller
            </button>

            <div className="flex items-center justify-center gap-4 text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] border-t border-white/5 pt-6">
              <button className="hover:text-[#F0EDE8] transition-colors flex items-center gap-2">⭐ Save</button>
              <span>|</span>
              <button className="hover:text-[#F0EDE8] transition-colors flex items-center gap-2">🔗 Share</button>
              <span>|</span>
              <button className="hover:text-red-500 transition-colors flex items-center gap-2 text-red-500/70">🚩 Report</button>
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
                <span className="text-[12px] text-[#8A8E99]">Private Seller</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-3 text-[13px] text-[#F0EDE8]">
                <span className="w-4 h-4 rounded-full bg-[#2A9C6E]/10 flex items-center justify-center text-[8px] border border-[#2A9C6E]/30 text-[#2A9C6E]">✓</span>
                Identity Verified
              </div>
              <div className="flex items-center gap-3 text-[13px] text-[#F0EDE8]">
                <span className="w-4 h-4 rounded-full bg-[#2A9C6E]/10 flex items-center justify-center text-[8px] border border-[#2A9C6E]/30 text-[#2A9C6E]">✓</span>
                Active SAPS Competency
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
                ['Category', 'Pistols'],
                ['Licence Type', 'Section 13 (Private)'],
              ].map(([label, val], i) => (
                <div key={label} className={`flex justify-between py-3 ${i !== 5 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-[13px] text-[#8A8E99]">{label}</span>
                  <span className="text-[13px] font-medium text-[#F0EDE8]">{val}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>
      </main>
    </div>
  );
}
