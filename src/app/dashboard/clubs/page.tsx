import React from 'react';

export default function ClubManagementPage() {
  const clubData = {
    name: "Tac Shac Shooting Club",
    status: "Verified",
    lastUpdated: "2 days ago",
    facilities: ["Indoor Pistol Range", "Tactical Bay", "Retail Store", "Gunsmithing"],
    upcomingMatches: [
      { date: "Mar 15", name: "League IPSC Handgun", entries: 45 },
      { date: "Mar 28", name: "SADPA Night Shoot", entries: 22 }
    ]
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-extrabold uppercase tracking-wide text-[#F0EDE8]">
          Club <span className="text-[#C9922A]">Management</span>
        </h1>
        <div className="flex gap-3">
           <button className="bg-white/5 text-[#F0EDE8] border border-white/10 text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-white/10 transition-all">Preview Profile</button>
           <button className="bg-[#C9922A] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:brightness-110 transition-all">Save Changes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN SETTINGS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#C9922A] mb-6">Profile Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-[#8A8E99]">Club Name</label>
                <input type="text" defaultValue={clubData.name} className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-[#8A8E99]">Primary Contact Email</label>
                <input type="email" defaultValue="info@tacshac.co.za" className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-6">
                <label className="text-[10px] font-bold uppercase text-[#8A8E99]">Club Description</label>
                <textarea rows={4} className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9922A] resize-none"></textarea>
            </div>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#C9922A] mb-6">Match Calendar</h3>
            <div className="flex flex-col gap-3">
              {clubData.upcomingMatches.map((match, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0D0F13] border border-white/5 p-4 rounded-sm">
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-white/5 px-3 py-1 rounded border border-white/5">
                      <span className="block text-[10px] font-bold uppercase text-[#C9922A]">{match.date.split(' ')[0]}</span>
                      <span className="block text-sm font-bold text-[#F0EDE8]">{match.date.split(' ')[1]}</span>
                    </div>
                    <span className="text-sm font-bold text-[#F0EDE8]">{match.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[11px] text-[#8A8E99] uppercase font-bold">{match.entries} Registered</span>
                    <button className="text-[#8A8E99] hover:text-[#C9922A] transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg></button>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 mt-4 border border-dashed border-white/10 rounded-sm text-[10px] font-bold uppercase text-[#8A8E99] hover:border-[#C9922A] hover:text-[#C9922A] transition-all">+ Add New Match Date</button>
            </div>
          </div>
        </div>

        {/* SIDEBAR TOOLS */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9922A] mb-4">Facility Status</h3>
            <div className="flex flex-col gap-3">
              {clubData.facilities.map(f => (
                <label key={f} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#2A9C6E] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all" />
                  <span className="text-xs text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{f}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#C9922A]/20 to-transparent border border-[#C9922A]/20 rounded-md p-6">
             <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📊</span>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F0EDE8]">Dealer Intelligence</h3>
             </div>
             <p className="text-[11px] text-[#8A8E99] leading-relaxed mb-4">Unlock advanced analytics including regional search trends and price benchmarking.</p>
             <button className="w-full bg-[#C9922A] text-black text-[10px] font-bold uppercase tracking-widest py-3 rounded-sm hover:brightness-110">Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  );
}
