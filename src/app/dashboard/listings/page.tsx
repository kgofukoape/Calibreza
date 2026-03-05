import React from 'react';
import Link from 'next/link';

export default function MyListingsPage() {
  const myItems = [
    { id: '1', title: 'Glock 19 Gen 5', price: 'R 12,500', status: 'Active', views: 142, inquiries: 3 },
    { id: '2', title: 'Musgrave .308 Hunting Rifle', price: 'R 18,000', status: 'Active', views: 89, inquiries: 1 },
    { id: '3', title: 'CZ P-07 Kadet', price: 'R 8,500', status: 'Sold', views: 310, inquiries: 12 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-extrabold uppercase tracking-wide text-[#F0EDE8]">
          My <span className="text-[#C9922A]">Listings</span>
        </h1>
        <Link href="/sell" className="bg-[#C9922A] text-black text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
          + New Listing
        </Link>
      </div>

      <div className="bg-[#191C23] border border-white/5 rounded-md overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-4 bg-[#111318] p-4 border-b border-white/5">
          <span className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest">Item Details</span>
          <span className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest text-center">Status</span>
          <span className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest text-center">Stats</span>
          <span className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest text-right">Actions</span>
        </div>

        {/* Listings List */}
        <div className="flex flex-col">
          {myItems.map((item) => (
            <div key={item.id} className="grid grid-cols-4 p-5 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
              {/* Details */}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-[#F0EDE8]">{item.title}</span>
                <span className="text-xs text-[#C9922A] font-mono">{item.price}</span>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${
                  item.status === 'Active' ? 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/20' : 'bg-white/5 text-[#8A8E99] border border-white/10'
                }`}>
                  {item.status}
                </span>
              </div>

              {/* Stats */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-[#F0EDE8] font-bold">{item.views} Views</span>
                <span className="text-[10px] text-[#8A8E99] uppercase">{item.inquiries} Inquiries</span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button className="text-[10px] font-bold uppercase text-[#8A8E99] hover:text-[#C9922A] transition-colors">Edit</button>
                <button className="text-[10px] font-bold uppercase text-[#8A8E99] hover:text-[#ff4d4d] transition-colors">Delete</button>
                {item.status === 'Active' && (
                  <button className="text-[10px] font-bold uppercase text-[#C9922A] border border-[#C9922A]/30 px-2 py-1 hover:bg-[#C9922A] hover:text-black transition-all">
                    Mark Sold
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 bg-[#C9922A]/5 border border-[#C9922A]/10 rounded-md">
        <p className="text-xs text-[#8A8E99] leading-relaxed">
          <strong className="text-[#C9922A]">Pro Tip:</strong> Listings marked as <span className="text-[#F0EDE8]">Sold</span> stay on the platform for 30 days to help other users track market prices, but your contact details will be hidden.
        </p>
      </div>
    </div>
  );
}
