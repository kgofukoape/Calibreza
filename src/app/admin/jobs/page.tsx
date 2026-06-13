'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin',           icon: '⚡', label: 'Overview'   },
  { href: '/admin/dealers',   icon: '🏪', label: 'Dealers'    },
  { href: '/admin/clubs',     icon: '⊕',  label: 'Clubs'      },
  { href: '/admin/services',  icon: '🔧', label: 'Services'   },
  { href: '/admin/jobs',      icon: '💼', label: 'Jobs', active: true },
  { href: '/admin/listings',  icon: '📋', label: 'Listings'   },
  { href: '/admin/users',     icon: '👥', label: 'Users'      },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics'  },
  { href: '/admin/crm',       icon: '💰', label: 'CRM'        },
  { href: '/admin/sentinel',  icon: '👁️', label: 'Tokoloshe'  },
];

const STATUS_FILTERS = ['all', 'pending', 'active', 'rejected', 'expired'];

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs]                 = useState<any[]>([]);
  const [filtered, setFiltered]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch]             = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    loadJobs();
  }, []);

  useEffect(() => {
    let result = jobs;
    if (statusFilter !== 'all') result = result.filter(j => j.status === statusFilter);
    if (search) result = result.filter(j =>
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [statusFilter, search, jobs]);

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await supabase.from('jobs').update({ status: 'active' }).eq('id', id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'active' } : j));
    if (selected?.id === id) setSelected((p: any) => ({ ...p, status: 'active' }));
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this job listing?')) return;
    setActionLoading(id);
    await supabase.from('jobs').update({ status: 'rejected' }).eq('id', id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'rejected' } : j));
    if (selected?.id === id) setSelected((p: any) => ({ ...p, status: 'rejected' }));
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this job listing?')) return;
    setActionLoading(id);
    await supabase.from('jobs').delete().eq('id', id);
    setJobs(prev => prev.filter(j => j.id !== id));
    if (selected?.id === id) setSelected(null);
    setActionLoading(null);
  };

  const fmt    = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  const counts = {
    all:      jobs.length,
    pending:  jobs.filter(j => j.status === 'pending').length,
    active:   jobs.filter(j => j.status === 'active').length,
    rejected: jobs.filter(j => j.status === 'rejected').length,
    expired:  jobs.filter(j => j.status === 'expired').length,
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs">K</div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">Kgofu</p>
            <p className="text-[9px] text-[#E63946] font-bold uppercase tracking-widest">Super Admin</p>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {NAV.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                  (item as any).active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}>
                  <span>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/admin/jobs' && counts.pending > 0 && (
                    <span className="bg-[#F59E0B] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">{counts.pending}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => { localStorage.removeItem('gunx_admin_session'); router.push('/admin/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-[260px] overflow-y-auto">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
            Jobs <span className="text-[#E63946]">Board</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            {jobs.length} total · {counts.pending} pending · {counts.active} active
          </p>
        </header>

        <div className="flex h-[calc(100vh-73px)]">

          {/* LEFT — List */}
          <div className="w-[400px] flex-shrink-0 border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 space-y-3">
              <input type="text" placeholder="Search by title, company or location..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#080B12] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E63946]/50" />
              <div className="flex gap-1 flex-wrap">
                {STATUS_FILTERS.map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`flex-1 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all ${
                      statusFilter === f ? 'bg-[#E63946] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}>
                    {f} ({counts[f as keyof typeof counts] ?? 0})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-white/30 text-sm">No jobs found</div>
              ) : filtered.map(job => (
                <button key={job.id} onClick={() => setSelected(job)}
                  className={`w-full text-left px-4 py-4 hover:bg-white/5 transition-all ${selected?.id === job.id ? 'bg-[#E63946]/5 border-l-2 border-[#E63946]' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-sm bg-[#C9922A]/10 border border-[#C9922A]/20 flex items-center justify-center text-[#C9922A] font-black text-sm flex-shrink-0">
                      💼
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{job.title}</p>
                      <p className="text-[10px] text-white/40">{job.company}</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">{job.location} · {job.category}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                      job.status === 'active'   ? 'bg-[#10B981]/10 text-[#10B981]' :
                      job.status === 'pending'  ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                      'bg-[#E63946]/10 text-[#E63946]'
                    }`}>{job.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Detail */}
          <div className="flex-1 overflow-y-auto">
            {!selected ? (
              <div className="h-full flex items-center justify-center flex-col gap-4 text-white/20">
                <span className="text-6xl">💼</span>
                <p className="text-sm uppercase tracking-widest font-bold">Select a job to review</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">{selected.title}</h2>
                    <p className="text-white/40 text-sm mt-0.5">{selected.company} · {selected.location}</p>
                    <p className="text-white/30 text-xs mt-0.5">Posted {fmt(selected.created_at)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/jobs/${selected.id}`} target="_blank"
                      className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 px-3 py-2 rounded-sm hover:bg-[#4CC9F0]/10 transition-all">
                      View Live ↗
                    </Link>
                    <button onClick={() => handleDelete(selected.id)} disabled={actionLoading === selected.id}
                      className="text-[10px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 px-3 py-2 rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-40">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Status Control</p>
                  <div className="flex gap-3 flex-wrap">
                    {selected.status !== 'active' && (
                      <button onClick={() => handleApprove(selected.id)} disabled={actionLoading === selected.id}
                        className="bg-[#10B981] text-white font-black uppercase tracking-widest text-[11px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                        {actionLoading === selected.id ? '...' : '✓ Approve & Publish'}
                      </button>
                    )}
                    {selected.status !== 'rejected' && (
                      <button onClick={() => handleReject(selected.id)} disabled={actionLoading === selected.id}
                        className="border border-[#E63946]/30 text-[#E63946] font-black uppercase tracking-widest text-[11px] px-6 py-2.5 rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-40">
                        ✕ Reject
                      </button>
                    )}
                    {selected.status === 'active' && (
                      <span className="flex items-center gap-2 text-[#10B981] font-black text-[11px] uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Live on Jobs Board
                      </span>
                    )}
                  </div>
                </div>

                {/* Job details */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-4">
                    Job <span className="text-[#C9922A]">Details</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Category',      value: selected.category },
                      { label: 'Job Type',      value: selected.job_type },
                      { label: 'Location',      value: selected.location },
                      { label: 'Salary Range',  value: selected.salary_range },
                      { label: 'Contact Email', value: selected.employer_email },
                    ].map(item => item.value ? (
                      <div key={item.label}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">{item.label}</p>
                        <p className="text-sm font-bold text-white">{item.value}</p>
                      </div>
                    ) : null)}
                  </div>
                </div>

                {/* Description */}
                {selected.description && (
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-3">Description</h3>
                    <p className="text-[13px] text-white/60 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                  </div>
                )}

                {/* Requirements */}
                {selected.requirements && (
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-3">Requirements</h3>
                    <p className="text-[13px] text-white/60 leading-relaxed">{selected.requirements}</p>
                  </div>
                )}

                {/* Certifications */}
                {selected.fca_competencies_required?.length > 0 && (
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-3">Required Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.fca_competencies_required.map((c: string) => (
                        <span key={c} className="text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-[#C9922A]/10 text-[#C9922A] border border-[#C9922A]/20">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}