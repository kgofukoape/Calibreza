'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const JOB_TYPES = [
  { id: '', label: 'All Jobs' },
  { id: 'retail', label: '🏪 Retail / Sales' },
  { id: 'gunsmith', label: '🔧 Gunsmithing' },
  { id: 'instructor', label: '🎯 Instruction / Training' },
  { id: 'security', label: '🛡️ Security' },
  { id: 'admin', label: '📋 Admin / Management' },
  { id: 'other', label: '📦 Other' },
];

const PROVINCES = [
  'All Provinces', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const JOB_TYPE_COLORS: Record<string, string> = {
  retail: 'text-[#C9922A] bg-[#C9922A]/10 border-[#C9922A]/20',
  gunsmith: 'text-[#4CC9F0] bg-[#4CC9F0]/10 border-[#4CC9F0]/20',
  instructor: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20',
  security: 'text-[#E63946] bg-[#E63946]/10 border-[#E63946]/20',
  admin: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20',
  other: 'text-[#8A8E99] bg-white/5 border-white/10',
};

// Demo jobs — replace with Supabase when table is created
const DEMO_JOBS = [
  {
    id: '1',
    title: 'Firearms Sales Consultant',
    company: 'Tactical Arms Cape Town',
    type: 'retail',
    location: 'Cape Town, Western Cape',
    salary: 'R18,000 – R25,000/month',
    description: 'We are looking for a passionate and knowledgeable firearms sales consultant to join our Cape Town showroom. Must hold a valid competency certificate and have at least 2 years retail experience.',
    requirements: ['Valid competency certificate', '2+ years retail experience', 'Knowledge of SA firearms legislation', 'Excellent communication skills'],
    posted: '2026-04-10',
    type_label: 'Full-time',
  },
  {
    id: '2',
    title: 'Qualified Gunsmith',
    company: 'Precision Arms Workshop',
    type: 'gunsmith',
    location: 'Johannesburg, Gauteng',
    salary: 'R22,000 – R35,000/month',
    description: 'Established gunsmith workshop seeks a qualified gunsmith with experience in trigger work, barrel fitting and general repairs. SAPS-registered workshop.',
    requirements: ['Qualified gunsmith certification', 'SAPS registered', '3+ years experience', 'Trigger work specialisation preferred'],
    posted: '2026-04-08',
    type_label: 'Full-time',
  },
  {
    id: '3',
    title: 'SAPS-Accredited Firearms Instructor',
    company: 'Gauteng Firearms Training Academy',
    type: 'instructor',
    location: 'Pretoria, Gauteng',
    salary: 'R15,000 – R20,000/month + commission',
    description: 'Training academy seeks an accredited instructor to deliver Section 13, 15, and 16 competency courses. Flexible schedule with commission on course completions.',
    requirements: ['SASSETA accredited', 'SAPS instructor registration', 'Section 13/15/16 qualified', 'Own transport'],
    posted: '2026-04-07',
    type_label: 'Part-time / Contract',
  },
  {
    id: '4',
    title: 'Firearms Store Manager',
    company: 'Safari Outdoors KZN',
    type: 'admin',
    location: 'Durban, KwaZulu-Natal',
    salary: 'R28,000 – R40,000/month',
    description: 'Safari Outdoors is looking for an experienced store manager to oversee our Durban firearms and outdoor retail store. Must have strong knowledge of FCA compliance and retail management.',
    requirements: ['FCA compliance knowledge', '5+ years retail management', 'Firearms competency certificate', 'Stock management experience'],
    posted: '2026-04-05',
    type_label: 'Full-time',
  },
  {
    id: '5',
    title: 'Range Safety Officer',
    company: 'Cape Town Practical Shooting Club',
    type: 'security',
    location: 'Cape Town, Western Cape',
    salary: 'R12,000 – R16,000/month',
    description: 'Weekend and weekday RSO positions available at our busy practical shooting range. SAIRO-accredited applicants preferred.',
    requirements: ['RSO qualification or SAIRO accreditation', 'Firearms competency', 'Practical shooting experience', 'Weekend availability'],
    posted: '2026-04-03',
    type_label: 'Part-time',
  },
  {
    id: '6',
    title: 'Online Firearms Parts Sales Rep',
    company: 'SA Tactical Online',
    type: 'retail',
    location: 'Remote (South Africa)',
    salary: 'R10,000 base + commission',
    description: 'Growing online firearms accessories retailer seeks a remote sales rep with strong product knowledge. Handle inbound enquiries, advise customers on parts compatibility and process orders.',
    requirements: ['Firearms accessories knowledge', 'Customer service experience', 'Reliable internet connection', 'Own laptop'],
    posted: '2026-04-01',
    type_label: 'Remote',
  },
];

export default function JobsPage() {
  const [selectedType, setSelectedType] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [search, setSearch] = useState('');
  const [activeJob, setActiveJob] = useState<any>(DEMO_JOBS[0]);

  const filtered = DEMO_JOBS.filter(j => {
    if (selectedType && j.type !== selectedType) return false;
    if (selectedProvince !== 'All Provinces' && !j.location.includes(selectedProvince)) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
      !j.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

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
                <Link href="/browse" className="hover:text-[#C9922A]">Browse</Link>
                <span>/</span>
                <span className="text-[#F0EDE8]">Jobs</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl md:text-6xl font-black uppercase tracking-tight">
                Industry <span className="text-[#C9922A]">Jobs</span>
              </h1>
              <p className="text-[#8A8E99] text-sm mt-2 uppercase tracking-widest font-bold">
                Careers in the South African firearms industry
              </p>
            </div>
            <Link href="/jobs/post"
              className="flex-shrink-0 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
              + Post a Job
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

      {/* JOB TYPE TABS */}
      <div className="border-b border-white/5 bg-[#0D0F13] sticky top-[68px] md:top-[80px] z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex gap-1.5 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
            {JOB_TYPES.map(type => (
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
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-[148px] p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>

        {/* JOB SPLIT PANEL */}
        <div className="flex-1 min-w-0 flex flex-col lg:flex-row gap-4">

          {/* LEFT — Job List */}
          <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-3">

            {/* Search + Province */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <input type="text" placeholder="Search jobs or company..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50" />
              <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)}
                className="bg-[#13151A] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none appearance-none cursor-pointer">
                {PROVINCES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <p className="text-[12px] text-[#8A8E99] uppercase tracking-widest font-bold">
              <span className="text-[#F0EDE8] font-black">{filtered.length}</span> job{filtered.length !== 1 ? 's' : ''} found
            </p>

            {/* Job Cards */}
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
              {filtered.length === 0 ? (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-10 text-center">
                  <div className="text-4xl mb-3">💼</div>
                  <p className="text-[#8A8E99] text-sm">No jobs match your search</p>
                </div>
              ) : filtered.map(job => (
                <div key={job.id} onClick={() => setActiveJob(job)}
                  className={`bg-[#13151A] border rounded-sm p-4 cursor-pointer transition-all hover:border-[#C9922A]/40 ${
                    activeJob?.id === job.id ? 'border-[#C9922A]/60 bg-[#C9922A]/5' : 'border-white/5'
                  }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-[17px] font-black uppercase tracking-tight text-[#F0EDE8] leading-tight">
                      {job.title}
                    </h3>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm border flex-shrink-0 ${JOB_TYPE_COLORS[job.type] || JOB_TYPE_COLORS.other}`}>
                      {job.type}
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-[#C9922A] mb-1">{job.company}</p>
                  <p className="text-[11px] text-[#8A8E99] mb-2">📍 {job.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8A8E99] font-bold uppercase tracking-wider">{job.type_label}</span>
                    <span className="text-[10px] text-white/30">{fmt(job.posted)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Job Detail */}
          <div className="flex-1 min-w-0">
            {!activeJob ? (
              <div className="bg-[#13151A] border border-white/5 rounded-sm h-full flex items-center justify-center flex-col gap-4 text-white/20 p-20">
                <span className="text-6xl">💼</span>
                <p className="text-sm uppercase tracking-widest font-bold">Select a job to view details</p>
              </div>
            ) : (
              <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">

                {/* Job Header */}
                <div className="p-6 md:p-8 border-b border-white/5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <span className={`inline-block text-[9px] font-black uppercase px-2 py-1 rounded-sm border mb-3 ${JOB_TYPE_COLORS[activeJob.type] || JOB_TYPE_COLORS.other}`}>
                        {activeJob.type}
                      </span>
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#F0EDE8] mb-1">
                        {activeJob.title}
                      </h2>
                      <p className="text-lg font-bold text-[#C9922A]">{activeJob.company}</p>
                    </div>
                    <span className="flex-shrink-0 bg-[#13151A] border border-white/10 text-[#8A8E99] text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm">
                      {activeJob.type_label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Location</p>
                      <p className="text-[13px] font-bold">📍 {activeJob.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Salary</p>
                      <p className="text-[13px] font-bold text-[#C9922A]">{activeJob.salary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Posted</p>
                      <p className="text-[13px] font-bold">{fmt(activeJob.posted)}</p>
                    </div>
                  </div>

                  <button
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="w-full md:w-auto bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-10 py-3 rounded-sm hover:brightness-110 transition-all">
                    Apply for This Position
                  </button>
                </div>

                {/* Job Body */}
                <div className="p-6 md:p-8 space-y-6">
                  <div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-xl font-black uppercase mb-3 text-[#C9922A]">About the Role</h3>
                    <p className="text-[14px] text-[#8A8E99] leading-relaxed">{activeJob.description}</p>
                  </div>

                  <div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-xl font-black uppercase mb-3">Requirements</h3>
                    <ul className="flex flex-col gap-2">
                      {activeJob.requirements.map((req: string) => (
                        <li key={req} className="flex items-center gap-3 text-[13px] text-[#8A8E99]">
                          <span className="text-[#C9922A] font-black flex-shrink-0">✓</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mid-content ad */}
                  <div className="w-full h-[90px] bg-[#0D0F13] border border-white/5 flex items-center justify-center relative">
                    <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">728 × 90 Ad Space</span>
                    <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
                  </div>

                  <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-5">
                    <p className="text-[12px] text-[#8A8E99] mb-4">
                      To apply, send your CV and a copy of your competency certificate to the employer. Gun X connects job seekers with employers — we do not process applications directly.
                    </p>
                    <button
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-3 rounded-sm hover:brightness-110 transition-all">
                      Apply for This Position
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[160px]">
          <div className="w-[160px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center sticky top-[148px] p-3" style={{ minHeight: '600px' }}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 × 600</div>
          </div>
        </aside>
      </div>
    </div>
  );
}