'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { id: '', label: 'All Services', icon: '🔍', color: 'text-[#F0EDE8]', subcategories: [] },
  {
    id: 'legal', label: 'Legal & Licensing', icon: '⚖️', color: 'text-[#F59E0B]',
    subcategories: ['Motivation Writers','Firearm Lawyers','Proficiency Centres','Record Clearance / Expungement','FCA Appeals','Licence Renewal Assistance'],
  },
  {
    id: 'gunsmith', label: 'Gunsmithing', icon: '🔧', color: 'text-[#C9922A]',
    subcategories: ['Master Gunsmiths','Cerakote & Finishing','Polymer Customization','Machining & Milling','Optic Cuts & Slide Milling','Trigger Jobs','Barrel Threading','Bluing & Restoration'],
  },
  {
    id: 'training', label: 'Training', icon: '🎯', color: 'text-[#4CC9F0]',
    subcategories: ['Tactical & EDC Training','Competition Coaching (IPSC / IDPA)','Long-Range / Precision Clinics','Medical / Stop-the-Bleed','Basic SAPS Competency','Low-Light Shooting','3-Gun Coaching','Vehicle Defense'],
  },
  {
    id: 'logistics', label: 'Logistics & Storage', icon: '🔒', color: 'text-[#8B5CF6]',
    subcategories: ['Licensed Storage Facilities','Deceased Estate Management','Firearm Valuators','Specialized Couriers','Insurance Appraisals'],
  },
  {
    id: 'hunting', label: 'Hunting & Field', icon: '🌿', color: 'text-[#10B981]',
    subcategories: ['Professional Hunters & Outfitters','Taxidermy','Meat Processing / Slaghuis','Guided Hunts','Trophy Management'],
  },
  {
    id: 'range', label: 'Ranges', icon: '🎯', color: 'text-[#2A9C6E]',
    subcategories: ['Indoor Range','Outdoor Range','Zeroing Lanes','Chronograph Testing'],
  },
  { id: 'other', label: 'Other', icon: '📋', color: 'text-[#8A8E99]', subcategories: [] },
];

const CAT_STYLES: Record<string, { badge: string; card: string }> = {
  legal:     { badge: 'text-[#F59E0B] border-[#F59E0B]/20 bg-[#F59E0B]/5',  card: 'hover:border-[#F59E0B]/30'  },
  gunsmith:  { badge: 'text-[#C9922A] border-[#C9922A]/20 bg-[#C9922A]/5',  card: 'hover:border-[#C9922A]/30'  },
  training:  { badge: 'text-[#4CC9F0] border-[#4CC9F0]/20 bg-[#4CC9F0]/5',  card: 'hover:border-[#4CC9F0]/30'  },
  logistics: { badge: 'text-[#8B5CF6] border-[#8B5CF6]/20 bg-[#8B5CF6]/5',  card: 'hover:border-[#8B5CF6]/30'  },
  hunting:   { badge: 'text-[#10B981] border-[#10B981]/20 bg-[#10B981]/5',  card: 'hover:border-[#10B981]/30'  },
  range:     { badge: 'text-[#2A9C6E] border-[#2A9C6E]/20 bg-[#2A9C6E]/5',  card: 'hover:border-[#2A9C6E]/30'  },
  other:     { badge: 'text-[#8A8E99] border-white/10 bg-white/5',           card: 'hover:border-white/20'       },
  instructor:{ badge: 'text-[#4CC9F0] border-[#4CC9F0]/20 bg-[#4CC9F0]/5',  card: 'hover:border-[#4CC9F0]/30'  },
  storage:   { badge: 'text-[#8B5CF6] border-[#8B5CF6]/20 bg-[#8B5CF6]/5',  card: 'hover:border-[#8B5CF6]/30'  },
};

const PROVINCES = [
  'All Provinces','Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape',
  'Free State','Limpopo','Mpumalanga','North West','Northern Cape',
];

const normalizeType = (t: string) => {
  if (t === 'instructor') return 'training';
  if (t === 'storage')    return 'logistics';
  return t;
};

