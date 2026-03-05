import React from 'react';
import Navbar from '@/components/layout/Navbar';

export default function CommandCenterPage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col">
      <Navbar />
      
      {/* PRO HEADER */}
      <div className="bg-[#191C23] border-b border-[#C9922A]/20 py-10 px-6 md:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#C9922A] text-black text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">Pro Organization</span>
              <span className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">Admin Portal</span>
            </div>
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl md:text-5xl font-extrabold uppercase text-[#F0EDE8]">
              Tac Shac <span className="text-[#C9922A]">Command Center</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <button className="bg-white/5 border border-white/10 text-[#F0EDE8] px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Public Profile</button>
            <button className="bg-[#C9922A] text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all">Manage Range</button>
          </div>
        </div>
      </div>

      <main className="max-w-[1440px] mx-auto w-full p-6 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* STATS FOR PROFESSIONALS */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Profile Views', value: '8,421', trend: '+12% this month' },
            { label: 'Leads Generated', value: '42', trend: 'Direct Inquiries' },
            { label: 'Match Entries', value: '156', trend: 'Active Bookings' },
            { label: 'Market Rank', value: '#4', trend: 'Gauteng Region' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#191C23] border border-white/5 p-6 rounded-md">
              <span className="block text-[10px] text-[#8A8E99] uppercase tracking-widest font-bold mb-2">{stat.label}</span>
              <span className="block text-2xl font-bold text-[#F0EDE8] mb-1">{stat.value}</span>
              <span className="text-[10px] text-[#C9922A] font-bold uppercase tracking-widest">{stat.trend}</span>
            </div>
          ))}
        </div>

        {/* LEFT: CLUB OPERATIONS */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold uppercase tracking-wide text-[#F0EDE8] mb-6">Range Operations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Match Management Mockup */}
               <div className="bg-[#0D0F13] border border-white/5 p-5 rounded-sm">
                  <span className="text-[10px] text-[#C9922A] font-bold uppercase tracking-widest block mb-4">Upcoming Events</span>
                  <p className="text-sm font-bold text-[#F0EDE8] mb-1">IPSC League Shoot #4</p>
                  <p className="text-xs text-[#8A8E99] mb-4">Saturday, 22 March 2026</p>
                  <button className="w-full py-2 bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-[#F0EDE8]">Manage Entries</button>
               </div>
               <div className="bg-[#0D0F13] border border-white/5 p-5 rounded-sm">
                  <span className="text-[10px] text-[#C9922A] font-bold uppercase tracking-widest block mb-4">Venue Alerts</span>
                  <p className="text-sm font-bold text-[#F0EDE8] mb-1">Range 2 Maintenance</p>
                  <p className="text-xs text-[#8A8E99] mb-4">Berms being rebuilt - Closed 12-14th</p>
                  <button className="w-full py-2 bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-[#F0EDE8]">Post Alert</button>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT: MARKET INTELLIGENCE (The "Hook") */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-[#C9922A]/20 to-[#191C23] border border-[#C9922A]/20 rounded-md p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9922A] mb-4">Market Intelligence</h3>
            <div className="space-y-4 mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#8A8E99] uppercase">Trending Hunt</span>
                <span className="text-sm font-bold text-[#F0EDE8]">Somchem S365 (Gauteng)</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#8A8E99] uppercase">Supply Gap</span>
                <span className="text-sm font-bold text-[#F0EDE8]">9mm Reloading Dies</span>
              </div>
            </div>
            <button className="w-full bg-[#C9922A] text-black text-[10px] font-bold uppercase tracking-widest py-4 rounded-sm">Get Full Data Report</button>
          </div>
        </div>
      </main>
    </div>
  );
}
