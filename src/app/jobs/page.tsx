'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AdBanner from '@/components/AdBanner';

const JOB_TYPES = [{ id: '', label: 'All Jobs' }, { id: 'Retail / Sales', label: '🏪 Retail / Sales' }, { id: 'Gunsmithing', label: '🔧 Gunsmithing' }, { id: 'Instruction / Training', label: '🎯 Instruction' }, { id: 'Security / PSIRA', label: '🛡️ Security / PSIRA' }, { id: 'Compliance / Admin', label: '📋 Compliance' }, { id: 'Other', label: '📦 Other' }];
const PROVINCES = ['All Provinces', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'National / Remote'];
const INDUSTRY_CERTIFICATIONS = ['Handgun', 'Rifle', 'Shotgun', 'SLR', 'Competency to Trade', 'Gunsmith Certificate', 'PSIRA Grade A', 'PSIRA Grade B/C', 'SASSETA Assessor', 'Range Officer (SAIRO)'];

export default function JobsPage() {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [selectedComps, setSelectedComps] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      const { data: liveJobs, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('status', 'active')
        .order('is_boosted', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!error && liveJobs) setJobs(liveJobs);
      setLoading(false);
    }
    loadData();
  }, []);

  const toggleComp = (comp: string) => setSelectedComps(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]);

  const filtered = jobs.filter(j => {
    if (selectedType && j.category !== selectedType) return false;
    if (selectedProvince !== 'All Provinces' && !j.location.includes(selectedProvince)) return false;
    const jobComps = j.fca_competencies_required || [];
    if (selectedComps.length > 0 && !selectedComps.every(c => jobComps.includes(c))) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col font-sans">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#12141A] border-b border-white/5 px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-6xl font-black uppercase tracking-tight">Industry <span className="text-[#C9922A]">Jobs</span></h1>
            <p className="text-[#8A8E99] text-sm mt-2 uppercase tracking-widest font-bold">Exclusive careers in the South African firearms ecosystem</p>
          </div>
          <Link href="/jobs/post" className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3.5 rounded-full hover:brightness-110 transition-all shadow-lg shadow-[#C9922A]/20">+ Post a Job</Link>
        </div>
      </div>

      {/* LEADERBOARD TOP */}
      <div className="w-full flex justify-center py-3 px-4">
        <AdBanner slot="leaderboard_top" page="jobs_board" />
      </div>

      {/* TABS (PILL DESIGN) */}
      <div className="border-b border-white/5 bg-[#0D0F13] sticky top-[80px] z-30 shadow-md">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
            {JOB_TYPES.map(type => (
              <button key={type.id || 'all'} onClick={() => setSelectedType(type.id)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedType === type.id ? 'bg-[#C9922A] text-black shadow-md shadow-[#C9922A]/20' : 'bg-[#161920] border border-white/5 text-[#8A8E99] hover:bg-white/5 hover:text-[#F0EDE8]'}`}>
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-8">

        {/* LEFT FILTERS */}
        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-4">
          <input type="text" placeholder="Search keywords..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#161920] border border-white/5 rounded-full px-5 py-3 text-[13px] focus:outline-none focus:border-[#C9922A]/50 transition-colors" />
          <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} className="w-full bg-[#161920] border border-white/5 rounded-full px-5 py-3 text-[13px] focus:outline-none appearance-none">
            {PROVINCES.map(p => <option key={p}>{p}</option>)}
          </select>
          <div className="bg-[#161920] border border-white/5 rounded-2xl p-5 mt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Filter by Certification</p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_CERTIFICATIONS.map(comp => (
                <button key={comp} onClick={() => toggleComp(comp)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${selectedComps.includes(comp) ? 'bg-[#C9922A] text-black' : 'bg-[#0D0F13] border border-white/5 text-[#8A8E99] hover:border-white/20'}`}>{comp}</button>
              ))}
            </div>
          </div>

          {/* SQUARE CARD AD — below filters */}
          <div className="flex justify-center mt-2">
            <AdBanner slot="square_card" page="jobs_board" />
          </div>
        </div>

        {/* RIGHT GRID */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <p className="text-[#8A8E99] font-bold text-sm uppercase tracking-widest">{filtered.length} <span className="text-[#F0EDE8]">Jobs Found</span></p>
          </div>

          {loading ? (
             <div className="py-20 text-center text-[#8A8E99] animate-pulse font-bold uppercase tracking-widest text-sm">Loading jobs...</div>
          ) : filtered.length === 0 ? (
             <div className="py-20 text-center">
               <div className="text-6xl mb-4">💼</div>
               <h3 className="text-2xl font-black uppercase text-white mb-2">No Matches Found</h3>
               <p className="text-[#8A8E99] text-sm">Try adjusting your filters or search terms.</p>
             </div>
          ) : (
            <>
              {/* LEADERBOARD MID — above grid */}
              <div className="flex justify-center mb-6">
                <AdBanner slot="leaderboard_mid" page="jobs_board" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 pb-20">
                {filtered.map(job => (
                  <div key={job.id} className="relative group">

                    {/* BASE CARD */}
                    <div className={`h-full bg-[#161920] border rounded-2xl p-6 flex flex-col transition-all ${job.is_boosted ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-[#8A8E99]">{job.category}</span>
                        {job.is_boosted && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-black uppercase tracking-widest animate-pulse">Urgent</span>}
                      </div>

                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[22px] font-black uppercase tracking-tight leading-tight mb-2 text-[#F0EDE8]">{job.title}</h3>

                      <div className="flex items-center gap-1.5 mb-4">
                        {user ? (
                          <><p className="text-[13px] font-bold text-[#C9922A]">{job.company}</p><svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg></>
                        ) : <p className="text-[13px] font-bold text-[#C9922A]">🔒 Confidential Employer</p>}
                      </div>

                      <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
                         <p className="text-[12px] text-[#8A8E99] flex items-center gap-2"><span className="opacity-50">📍</span> {job.location}</p>
                         <p className="text-[12px] text-[#8A8E99] flex items-center gap-2"><span className="opacity-50">💰</span> {job.salary_range}</p>
                         <p className="text-[10px] text-white/30 uppercase tracking-widest pt-2">Posted {fmt(job.created_at)}</p>
                      </div>
                    </div>

                    {/* HOVER POP-OUT CARD */}
                    <div className="hidden lg:flex absolute -inset-4 bg-[#1a1d24] border border-[#C9922A]/50 rounded-3xl p-8 flex-col opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 pointer-events-none group-hover:pointer-events-auto transform scale-95 group-hover:scale-100">
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 rounded-full bg-[#C9922A]/10 text-[#C9922A] text-[9px] font-black uppercase tracking-widest">{job.category}</span>
                      </div>
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[24px] font-black uppercase tracking-tight leading-tight mb-2 text-[#F0EDE8]">{job.title}</h3>

                      <div className="flex-1 mt-4">
                        <p className="text-[12px] font-bold uppercase tracking-widest text-[#8A8E99] mb-2">Key Requirements:</p>
                        <ul className="space-y-1 mb-4">
                          {(job.requirements || []).slice(0, 3).map((req: string, i: number) => (
                            <li key={i} className="text-[12px] text-[#8A8E99] flex gap-2"><span className="text-[#C9922A]">✓</span><span className="truncate">{req}</span></li>
                          ))}
                        </ul>
                        <p className="text-[12px] text-[#8A8E99] line-clamp-3 italic">"{job.description}"</p>
                      </div>

                      <Link href={`/jobs/${job.id}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="w-full mt-6 bg-[#C9922A] text-black text-center py-3 rounded-full font-black uppercase tracking-widest text-[14px] hover:brightness-110 transition-all shadow-lg">
                        View Full Details →
                      </Link>
                    </div>

                    {/* Mobile Click Target */}
                    <Link href={`/jobs/${job.id}`} className="absolute inset-0 z-20 lg:hidden"></Link>

                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
