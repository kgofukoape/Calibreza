import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

const DEMO_LISTINGS = [
  { id:'36', title:'Vortex Viper PST Gen II 5-25x50', make:'Vortex', price:14000, province:'Gauteng', condition:'Like New', category:'accessories', listingType:'private' as const, sellerName:'Pretoria East', calibre:'Optics & Sights', featured:true },
  { id:'38', title:'Musgrave Walnut Sporter Stock (K98)', make:'Musgrave', price:4500, province:'Free State', condition:'Good', category:'accessories', listingType:'dealer' as const, sellerName:'Bloem Custom', calibre:'Rifle Stocks' },
  { id:'39', title:'MDT Oryx Chassis System - Tikka T3', make:'MDT', price:9500, province:'Western Cape', condition:'Brand New', category:'accessories', listingType:'dealer' as const, sellerName:'Cape Tactical', calibre:'Rifle Chassis Systems' },
  { id:'40', title:'Magpul MOE M-LOK Handguard', make:'Magpul', price:850, province:'KZN', condition:'Like New', category:'accessories', listingType:'private' as const, sellerName:'DBN North', calibre:'Forends & Handguards' },
];

export default function AccessoriesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Accessories</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Accessories & Parts</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
              <button className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">Clear All</button>
            </div>

            {/* Main Accessory Category Filter */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Category</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Optics & Sights', 'Rifle Stocks', 'Rifle Chassis Systems', 
                  'Shotgun Stocks', 'Pistol Grips (Handgun)', 'AR / Semi-Auto Grips', 
                  'Forends & Handguards', 'Recoil Pads & Buttpads', 'Cheekpieces & Risers',
                  'Barrels & Suppressors', 'Triggers & Actions', 'Rails, Mounts & Rings', 
                  'Lights & Lasers', 'Slings & Cases', 'Cleaning & Maintenance', 
                  'Safety & Storage', 'Other'
                ].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* NEW: Stock Material (For Stocks & Furniture) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Stock Material</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Wood (Walnut)', 'Wood (Laminate)', 'Synthetic / Polymer', 
                  'Fibreglass', 'Carbon Fibre', 'Aluminium Chassis', 'Other'
                ].map(mat => (
                  <label key={mat} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{mat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* NEW: Stock / Furniture Style */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Furniture Style</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Sporter / Hunting', 'Thumbhole', 'Monte Carlo', 'Tactical / Precision', 
                  'Bullpup', 'Folding', 'Adjustable (LOP/Comb)', 'M-LOK', 'KeyMod', 
                  'Picatinny / Quad Rail', 'Free-Float', 'Drop-In', 'Other'
                ].map(style => (
                  <label key={style} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{style}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optics Subcategory (From Previous) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Optics Types</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Rifle Scopes', 'Red Dot Sights', 'Holographic Sights', 'Magnifiers', 
                  'Night Vision', 'Thermal', 'Binoculars / Spotting', 'Iron Sights'
                ].map(opticType => (
                  <label key={opticType} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{opticType}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* MASSIVE COMBINED BRAND LIST (Optics + Stocks + Grips) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Adaptive Tactical', 'Aero Precision', 'Aimpoint', 'Altamont', 'Archangel', 
                  'ATI', 'BCM', 'Boyds Gunstocks', 'Burris', 'Bushnell', 'Choate', 
                  'Crimson Trace', 'Daniel Defense', 'EOTech', 'Ergo', 'FAB Defense', 
                  'Foundation Stocks', 'GRS Gunstocks', 'Hawke', 'HF Stocks (SA)', 'Hogue', 
                  'Holosun', 'HS Precision', 'Kick-EEZ', 'Leupold', 'Limbsaver', 'Magnum Arms (SA)', 
                  'Magpul', 'Manners Composite', 'McMillan', 'MDT (Modular Driven Tech)', 
                  'Meopta', 'Midwest Industries', 'Musgrave (SA)', 'Nightforce', 'Oryx / MDT', 
                  'Pachmayr', 'Pearce Grip', 'Primary Arms', 'ProMag', 'Pulsar', 
                  'SABI Rifles (SA)', 'Schmidt & Bender', 'Sig Sauer Optics', 'Sims Vibration Lab', 
                  'Stark Equipment', 'Strike Industries', 'Swarovski', 'Talon Grips', 
                  'Trijicon', 'Troy Industries', 'US Optics', 'UTG', 'Vortex', 'VZ Grips', 'Zeiss', 'Other'
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

          </div>
        </aside>

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">2,680</strong> results for Accessories</span>
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
        </div>
      </div>
    </div>
  );
}
