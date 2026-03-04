import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Temporary Mock Data for Revolvers
const DEMO_LISTINGS = [
  { id:'5', title:'Taurus 856 Ultra-Lite 38 Special', make:'Taurus', price:7500, province:'Free State', condition:'Fair', category:'revolvers', listingType:'private' as const, sellerName:'Bloemfontein', calibre:'.38 Special', featured:true },
  { id:'23', title:'Smith & Wesson 686 Plus', make:'Smith & Wesson', price:24000, province:'Gauteng', condition:'Like New', category:'revolvers', listingType:'dealer' as const, sellerName:'Centurion Arms', calibre:'.357 Magnum' },
  { id:'24', title:'Ruger GP100 Match Champion', make:'Ruger', price:21500, province:'Western Cape', condition:'Brand New', category:'revolvers', listingType:'dealer' as const, sellerName:'Cape Gunworks', calibre:'.357 Magnum' },
  { id:'25', title:'Colt Python 6" Stainless', make:'Colt', price:38000, province:'KZN', condition:'Brand New', category:'revolvers', listingType:'dealer' as const, sellerName:'Durban Central', calibre:'.357 Magnum' },
  { id:'26', title:'Chiappa Rhino 50DS', make:'Chiappa', price:28500, province:'Gauteng', condition:'Like New', category:'revolvers', listingType:'private' as const, sellerName:'Sandton', calibre:'.357 Magnum' },
  { id:'27', title:'Uberti 1873 Cattleman', make:'Uberti', price:11000, province:'Eastern Cape', condition:'Good', category:'revolvers', listingType:'private' as const, sellerName:'PE Firearms', calibre:'.45 Colt' },
];

export default function RevolversPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Revolvers</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Revolvers</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTERS */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
          
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
              <button className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">Clear All</button>
            </div>

            {/* Action Type Filter (Top Priority) */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Action Type</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Single Action', 'Double Action', 'Double Action Only (DAO)', 'Single/Double Action (SA/DA)', 'Other'
                ].map(action => (
                  <label key={action} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{action}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE REVOLVER BRANDS */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Alfa Proj', 'Amadeo Rossi', 'American Tactical', 'Armi Sport', 'Arminius', 
                  'Armscor', 'Astra', 'Cabot Guns', 'Charter Arms', 'Chiappa', 'Cimarron', 
                  'Colt', 'Connecticut Shotgun', 'Dan Wesson', 'EAA', 'EMF Company', 'Erma', 
                  'Firestorm', 'Freedom Arms', 'Great Western Arms', 'Heritage Manufacturing', 
                  'Kimber', 'Korth', 'Legacy Sports', 'Les Baer', 'Llama', 'Manurhin', 'Mateba', 
                  'Mitchell\'s Mausers', 'Navy Arms', 'Nighthawk Custom', 'North American Arms', 
                  'Pedersoli', 'Pietta', 'Rock Island Armory', 'Rohm', 'Rossi', 'Ruger', 
                  'Smith & Wesson', 'Standard Manufacturing', 'Star', 'Taurus', 'Taylor\'s & Co', 
                  'Turnbull Manufacturing', 'Uberti', 'United States Fire Arms (USFA)', 
                  'Weihrauch', 'Wilson Combat', 'Zastava', 'Other'
                ].map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE REVOLVER CALIBRES */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Calibre</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  '.17 HMR', '.22 Hornet', '.22 LR', '.22 WMR', '.25-20 Winchester', 
                  '.256 Winchester Magnum', '.30 Carbine', '.32 H&R Magnum', '.32 Long Colt', 
                  '.32 S&W', '.32 S&W Long', '.32-20 Winchester', '.327 Federal Magnum', 
                  '.357 Magnum', '.357 Maximum', '.38 Long Colt', '.38 S&W', '.38 Special', 
                  '.38-40 Winchester', '.40 S&W', '.41 Magnum', '.41 Special', '.44 Magnum', 
                  '.44 Russian', '.44 Special', '.44-40 Winchester', '.445 SuperMag', '.45 ACP', 
                  '.45 Colt', '.45 GAP', '.45 Long Colt', '.45 Schofield', '.454 Casull', 
                  '.460 S&W Magnum', '.475 Linebaugh', '.480 Ruger', '.500 S&W Magnum', 
                  '9mm Luger', '10mm Auto', 'Other'
                ].map(calibre => (
                  <label key={calibre} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{calibre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Province Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Location</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'].map(prov => (
                  <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Condition</span>
              <div className="flex flex-col gap-2.5">
                {['Brand New', 'Like New', 'Good', 'Fair'].map(cond => (
                  <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{cond}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Price Range</span>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min (R)" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
                <span className="text-[#8A8E99]">-</span>
                <input type="number" placeholder="Max (R)" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
              </div>
            </div>

            {/* Licence/Seller Type */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Seller Type</span>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Dealer Stock (🏪)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Private Licence (👤)</span>
                </label>
              </div>
            </div>

          </div>
        </aside>

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">310</strong> results for Revolvers</span>
            
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Sort by:</span>
              <select style={{fontFamily:"'Barlow', sans-serif"}} className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] font-medium px-4 py-2 rounded-sm cursor-pointer outline-none focus:border-[#C9922A] appearance-none min-w-[140px]">
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Condition: Best</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {DEMO_LISTINGS.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8">
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">&lt;</button>
            <button className="w-10 h-10 flex items-center justify-center border border-[#C9922A] bg-[#C9922A]/10 rounded-sm text-[#C9922A] font-bold transition-all">1</button>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">2</button>
            <span className="text-[#8A8E99] px-2">...</span>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">&gt;</button>
          </div>

        </div>
      </div>
    </div>
  );
}
