'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const SERVICE_TYPES = [
  { id: '', label: 'All Services' },
  { id: 'gunsmith', label: '🔧 Gunsmiths' },
  { id: 'instructor', label: '🎯 Instructors' },
  { id: 'range', label: '⊕ Shooting Ranges' },
  { id: 'storage', label: '🔒 Firearm Storage' },
  { id: 'legal', label: '⚖️ Legal Services' },
  { id: 'other', label: '📋 Other' },
];

const PROVINCES = [
  'All Provinces', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const TYPE_ICONS: Record<string, string> = {
  gunsmith: '🔧', instructor: '🎯', range: '⊕',
  storage: '🔒', legal: '⚖️', other: '📋',
};

const TYPE_COLORS: Record<string, string> = {
  gunsmith: 'text-[#C9922A] border-[#C9922A]/20 bg-[#C9922A]/5',
  instructor: 'text-[#4CC9F0] border-[#4CC9F0]/20 bg-[#4CC9F0]/5',
  range: 'text-[#10B981] border-[#10B981]/20 bg-[#10B981]/5',
  storage: 'text-[#8B5CF6] border-[#8B5CF6]/20 bg-[#8B5CF6]/5',
  legal: 'text-[#F59E0B] border-[#F59E0B]/20 bg-[#F59E0B]/5',
  other: 'text-[#8A8E99] border-white/20 bg-white/5',
};

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('name');
    if (error) console.error('Services fetch error:', error);
    console.log('Services data:', data);
    setServices(data || []);
    setLoading(false);
  };

  const filtered = services.filter(s => {
    if (selectedType && s.type !== selectedType) return false;
    if (selectedProvince !== 'All Provinces' && s.province !== selectedProvince) return false;
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) &&
      !s.city?.toLowerCase().includes(search.toLowerCase()) &&
      !s.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* PAGE HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
                <Link href="/" className="hover:text-[#C9922A]">Home</Link>
                <span>/</span>
                <span className="text-[#F0EDE8]">Services</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tight">
                Firearm <span className="text-[#C9922A]">Services</span>
              </h1>
              <p className="text-[#8A8E99] text-sm mt-2 uppercase tracking-widest font-bold">
                Gunsmiths, instructors, ranges, storage and more across South Africa
              </p>
            </div>
            <Link href="/services/apply"
              className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
              + List Your Service
            </Link>
          </div>
        </div>
      </div>

      {/* LEADERBOARD AD */}
      <div className="w-full flex justify-center py-3 px-4 md:px-6">
        <div className="w-full max-w-[970px] h-[70px] md:h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* SERVICE TYPE TABS */}
      <div className="border-b border-white/5 bg-[#0D0F13] sticky top-[68px] md:top-[80px] z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
            {SERVICE_TYPES.map(type => (
              <button key={type.id} onClick={() => setSelectedType(type.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedType === type.id
                    ? 'bg-[#C9922A] text-black'
                    : 'bg-[#13151A] border border-white/10 text-[#8A8E99] hover:border-[#C9922A]/30 hover:text-[#F0EDE8]'
                }`}>
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6 flex gap-6">

        {/* LEFT AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-[140px] p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">

          {/* SEARCH + PROVINCE */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <input type="text" placeholder="Search services, city..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50" />
            <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
              className="bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50 appearance-none cursor-pointer">
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <p className="text-[12px] text-[#8A8E99] mb-4 uppercase tracking-widest font-bold">
            <span className="text-[#F0EDE8] font-black">{filtered.length}</span> service{filtered.length !== 1 ? 's' : ''} found
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
              <div className="text-5xl mb-4">🔧</div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">No services found</h3>
              <p className="text-[#8A8E99] text-sm mb-6">Be the first to list your service in this area</p>
              <Link href="/services/apply" className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
                List Your Service
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
              {filtered.map(service => (
                <div key={service.id} className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden hover:border-[#C9922A]/30 transition-all group">

                  {/* Cover */}
                  <div className="relative h-[140px] bg-[#191C23] overflow-hidden">
                    {service.cover_url ? (
                      <img src={service.cover_url} alt="" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-7xl opacity-5">{TYPE_ICONS[service.type] || '🔧'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13151A] to-transparent" />

                    {/* Logo */}
                    <div className="absolute bottom-3 left-4 w-12 h-12 rounded-sm border-2 border-[#13151A] overflow-hidden flex items-center justify-center shadow-lg"
                      style={{ background: service.logo_url ? 'transparent' : '#C9922A' }}>
                      {service.logo_url ? (
                        <img src={service.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-lg">
                          {service.name?.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Type badge */}
                    <div className={`absolute top-3 left-3 text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-wider border ${TYPE_COLORS[service.type] || TYPE_COLORS.other}`}>
                      {TYPE_ICONS[service.type]} {service.type}
                    </div>

                    {/* Featured / Verified */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {service.is_featured && (
                        <span className="bg-[#C9922A] text-black text-[9px] font-black px-2 py-0.5 rounded-sm uppercase">Featured</span>
                      )}
                      {service.is_verified && (
                        <span className="bg-[#2A9C6E] text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase">✓ Verified</span>
                      )}
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-4 pt-3">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-xl font-black uppercase tracking-tight text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors mb-1">
                      {service.name}
                    </h3>
                    <p className="text-[12px] text-[#8A8E99] mb-2">📍 {service.city}{service.province ? `, ${service.province}` : ''}</p>

                    {service.description && (
                      <p className="text-[12px] text-[#8A8E99] line-clamp-2 leading-relaxed mb-3">{service.description}</p>
                    )}

                    {service.specializations?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {service.specializations.slice(0, 3).map((s: string) => (
                          <span key={s} className="bg-[#0D0F13] border border-white/10 text-[#8A8E99] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">{s}</span>
                        ))}
                        {service.specializations.length > 3 && (
                          <span className="text-[#8A8E99] text-[9px] self-center font-bold">+{service.specializations.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        {service.phone && (
                          <a href={`tel:${service.phone}`} className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">
                            📞 Call
                          </a>
                        )}
                        {service.email && (
                          <a href={`mailto:${service.email}`} className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8]">
                            ✉ Email
                          </a>
                        )}
                      </div>
                      {service.website && (
                        <a href={service.website} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] transition-colors">
                          Website →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {!loading && (
            <div className="mt-10 bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-8 text-center">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-3">
                Are you a <span className="text-[#C9922A]">service provider?</span>
              </h2>
              <p className="text-[#8A8E99] text-sm mb-5 max-w-xl mx-auto">
                Gunsmiths, shooting instructors, legal consultants and storage facilities — list your service free and reach licensed firearm owners across South Africa.
              </p>
              <Link href="/services/apply"
                className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
                List Your Service — Free
              </Link>
            </div>
          )}
        </main>

        {/* RIGHT AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-[140px] p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>
      </div>
    </div>
  );
}