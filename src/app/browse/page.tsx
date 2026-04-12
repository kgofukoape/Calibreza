'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const CATEGORIES = [
  {
    title: 'Firearms',
    items: [
      { name: 'Pistols', slug: 'pistols', icon: '🔫' },
      { name: 'Rifles', slug: 'rifles', icon: '🎯' },
      { name: 'Shotguns', slug: 'shotguns', icon: '🏹' },
      { name: 'Revolvers', slug: 'revolvers', icon: '🎡' },
    ]
  },
  {
    title: 'Blades',
    items: [
      { name: 'Knives', slug: 'knives', icon: '🔪' },
    ]
  },
  {
    title: 'Air Guns',
    items: [
      { name: 'Air Rifles', slug: 'air-guns', icon: '💨' },
      { name: 'Airsoft', slug: 'airsoft', icon: '⚡' },
    ]
  },
  {
    title: 'Gear & Accessories',
    items: [
      { name: 'Holsters & Carry', slug: 'holsters', icon: '💼' },
      { name: 'Magazines', slug: 'magazines', icon: '🗂️' },
      { name: 'Ammunition', slug: 'ammunition', icon: '📦' },
      { name: 'Reloading', slug: 'reloading', icon: '⚖️' },
    ]
  },
  {
    title: 'Community',
    items: [
      { name: 'Wanted Ads', slug: 'wanted', icon: '🔍', href: '/wanted' },
      { name: 'Clubs & Ranges', slug: 'clubs', icon: '⊕', href: '/clubs' },
      { name: 'Services', slug: 'services', icon: '🔧', href: '/services' },
      { name: 'Industry Jobs', slug: 'jobs', icon: '💼', href: '/jobs' },
    ]
  },
];

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      {/* LEADERBOARD AD */}
      <div className="w-full flex justify-center py-3 px-4 md:px-6">
        <div className="w-full max-w-[970px] h-[70px] md:h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* MAIN */}
      <div className="flex gap-6 max-w-[1400px] mx-auto px-4 md:px-6 py-6">

        {/* LEFT AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6 p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="mb-10">
            <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
              <Link href="/" className="hover:text-[#C9922A]">Home</Link>
              <span>/</span>
              <span className="text-[#F0EDE8]">Browse</span>
            </div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
              Browse By <span className="text-[#C9922A]">Category</span>
            </h1>
            <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">South Africa's premier firearms marketplace</p>
          </header>

          <div className="space-y-12">
            {CATEGORIES.map(group => (
              <div key={group.title}>
                <h2 className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em] mb-5 border-b border-white/5 pb-3">
                  {group.title}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {group.items.map(item => (
                    <Link
                      key={item.slug}
                      href={item.href || `/browse/${item.slug}`}
                      className="group relative h-[160px] md:h-[180px] bg-[#13151A] border border-white/5 flex flex-col items-center justify-center overflow-hidden hover:border-[#C9922A]/40 transition-all rounded-sm">
                      <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-500">{item.icon}</span>
                      <h3 className="font-black uppercase tracking-widest text-[12px] group-hover:text-[#C9922A] transition-colors text-center px-2">{item.name}</h3>
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C9922A] scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* RIGHT AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-6 p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>
      </div>
    </div>
  );
}