import React from 'react';
import Link from 'next/link';

interface ListingCardProps {
  id: string;
  title: string;
  make: string;
  price: number;
  province: string;
  condition: string;
  category: string;
  listingType: 'dealer' | 'private';
  sellerName: string;
  calibre?: string;
  featured?: boolean;
}

export default function ListingCard({
  id, title, make, price, province, condition, category, listingType, sellerName, calibre, featured
}: ListingCardProps) {
  
  // Format price to South African Rands (ZAR)
  const formattedPrice = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <Link href={`/listings/${id}`} className="flex flex-col bg-[#111318] border border-white/5 rounded-md overflow-hidden hover:border-[#C9922A]/50 hover:-translate-y-1 transition-all duration-300 group relative">
      
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-3 left-3 z-10 bg-[#C9922A] text-black text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm shadow-md">
          Featured
        </div>
      )}

      {/* Image Placeholder (Dark gradient with icon) */}
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#1F2330] to-[#0D0F13] border-b border-white/5 relative flex items-center justify-center overflow-hidden">
        <span className="text-4xl opacity-20 group-hover:scale-110 transition-transform duration-500">
          {category === 'pistols' ? '🔫' : category === 'rifles' ? '🎯' : '📷'}
        </span>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Card Content */}
      <div className="p-4 md:p-5 flex flex-col flex-1">
        
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] md:text-[20px] text-[#F0EDE8] leading-tight group-hover:text-[#C9922A] transition-colors line-clamp-2">
            {title}
          </h3>
        </div>
        
        <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-[22px] md:text-[24px] text-[#C9922A] mb-4">
          {formattedPrice}
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-5">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8A8E99] uppercase tracking-wider">Condition</span>
            <span className="text-[12px] text-[#F0EDE8]">{condition}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8A8E99] uppercase tracking-wider">Calibre</span>
            <span className="text-[12px] text-[#F0EDE8]">{calibre || 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#8A8E99] uppercase tracking-wider">Location</span>
            <span className="text-[12px] text-[#F0EDE8] truncate">{province}</span>
          </div>
        </div>

        {/* Footer (Seller Info) */}
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[14px] flex-shrink-0">
              {listingType === 'dealer' ? '🏪' : '👤'}
            </span>
            <span className="text-[11px] md:text-[12px] text-[#8A8E99] truncate">
              {sellerName}
            </span>
          </div>
          {listingType === 'dealer' && (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#2A9C6E]/10 flex items-center justify-center text-[8px] border border-[#2A9C6E]/30" title="Verified Dealer">
              ✓
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
