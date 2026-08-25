'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminNav, { AdminNavCounts } from '@/components/admin/AdminNav';

// ─── COMMAND CENTER ──────────────────────────────────────────────────────────
// Everything the previous version did, plus what it could not answer.
//
// FOUR BUGS FIXED, all of the same kind — a filter that could never match:
//
//   Pending dealers and services were queried with status 'pending_payment'.
//   Those tables use 'pending'. Both queues were therefore always empty, no
//   matter how many applications were waiting.
//
//   Pending jobs counted status 'pending'. job_listings uses 'pending_payment'.
//   Always zero.
//
//   Pending clubs counted `!is_verified`, which is unverified clubs — a
//   different thing from clubs awaiting a decision.
//
//   The quick approve and reject buttons wrote to the database directly with
//   the anon key. Row-level security judges that request as if an ordinary
//   visitor made it, so approving a dealer returned success and changed
//   nothing. They now go through /api/admin/suspend, which holds the service
//   key, whitelists the status and writes an audit entry.
//
// ADDED: a money band (revenue, subscriptions, comped, stuck payments) and live
// presence. Both answer questions the old page could not.

interface Stats {
  totalListings: number; activeListings: number; totalViews: number;
  totalDealers: number; pendingDealers: number;
  totalClubs: number; pendingClubs: number;
  totalServices: number; pendingServices: number;
  totalJobs: number; pendingJobs: number;
  pendingVerification: number; pendingAds: number;
  totalUsers: number;
  activeSubscriptions: number; compedSubscriptions: number;
  revenueThisMonth: number; stuckPayments: number;
}

const EMPTY: Stats = {
  totalListings: 0, activeListings: 0, totalViews: 0,
  totalDealers: 0, pendingDealers: 0, totalClubs: 0, pendingClubs: 0,
  totalServices: 0, pendingServices: 0, totalJobs: 0, pendingJobs: 0,
  pendingVerification: 0, pendingAds: 0, totalUsers: 0,
  activeSubscriptions: 0, compedSubscriptions: 0,
  revenueThisMonth: 0, stuckPayments: 0,
};

