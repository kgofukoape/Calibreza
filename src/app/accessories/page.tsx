import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

const DEMO_LISTINGS = [
  { id:'36', title:'Vortex Viper PST Gen II 5-25x50', make:'Vortex Optics', price:14000, province:'Gauteng', condition:'Like New', category:'accessories', listingType:'private' as const, sellerName:'Pretoria East', calibre:'Optics & Sights', featured:true },
  { id:'37', title:'Safariland 6390RDS for Glock 19', make:'Safariland', price:3200, province:'Western Cape', condition:'Brand New', category:'accessories', listingType:'dealer' as const, sellerName:'Tactical HQ', calibre:'Holsters & Carry' },
  { id:'38', title:'Magpul CTR Carbine Stock - Mil-Spec', make:'Magpul', price:1800, province:'KZN', condition:'Good', category:'accessories', listingType:'private' as const, sellerName:'DBN North', calibre:'Stocks & Grips' },
  { id:'39', title:'Holosun HS507C X2 Red Dot', make:'Holosun', price:6500, province:'Free State', condition:'Brand New', category:'accessories', listingType:'dealer' as const, sellerName:'Bloem Optics', calibre:'Optics & Sights' },
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
            Browse <span className="text-[#C9922A]">Accessories & Optics</span>
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

            {/* Accessory Type / Category Filter */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Category</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Optics & Sights', 'Holsters & Carry', 'Magazines & Speed Loaders', 
                  'Stocks, Grips & Furniture', 'Barrels & Suppressors', 'Triggers & Actions', 
                  'Rails, Mounts & Rings', 'Lights & Lasers', 'Slings & Cases', 
                  'Cleaning & Maintenance', 'Reloading Equipment', 'Safety & Storage', 
                  'Clothing & PPE', 'Training Equipment', 'Other'
                ].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Subcategory: Optics Types */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Optics Subcategory</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Rifle Scopes', 'Red Dot Sights', 'Holographic Sights', 'Magnifiers', 
                  'Night Vision Optics', 'Thermal Optics', 'Binoculars & Spotting Scopes', 
                  'Iron Sights', 'Prism Scopes'
                ].map(opticType => (
                  <label key={opticType} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{opticType}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE ACCESSORY & OPTICS BRANDS */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'African Optics (SA)', 'Aimpoint', 'Alien Gear', 'Alpen', 'Armasight', 'Ase Utra', 
                  'Athlon', 'ATN', 'Barska', 'BCM', 'BEIOMO', 'Bering Optics', 
                  'Blackhawk', 'Burris', 'Bushnell', 'Caldwell', 'Celestron', 'Crimson Trace', 
                  'Daniel Defense', 'Dedal', 'Dipol', 'Docter', 'Elbit Systems', 'EOTech', 
                  'FAB Defense', 'Feyachi', 'Filipp', 'Firefield', 'FLIR', 'G-Code', 'Geissele', 
                  'Guide Sensmart', 'Hawke', 'Hensoldt', 'Hikmicro', 'Hogue', 'Holosun', 'Hoppe\'s', 
                  'Hornady', 'InfiRay', 'ITT Exelis', 'Kahles', 'Katod', 'Knights Armament', 'Kowa', 
                  'L-3 Technologies', 'LaRue Tactical', 'Leica', 'Leupold', 'Lucid Optics', 
                  'Lyman', 'Lynx Optics (SA)', 'Magpul', 'March Optics', 'Maven', 'Meade', 
                  'Mec-Gar', 'Meopta', 'Meprolight', 'Midwest Industries', 'Minox', 'Monstrum', 
                  'Night Optics', 'Nightforce', 'Nikon', 'Nikko Stirling', 'Nitesite (SA)', 
                  'Noblex', 'Nocturn Industries', 'Noveske', 'Olight', 'Optika (SA)', 
                  'Ozark Armament', 'Pelican', 'Photonis', 'Plano', 'Premier Reticles', 
                  'Primary Arms', 'Pulsar', 'RCBS', 'Real Avid', 'Riton Optics', 'Safariland', 
                  'Samson Manufacturing', 'Schmidt & Bender', 'Shield Sights', 'Sightmark', 
                  'Sig Sauer Optics', 'SilencerCo', 'Simmons', 'Spuhr', 'Steiner', 'Streamlight', 
                  'SureFire', 'Swampfox', 'Swarovski', 'Tangent Theta', 'Tasco', 'Tract Optics', 
                  'Trijicon', 'Troy Industries', 'US Optics', 'Valdada IOR', 'Vortex', 'Weaver', 
                  'Yankee Hill Machine', 'Yukon', 'Zeiss', 'Other'
                ].map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* RETICLE TYPES */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Reticle Type</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Duplex', 'Mil-Dot', 'BDC (Bullet Drop Compensator)', 'MOA Grid', 
                  'MRAD Grid', 'Christmas Tree', 'Illuminated', 'Etched Glass', 'Wire'
                ].map(reticle => (
                  <label key={reticle} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{reticle}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">2,100</strong> results for Accessories</span>
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
