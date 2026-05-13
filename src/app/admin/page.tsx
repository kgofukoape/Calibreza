'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin',           icon: '⚡', label: 'Overview',      active: true },
  { href: '/admin/dealers',   icon: '🏪', label: 'Dealers',       key: 'pendingDealers'   },
  { href: '/admin/clubs',     icon: '⊕',  label: 'Clubs',         key: 'pendingClubs'     },
  { href: '/admin/services',  icon: '🔧', label: 'Services',      key: 'pendingServices'  },
  { href: '/admin/jobs',      icon: '💼', label: 'Jobs',          key: 'pendingJobs'      },
  { href: '/admin/listings',  icon: '📋', label: 'Listings'                               },
  { href: '/admin/users',     icon: '👥', label: 'Users'                                  },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics'                              },
  { href: '/admin/crm',       icon: '💰', label: 'CRM'                                    },
  { href: '/admin/sentinel',  icon: '👁️', label: 'Tokoloshe'                              },
];

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState({
    totalListings:    0,
    activeListings:   0,
    totalViews:       0,
    totalDealers:     0,
    pendingDealers:   0,
    totalClubs:       0,
    pendingClubs:     0,
    totalServices:    0,
    pendingServices:  0,
    totalJobs:        0,
    pendingJobs:      0,
    totalUsers:       0,
  });
  const [pendingDealers,  setPendingDealers]  = useState<any[]>([]);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [pendingJobs,     setPendingJobs]     = useState<any[]>([]);
  const [recentListings,  setRecentListings]  = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    loadData();
  }, []);

  const loadData = async () => {
    const [
      listingsRes, dealersRes, pendingDealersRes,
      clubsRes, servicesRes, pendingServicesRes,
      jobsRes, pendingJobsRes, usersRes,
    ] = await Promise.all([
      supabase.from('listings').select('id, status, views_count'),
      supabase.from('dealers').select('id, status'),
      supabase.from('dealers').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('clubs').select('id, status, is_verified'),
      supabase.from('services').select('id, status'),
      supabase.from('services').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('jobs').select('id, status'),
      supabase.from('jobs').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);

    const listings  = listingsRes.data  || [];
    const dealers   = dealersRes.data   || [];
    const clubs     = clubsRes.data     || [];
    const services  = servicesRes.data  || [];
    const jobs      = jobsRes.data      || [];

    setStats({
      totalListings:   listings.length,
      activeListings:  listings.filter(l => l.status === 'active').length,
      totalViews:      listings.reduce((s, l) => s + (l.views_count || 0), 0),
      totalDealers:    dealers.filter(d => d.status === 'approved').length,
      pendingDealers:  dealers.filter(d => d.status === 'pending').length,
      totalClubs:      clubs.length,
      pendingClubs:    clubs.filter(c => !c.is_verified).length,
      totalServices:   services.filter(s => s.status === 'active').length,
      pendingServices: services.filter(s => s.status === 'pending').length,
      totalJobs:       jobs.filter(j => j.status === 'active').length,
      pendingJobs:     jobs.filter(j => j.status === 'pending').length,
      totalUsers:      usersRes.count || 0,
    });

    setPendingDealers(pendingDealersRes.data   || []);
    setPendingServices(pendingServicesRes.data || []);
    setPendingJobs(pendingJobsRes.data         || []);

    const { data: recentL } = await supabase
      .from('listings')
      .select('id, title, status, category_id, price, created_at')
      .order('created_at', { ascending: false })
      .limit(6);
    setRecentListings(recentL || []);

    setLoading(false);
  };

  // ── Quick actions ────────────────────────────────────────────────────────
  const quickApproveDealer = async (id: string) => {
    await supabase.from('dealers').update({ status: 'approved' }).eq('id', id);
    setPendingDealers(p => p.filter(d => d.id !== id));
    setStats(s => ({ ...s, pendingDealers: s.pendingDealers - 1, totalDealers: s.totalDealers + 1 }));
  };
  const quickRejectDealer = async (id: string) => {
    await supabase.from('dealers').update({ status: 'rejected' }).eq('id', id);
    setPendingDealers(p => p.filter(d => d.id !== id));
    setStats(s => ({ ...s, pendingDealers: s.pendingDealers - 1 }));
  };
  const quickApproveService = async (id: string) => {
    await supabase.from('services').update({ status: 'active' }).eq('id', id);
    setPendingServices(p => p.filter(s => s.id !== id));
    setStats(s => ({ ...s, pendingServices: s.pendingServices - 1, totalServices: s.totalServices + 1 }));
  };
  const quickRejectService = async (id: string) => {
    await supabase.from('services').update({ status: 'rejected' }).eq('id', id);
    setPendingServices(p => p.filter(s => s.id !== id));
    setStats(s => ({ ...s, pendingServices: s.pendingServices - 1 }));
  };
  const quickApproveJob = async (id: string) => {
    await supabase.from('jobs').update({ status: 'active' }).eq('id', id);
    setPendingJobs(p => p.filter(j => j.id !== id));
    setStats(s => ({ ...s, pendingJobs: s.pendingJobs - 1, totalJobs: s.totalJobs + 1 }));
  };
  const quickRejectJob = async (id: string) => {
    await supabase.from('jobs').update({ status: 'rejected' }).eq('id', id);
    setPendingJobs(p => p.filter(j => j.id !== id));
    setStats(s => ({ ...s, pendingJobs: s.pendingJobs - 1 }));
  };

  const handleLogout = () => { localStorage.removeItem('gunx_admin_session'); router.push('/admin/login'); };
  const fmt    = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  const fmtCat = (c: string) => c?.replace(/-/g, ' ').replace(/\b\w/g, x => x.toUpperCase()) || '—';

  const badges: Record<string, number> = {
    pendingDealers:  stats.pendingDealers,
    pendingClubs:    stats.pendingClubs,
    pendingServices: stats.pendingServices,
    pendingJobs:     stats.pendingJobs,
  };

  const totalPending = stats.pendingDealers + stats.pendingServices + stats.pendingJobs;

  if (loading) return (
    <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#E63946] font-black uppercase tracking-widest text-sm">Loading Command Center...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs flex-shrink-0">K</div>
          <div>
            <p className="text-xs font-black text-white uppercase tracking-widest">Kgofu</p>
            <p className="text-[9px] text-[#E63946] font-bold uppercase tracking-widest">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Main</p>
          <ul className="space-y-1">
            {NAV.map(item => {
              const badge = item.key ? badges[item.key] : 0;
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                    item.active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}>
                    <span>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="bg-[#F59E0B] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Quick Links</p>
            <ul className="space-y-1">
              {[
                ['🌐', 'View Site',     'http://localhost:3000'],
                ['🔧', 'Services Page', 'http://localhost:3000/services'],
                ['🗄️', 'Supabase',     'https://supabase.com/dashboard/project/xklyirzvbjncedymrjqj'],
              ].map(([icon, label, href]) => (
                <li key={label}>
                  <Link href={href} target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all">
                    <span>{icon}</span><span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 ml-[260px] overflow-y-auto">

        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
              Command <span className="text-[#E63946]">Overview</span>
            </h1>
            <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {totalPending > 0 && (
            <div className="flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-4 py-2 rounded-sm animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="text-[#F59E0B] font-black text-[11px] uppercase tracking-widest">{totalPending} Item{totalPending !== 1 ? 's' : ''} Awaiting Approval</span>
            </div>
          )}
        </header>

        <div className="p-8 space-y-8">

          {/* ── STATS GRID ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: 'Active Listings',   value: stats.activeListings,  color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20', icon: '📋' },
              { label: 'Total Views',       value: stats.totalViews.toLocaleString(), color: 'text-[#10B981]', border: 'border-[#10B981]/20', icon: '👁️' },
              { label: 'Active Dealers',    value: stats.totalDealers,    color: 'text-[#C9922A]', border: 'border-[#C9922A]/20', icon: '🏪' },
              { label: 'Active Services',   value: stats.totalServices,   color: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20', icon: '🔧' },
              { label: 'Active Jobs',       value: stats.totalJobs,       color: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20', icon: '💼' },
              { label: 'Total Users',       value: stats.totalUsers,      color: 'text-[#E63946]', border: 'border-[#E63946]/20', icon: '👥' },
            ].map(stat => (
              <div key={stat.label} className={`bg-[#0D1420] border ${stat.border} rounded-sm p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-tight">{stat.label}</p>
                  <span className="text-base">{stat.icon}</span>
                </div>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* ── PENDING COUNTS ROW ────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Dealers Pending',  value: stats.pendingDealers,  href: '/admin/dealers',  color: 'border-[#E63946]/30 text-[#E63946]'  },
              { label: 'Clubs Unverified', value: stats.pendingClubs,    href: '/admin/clubs',    color: 'border-[#C9922A]/30 text-[#C9922A]'  },
              { label: 'Services Pending', value: stats.pendingServices, href: '/admin/services', color: 'border-[#8B5CF6]/30 text-[#8B5CF6]'  },
              { label: 'Jobs Pending',     value: stats.pendingJobs,     href: '/admin/jobs',     color: 'border-[#F59E0B]/30 text-[#F59E0B]'  },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className={`bg-[#0D1420] border ${item.color} rounded-sm p-4 flex items-center justify-between hover:brightness-125 transition-all group`}>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{item.label}</p>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-4xl font-black ${item.color.split(' ')[1]}`}>{item.value}</p>
                </div>
                <span className="text-white/20 group-hover:text-white/60 text-lg transition-colors">→</span>
              </Link>
            ))}
          </div>

          {/* ── PENDING DEALERS ───────────────────────────────────────── */}
          {pendingDealers.length > 0 && (
            <PendingSection
              title="Pending Dealer Applications"
              color="text-[#E63946]"
              borderColor="border-[#E63946]/20"
              viewAllHref="/admin/dealers"
              items={pendingDealers}
              onApprove={quickApproveDealer}
              onReject={quickRejectDealer}
              getTitle={d => d.business_name}
              getSub={d => `${d.city}, ${d.province} · ${fmt(d.created_at)}`}
            />
          )}

          {/* ── PENDING SERVICES ──────────────────────────────────────── */}
          {pendingServices.length > 0 && (
            <PendingSection
              title="Pending Service Provider Applications"
              color="text-[#8B5CF6]"
              borderColor="border-[#8B5CF6]/20"
              viewAllHref="/admin/services"
              items={pendingServices}
              onApprove={quickApproveService}
              onReject={quickRejectService}
              getTitle={s => s.name}
              getSub={s => `${s.type} · ${s.city}, ${s.province} · ${fmt(s.created_at)}`}
            />
          )}

          {/* ── PENDING JOBS ──────────────────────────────────────────── */}
          {pendingJobs.length > 0 && (
            <PendingSection
              title="Pending Job Listings"
              color="text-[#F59E0B]"
              borderColor="border-[#F59E0B]/20"
              viewAllHref="/admin/jobs"
              items={pendingJobs}
              onApprove={quickApproveJob}
              onReject={quickRejectJob}
              getTitle={j => j.title}
              getSub={j => `${j.company} · ${j.location} · ${fmt(j.created_at)}`}
            />
          )}

          {/* ── ALL CLEAR ─────────────────────────────────────────────── */}
          {totalPending === 0 && (
            <div className="bg-[#0D1420] border border-[#10B981]/20 rounded-sm p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-[#10B981]">All Clear</p>
              <p className="text-white/40 text-sm mt-1">No pending applications — you're up to date.</p>
            </div>
          )}

          {/* ── RECENT LISTINGS ───────────────────────────────────────── */}
          <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-white">
                Recent <span className="text-[#4CC9F0]">Listings</span>
              </h2>
              <Link href="/admin/listings" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">All Listings →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#080B12]">
                    {['Title', 'Category', 'Price', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentListings.map(l => (
                    <tr key={l.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-[13px] font-bold text-white max-w-[200px] truncate">{l.title}</td>
                      <td className="px-5 py-3 text-[12px] text-white/40 uppercase tracking-wider">{fmtCat(l.category_id)}</td>
                      <td className="px-5 py-3 text-[13px] font-black text-[#C9922A]">R{l.price?.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${
                          l.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white/40'
                        }`}>{l.status}</span>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-white/40">{fmt(l.created_at)}</td>
                    </tr>
                  ))}
                  {recentListings.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-white/30 text-sm">No listings yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Reusable pending section ───────────────────────────────────────────────
function PendingSection({ title, color, borderColor, viewAllHref, items, onApprove, onReject, getTitle, getSub }: {
  title: string;
  color: string;
  borderColor: string;
  viewAllHref: string;
  items: any[];
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  getTitle: (item: any) => string;
  getSub:   (item: any) => string;
}) {
  return (
    <div className={`bg-[#0D1420] border ${borderColor} rounded-sm overflow-hidden`}>
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} animate-pulse`} />
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-xl font-black uppercase ${color}`}>{title}</h2>
        </div>
        <Link href={viewAllHref} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">View All →</Link>
      </div>
      <div className="divide-y divide-white/5">
        {items.map(item => (
          <div key={item.id} className="px-6 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 ${borderColor.replace('border-', 'border ')} border rounded-sm flex items-center justify-center ${color} font-black flex-shrink-0`}>
              {getTitle(item)?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-white truncate">{getTitle(item)}</p>
              <p className="text-[11px] text-white/40 uppercase tracking-wider">{getSub(item)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={viewAllHref} className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 px-3 py-1.5 rounded-sm hover:bg-[#4CC9F0]/10 transition-all">
                Review
              </Link>
              <button onClick={() => onApprove(item.id)}
                className="text-[10px] font-black uppercase tracking-widest text-[#10B981] border border-[#10B981]/30 px-3 py-1.5 rounded-sm hover:bg-[#10B981]/10 transition-all">
                ✓ Approve
              </button>
              <button onClick={() => onReject(item.id)}
                className="text-[10px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 px-3 py-1.5 rounded-sm hover:bg-[#E63946]/10 transition-all">
                ✗ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
