'use client';

import { useState, useRef, useEffect } from 'react';

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: { address: string; lat: number; lng: number; city: string; province: string }) => void;
  placeholder?: string;
  label?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address...',
  label = 'Address',
}: AddressAutocompleteProps) {
  const [results, setResults]     = useState<AddressResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef                = useRef<NodeJS.Timeout>();
  const wrapperRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = async (query: string) => {
    if (query.length < 3) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', South Africa')}&format=json&addressdetails=1&limit=5&countrycodes=za`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setResults(data || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string) => {
    onChange(val);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (result: AddressResult) => {
    const city = result.address.city || result.address.town || result.address.suburb || '';
    const province = result.address.state || '';
    onChange(result.display_name);
    setShowDropdown(false);
    setResults([]);
    onSelect({
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      city,
      province,
    });
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50 transition-colors pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-[#13151A] border border-white/10 rounded-sm shadow-[0_8px_32px_rgba(0,0,0,0.6)] mt-1 overflow-hidden">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 text-[13px] text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8] transition-all border-b border-white/5 last:border-0 flex items-start gap-2">
              <span className="text-[#C9922A] flex-shrink-0 mt-0.5">📍</span>
              <span className="leading-tight">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {showDropdown && results.length === 0 && !loading && value.length >= 3 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-[#13151A] border border-white/10 rounded-sm shadow-lg mt-1 px-4 py-3">
          <p className="text-[12px] text-[#8A8E99]">No addresses found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}
