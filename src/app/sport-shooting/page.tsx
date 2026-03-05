import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Directory Mock Data for Clubs & Ranges
const DEMO_LISTINGS = [
  { id:'66', title:'Tac Shac Shooting Club', make:'SAPSA / SADPA', price:1500, province:'Gauteng', condition:'Club Membership', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Sandton', calibre:'Indoor Range / Practical', featured:true },
  { id:'67', title:'Frontier Shooting Range (Matlosana)', make:'World Shoot Venue', price:250, province:'North West', condition:'Day Visitor / Match', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Klerksdorp', calibre:'IPSC / Long Range' },
  { id:'68', title:'Wattlespring Gun Club', make:'CTSASA / FITASC', price:4500, province:'Gauteng', condition:'Club Membership', category:'sport-shooting', listingType:'private' as const, sellerName:'Houghton', calibre:'Clay Target / Skeet' },
  { id:'69', title:'False Bay Sport Shooting Club', make:'SAPSA / 3GN', price:1800, province:'Western Cape', condition:'Club Membership', category:'sport-shooting', listingType:'dealer' as const, sellerName:'Fish Hoek', calibre:'Practical / Long Range' },
];

export default function SportShootingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Sport Shooting Directory</span>
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

            {/* Entity Type Filter */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Listing Type</span>
              <div className="flex flex-col gap-2.5">
                {[
                  'Club / Association Listing', 'Match / Event Listing', 
                  'Range / Venue Listing', 'Coaching / Training Available', 
                  'Sponsorship / Team Opportunity', 'Equipment Wanted'
                ].map(type => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Shooting Disciplines */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Disciplines Supported</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'IPSC (Practical Shooting)', 'IDPA (Defensive Pistol)', 'MPDS', 
                  'ICORE (Revolver)', '3-Gun Nation', 'Steel Challenge', 'XSSSA (Extreme Steel)', 
                  'Pin Shooting', 'PRS / Long Range', 'NRL (National Rifle League)', 
                  'Benchrest', 'F-Class / Bisley', 'Metallic Silhouette', 'Clay Target - Trap', 
                  'Clay Target - Skeet', 'Sporting Clays', 'Cowboy Action / WSSA', 
                  'Air Rifle', 'Muzzleloader / Black Powder', 'Informal / Recreational'
                ].map(discipline => (
                  <label key={discipline} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{discipline}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Affiliations & Governing Bodies */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Affiliations</span>
              <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'SAPSA (IPSC)', 'SADPA (IDPA)', 'CTSASA (Clays)', 'Natshoot (NHSA)', 
                  'SA Hunters (SAHGCA)', 'FOSA', 'NARFO', 'SABU (Bisley)', 'SABSF (Benchrest)', 
                  'SAMSSA (Silhouette)', 'WSSA (Western)', 'SAARA (Air Rifle)', 'SACRA (Combat Rifle)'
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
              <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Indoor Pistol Range', 'Outdoor Pistol Bays', 'Rifle Range (100m)', 
                  'Rifle Range (200m+)', 'Long Range (300m+)', 'Kill House / CQB', 
                  'Clay Trap / Skeet', 'Sporting Clays Course', 'Steel Bays', 
                  'Covered Benches', 'Clubhouse / Braai Facilities', 'Firearm Rental On-Site'
                ].map(facility => (
                  <label key={facility} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{facility}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Province Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Location</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape', 'National'].map(prov => (
                  <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">215</strong> registered clubs & ranges</span>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Sort by:</span>
              <select style={{fontFamily:"'Barlow', sans-serif"}} className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] font-medium px-4 py-2 rounded-sm cursor-pointer outline-none focus:border-[#C9922A] appearance-none min-w-[140px]">
                <option>Alphabetical</option>
                <option>Most Reviewed</option>
                <option>Recently Active</option>
              </select>
            </div>
          </div>

          {/* Directory Listings */}
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
