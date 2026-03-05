import React from 'react';

export default function DashboardOverview() {
  return (
    <div className="flex flex-col gap-8">
      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Listings', value: '12', color: '#C9922A' },
          { label: 'Unread Messages', value: '3', color: '#2A9C6E' },
          { label: 'Bounties Set', value: '2', color: '#3B82F6' },
          { label: 'Profile Views', value: '1,420', color: '#8A8E99' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <span className="block text-[10px] text-[#8A8E99] uppercase tracking-[0.2em] font-bold mb-2">{stat.label}</span>
            <span style={{ color: stat.color }} className="text-3xl font-bold font-mono">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-[#191C23] border border-white/5 rounded-md p-8">
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-bold uppercase tracking-wide text-[#F0EDE8] mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="bg-[#C9922A] text-black font-bold uppercase tracking-widest py-4 rounded-sm text-sm hover:brightness-110 transition-all">+ Post New Listing</button>
          <button className="bg-white/5 text-[#F0EDE8] border border-white/10 font-bold uppercase tracking-widest py-4 rounded-sm text-sm hover:bg-white/10 transition-all">+ Post Wanted Bounty</button>
          <button className="bg-white/5 text-[#F0EDE8] border border-white/10 font-bold uppercase tracking-widest py-4 rounded-sm text-sm hover:bg-white/10 transition-all">Verify My ID</button>
        </div>
      </div>

      {/* RECENT ACTIVITY MOCKUP */}
      <div className="bg-[#191C23] border border-white/5 rounded-md p-8">
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-bold uppercase tracking-wide text-[#F0EDE8] mb-6">Recent Activity</h3>
        <div className="flex flex-col gap-4">
          {[
            { msg: 'Inquiry received for "Glock 19 Gen 5"', time: '2 hours ago', icon: '💬' },
            { msg: 'Your Wanted Bounty "Somchem S365" was viewed', time: '5 hours ago', icon: '🎯' },
            { msg: 'Verification approved: Your profile is now active', time: '1 day ago', icon: '🛡️' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-[#0D0F13] border border-white/5 p-4 rounded-md">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm text-[#F0EDE8] font-medium">{item.msg}</p>
                <p className="text-[11px] text-[#8A8E99]">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
