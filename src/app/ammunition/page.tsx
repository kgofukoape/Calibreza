import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Temporary Mock Data for Ammunition
const DEMO_LISTINGS = [
  { id:'48', title:'PMP 9mm Luger 115gr FMJ (250 Rounds)', make:'PMP', price:1650, province:'Gauteng', condition:'Factory New', category:'ammunition', listingType:'dealer' as const, sellerName:'Tac Shac', calibre:'9mm Luger', featured:true },
  { id:'49', title:'Hornady .308 Win 168gr ELD Match', make:'Hornady', price:1200, province:'Western Cape', condition:'Factory New', category:'ammunition', listingType:'dealer' as const, sellerName:'Safari Outdoor', calibre:'.308 Winchester' },
  { id:'50', title:'Diplopoint 9mm 124gr Remanufactured', make:'Diplopoint', price:350, province:'KZN', condition:'Remanufactured', category:'ammunition', listingType:'dealer' as const, sellerName:'Durban Ammo', calibre:'9mm Luger' },
  { id:'51', title:'Sellier & Bellot 12 Ga 00 Buckshot', make:'Sellier & Bellot', price:280, province:'Free State', condition:'Factory New', category:'ammunition', listingType:'private' as const, sellerName:'Bloem Tactical', calibre:'12 Gauge' },
];

export default function AmmunitionPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Ammunition</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Ammunition</span>
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

            {/* Ammunition Category */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Ammunition Type</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Handgun / Pistol', 'Centrefire Rifle', 'Rimfire', 
                  'Big Bore / Dangerous Game', 'Shotgun', 'Blanks / Dummies'
                ].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE CALIBRE / GAUGE FILTER */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Calibre / Gauge</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  '.17 HMR', '.22 LR', '.22 WMR', '.22-250 Remington', '.223 Rem / 5.56 NATO', 
                  '.243 Winchester', '.25 ACP', '.260 Remington', '.270 Winchester', 
                  '.30-06 Springfield', '.30-30 Winchester', '.300 Blackout', '.300 Win Mag', 
                  '.303 British', '.308 Win / 7.62 NATO', '.32 ACP', '.338 Lapua Magnum', 
                  '.357 Magnum', '.375 H&H Magnum', '.38 Special', '.380 ACP', '.40 S&W', 
                  '.404 Jeffery', '.416 Rigby', '.44 Magnum', '.45 ACP', '.45-70 Govt', 
                  '.458 Win Mag', '.50 BMG', '.500 Nitro Express', '5.45x39mm', '6.5 Creedmoor', 
                  '6.5 PRC', '6.5x55 Swedish', '7.62x25mm Tokarev', '7.62x39mm', 
                  '7mm Rem Mag', '9.3x62 Mauser', '9mm Luger', '9mm Makarov', '10mm Auto', 
                  '12 Gauge', '16 Gauge', '20 Gauge', '28 Gauge', '.410 Bore', 'Other'
                ].map(calibre => (
                  <label key={calibre} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{calibre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bullet / Load Type */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Bullet / Load Type</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'FMJ (Full Metal Jacket)', 'JHP (Jacketed Hollow Point)', 'JSP (Jacketed Soft Point)', 
                  'HPBT (Hollow Point Boat Tail)', 'SPBT (Soft Point Boat Tail)', 'Monolithic / Solid Copper', 
                  'Ballistic Tip', 'Bonded', 'Partition', 'Frangible', 'Subsonic', '+P / +P+', 
                  'Birdshot (Lead)', 'Birdshot (Steel/Bismuth)', 'Buckshot', 'Slugs (Foster/Sabot)', 'Rubber/Less Lethal', 'Other'
                ].map(bulletType => (
                  <label key={bulletType} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{bulletType}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Grain Weight / Shot Size */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Grain Weight / Shot Size</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  '40gr', '55gr', '62gr', '115gr', '124gr', '140gr', '147gr', '150gr', 
                  '168gr', '175gr', '180gr', '230gr', '300gr', '400gr', '500gr', 
                  '00 Buck', '000 Buck', '#4 Buck', '#7.5 Shot', '#9 Shot', '1 oz Slug', 'Other'
                ].map(grain => (
                  <label key={grain} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{grain}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE AMMUNITION BRANDS (SA & International) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'African Buckshot', 'Aguila', 'Barnes', 'Baschieri & Pellagri', 'Berger', 
                  'Blazer', 'CBC', 'CCI', 'Cheddite', 'Clever Mirage', 'Corbon', 'Cutting Edge', 
                  'Diplopoint', 'Eley', 'Federal', 'Fiocchi', 'Geco', 'Hornady', 'Hull Cartridge', 
                  'Lapua', 'Magtech', 'Melior', 'Nobleteq', 'Norinco', 'Norma', 'Nosler', 
                  'Peregrine Bullets', 'PMC', 'PMP (Pretoria Metal Pressings)', 'PPU (Partizan)', 
                  'RC Cartridge', 'Remington', 'Rhino', 'Rio', 'RWS', 'Sako', 'Sellier & Bellot', 
                  'Sierra', 'Sig Sauer', 'Speer', 'STV Ammunition', 'Swift', 'Tesmar', 
                  'Winchester', 'Woodleigh', 'Other'
                ].map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ammo Condition (New vs Remanufactured) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Ammunition Condition</span>
              <div className="flex flex-col gap-2.5">
                {[
                  'Factory New', 'Remanufactured (Reloads)', 'Military Surplus'
                ].map(cond => (
                  <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{cond}</span>
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
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">850</strong> results for Ammunition</span>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Sort by:</span>
              <select style={{fontFamily:"'Barlow', sans-serif"}} className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] font-medium px-4 py-2 rounded-sm cursor-pointer outline-none focus:border-[#C9922A] appearance-none min-w-[140px]">
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
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