export default function ServicesPage() {
  const [services, setServices]               = useState<any[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [selectedCat, setSelectedCat]         = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [search, setSearch]                   = useState('');
  const navRef                                = useRef<HTMLDivElement>(null);

  const activeCat = CATEGORIES.find(c => c.id === selectedCat);
  const hasSubcats = !!(activeCat && activeCat.subcategories.length > 0);

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('name');
    setServices(data || []);
    setLoading(false);
  };

  const filtered = services.filter(s => {
    const type = normalizeType(s.type || '');
    if (selectedCat && type !== selectedCat) return false;
    if (selectedProvince !== 'All Provinces' && s.province !== selectedProvince) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name?.toLowerCase().includes(q) && !s.city?.toLowerCase().includes(q) && !s.description?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const scrollCatIntoView = (id: string) => {
    setSelectedCat(id);
    setSearch('');
    if (navRef.current) {
      const btn = navRef.current.querySelector(`[data-cat="${id}"]`) as HTMLElement;
      if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HERO */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
                <Link href="/" className="hover:text-[#C9922A]">Home</Link>
                <span>/</span>
                <span className="text-[#F0EDE8]">Services</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
                Firearm <span className="text-[#C9922A]">Services</span>
              </h1>
              <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">
                Legal · Gunsmiths · Training · Storage · Hunting — across South Africa
              </p>
            </div>
            <Link href="/services/apply"
              className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
              + List Your Service
            </Link>
          </div>
        </div>
      </div>

      {/* STICKY WRAPPER — both navs in one fixed-height container to prevent shift */}
      <div className="sticky top-[80px] z-40 bg-[#0A0C10]">

        {/* CATEGORY NAV */}
        <div ref={navRef} className="border-b border-white/5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="flex gap-1 py-2 min-w-max">
              {CATEGORIES.map(cat => (
                <button key={cat.id} data-cat={cat.id} onClick={() => scrollCatIntoView(cat.id)}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    selectedCat === cat.id
                      ? 'bg-[#C9922A] text-black'
                      : 'bg-[#13151A] border border-white/10 text-[#8A8E99] hover:border-[#C9922A]/30 hover:text-[#F0EDE8]'
                  }`}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SUBCATEGORY STRIP — always rendered, shown/hidden via CSS to prevent layout shift */}
        <div className={`border-b border-white/5 bg-[#0D0F13] overflow-x-auto transition-all duration-200 ${hasSubcats ? 'max-h-[52px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden border-0'}`}
          style={{ scrollbarWidth: 'none' }}>
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-2 flex gap-2 min-w-max">
            {(activeCat?.subcategories || []).map(sub => (
              <button key={sub} onClick={() => setSearch(sub)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest border transition-all ${
                  search === sub
                    ? 'bg-[#C9922A]/20 border-[#C9922A]/40 text-[#C9922A]'
                    : 'border-white/10 text-[#8A8E99] hover:border-white/20 hover:text-[#F0EDE8]'
                }`}>
                {sub}
              </button>
            ))}
            {search && hasSubcats && (
              <button onClick={() => setSearch('')}
                className="flex-shrink-0 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AD */}
      <div className="w-full flex justify-center py-3 px-4">
        <div className="w-full max-w-[970px] h-[70px] md:h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative rounded-sm">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Advertisement — 970 × 90</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20 rounded-sm" />
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-6">

        {/* SEARCH + PROVINCE */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <input type="text"
              placeholder={`Search ${activeCat && activeCat.id ? activeCat.label.toLowerCase() : 'services'}, city, name...`}
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8E99] hover:text-white text-lg">×</button>
            )}
          </div>
          <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
            className="bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50 cursor-pointer">
            {PROVINCES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* RESULTS COUNT */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] text-[#8A8E99] uppercase tracking-widest font-bold">
            <span className="text-[#F0EDE8] font-black">{filtered.length}</span>{' '}
            {activeCat && activeCat.id ? activeCat.label.toLowerCase() : 'service'}
            {filtered.length !== 1 ? 's' : ''} found
            {selectedProvince !== 'All Provinces' && <span className="text-[#C9922A]"> · {selectedProvince}</span>}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
            <div className="text-5xl mb-4">{activeCat?.icon || '🔧'}</div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">
              No {activeCat?.label || 'services'} found
            </h3>
            <p className="text-[#8A8E99] text-sm mb-6">Be the first to list in this category</p>
            <Link href="/services/apply"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
              List Your Service
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(service => {
              const type  = normalizeType(service.type || 'other');
              const style = CAT_STYLES[type] || CAT_STYLES.other;
              const cat   = CATEGORIES.find(c => c.id === type);
              return (
                <div key={service.id}
                  className={`bg-[#13151A] border border-white/5 rounded-sm overflow-hidden transition-all group ${style.card}`}>

                  {/* Cover */}
                  <div className="relative h-[140px] bg-[#191C23] overflow-hidden">
                    {service.cover_url ? (
                      <img src={service.cover_url} alt="" className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-7xl opacity-5">{cat?.icon || '🔧'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13151A] to-transparent" />

                    {/* Logo */}
                    <div className="absolute bottom-3 left-4 w-12 h-12 rounded-sm border-2 border-[#13151A] overflow-hidden flex items-center justify-center shadow-lg"
                      style={{ background: service.logo_url ? 'transparent' : '#C9922A' }}>
                      {service.logo_url
                        ? <img src={service.logo_url} alt="" className="w-full h-full object-cover" />
                        : <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-lg">{service.name?.charAt(0)}</span>
                      }
                    </div>

                    {/* Type badge */}
                    <div className={`absolute top-3 left-3 text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-wider border ${style.badge}`}>
                      {cat?.icon} {cat?.label || type}
                    </div>

                    {/* Verified / Featured */}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {service.is_featured && <span className="bg-[#C9922A] text-black text-[9px] font-black px-2 py-0.5 rounded-sm uppercase">Featured</span>}
                      {service.is_verified  && <span className="bg-[#2A9C6E] text-white  text-[9px] font-black px-2 py-0.5 rounded-sm uppercase">✓ Verified</span>}
                    </div>
                  </div>

                  {/* Card body */}
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

                    {/* View Profile button */}
                    {service.slug && (
                      <Link href={`/services/${service.slug}`}
                        className="block w-full text-center bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A] font-black uppercase tracking-widest text-[11px] py-2 rounded-sm hover:bg-[#C9922A]/20 transition-all mb-3">
                        View Profile →
                      </Link>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        {service.phone && (
                          <a href={`tel:${service.phone}`} className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">📞 Call</a>
                        )}
                        {service.email && (
                          <a href={`mailto:${service.email}`} className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8]">✉ Email</a>
                        )}
                      </div>
                      {service.website && (
                        <a href={service.website.startsWith('http') ? service.website : `https://${service.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] transition-colors">
                          Website →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM CTA */}
        {!loading && (
          <div className="mt-10 bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-8 text-center">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-3">
              Are you a <span className="text-[#C9922A]">service provider?</span>
            </h2>
            <p className="text-[#8A8E99] text-sm mb-5 max-w-xl mx-auto">
              Gunsmiths, lawyers, instructors, storage facilities, hunters — list your service and reach thousands of licensed firearm owners across South Africa.
            </p>
            <Link href="/services/apply"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
              List Your Service — Free
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
