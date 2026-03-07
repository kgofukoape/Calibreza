import React from 'react';

export default function WishlistPage() {
  const savedItems = [
    { id: '1', title: 'Tikka T3x Tac A1', price: 'R 45,000', location: 'Pretoria', status: 'Available' },
    { id: '2', title: 'Vortex Viper PST Gen II', price: 'R 18,500', location: 'Cape Town', status: 'Price Dropped' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-wide text-[#F0EDE8]">
        MY <span className="text-[#C9922A]">WISHLIST</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedItems.map((item) => (
          <div key={item.id} className="bg-[#191C23] border border-white/5 p-6 rounded-sm flex flex-col gap-4 group hover:border-[#C9922A]/30 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-[#C9922A] font-bold uppercase tracking-widest block mb-1">{item.status}</span>
                <h3 className="text-lg font-bold text-[#F0EDE8]">{item.title}</h3>
              </div>
              <button className="text-[#8A8E99] hover:text-[#ff4d4d] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg>
              </button>
            </div>
            <div className="flex justify-between items-end mt-2">
              <span className="text-xl font-black text-[#F0EDE8]">{item.price}</span>
              <button className="bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-[#C9922A] hover:text-black transition-all">View Ad</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
