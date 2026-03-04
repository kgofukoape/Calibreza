import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Temporary Mock Data for Accessories
const DEMO_LISTINGS = [
  { id:'36', title:'Vortex Viper PST Gen II 5-25x50', make:'Vortex Optics', price:14000, province:'Gauteng', condition:'Like New', category:'accessories', listingType:'private' as const, sellerName:'Pretoria East', calibre:'Optics & Sights', featured:true },
  { id:'37', title:'Safariland 6390RDS for Glock 19', make:'Safariland', price:3200, province:'Western Cape', condition:'Brand New', category:'accessories', listingType:'dealer' as const, sellerName:'Tactical HQ', calibre:'Holsters & Carry' },
  { id:'38', title:'Magpul CTR Carbine Stock - Mil-Spec', make:'Magpul', price:1800, province:'KZN', condition:'Good', category:'accessories', listingType:'private' as const, sellerName:'DBN North', calibre:'Stocks & Grips' },
  { id:'39', title:'Holosun HS507C X2 Red Dot', make:'Holosun', price:6500, province:'Free State', condition:'Brand New', category:'accessories', listingType:'dealer' as const, sellerName:'Bloem Optics', calibre:'Optics & Sights' },
  { id:'40', title:'SureFire X300 Ultra WeaponLight', make:'SureFire', price:5500, province:'Gauteng', condition:'Like New', category:'accessories', listingType:'private' as const, sellerName:'Centurion', calibre:'Lights & Lasers' },
  { id:'41', title:'Aimpoint Trijicon ACOG 4x32', make:'Trijicon', price:22000, province:'Eastern Cape', condition:'Fair', category:'accessories', listingType:'private' as const, sellerName:'PE Tactical', calibre:'Optics & Sights' },
];

export default function AccessoriesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Accessories</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Accessories</span>
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

            {/* Accessory Type / Category Filter */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Accessory Category</span>
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

            {/* Top Accessory Brands */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Aimpoint', 'Alien Gear', 'Ase Utra', 'BCM', 'Blackhawk', 'Burris', 'Bushnell', 
                  'Caldwell', 'Crimson Trace', 'Daniel Defense', 'EOTech', 'FAB Defense', 
                  'G-Code', 'Geissele', 'Hawke', 'Hogue', 'Holosun', 'Hoppe\'s', 'Hornady', 
                  'Leupold', 'Lyman', 'Magpul', 'Mec-Gar', 'Meopta', 'Nightforce', 'Olight', 
                  'Pelican', 'Plano', 'Primary Arms', 'RCBS', 'Real Avid', 'Safariland', 
                  'Sig Sauer Electro-Optics', 'SilencerCo', 'Spuhr', 'Streamlight', 'SureFire', 
                  'Swarovski', 'Trijicon', 'Troy Industries', 'Vortex Optics', 'Weaver', 'Zeiss', 'Other'
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
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Private Seller (👤)</span>
                </label>
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

          <div className="flex items-center justify-center gap-2 mt-8">
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">&lt;</button>
            <button className="w-10 h-10 flex items-center justify-center border border-[#C9922A] bg-[#C9922A]/10 rounded-sm text-[#C9922A] font-bold transition-all">1</button>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">2</button>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">3</button>
            <span className="text-[#8A8E99] px-2">...</span>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">&gt;</button>
          </div>

        </div>
      </div>
    </div>
  );
}
