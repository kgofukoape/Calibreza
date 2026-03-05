import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Comprehensive Directory Mock Data based on your PDF
const CLUB_DIRECTORY = [
  { id:'c1', title:'Tac Shac Shooting Club', make:'SAPSA / SADPA', price:1500, province:'Gauteng', condition:'Verified Club', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Sandton / Midrand', calibre:'Practical / Tactical', featured:true },
  { id:'c2', title:'Wattlespring Gun Club', make:'CTSASA / NHSA', price:4500, province:'Gauteng', condition:'Verified Club', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Houghton', calibre:'Clay Target / Skeet' },
  { id:'c3', title:'Frontier Shooting Range', make:'IPSC World Shoot Venue', price:250, province:'North West', condition:'landmark', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Matlosana', calibre:'Extreme Long Range' },
  { id:'c4', title:'Kraaifontein Sport Shooting Club', make:'WPPSA / SADPA', price:1200, province:'Western Cape', condition:'Verified Club', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Kraaifontein', calibre:'Multi-Discipline' },
  { id:'c5', title:'False Bay Sport Shooting Club', make:'SAPSA / 3GN', price:1800, province:'Western Cape', condition:'Verified Club', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Fish Hoek', calibre:'Outdoor / Long Range' },
  { id:'c6', title:'Port Elizabeth Rifle & Pistol Club', make:'PERPC', price:900, province:'Eastern Cape', condition:'Verified Club', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Greenbushes', calibre:'Steel Challenge' },
];

export default function SportShootingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Sport Shooting & Clubs</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Clubs, Ranges & <span className="text-[#C9922A]">Associations</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* DIRECTORY FILTERS */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
              <button className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">Clear All</button>
            </div>

            {/* Disciplines - Multi-select based on PDF data */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Disciplines</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'IPSC / SAPSA', 'IDPA / SADPA', 'MPDS (Multi-Platform)', 'ICORE (Revolver)', 
                  '3-Gun Nation', 'PRS / Long Range', 'NRL SA', 'Steel Challenge', 
                  'F-Class / Bisley', 'Metallic Silhouette', 'Trap / Skeet', 'Sporting Clays', 
                  'Cowboy Action (WSSA)', 'Air Rifle', 'Black Powder', 'Benchrest'
                ].map(disc => (
                  <label key={disc} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{disc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Governing Bodies / Affiliations */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Affiliations</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'SAPSA', 'SADPA', 'CTSASA', 'Natshoot / NHSA', 'SA Hunters (SAHGCA)', 
                  'FOSA', 'NARFO', 'SABU', 'SABSF', 'SAMSSA', 'SAARA', 'SACRA', 'XSSSA'
                ].map(body => (
                  <label key={body} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{body}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Range Facilities */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Facilities</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Indoor Pistol Range', 'Outdoor Pistol Bays', 'Rifle Range (100m)', 
                  'Rifle Range (200m+)', 'Long Range (300m+)', 'Kill House / CQB', 
                  'Clay Trap / Skeet', 'Sporting Clays Course', 'Steel Bays', 
                  'Clubhouse / Braai', 'Firearm Rental Available'
                ].map(fac => (
                  <label key={fac} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{fac}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Province Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Location</span>
              <div className="flex flex-col gap-2.5">
                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'].map(prov => (
                  <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* DIRECTORY RESULTS */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">215</strong> registered clubs & ranges</span>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Sort by:</span>
              <select style={{fontFamily:"'Barlow', sans-serif"}} className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] font-medium px-4 py-2 rounded-sm cursor-pointer outline-none focus:border-[#C9922A] appearance-none min-w-[140px]">
                <option>Alphabetical</option>
                <option>Most Reviewed</option>
                <option>Newest Listed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {CLUB_DIRECTORY.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8">
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">&lt;</button>
            <button className="w-10 h-10 flex items-center justify-center border border-[#C9922A] bg-[#C9922A]/10 rounded-sm text-[#C9922A] font-bold">1</button>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">2</button>
            <span className="text-[#8A8E99] px-2">...</span>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
