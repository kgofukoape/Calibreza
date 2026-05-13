import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Temporary Mock Data for Knives & Blades
const DEMO_LISTINGS = [
  { id:'58', title:'Chris Reeve Large Sebenza 31 (Titanium)', make:'Chris Reeve Knives', price:9500, province:'Gauteng', condition:'Like New', category:'knives', listingType:'private' as const, sellerName:'Pretoria EDC', calibre:'Folding Knives', featured:true },
  { id:'59', title:'Gareth Bull Shamwari 3" Chechen Wood', make:'Gareth Bull', price:18500, province:'Western Cape', condition:'Brand New', category:'knives', listingType:'private' as const, sellerName:'Cape Custom Blades', calibre:'EDC Knives' },
  { id:'60', title:'Spyderco Paramilitary 2 S30V G10', make:'Spyderco', price:3800, province:'KZN', condition:'Good', category:'knives', listingType:'dealer' as const, sellerName:'DBN Tactical', calibre:'Folding Knives' },
  { id:'61', title:'Leatherman Wave Plus Multi-Tool', make:'Leatherman', price:2400, province:'Free State', condition:'Brand New', category:'knives', listingType:'dealer' as const, sellerName:'Bloem Outdoor', calibre:'Multi-Tools' },
];

export default function KnivesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Knives & Blades</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Knives & EDC</span>
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

            {/* Knife Subcategory */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Category</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Folding Knives', 'Fixed Blade Knives', 'EDC (Everyday Carry) Knives', 
                  'Tactical & Military Knives', 'Hunting & Outdoor Knives', 
                  'Automatic / OTF Knives', 'Butterfly Knives (Balisong)', 'Multi-Tools', 
                  'Axes, Tomahawks & Machetes', 'Kitchen & Culinary Knives', 
                  'Swords & Fantasy Blades', 'Throwing Knives & Spears', 
                  'Knife Sharpening & Maintenance', 'Other'
                ].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE KNIFE BRANDS (SA Custom + International) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand / Maker</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Al Mar', 'André van Heerden (SA)', 'Angus Arbuckle / ARA (SA)', 'Benchmade', 'Boker', 
                  'Buck', 'Byrd', 'Chaves', 'Chris Reeve Knives', 'Civivi', 'Cold Steel', 
                  'Condor', 'CRKT', 'Demko', 'DMT', 'Esee', 'Estwing', 'Extrema Ratio', 
                  'Fox Knives', 'Francois Boonzaaier (SA)', 'Gareth Bull (SA)', 'Gerber', 
                  'Gränsfors Bruk', 'Harry Bosman (SA)', 'Heretic Knives', 'Hinderer', 'Hogue', 
                  'Jason Guthrie (SA)', 'Ka-Bar', 'Kershaw', 'Kizer', 'KME', 'Lansky', 
                  'Leatherman', 'Lionsteel', 'Master Cutlery', 'Microtech', 'MKM', 'Morakniv', 
                  'Ontario Knife Co', 'Owen Wood (SA)', 'Peter Bauchop (SA)', 'Piet Grey (SA)', 
                  'Protech', 'QSP', 'Real Steel', 'Regiment Blades (SA)', 'Rob Brown (SA)', 
                  'Ruike', 'Schrade', 'Sencut', 'Smith & Wesson Knives', 'SOG', 'Spartan Blades', 
                  'Spyderco', 'Todd Begg', 'TOPS Knives', 'Trevor Burger (SA)', 'United Cutlery', 
                  'Victorinox', 'Viper', 'WE Knife Company', 'Wicked Edge', 'Wiha', 'Work Sharp', 
                  'Zero Tolerance', 'Other SA Custom / Handmade', 'Other'
                ].map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Blade Material (Steel Type) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Blade Steel / Material</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'M390', '20CV', 'CPM-S90V', 'CPM-S35VN', 'CPM-S30V', 'Damascus', 
                  '154CM', 'VG-10', 'N690', 'D2', '14C28N', '440C', 
                  '1095 High Carbon', '1075 High Carbon', 'Stainless Steel (General)', 'Other'
                ].map(steel => (
                  <label key={steel} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{steel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Handle Material */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Handle Material</span>
              <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Titanium', 'Carbon Fibre', 'G10', 'Micarta', 'FRN/Nylon', 
                  'Aluminium', 'Stainless Steel', 'Wood', 'Bone/Horn', 'Rubber/Kraton', 'Other'
                ].map(handle => (
                  <label key={handle} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{handle}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lock Type */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Lock Type (Folding)</span>
              <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Frame Lock', 'Liner Lock', 'Axis Lock', 'Compression Lock', 
                  'Button Lock', 'Back Lock', 'Arc Lock', 'Slip Joint (No Lock)', 'Other'
                ].map(lock => (
                  <label key={lock} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{lock}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Opening Mechanism */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Opening Mechanism</span>
              <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Flipper', 'Manual Thumb Stud', 'Thumb Hole', 'Automatic (Button)', 
                  'OTF (Out The Front)', 'Assisted Opening', 'Balisong', 'Friction Folder', 'Other'
                ].map(open => (
                  <label key={open} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{open}</span>
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
                {['Brand New', 'Like New / Safe Queen', 'Good / Carried', 'Fair / User'].map(cond => (
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
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">670</strong> results for Knives & Blades</span>
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
