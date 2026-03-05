import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ClubCard from '@/components/listings/ClubCard';

const CLUBS = [
  // GAUTENG
  { id:'ts1', title:'Tac Shac Shooting Club', town:'Sandton / Midrand', province:'Gauteng', disciplines:['IPSC','IDPA','PCC','Practical'], affiliations:['SAPSA','SADPA'], featured:true },
  { id:'ws1', title:'Wattlespring Gun Club', town:'Houghton', province:'Gauteng', disciplines:['Skeet','Trap','Sporting Clays'], affiliations:['CTSASA','NHSA'], featured:true },
  { id:'vk1', title:'Vektor Shooting Club', town:'Centurion', province:'Gauteng', disciplines:['IPSC 3-Gun','Handgun','Rifle','Shotgun'], affiliations:['SAPSA'] },
  { id:'gc1', title:'Golden City Shooting Club', town:'Vereeniging', province:'Gauteng', disciplines:['IPSC','IDPA','Rifle','Hunting Sim'], affiliations:['SAPSA','SADPA'] },
  { id:'rk1', title:'Rooikraal Shooting Club', town:'Pretoria East', province:'Gauteng', disciplines:['IPSC','IDPA'], affiliations:['SAPSA'] },
  { id:'er1', title:'East Rand Shooting Club (ERSC)', town:'Benoni', province:'Gauteng', disciplines:['Handgun','Rifle','Shotgun'], affiliations:['SAPSA'] },
  { id:'lr1', title:'Long Range Shooting Club (LRSC)', town:'Krugersdorp', province:'Gauteng', disciplines:['Long Range','Precision'], affiliations:['SAPRF'] },
  
  // WESTERN CAPE
  { id:'kr1', title:'Kraaifontein Sport Shooting Club', town:'Kraaifontein', province:'Western Cape', disciplines:['IPSC','SADPA','Steel Challenge','3-Gun'], affiliations:['WPPSA','SADPA'] },
  { id:'fb1', title:'False Bay Sport Shooting Club', town:'Fish Hoek', province:'Western Cape', disciplines:['Practical','Handgun','Rifle','Long Range'], affiliations:['SAPSA','3GN SA'] },
  { id:'ds1', title:'Durbanville Shooting Club', town:'Durbanville', province:'Western Cape', disciplines:['Rifle','Handgun','Long Range'], affiliations:['SAGA'] },
  
  // KZN
  { id:'ih1', title:'Ihawu Shooting Club', town:'New Germany', province:'KZN', disciplines:['Practical','Handgun','General'], affiliations:['SADPA','NHSA'] },
  { id:'im1', title:'Impala Shooting Club', town:'Glenwood', province:'KZN', disciplines:['Practical','General'], affiliations:['SAPSA'] },

  // EASTERN CAPE
  { id:'pe1', title:'Port Elizabeth Rifle & Pistol Club', town:'Greenbushes', province:'Eastern Cape', disciplines:['IPSC','Steel Challenge','Big Bore','Cowboy Action'], affiliations:['SAPSA','WSSA'] },

  // NORTH WEST
  { id:'fr1', title:'Frontier Shooting Range', town:'Matlosana', province:'North West', disciplines:['IPSC','Long Range','Handgun'], affiliations:['SAPSA','World Shoot Venue'], featured:true },
  
  // MPUMALANGA
  { id:'wt1', title:'Witbank Practical Shooting Club', town:'eMalahleni', province:'Mpumalanga', disciplines:['Practical','IPSC'], affiliations:['SAPSA'] },
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
            <span className="text-[#F0EDE8]">Clubs & Ranges</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Shooting <span className="text-[#C9922A]">Club Directory</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-[280px] flex-shrink-0">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8] border-b border-white/5 pb-4">Province</span>
            <div className="flex flex-col gap-3">
              {['Gauteng','Western Cape','KZN','Eastern Cape','Free State','North West','Mpumalanga','Limpopo','Northern Cape'].map(p => (
                <label key={p} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all" />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{p}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-4 flex justify-between items-center">
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">{CLUBS.length}</strong> registered venues</span>
            <select className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] px-4 py-2 rounded-sm outline-none cursor-pointer">
              <option>Alphabetical</option>
              <option>Recently Active</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {CLUBS.map(club => (
              <ClubCard key={club.id} {...club} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