/** Every privileged write goes through the service-role route. */
async function adminAction(payload: Record<string, any>) {
  const res = await fetch('/api/admin/suspend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Action failed');
  return json;
}

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [presence, setPresence] = useState<any>(null);

  const [pendingDealers, setPendingDealers]   = useState<any[]>([]);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [pendingJobs, setPendingJobs]         = useState<any[]>([]);
  const [recentListings, setRecentListings]   = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadPresence();
    // Presence only. Reloading everything every 30 seconds would shift the page
    // under you while you are reading it.
    const t = setInterval(loadPresence, 30_000);
    return () => clearInterval(t);
  }, []);

  const loadPresence = async () => {
    try {
      const res = await fetch('/api/admin/presence');
      if (!res.ok) return;
      const json = await res.json();
      if (json.ok) setPresence(json.data);
    } catch { /* a nicety — never break the page over it */ }
  };

  const loadData = async () => {
    try {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

      const [
        listingsRes, dealersRes, pendingDealersRes,
        clubsRes, servicesRes, pendingServicesRes,
        jobsRes, pendingJobsRes, usersRes,
        verifRes, adsRes, compedRes, invoicesRes, stuckRes,
      ] = await Promise.all([
        supabase.from('listings').select('id, status, views_count'),
        supabase.from('dealers').select('id, status, subscription_tier'),
        // 'pending', not 'pending_payment' — see the note at the top.
        supabase.from('dealers').select('*').eq('status', 'pending')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('clubs').select('id, status, is_verified, subscription_status'),
        supabase.from('services').select('id, status'),
        supabase.from('services').select('*').eq('status', 'pending')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('job_listings').select('id, status'),
        supabase.from('job_listings').select('*').eq('status', 'pending_payment')
          .order('created_at', { ascending: false }).limit(5),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('verification_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('dealers').select('id', { count: 'exact', head: true }).eq('is_comped', true),
        supabase.from('invoices').select('amount').gte('created_at', monthStart.toISOString()),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'pending_payment'),
      ]);

      const listings = listingsRes.data || [];
      const dealers  = dealersRes.data  || [];
      const clubs    = clubsRes.data    || [];
      const services = servicesRes.data || [];
      const jobs     = jobsRes.data     || [];

      // Refunds are negative amounts, so this is the net figure rather than a
      // gross one that flatters the month.
      const revenue = (invoicesRes.data || [])
        .reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0) / 100;

      setStats({
        totalListings:  listings.length,
        activeListings: listings.filter(l => l.status === 'active').length,
        totalViews:     listings.reduce((s, l) => s + (l.views_count || 0), 0),

        totalDealers:   dealers.filter(d => d.status === 'approved').length,
        pendingDealers: dealers.filter(d => d.status === 'pending').length,

        totalClubs:     clubs.length,
        // Clubs awaiting a decision, not clubs lacking a badge.
        pendingClubs:   clubs.filter(c => c.status === 'pending').length,

        totalServices:   services.filter(s => s.status === 'active').length,
        pendingServices: services.filter(s => s.status === 'pending').length,

        totalJobs:   jobs.filter(j => j.status === 'active').length,
        pendingJobs: jobs.filter(j => j.status === 'pending_payment').length,

        pendingVerification: verifRes.count || 0,
        pendingAds:          adsRes.count   || 0,
        totalUsers:          usersRes.count || 0,

        activeSubscriptions:
          dealers.filter(d => ['pro', 'premium'].includes(d.subscription_tier)).length +
          clubs.filter(c => c.subscription_status === 'active').length,
        compedSubscriptions: compedRes.count || 0,
        revenueThisMonth: revenue,
        stuckPayments: (stuckRes.count || 0) +
          jobs.filter(j => j.status === 'pending_payment').length,
      });

      setPendingDealers(pendingDealersRes.data   || []);
      setPendingServices(pendingServicesRes.data || []);
      setPendingJobs(pendingJobsRes.data         || []);

      const { data: recentL } = await supabase
        .from('listings')
        .select('id, title, status, category_id, price, created_at')
        .order('created_at', { ascending: false }).limit(6);
      setRecentListings(recentL || []);

    } catch (e) {
      console.error('[admin] load', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Quick actions, through the API ─────────────────────────────────────
  const act = async (
    entityType: string, id: string, status: string,
    clear: (id: string) => void,
  ) => {
    try {
      await adminAction({ entityType, entityId: id, action: 'set_status', status });
      clear(id);
    } catch (err: any) {
      // Previously these failed silently. If the change did not happen you
      // should be told, not left looking at a list that lies.
      alert(`Could not update: ${err.message}`);
    }
  };

  const dropDealer  = (id: string) => { setPendingDealers(p => p.filter(d => d.id !== id));  setStats(s => ({ ...s, pendingDealers: s.pendingDealers - 1 })); };
  const dropService = (id: string) => { setPendingServices(p => p.filter(x => x.id !== id)); setStats(s => ({ ...s, pendingServices: s.pendingServices - 1 })); };
  const dropJob     = (id: string) => { setPendingJobs(p => p.filter(j => j.id !== id));     setStats(s => ({ ...s, pendingJobs: s.pendingJobs - 1 })); };

  const fmt    = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  const fmtCat = (c: string) => c?.replace(/-/g, ' ').replace(/\b\w/g, x => x.toUpperCase()) || '—';
  const rand   = (n: number) => `R${n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

  const counts: AdminNavCounts = {
    pendingDealers: stats.pendingDealers,
    pendingClubs: stats.pendingClubs,
    pendingServices: stats.pendingServices,
    pendingJobs: stats.pendingJobs,
    pendingVerification: stats.pendingVerification,
    pendingAds: stats.pendingAds,
  };

  const totalPending =
    stats.pendingDealers + stats.pendingServices + stats.pendingJobs +
    stats.pendingClubs + stats.pendingVerification + stats.pendingAds;

  if (loading) return (
    <div className="min-h-screen bg-[#080B12] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#E63946] font-black uppercase tracking-widest text-sm">Loading Command Center…</span>
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

        {/* Shared nav — includes Ad Manager and Verification, which the old
            hand-written list omitted, leaving both reachable only by URL. */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <AdminNav counts={counts} />

          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Quick Links</p>
            <ul className="space-y-1">
              {[
                ['🌐', 'View Site', '/'],
                ['🔧', 'Services Page', '/services'],
                ['🗄️', 'Supabase', 'https://supabase.com/dashboard/project/xklyirzvbjncedymrjqj'],
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

          <div className="flex items-center gap-3">
            {presence && (
              <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/50">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                {presence.total} on site
              </span>
            )}
            {totalPending > 0 && (
              <div className="flex items-center gap-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-4 py-2 rounded-sm">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-[#F59E0B] font-black text-[11px] uppercase tracking-widest">
                  {totalPending} Awaiting You
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* ── THE MONEY ─────────────────────────────────────────────── */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9922A] mb-3">The Money</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Revenue This Month', value: rand(stats.revenueThisMonth), color: 'text-[#C9922A]', border: 'border-[#C9922A]/20', icon: '💰' },
                { label: 'Active Subscriptions', value: stats.activeSubscriptions, color: 'text-[#10B981]', border: 'border-[#10B981]/20', icon: '🔄' },
                { label: 'Comped', value: stats.compedSubscriptions, color: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20', icon: '🎁', note: 'Granted, not paid' },
                { label: 'Stuck Payments', value: stats.stuckPayments, color: stats.stuckPayments > 0 ? 'text-[#E63946]' : 'text-white/40', border: 'border-[#E63946]/20', icon: '⚠️', note: 'Started, never finished' },
              ].map(s => (
                <div key={s.label} className={`bg-[#0D1420] border ${s.border} rounded-sm p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-tight">{s.label}</p>
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  {s.note && <p className="text-[9px] text-white/25 mt-1">{s.note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* ── THE PLATFORM ──────────────────────────────────────────── */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#4CC9F0] mb-3">The Platform</p>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { label: 'Active Listings', value: stats.activeListings, color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20', icon: '📋' },
                { label: 'Total Views', value: stats.totalViews.toLocaleString(), color: 'text-[#10B981]', border: 'border-[#10B981]/20', icon: '👁️' },
                { label: 'Active Dealers', value: stats.totalDealers, color: 'text-[#C9922A]', border: 'border-[#C9922A]/20', icon: '🏪' },
                { label: 'Active Services', value: stats.totalServices, color: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20', icon: '🔧' },
                { label: 'Active Jobs', value: stats.totalJobs, color: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20', icon: '💼' },
                { label: 'Total Users', value: stats.totalUsers, color: 'text-[#E63946]', border: 'border-[#E63946]/20', icon: '👥' },
              ].map(s => (
                <div key={s.label} className={`bg-[#0D1420] border ${s.border} rounded-sm p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-tight">{s.label}</p>
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── PENDING COUNTS ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { label: 'Dealers', value: stats.pendingDealers, href: '/admin/dealers', color: 'border-[#E63946]/30 text-[#E63946]' },
              { label: 'Clubs', value: stats.pendingClubs, href: '/admin/clubs', color: 'border-[#C9922A]/30 text-[#C9922A]' },
              { label: 'Services', value: stats.pendingServices, href: '/admin/services', color: 'border-[#8B5CF6]/30 text-[#8B5CF6]' },
              { label: 'Jobs', value: stats.pendingJobs, href: '/admin/jobs', color: 'border-[#F59E0B]/30 text-[#F59E0B]' },
              { label: 'Documents', value: stats.pendingVerification, href: '/admin/verification', color: 'border-[#4CC9F0]/30 text-[#4CC9F0]' },
              { label: 'Ad Bookings', value: stats.pendingAds, href: '/admin/ads', color: 'border-[#10B981]/30 text-[#10B981]' },
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

          {/* ── PENDING QUEUES ────────────────────────────────────────── */}
          {pendingDealers.length > 0 && (
            <PendingSection
              title="Pending Dealer Applications" color="text-[#E63946]"
              borderColor="border-[#E63946]/20" viewAllHref="/admin/dealers"
              items={pendingDealers}
              onApprove={id => act('dealer', id, 'approved', dropDealer)}
              onReject={id => act('dealer', id, 'rejected', dropDealer)}
              getTitle={d => d.business_name}
              getSub={d => `${d.city}, ${d.province} · ${fmt(d.created_at)}`}
            />
          )}

          {pendingServices.length > 0 && (
            <PendingSection
              title="Pending Service Providers" color="text-[#8B5CF6]"
              borderColor="border-[#8B5CF6]/20" viewAllHref="/admin/services"
              items={pendingServices}
              onApprove={id => act('service', id, 'active', dropService)}
              onReject={id => act('service', id, 'rejected', dropService)}
              getTitle={s => s.business_name || s.name}
              getSub={s => `${s.category || s.type || ''} · ${s.city}, ${s.province} · ${fmt(s.created_at)}`}
            />
          )}

          {pendingJobs.length > 0 && (
            <PendingSection
              title="Jobs Awaiting Payment" color="text-[#F59E0B]"
              borderColor="border-[#F59E0B]/20" viewAllHref="/admin/jobs"
              items={pendingJobs}
              onApprove={id => act('job', id, 'active', dropJob)}
              onReject={id => act('job', id, 'rejected', dropJob)}
              getTitle={j => j.title}
              getSub={j => `${j.company} · ${j.location} · ${fmt(j.created_at)}`}
            />
          )}

          {totalPending === 0 && (
            <div className="bg-[#0D1420] border border-[#10B981]/20 rounded-sm p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-[#10B981]">All Clear</p>
              <p className="text-white/40 text-sm mt-1">Nothing waiting on you.</p>
            </div>
          )}

          {/* ── RIGHT NOW ─────────────────────────────────────────────── */}
          {presence && presence.total > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-4">Most Viewed Right Now</p>
                <div className="space-y-2">
                  {presence.topPaths.map((p: any) => (
                    <div key={p.path} className="flex items-center justify-between text-[13px]">
                      <span className="text-white/70 truncate mr-3">{p.path}</span>
                      <span className="text-[#C9922A] font-bold flex-shrink-0">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-4">
                  Signed In ({presence.signedIn}) · Anonymous ({presence.anonymous})
                </p>
                {presence.visitors.filter((v: any) => v.signedIn).length === 0 ? (
                  <p className="text-[13px] text-white/25">Nobody signed in at the moment.</p>
                ) : (
                  <div className="space-y-2">
                    {presence.visitors.filter((v: any) => v.signedIn).slice(0, 8).map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[13px]">
                        <span className="text-white/70 truncate mr-3">
                          {v.name || v.email}
                          {v.tier && <span className="text-[#C9922A] text-[9px] font-black uppercase ml-2">{v.tier}</span>}
                        </span>
                        <span className="text-white/25 text-[11px] truncate flex-shrink-0">{v.path}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Anonymous visitors are counted, never itemised. This page is
                    for running the platform, not watching individuals. */}
              </div>
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
  title: string; color: string; borderColor: string; viewAllHref: string;
  items: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  getTitle: (item: any) => string;
  getSub: (item: any) => string;
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
            <div className={`w-10 h-10 border ${borderColor} rounded-sm flex items-center justify-center ${color} font-black flex-shrink-0`}>
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