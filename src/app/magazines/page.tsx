import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Temporary Mock Data for Magazines & Loaders
const DEMO_LISTINGS = [
  { id:'44', title:'Magpul PMAG 30 AR/M4 GEN M3', make:'Magpul', price:650, province:'Gauteng', condition:'Brand New', category:'magazines', listingType:'dealer' as const, sellerName:'Centurion Arms', calibre:'5.56x45mm NATO', featured:true },
  { id:'45', title:'Glock 19 Gen5 15rd Magazine', make:'Glock', price:950, province:'Western Cape', condition:'Like New', category:'magazines', listingType:'private' as const, sellerName:'Cape Town', calibre:'9mm Luger' },
  { id:'46', title:'HKS 586 Revolver Speedloader', make:'HKS', price:350, province:'KZN', condition:'Good', category:'magazines', listingType:'private' as const, sellerName:'Durban North', calibre:'.357 Magnum' },
  { id:'47', title:'ProMag Saiga 12 Gauge 10rd Drum', make:'ProMag', price:2400, province:'Free State', condition:'Brand New', category:'magazines', listingType:'dealer' as const, sellerName:'Bloem Tactical', calibre:'12 Gauge' },
];

export default function MagazinesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Magazines & Loaders</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Mags & Loaders</span>
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

            {/* Category Type Filter */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Category</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Pistol Magazines', 'Rifle Magazines', 'Shotgun Magazines', 
                  'Drum Magazines', 'Extended Magazines', 'Revolver Speed Loaders', 
                  'Revolver Moon Clips', 'Revolver Speed Strips', 'Magazine Couplers', 
                  'Base Plates & Extensions', 'Other'
                ].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Platform Fitment (Crucial for Mags) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Platform Fitment</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'AR-15 / M4 / 5.56', 'AK-47 / AKM / 7.62', 'AR-10 / SR-25 / .308', 
                  'Glock 17/19/26/34', 'Glock 43/43X/48', 'CZ 75 / SP-01 / Shadow', 
                  'CZ P-10 / P-07', 'Sig P320 / M17', 'Sig P365 / XL', 
                  'Smith & Wesson M&P', '1911 Single Stack', '2011 Double Stack', 
                  'AICS Pattern (Bolt Action)', 'Remington 700', 'Saiga / VEPR 12', 
                  'Universal / Multi-Fit', 'Other'
                ].map(fit => (
                  <label key={fit} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{fit}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* THE NEW MASTER CALIBRE FILTER */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Calibre / Gauge</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  '.17 HMR', '.22 LR', '.22 WMR', '.223 Remington', '.224 Valkyrie', '.243 Winchester', 
                  '.25 ACP', '.300 Blackout', '.300 Win Mag', '.308 Winchester', '.32 ACP', 
                  '.32 H&R Magnum', '.327 Federal Magnum', '.338 Lapua', '.350 Legend', '.357 Magnum', 
                  '.357 SIG', '.38 Special', '.380 ACP', '.40 S&W', '.41 Magnum', '.410 Bore', 
                  '.44 Magnum', '.44 Special', '.45 ACP', '.45 Colt', '.45 GAP', '.450 Bushmaster', 
                  '.454 Casull', '.458 SOCOM', '.460 S&W Magnum', '.480 Ruger', '.50 Beowulf', 
                  '.500 S&W Magnum', '4.6x30mm', '5.45x39mm', '5.56x45mm NATO', '5.7x28mm', 
                  '6.5 Creedmoor', '6.5 Grendel', '6.8 SPC', '6mm ARC', '7.62x39mm', 
                  '7.62x51mm NATO', '7.62x54mmR', '9mm Luger', '10 Gauge', '10mm Auto', 
                  '12 Gauge', '16 Gauge', '20 Gauge', '28 Gauge', 'Other'
                ].map(calibre => (
                  <label key={calibre} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{calibre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Capacity Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Capacity</span>
              <div className="flex flex-col gap-2.5">
                {[
                  '1 - 5 Rounds', '6 - 10 Rounds', '11 - 15 Rounds', 
                  '16 - 20 Rounds', '21 - 30 Rounds', '31 - 40 Rounds', 
                  'Drum / High-Cap (50+)'
                ].map(cap => (
                  <label key={cap} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{cap}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE MAGAZINE BRANDS (SA & International) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  '5 Star Firearms', 'ACT-Mag', 'Agency Arms', 'Armscor SA', 'ASC', 
                  'BCM', 'Beta Company', 'Bianchi', 'Blackhawk', 'Blade-Tech', 
                  'Brownells', 'Browning', 'BT Arms', 'C Products Defense', 
                  'Check-Mate Industries', 'Chip McCormick', 'Comp-Tac', 'Condor', 
                  'CZ', 'D&H Industries', 'Dade Machine', 'Daniel Defense', 
                  'Dawson Precision', 'Denel', 'ETS', 'FN Herstal', 'Fobus', 
                  'Glock', 'Heckler & Koch', 'Hexmag', 'HKS', 'KCI', 'Kimber', 
                  'Lancer Systems', 'Lone Wolf Distributors', 'Lyttleton Engineering', 
                  'Magpul', 'Mec-Gar', 'Mission First Tactical', 'Mossberg', 
                  'Musgrave', 'Nighthawk Custom', 'Okay Industries', 'Pachmayr', 
                  'Pretoria Metal Pressings', 'ProMag', 'Ranch Products', 'Remington', 
                  'Ruger', 'SA Arms', 'Safariland', 'Savage', 'Serpa', 'SGM Tactical', 
                  'Sig Sauer', 'Smith & Wesson', 'Speed Beez', 'Springfield Armory', 
                  'Springer Precision', 'Strike Industries', 'Surefire', 'Taran Tactical', 
                  'Taurus', 'TK Custom', 'Tripp Research', 'Triple K', 'Troy Industries', 
                  'Truvelo', 'Tuff Products', 'Vector Arms SA', 'Vektor SA', 'Walther', 
                  'Wilson Combat', 'Winchester', 'X Products', 'Zev Technologies', 'Other'
                ].map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
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

          </div>
        </aside>

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">1,420</strong> results for Magazines & Loaders</span>
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
