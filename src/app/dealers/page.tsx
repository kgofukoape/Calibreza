'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const PROVINCES = [
  "All Provinces",
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

export default function DealersDirectoryPage() {
  const [dealers, setDealers] = useState<any[]>([]);
  const [filteredDealers, setFilteredDealers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");

  useEffect(() => {
    const fetchDealers = async () => {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('status', 'approved')
        .order('business_name');
      
      if (!error && data) {
        setDealers(data);
        setFilteredDealers(data);
      }
      setLoading(false);
    };
    fetchDealers();
  }, []);

  useEffect(() => {
    if (selectedProvince === "All Provinces") {
      setFilteredDealers(dealers);
    } else {
      setFilteredDealers(dealers.filter(d => d.province === selectedProvince));
    }
  }, [selectedProvince, dealers]);

  const renderBadge = (tier: string) => {
    if (tier === 'premium') {
      return (
        <span className="absolute top-4 right-4 bg-[#C9922A] text-black text-[9px] font-black px-2 py-1 uppercase rounded-full">
          ⭐ PREMIUM
        </span>
      );
    } else if (tier === 'pro') {
      return (
        <span className="absolute top-4 right-4 bg-[#C9922A] text-black text-[9px] font-black px-2 py-1 uppercase rounded-full">
          ✓ PRO
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      
      <main className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4">
            OFFICIAL <span className="text-[#C9922A]">DEALERS</span>
          </h1>
          <p className="text-[#8A8E99] uppercase tracking-[0.3em] font-bold text-sm mb-12">
            Find verified firearm dealers across South Africa
          </p>

          {/* FILTER BAR */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-16">
            {PROVINCES.map((prov) => (
              <button
                key={prov}
                onClick={() => setSelectedProvince(prov)}
                style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                className={`px-5 py-2 text-[13px] font-black uppercase tracking-widest transition-all rounded-sm border ${
                  selectedProvince === prov 
                    ? 'bg-[#C9922A] border-[#C9922A] text-black' 
                    : 'bg-[#13151A] border-white/10 text-[#8A8E99] hover:border-white/30'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9922A]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDealers.length > 0 ? (
              filteredDealers.map((dealer) => (
                <Link 
                  key={dealer.id} 
                  href={`/dealers/${dealer.slug}`}
                  className="group bg-[#13151A] border border-white/5 p-8 rounded-sm hover:border-[#C9922A]/40 transition-all flex flex-col items-center text-center relative"
                >
                  {renderBadge(dealer.subscription_tier)}

                  <div className="w-24 h-24 bg-[#191C23] border border-white/10 mb-6 flex items-center justify-center overflow-hidden rounded-sm">
                    {dealer.logo_url ? (
                      <img src={dealer.logo_url} alt={dealer.business_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-[#C9922A]">{dealer.business_name?.charAt(0) || '?'}</span>
                    )}
                  </div>

                  <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-black uppercase mb-2 group-hover:text-[#C9922A] transition-colors">
                    {dealer.business_name}
                  </h2>

                  <p className="text-[#8A8E99] text-xs font-bold uppercase tracking-widest mb-4">
                    📍 {dealer.city}, {dealer.province}
                  </p>

                  {dealer.rating && (
                    <div className="flex items-center gap-1 mb-6">
                      <span className="text-[#C9922A]">⭐</span>
                      <span className="text-sm font-bold">{dealer.rating.toFixed(1)}</span>
                      <span className="text-[#8A8E99] text-xs">({dealer.review_count || 0})</span>
                    </div>
                  )}

                  <span className="text-[11px] font-black uppercase tracking-widest border border-white/10 px-6 py-2 group-hover:bg-white group-hover:text-black transition-all">
                    View Storefront
                  </span>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border border-dashed border-white/10 opacity-50">
                <p className="uppercase font-black tracking-widest text-[#8A8E89]">No dealers found in {selectedProvince}.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}