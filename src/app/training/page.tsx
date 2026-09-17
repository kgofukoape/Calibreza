'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

const WEAPON_TYPES = ['Pistol', 'Rifle', 'Shotgun', 'Multi'];
const TRAINING_TYPES = ['Basic Competence', 'Defensive', 'CQB', 'Long Range', 'Competition', 'Other'];
const SKILL_LEVELS = ['Beginner / Competence', 'Intermediate', 'Advanced / Tactical'];

const skillBadge = (s: string) =>
  s === 'Advanced / Tactical' ? 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30'
  : s === 'Intermediate' ? 'bg-[#C9922A]/15 text-[#C9922A] border-[#C9922A]/30'
  : 'bg-[#2A9C6E]/15 text-[#2A9C6E] border-[#2A9C6E]/30';

export default function TrainingDirectoryPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fProvince, setFProvince] = useState('');
  const [fType, setFType] = useState('');
  const [fWeapon, setFWeapon] = useState('');
  const [fSkill, setFSkill] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const nowIso = new Date().toISOString();
    const [{ data: evs }, { data: provs }] = await Promise.all([
      supabase.from('training_events')
        .select('*, provinces:province_id(name)')
        .eq('status', 'active')
        .gte('date', nowIso)
        .order('date', { ascending: true }),
      supabase.from('provinces').select('*').order('name'),
    ]);
    setEvents(evs || []);
    setProvinces(provs || []);
    setLoading(false);
  };

  const filtered = events.filter(e => {
    if (fProvince && e.province_id !== fProvince) return false;
    if (fType && e.training_type !== fType) return false;
    if (fWeapon && e.weapon_type !== fWeapon) return false;
    if (fSkill && e.skill_level !== fSkill) return false;
    if (fFrom && new Date(e.date) < new Date(fFrom)) return false;
    if (fTo && new Date(e.date) > new Date(fTo + 'T23:59:59')) return false;
    return true;
  });

  const clear = () => { setFProvince(''); setFType(''); setFWeapon(''); setFSkill(''); setFFrom(''); setFTo(''); };
  const hasFilters = fProvince || fType || fWeapon || fSkill || fFrom || fTo;

  const fmt = (d: string) => new Date(d).toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const sel = "bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50";

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
              <Link href="/" className="hover:text-[#C9922A]">Home</Link><span>/</span>
              <span className="text-[#F0EDE8]">Training Days</span>
            </div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-6xl font-black uppercase tracking-tight">
              Training <span className="text-[#C9922A]">Days</span>
            </h1>
            <p className="text-[#8A8E99] text-sm mt-2 uppercase tracking-widest font-bold">
              Live-fire courses, clinics and defensive classes
            </p>
          </div>
          <Link href="/training/post"
            className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
            + Post a Training Day
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={fProvince} onChange={e => setFProvince(e.target.value)} className={sel}>
            <option value="">All provinces</option>
            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={fType} onChange={e => setFType(e.target.value)} className={sel}>
            <option value="">All training types</option>
            {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fWeapon} onChange={e => setFWeapon(e.target.value)} className={sel}>
            <option value="">All weapons</option>
            {WEAPON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fSkill} onChange={e => setFSkill(e.target.value)} className={sel}>
            <option value="">All skill levels</option>
            {SKILL_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} className={sel} title="From date" />
          <input type="date" value={fTo} onChange={e => setFTo(e.target.value)} className={sel} title="To date" />
          {hasFilters && (
            <button onClick={clear} className="text-[12px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] px-2">Clear</button>
          )}
        </div>

        {loading ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
            <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
            <div className="text-4xl mb-3 opacity-20">🎯</div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-[#F0EDE8] mb-1">
              {hasFilters ? 'No matching training days' : 'No upcoming training days yet'}
            </p>
            <p className="text-[#8A8E99] text-sm">
              {hasFilters ? 'Try adjusting your filters.' : 'Check back soon, or post your own course.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ev => (
              <Link key={ev.id} href={`/training/${ev.slug}`}
                className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden hover:border-[#C9922A]/30 transition-all group">
                <div className="relative h-[160px] bg-[#191C23] overflow-hidden">
                  {ev.cover_image
                    ? <img src={ev.cover_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-5xl opacity-10">🎯</div>}
                  <div className="absolute top-3 left-3 bg-black/70 text-[#F0EDE8] text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-wider">
                    {ev.weapon_type} · {ev.training_type}
                  </div>
                  <div className={`absolute top-3 right-3 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border ${skillBadge(ev.skill_level)}`}>
                    {ev.skill_level.split(' ')[0]}
                  </div>
                </div>
                <div className="p-4">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-tight text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors mb-1 line-clamp-1">
                    {ev.title}
                  </h3>
                  <p className="text-[12px] text-[#8A8E99] mb-2">{fmt(ev.date)}</p>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#8A8E99]">📍 {ev.provinces?.name || ev.city}</span>
                    <span className="text-[#C9922A] font-black">{ev.price > 0 ? `R${Number(ev.price).toLocaleString('en-ZA')}` : 'Free'}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-[#8A8E99] flex justify-between">
                    <span>{ev.total_slots} slots</span>
                    <span>{ev.rounds_required} rounds</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
