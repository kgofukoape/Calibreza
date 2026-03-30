'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterSidebarProps {
  brands: string[];
  calibres: string[];
  provinces: string[];
}

export default function FilterSidebar({ brands, calibres, provinces }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get('brands')?.split(',').filter(Boolean) || []
  );
  const [selectedCalibres, setSelectedCalibres] = useState<string[]>(
    searchParams.get('calibres')?.split(',').filter(Boolean) || []
  );
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(
    searchParams.get('provinces')?.split(',').filter(Boolean) || []
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    searchParams.get('conditions')?.split(',').filter(Boolean) || []
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sellerTypes, setSellerTypes] = useState<string[]>(
    searchParams.get('sellerTypes')?.split(',').filter(Boolean) || []
  );

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (selectedBrands.length > 0) params.set('brands', selectedBrands.join(','));
    if (selectedCalibres.length > 0) params.set('calibres', selectedCalibres.join(','));
    if (selectedProvinces.length > 0) params.set('provinces', selectedProvinces.join(','));
    if (selectedConditions.length > 0) params.set('conditions', selectedConditions.join(','));
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sellerTypes.length > 0) params.set('sellerTypes', sellerTypes.join(','));
    
    router.push(`?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedCalibres([]);
    setSelectedProvinces([]);
    setSelectedConditions([]);
    setMinPrice('');
    setMaxPrice('');
    setSellerTypes([]);
    router.push('?');
  };

  const toggleArrayFilter = (value: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const conditions = ['Brand New', 'Like New', 'Good', 'Fair'];

  return (
    <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
      <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
          <button onClick={clearAllFilters} className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">
            Clear All
          </button>
        </div>

        {/* Brand Filter */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {brands.map(brand => (
              <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleArrayFilter(brand, selectedBrands, setSelectedBrands)}
                  className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] cursor-pointer"
                />
                <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Calibre Filter */}
        <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Calibre</span>
          <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {calibres.map(calibre => (
              <label key={calibre} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCalibres.includes(calibre)}
                  onChange={() => toggleArrayFilter(calibre, selectedCalibres, setSelectedCalibres)}
                  className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] cursor-pointer"
                />
                <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{calibre}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Province Filter */}
        <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Location</span>
          <div className="flex flex-col gap-2.5">
            {provinces.map(prov => (
              <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedProvinces.includes(prov)}
                  onChange={() => toggleArrayFilter(prov, selectedProvinces, setSelectedProvinces)}
                  className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] cursor-pointer"
                />
                <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Condition</span>
          <div className="flex flex-col gap-2.5">
            {conditions.map(cond => (
              <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(cond)}
                  onChange={() => toggleArrayFilter(cond, selectedConditions, setSelectedConditions)}
                  className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] cursor-pointer"
                />
                <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{cond}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Price Range</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min (R)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
            />
            <span className="text-[#8A8E99]">-</span>
            <input
              type="number"
              placeholder="Max (R)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
            />
          </div>
        </div>

        {/* Seller Type */}
        <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
          <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Seller Type</span>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={sellerTypes.includes('dealer')}
                onChange={() => toggleArrayFilter('dealer', sellerTypes, setSellerTypes)}
                className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] cursor-pointer"
              />
              <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Dealer Stock (🏪)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={sellerTypes.includes('private')}
                onChange={() => toggleArrayFilter('private', sellerTypes, setSellerTypes)}
                className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] cursor-pointer"
              />
              <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Private Licence (👤)</span>
            </label>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={applyFilters}
          style={{fontFamily:"'Barlow Condensed', sans-serif"}}
          className="w-full bg-[#C9922A] text-black font-bold text-[14px] tracking-[0.1em] uppercase py-3 rounded-[3px] hover:brightness-110 transition-all mt-2"
        >
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
