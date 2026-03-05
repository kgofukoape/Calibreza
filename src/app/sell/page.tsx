import React from 'react';
import Navbar from '@/components/layout/Navbar';

export default function SellPage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-[800px] mx-auto w-full px-6 py-12">
        <div className="mb-10">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl md:text-5xl font-extrabold uppercase text-[#F0EDE8] mb-2">
            Create <span className="text-[#C9922A]">New Listing</span>
          </h1>
          <p className="text-[#8A8E99]">Complete the details below to post your listing to the community.</p>
        </div>

        <form className="bg-[#191C23] border border-white/5 rounded-md p-8 flex flex-col gap-8">
          {/* Category Selection */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-widest text-[#C9922A]">Select Category</label>
            <select className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] outline-none focus:border-[#C9922A] appearance-none">
              <option>Pistols</option>
              <option>Rifles</option>
              <option>Shotguns</option>
              <option>Ammunition</option>
              <option>Reloading</option>
              <option>Accessories</option>
              <option>Knives & Blades</option>
            </select>
          </div>

          {/* Title & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-[#8A8E99]">Listing Title</label>
              <input type="text" placeholder="e.g. Glock 19 Gen 5 with Night Sights" className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-[#8A8E99]">Price (ZAR)</label>
              <input type="number" placeholder="0.00" className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-widest text-[#8A8E99]">Description</label>
            <textarea rows={5} placeholder="Describe the item, including round count, extras, and any wear..." className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] outline-none focus:border-[#C9922A] resize-none"></textarea>
          </div>

          {/* Location & Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-[#8A8E99]">Province</label>
              <select className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] outline-none focus:border-[#C9922A] appearance-none">
                <option>Gauteng</option>
                <option>Western Cape</option>
                <option>KwaZulu-Natal</option>
                <option>Free State</option>
                <option>Eastern Cape</option>
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-[#8A8E99]">Condition</label>
              <select className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] outline-none focus:border-[#C9922A] appearance-none">
                <option>Brand New</option>
                <option>Like New</option>
                <option>Good</option>
                <option>Fair</option>
              </select>
            </div>
          </div>

          <button type="submit" className="bg-[#C9922A] text-black font-bold uppercase tracking-[0.2em] py-5 rounded-sm mt-4 hover:brightness-110 transition-all">
            Post Listing
          </button>
        </form>
      </div>
    </div>
  );
}
