'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';

const JOB_CATEGORIES = ['Retail / Sales', 'Gunsmithing', 'Instruction / Training', 'Security / PSIRA', 'Compliance / Admin', 'Other'];
const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'National / Remote'];
const INDUSTRY_CERTIFICATIONS = ['Handgun', 'Rifle', 'Shotgun', 'SLR', 'Competency to Trade', 'Gunsmith Certificate', 'PSIRA Grade A', 'PSIRA Grade B/C', 'SASSETA Assessor', 'Range Officer (SAIRO)'];

export default function PostJobPage() {
  const [accessStatus, setAccessStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [formData, setFormData] = useState({ title: '', company: '', employer_email: '', category: 'Retail / Sales', location: 'Gauteng', salary_range: '', job_type: 'Full-time', description: '', requirements: '' });
  const [selectedComps, setSelectedComps] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function verifyEmployerStatus() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setAccessStatus('denied'); return; }

      const { data: dealer } = await supabase.from('dealers').select('id, business_name, email').eq('user_id', session.user.id).eq('status', 'approved').maybeSingle();
      if (dealer) { 
        setFormData(p => ({ ...p, company: dealer.business_name, employer_email: dealer.email }));
        setAccessStatus('granted'); return; 
      }

      const { data: club } = await supabase.from('clubs').select('id, name, email').eq('user_id', session.user.id).eq('status', 'approved').maybeSingle();
      if (club) { 
        setFormData(p => ({ ...p, company: club.name, employer_email: club.email }));
        setAccessStatus('granted'); return; 
      }

      setAccessStatus('denied');
    }
    verifyEmployerStatus();
  }, []);

  const toggleComp = (comp: string) => setSelectedComps(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ...formData, fca_competencies_required: selectedComps })
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (result.action === 'published') {
        alert("Success! " + result.message);
        window.location.href = '/jobs';
      } else if (result.action === 'payfast') {
        window.location.href = result.redirectUrl;
      }
    } catch (error: any) {
      alert("Error posting job: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (accessStatus === 'loading') return <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center text-[#8A8E99] font-black uppercase tracking-widest text-sm animate-pulse">Verifying Credentials...</div>;

  if (accessStatus === 'denied') return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col font-sans"><Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-[#161920] border border-red-500/30 rounded-3xl p-10 max-w-lg text-center shadow-[0_0_50px_rgba(239,68,68,0.05)]">
          <div className="text-5xl mb-6">🛡️</div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase text-white mb-3">Restricted Area</h2>
          <p className="text-[#8A8E99] text-[14px] leading-relaxed mb-8">To protect the community from job scams, only <strong className="text-white">Verified Dealers, Clubs, and Service Providers</strong> are permitted to post recruitment listings on Gun X.</p>
          <div className="flex flex-col gap-3">
            <Link href="/dealer/apply" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-4 rounded-full hover:brightness-110 transition-all">Apply for a Dealer Account</Link>
            <Link href="/jobs" className="text-[#8A8E99] font-bold uppercase tracking-widest text-[11px] py-2 hover:text-white transition-all">← Return to Jobs Board</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col font-sans">
      <Navbar />
      <div className="bg-[#12141A] border-b border-white/5 px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl font-black uppercase tracking-tight">Post an <span className="text-[#C9922A]">Industry Job</span></h1>
        </div>
      </div>
      <div className="flex-1 max-w-[800px] mx-auto w-full px-4 md:px-6 py-10">
        <form onSubmit={handleSubmit} className="bg-[#161920] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-[#C9922A] mb-4 border-b border-white/5 pb-2">1. The Basics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Job Title</label><input type="text" required placeholder="e.g. Senior Master Gunsmith" className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#C9922A]/50 transition-colors" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Company Name</label><input type="text" required className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#C9922A]/50 transition-colors" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Receiving Email (For CVs)</label><input type="email" required className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#C9922A]/50 transition-colors" value={formData.employer_email} onChange={e => setFormData({...formData, employer_email: e.target.value})} /></div>
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-[#C9922A] mb-4 border-b border-white/5 pb-2">2. Position Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Category</label><select className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none appearance-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{JOB_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Province / Location</label><select className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none appearance-none cursor-pointer" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>{PROVINCES.map(prov => <option key={prov}>{prov}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Salary Range</label><input type="text" placeholder="e.g. R15k - R20k or Negotiable" className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#C9922A]/50 transition-colors" value={formData.salary_range} onChange={e => setFormData({...formData, salary_range: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Job Type</label><select className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none appearance-none cursor-pointer" value={formData.job_type} onChange={e => setFormData({...formData, job_type: e.target.value})}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Freelance</option></select></div>
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-[#C9922A] mb-4 border-b border-white/5 pb-2">3. The Work</h3>
            <div className="space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Job Description</label><textarea required rows={5} placeholder="Describe the day-to-day responsibilities..." className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#C9922A]/50 transition-colors resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Requirements (Separate with commas)</label><input type="text" required placeholder="e.g. 3 years experience, Bilingual, Own transport" className="w-full bg-[#0D0F13] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#C9922A]/50 transition-colors" value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} /></div>
              <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Required Certifications</label><div className="flex flex-wrap gap-2 p-5 bg-[#0D0F13] rounded-2xl border border-white/5">{INDUSTRY_CERTIFICATIONS.map(comp => (<button type="button" key={comp} onClick={() => toggleComp(comp)} className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all ${selectedComps.includes(comp) ? 'bg-[#C9922A] text-black' : 'bg-[#161920] border border-white/5 text-[#8A8E99] hover:border-white/20'}`}>{comp}</button>))}</div></div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/5">
            <button type="submit" disabled={isSubmitting} style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`w-full text-black px-6 py-4 rounded-full font-black uppercase tracking-widest text-[16px] transition-all shadow-lg ${isSubmitting ? 'bg-[#C9922A]/50' : 'bg-[#C9922A] hover:brightness-110 shadow-[#C9922A]/20'}`}>{isSubmitting ? 'Processing...' : 'Continue to Publish Listing →'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}