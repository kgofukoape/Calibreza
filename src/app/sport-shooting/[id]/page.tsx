import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function ClubProfilePage() {
  // In a real build, we would fetch data based on the URL ID. 
  // Here is the 'Majestic' Wattlespring / Tac Shac template data.
  const club = {
    name: "Wattlespring Gun Club",
    location: "Houghton, Johannesburg",
    province: "Gauteng",
    founded: "1994",
    affiliations: ["CTSASA", "NHSA", "FITASC"],
    disciplines: ["Clay Target", "Skeet", "Trap", "Sporting Clays", "FITASC"],
    facilities: ["Clay Trap", "Clay Skeet", "Sporting Clays Course", "Clubhouse", "Braai Facilities", "Ablutions", "Parking"],
    membership: { public: "Yes", required: "Yes", annualFee: "R4,500", dayFee: "R250" },
    matches: [
      { date: "2nd Saturday monthly", type: "Club Sporting Clays" },
      { date: "15 Oct 2026", type: "National Trap Championship" }
    ],
    about: "Wattlespring is South Africa's premier clay target destination. Known as 'Golf with a Shotgun', our world-class courses offer technically demanding targets in a beautiful Highveld setting."
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      
      {/* HERO BANNER */}
      <div className="h-[300px] md:h-[400px] bg-[#191C23] relative border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] to-transparent" />
        <div className="max-w-[1280px] mx-auto h-full flex items-end p-6 md:p-8 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#C9922A] text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">Verified Club</span>
              <span className="text-[#8A8E99] text-xs uppercase tracking-widest">{club.province}</span>
            </div>
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl md:text-7xl font-extrabold uppercase mb-2">{club.name}</h1>
            <p className="text-[#8A8E99] flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>{club.location}</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: ABOUT & DISCIPLINES */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold uppercase tracking-wide text-[#C9922A] mb-4">About the Club</h2>
            <p className="text-[#8A8E99] leading-relaxed text-lg">{club.about}</p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#F0EDE8] mb-4">Disciplines Offered</h3>
              <div className="flex flex-wrap gap-2">
                {club.disciplines.map(d => <span key={d} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm text-xs font-semibold">{d}</span>)}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#F0EDE8] mb-4">Range Facilities</h3>
              <ul className="grid grid-cols-1 gap-2">
                {club.facilities.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-[#8A8E99]">
                    <span className="w-1.5 h-1.5 bg-[#C9922A] rounded-full" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="bg-[#191C23] border border-white/5 rounded-md p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold uppercase tracking-wide text-[#F0EDE8] mb-6">Upcoming Matches</h2>
            <div className="flex flex-col gap-4">
              {club.matches.map((m, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0D0F13] p-4 rounded border border-white/5">
                  <div>
                    <p className="font-bold text-[#F0EDE8]">{m.type}</p>
                    <p className="text-xs text-[#8A8E99] uppercase tracking-widest">{m.date}</p>
                  </div>
                  <button className="text-[11px] font-bold text-[#C9922A] uppercase border border-[#C9922A]/30 px-4 py-2 hover:bg-[#C9922A] hover:text-black transition-all">Details</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: INFO BAR */}
        <aside className="flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9922A] mb-6">Membership Info</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[#8A8E99] text-sm">Annual Fee</span>
                <span className="font-bold text-[#F0EDE8]">{club.membership.annualFee}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[#8A8E99] text-sm">Day Visitor</span>
                <span className="font-bold text-[#F0EDE8]">{club.membership.dayFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8E99] text-sm">Founded</span>
                <span className="font-bold text-[#F0EDE8]">{club.founded}</span>
              </div>
            </div>
            <button className="w-full bg-[#C9922A] text-black font-bold uppercase tracking-widest py-4 mt-8 rounded-sm text-sm">Apply for Membership</button>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9922A] mb-4">Official Affiliations</h3>
            <div className="flex flex-wrap gap-2">
              {club.affiliations.map(a => <span key={a} className="text-[10px] font-bold text-[#8A8E99] border border-white/10 px-2 py-1">{a}</span>)}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
