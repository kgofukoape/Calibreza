'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';

export default function SingleJobPage() {
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    async function loadJob() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (params.id) {
        const { data } = await supabase.from('job_listings').select('*').eq('id', params.id).single();
        if (data) setJob(data);
      }
      setLoading(false);
    }
    loadJob(); // <-- This was the typo! It is fixed now.
  }, [params.id]);

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleApplyClick = async () => {
    if (!user) {
      setShowLoginPrompt(true);
    } else if (job) {
      await supabase.from('job_clicks').insert({ job_id: job.id, applicant_id: user.id });
      const subject = encodeURIComponent(`Application: ${job.title} (Gun X Ref: GX-${job.id})`);
      const body = encodeURIComponent(`Hi ${job.company} Hiring Team,\n\nI am writing to apply for the ${job.title} position listed on Gun X.\n\nPlease find my CV and required competency documents attached to this email.\n\nRegards,\n${user?.email}`);
      window.location.href = `mailto:${job.employer_email}?subject=${subject}&body=${body}`;
    }
  };

  const generateJSONLD = (j: any) => {
    return {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": j.title,
      "description": j.description,
      "hiringOrganization": { "@type": "Organization", "name": j.company },
      "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": j.location, "addressCountry": "ZA" } },
      "employmentType": j.job_type === 'Full-time' ? 'FULL_TIME' : j.job_type === 'Part-time' ? 'PART_TIME' : 'CONTRACTOR',
      "datePosted": j.created_at,
      "validThrough": j.expires_at,
    };
  };

  if (loading) return <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center text-[#C9922A] font-bold uppercase tracking-widest text-sm animate-pulse">Loading Job...</div>;
  if (!job) return <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center text-[#8A8E99] font-bold uppercase tracking-widest">Job not found or has expired.</div>;

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col font-sans">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJSONLD(job)) }} />

      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#191C23] border border-[#C9922A]/50 max-w-md w-full rounded-2xl p-8 text-center relative shadow-[0_0_50px_rgba(201,146,42,0.15)]">
            <button onClick={() => setShowLoginPrompt(false)} className="absolute top-4 right-4 text-[#8A8E99] hover:text-white w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">✕</button>
            <div className="text-4xl mb-4">🔒</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase text-white mb-2">Sign in to Apply</h2>
            <p className="text-[#8A8E99] text-sm mb-6">Create a free Gun X account to view employer details and submit applications instantly.</p>
            <div className="flex gap-3">
              <Link href={`/login?redirect=/jobs/${job.id}`} className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-3 rounded-full hover:brightness-110 transition-all">Log In</Link>
              <Link href={`/signup?redirect=/jobs/${job.id}`} className="flex-1 border border-white/20 text-white font-black uppercase tracking-widest text-[13px] py-3 rounded-full hover:bg-white/5 transition-all">Register</Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-6 py-10">
        <Link href="/jobs" className="text-[11px] font-bold uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] mb-8 inline-block transition-colors">← Back to Jobs Board</Link>

        <div className="bg-[#161920] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 md:p-12 border-b border-white/5 relative bg-[#1a1d24]">
            {!user && <div className="absolute top-8 right-8 bg-[#C9922A]/10 border border-[#C9922A]/30 text-[#C9922A] px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2"><span>🔒</span> Sign in to view employer</div>}
            
            {job.is_boosted && <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/50 text-[10px] font-black uppercase tracking-widest mb-4">🔥 Urgent Hire</span>}

            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-6xl font-black uppercase tracking-tight text-[#F0EDE8] mb-3 pr-20">{job.title}</h1>
            
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${user ? 'text-[#C9922A]' : 'text-white/20 blur-md select-none transition-all'}`}>{user ? job.company : 'Restricted Employer Details'}</p>
              {user && <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-[#0D0F13] p-4 rounded-2xl border border-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Category</p><p className="text-[13px] font-bold">{job.category}</p></div>
              <div className="bg-[#0D0F13] p-4 rounded-2xl border border-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Location</p><p className="text-[13px] font-bold">{job.location}</p></div>
              <div className="bg-[#0D0F13] p-4 rounded-2xl border border-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Salary</p><p className="text-[13px] font-bold text-[#C9922A]">{job.salary_range}</p></div>
              <div className="bg-[#0D0F13] p-4 rounded-2xl border border-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Posted</p><p className="text-[13px] font-bold">{fmt(job.created_at)}</p></div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4 text-[#C9922A]">About the Role</h3>
            <p className="text-[16px] text-[#8A8E99] leading-relaxed mb-10 whitespace-pre-wrap">{job.description}</p>

            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">Requirements</h3>
            <ul className="flex flex-col gap-3 mb-10">
              {(job.requirements || []).map((req: string) => <li key={req} className="flex items-center gap-4 text-[15px] text-[#8A8E99] bg-[#0D0F13] p-4 rounded-2xl border border-white/5"><span className="w-8 h-8 rounded-full bg-[#C9922A]/10 text-[#C9922A] flex items-center justify-center font-black flex-shrink-0">✓</span> {req}</li>)}
            </ul>

            <div className="bg-[#0D0F13] border border-white/5 p-10 rounded-3xl text-center shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9922A]/50 to-transparent"></div>
              {!user ? (
                <><p className="text-[14px] text-[#8A8E99] mb-6">Create a free profile to instantly send your CV and Competencies to this employer.</p><button onClick={handleApplyClick} style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="w-full bg-[#191C23] border border-[#C9922A]/50 text-[#C9922A] font-black uppercase tracking-widest text-[18px] py-5 rounded-full hover:bg-[#C9922A] hover:text-black transition-all shadow-[0_0_30px_rgba(201,146,42,0.1)]">🔒 Sign in to Apply</button></>
              ) : (
                <><p className="text-[14px] text-[#8A8E99] mb-6">You are signed in as <span className="text-white font-bold">{user.email}</span>. Clicking apply will launch your email client to send your CV directly to the employer.</p><button onClick={handleApplyClick} style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[18px] py-5 rounded-full hover:brightness-110 transition-all flex items-center justify-center gap-3"><span className="text-2xl">✉️</span> Apply via Email</button></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}