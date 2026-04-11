'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const categoryGroups = [
  {
    title: 'Firearms',
    items: [
      { name: 'Pistols', slug: 'pistols', image: '🔫' },
      { name: 'Rifles', slug: 'rifles', image: '🎯' },
      { name: 'Shotguns', slug: 'shotguns', image: '🏹' },
      { name: 'Revolvers', slug: 'revolvers', image: '🎡' },
    ]
  },
  {
    title: 'Edged Weapons',
    items: [
      { name: 'Knives', slug: 'knives', image: '🔪' },
    ]
  },
  {
    title: 'Air Guns',
    items: [
      { name: 'Air Rifles', slug: 'air-guns', image: '💨' },
      { name: 'Airsoft', slug: 'airsoft', image: '🔋' },
    ]
  },
  {
    title: 'Gear & Accessories',
    items: [
      { name: 'Holsters', slug: 'holsters', image: '💼' },
      { name: 'Magazines', slug: 'magazines', image: '🖇️' },
      { name: 'Ammunition', slug: 'ammunition', image: '📦' },
      { name: 'Reloading', slug: 'reloading', image: '⚖️' },
    ]
  }
];

// Mock data for the auto-scrolling reel
const featuredListings = [
  { id: 1, title: 'Glock 17 Gen 5', price: '12,500', loc: 'GP', cat: 'Pistols' },
  { id: 2, title: 'Folding Karambit', price: '1,200', loc: 'WC', cat: 'Knives' },
  { id: 3, title: '9mm PMP Ammo', price: '450', loc: 'KZN', cat: 'Ammo' },
  { id: 4, title: 'CZ P-07 Kadet', price: '9,800', loc: 'LP', cat: 'Pistols' },
  { id: 5, title: 'Leather OWB Holster', price: '850', loc: 'EC', cat: 'Gear' },
  { id: 6, title: 'Tikka T3x 6.5 CM', price: '24,000', loc: 'NW', cat: 'Rifles' },
  { id: 7, title: 'Gas Blowback Pistol', price: '3,200', loc: 'FS', cat: 'Airsoft' },
  { id: 8, title: 'Buck Fixed Blade', price: '2,100', loc: 'NC', cat: 'Knives' },
];

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] overflow-x-hidden">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-20">
        <header className="mb-16">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
            Browse By <span className="text-[#C9922A]">Category</span>
          </h1>
          <p className="text-[#8A8E99] text-[14px] uppercase tracking-widest font-bold">The ultimate directory for South African enthusiasts</p>
        </header>

        {/* CATEGORY GRID */}
        <div className="space-y-20">
          {categoryGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-[#C9922A] text-[12px] font-black uppercase tracking-[0.4em] mb-8 border-b border-white/5 pb-4">
                {group.title}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
                {group.items.map((item) => (
                  <Link 
                    key={item.slug} 
                    href={`/browse/${item.slug}`}
                    className="group relative h-[220px] bg-[#191C23] border border-white/5 flex flex-col items-center justify-center overflow-hidden hover:border-[#C9922A]/40 transition-all rounded-sm shadow-xl"
                  >
                    <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">{item.image}</span>
                    <h3 className="font-bold uppercase tracking-widest text-[14px] group-hover:text-[#C9922A]">{item.name}</h3>
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C9922A] scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AUTOMATIC FEATURED REEL */}
        <section className="mt-32 pt-20 border-t border-white/5 relative">
          <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-black uppercase tracking-tight mb-12">
            Live <span className="text-[#C9922A]">Listings Feed</span>
          </h2>

          <div className="relative w-full overflow-hidden">
            {/* The Scrolling Container */}
            <div className="flex gap-4 animate-scroll whitespace-nowrap">
              {/* Render items twice for infinite effect */}
              {[...featuredListings, ...featuredListings].map((item, idx) => (
                <div 
                  key={idx} 
                  className="min-w-[210px] w-[210px] bg-[#191C23] border border-white/5 p-3 rounded-sm hover:border-[#C9922A]/50 transition-all cursor-pointer group shrink-0"
                >
                  <div className="aspect-[4/3] bg-[#0D0F13] mb-3 relative overflow-hidden">
                    <div className="absolute top-2 left-2 bg-[#C9922A] text-black text-[8px] font-black px-1.5 py-0.5 uppercase tracking-tighter z-10">
                      {item.cat}
                    </div>
                    <div className="w-full h-full opacity-20 bg-gradient-to-tr from-orange-500/10 to-transparent group-hover:opacity-40 transition-opacity" />
                  </div>
                  <h4 className="font-bold text-[12px] uppercase mb-1 truncate text-[#F0EDE8]">{item.title}</h4>
                  <p className="text-[#C9922A] font-black text-md mb-1">R {item.price}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] text-[#8A8E99] uppercase tracking-widest font-bold">{item.loc} • PRIVATE</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <style jsx global>{`
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-210px * 8 - 1rem * 8)); }
            }
            .animate-scroll {
              animation: scroll 30s linear infinite;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </section>
      </main>
    </div>
  );
}