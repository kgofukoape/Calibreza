'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const JOB_TYPES = [
  { id: 'retail', label: 'Retail / Sales' },
  { id: 'gunsmith', label: 'Gunsmithing' },
  { id: 'instructor', label: 'Instruction / Training' },
  { id: 'security', label: 'Security / RSO' },
  { id: 'admin', label: 'Admin / Management' },
  { id: 'other', label: 'Other' },
];

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

export default function DealerJobsPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    title: '',
    type: 'retail',
    location: '',
    province: 'Gauteng',
    salary: '',
    type_label: 'Full-time',
    description: '',
    requirements: [''],
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }
    const { data } = await supabase.from('dealers').select('*').eq('user_id', user.id).eq('status', 'approved').single();
    if (!data) { router.push('/dealer/login'); return; }
    setDealer(data);
    fetchJobs(data.id);
  };

  const fetchJobs = async (dealerId: string) => {
    const { data } = await supabase.from('jobs').select('*').eq('dealer_id', dealerId).order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateRequirement = (idx: number, value: string) => {
    const updated = [...form.requirements];
    updated[idx] = value;
    setForm({ ...form, requirements: updated });
  };

  const addRequirement = () => setForm({ ...form, requirements: [...form.requirements, ''] });
  const removeRequirement = (idx: number) => setForm({ ...form, requirements: form.requirements.filter((_, i) => i !== idx) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    setPosting(true);
    try {
      await supabase.from('jobs').insert({
        title: form.title,
        company: dealer.business_name,
        dealer_id: dealer.id,
        type: form.type,
        location: `${form.location}, ${form.province}`,
        province: form.province,
        salary: form.salary,
        type_label: form.type_label,
        description: form.description,
        requirements: form.requirements.filter(r => r.trim()),
        contact_email: form.contact_email || dealer.email,
        contact_phone: form.contact_phone || dealer.phone,
        status: 'active',
      });
      setSubmitted(true);
      setShowForm(false);
      fetchJobs(dealer.id);
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this job listing?')) return;
    await supabase.from('jobs').delete().eq('id', id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'active' ? 'closed' : 'active';
    await supabase.from('jobs').update({ status: next }).eq('id', id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: next } : j));
  };

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 transition-colors";
  const labelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";

  const SIDEBAR_LINKS = [
    { href: '/dealer-dashboard', icon: '📊', label: 'Overview' },
    { href: '/dealer-dashboard/inventory', icon: '📦', label: 'Inventory' },
    { href: '/dealer-dashboard/add-listing', icon: '➕', label: 'Add Listing' },
    { href: '/dealer-dashboard/jobs', icon: '💼', label: 'Job Listings', active: true },
    { href: '/dealer-dashboard/analytics', icon: '📈', label: 'Analytics' },
    { href: '/dealer-dashboard/profile', icon: '⚙️', label: 'Profile' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[240px] bg-[#13151A] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-5 border-b border-white/5">
          <Link href="/">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-tighter text-[#F0EDE8]">
              GUN <span className="text-[#C9922A]">X</span>
            </span>
          </Link>
          <p className="text-[9px] font-bold text-[#8A8E99] uppercase tracking-[0.3em] mt-0.5">Dealer Dashboard</p>
        </div>
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-[11px] font-black text-[#F0EDE8] uppercase tracking-widest truncate">{dealer?.business_name}</p>
          <p className="text-[9px] text-[#C9922A] font-bold uppercase tracking-widest">{dealer?.subscription_tier} plan</p>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {SIDEBAR_LINKS.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                  item.active ? 'bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A]' : 'text-[#8A8E99] hover:bg-white/5 hover:text-white'
                }`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-3 border-t border-white/5">
          <Link href={`/dealers/${dealer?.slug}`} target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-[#8A8E99] hover:bg-white/5 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🌐</span><span>My Storefront</span>
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-[240px] overflow-y-auto">
        <header className="bg-[#13151A] border-b border-white/5 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight">
              Job <span className="text-[#C9922A]">Listings</span>
            </h1>
            <p className="text-[#8A8E99] text-xs mt-0.5 uppercase tracking-widest font-bold">Post and manage job opportunities</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setSubmitted(false); }}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all">
            {showForm ? 'Cancel' : '+ Post Job'}
          </button>
        </header>

        <div className="p-8 space-y-6">

          {/* SUCCESS BANNER */}
          {submitted && (
            <div className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm p-4 flex items-center gap-3">
              <span className="text-[#2A9C6E] text-xl">✓</span>
              <p className="text-[#2A9C6E] font-bold text-sm uppercase tracking-widest">Job posted successfully! It is now live on the jobs board.</p>
            </div>
          )}

          {/* POST JOB FORM */}
          {showForm && (
            <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase">Post a New Job</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={labelClass}>Job Title <span className="text-red-400">*</span></label>
                    <input name="title" value={form.title} onChange={handleChange} required className={inputClass} placeholder="e.g., Firearms Sales Consultant" />
                  </div>
                  <div>
                    <label className={labelClass}>Job Type</label>
                    <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                      {JOB_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Employment Type</label>
                    <select name="type_label" value={form.type_label} onChange={handleChange} className={inputClass}>
                      {['Full-time', 'Part-time', 'Contract', 'Remote', 'Casual'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>City / Area</label>
                    <input name="location" value={form.location} onChange={handleChange} className={inputClass} placeholder="e.g., Cape Town" />
                  </div>
                  <div>
                    <label className={labelClass}>Province</label>
                    <select name="province" value={form.province} onChange={handleChange} className={inputClass}>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Salary / Remuneration</label>
                    <input name="salary" value={form.salary} onChange={handleChange} className={inputClass} placeholder="e.g., R18,000 – R25,000/month or Market related" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Job Description <span className="text-red-400">*</span></label>
                    <textarea name="description" value={form.description} onChange={handleChange} required rows={5}
                      className={`${inputClass} resize-none`} placeholder="Describe the role, responsibilities, company culture..." />
                  </div>

                  {/* Requirements */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelClass}>Requirements</label>
                      <button type="button" onClick={addRequirement}
                        className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">
                        + Add
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {form.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input value={req} onChange={e => updateRequirement(idx, e.target.value)}
                            className={inputClass} placeholder={`Requirement ${idx + 1}`} />
                          {form.requirements.length > 1 && (
                            <button type="button" onClick={() => removeRequirement(idx)}
                              className="text-red-400 hover:text-red-300 flex-shrink-0 font-black px-2">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Contact Email</label>
                    <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange}
                      className={inputClass} placeholder={dealer?.email || 'applications@yourstore.co.za'} />
                  </div>
                  <div>
                    <label className={labelClass}>Contact Phone</label>
                    <input name="contact_phone" value={form.contact_phone} onChange={handleChange}
                      className={inputClass} placeholder={dealer?.phone || '021 555 1234'} />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={posting}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                    {posting ? 'Posting...' : 'Post Job — Live Immediately'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ACTIVE JOBS */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase">
                Your Job Listings <span className="text-[#8A8E99] text-lg">({jobs.length})</span>
              </h2>
              <Link href="/jobs" target="_blank" className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">
                View Jobs Board →
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-5xl mb-4">💼</div>
                <p className="text-[#8A8E99] text-sm mb-4">No jobs posted yet</p>
                <button onClick={() => setShowForm(true)}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all">
                  Post Your First Job
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {jobs.map(job => (
                  <div key={job.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-[15px] text-[#F0EDE8] truncate">{job.title}</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm flex-shrink-0 ${
                          job.status === 'active' ? 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/20' : 'bg-white/5 text-white/40 border border-white/10'
                        }`}>{job.status}</span>
                      </div>
                      <p className="text-[12px] text-[#8A8E99]">
                        {job.type_label} · {job.location} · {job.salary || 'Market related'}
                      </p>
                      <p className="text-[11px] text-white/30 mt-1">
                        Posted {new Date(job.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleStatus(job.id, job.status)}
                        className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border transition-all ${
                          job.status === 'active'
                            ? 'border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10'
                            : 'border-[#2A9C6E]/30 text-[#2A9C6E] hover:bg-[#2A9C6E]/10'
                        }`}>
                        {job.status === 'active' ? 'Close' : 'Reopen'}
                      </button>
                      <button onClick={() => handleDelete(job.id)}
                        className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* INFO BOX */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-2">About Job Listings</h3>
            <ul className="space-y-2 text-[13px] text-[#8A8E99]">
              <li className="flex items-center gap-2"><span className="text-[#C9922A]">✓</span> Job listings are free for all verified dealers, clubs and service providers</li>
              <li className="flex items-center gap-2"><span className="text-[#C9922A]">✓</span> Listings go live immediately and appear on the <Link href="/jobs" className="text-[#C9922A] hover:underline">Gun X Jobs Board</Link></li>
              <li className="flex items-center gap-2"><span className="text-[#C9922A]">✓</span> You can close or delete listings at any time</li>
              <li className="flex items-center gap-2"><span className="text-[#C9922A]">✓</span> Applicants contact you directly via email or phone</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}