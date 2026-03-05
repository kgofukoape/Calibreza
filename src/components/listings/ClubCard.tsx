import React from 'react';
import Link from 'next/link';

interface ClubProps {
  id: string;
  title: string;
  town: string;
  province: string;
  disciplines: string[];
  affiliations: string[];
  featured?: boolean;
}

export default function ClubCard({ id, title, town, province, disciplines, affiliations, featured }: ClubProps) {
  return (
    <Link href={`/sport-shooting/${id}`} className={`group bg-[#191C23] border ${featured ? 'border-[#C9922A]/40' : 'border-white/5'} rounded-md overflow-hidden hover:border-[#C9922A]/60 transition-all flex flex-col h-full`}>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] text-[#C9922A] font-bold uppercase tracking-[0.15em] bg-[#C9922A]/10 px-2 py-1 rounded-sm">
            {featured ? '⭐ Premier Club' : 'Verified Club'}
          </span>
          <span className="text-[11px] text-[#8A8E99] font-medium">{province}</span>
        </div>
        
        <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-xl font-bold text-[#F0EDE8] uppercase leading-tight group-hover:text-[#C9922A] transition-colors mb-1">
          {title}
        </h3>
        <p className="text-[12px] text-[#8A8E99] mb-4 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {town}
        </p>

        <div className="mt-auto">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {disciplines.slice(0, 3).map(d => (
              <span key={d} className="text-[9px] bg-white/5 text-[#F0EDE8] px-2 py-0.5 rounded-sm uppercase font-semibold border border-white/5">{d}</span>
            ))}
            {disciplines.length > 3 && <span className="text-[9px] text-[#8A8E99] px-1">+{disciplines.length - 3} more</span>}
          </div>
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-[#8A8E99] uppercase font-bold tracking-wider">{affiliations[0]}</span>
            <span className="text-[#C9922A] text-[11px] font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">View Profile →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
