'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SIDEBAR_LINKS = [
  { href: '/dealer-dashboard', icon: '📊', label: 'Overview' },
  { href: '/dealer-dashboard/inventory', icon: '📦', label: 'Inventory' },
  { href: '/dealer-dashboard/add-listing', icon: '➕', label: 'Add Listing' },
  { href: '/dealer-dashboard/jobs', icon: '💼', label: 'Job Listings', active: true },
  { href: '/dealer-dashboard/analytics', icon: '📈', label: 'Analytics' },
  { href: '/dealer-dashboard/profile', icon: '⚙️', label: 'Profile' },
];

export default function DealerJobsDashboard() {
  const router = useRouter();
  const [dealer, setDealer] = useState<any>(null);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployerJobs() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/dealer/login'); return; }

      const { data: dealerData } = await supabase.from('dealers').select('*').eq('user_id', session.user.id).single();
      if (!dealerData || dealerData.status !== 'approved') { router.push('/dealer/login'); return; }
      setDealer(dealerData);

      // Fetch jobs AND count the clicks/leads
      const { data, error } = await supabase
        .from('job_listings')
        .select(`*, job_clicks ( count )`)
        .eq('employer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) setMyJobs(data);
      setLoading(false);
    }
    fetchEmployerJobs();
  }, [router]);

  const handleBoost = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/jobs/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ jobId })
      });
      const data = await res.json();
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      else alert(data.error || "Failed to initiate boost.");
    } catch (e) { alert("Network error."); }
  };

  const calculateDaysLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">
      {/* YOUR EXACT SIDEBAR */}
      <aside className="w-[240px] bg-[#13151A] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-5 border-b border-white/5">
          <Link href="/">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-tighter text-[#F0EDE8]">GUN <span className="text-[#C9922A]">X</span></span>
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
          <Link href={`/dealers/${dealer?.slug}`} target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-[#8A8E99] hover:bg-white/5 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🌐</span><span>My Storefront</span>
          </Link>
        </div>
      </aside>

      {/* NEW ANALYTICS MAIN CONTENT */}
      <main className="flex-1 ml-[240px] overflow-y-auto">
        <header className="bg-[#13151A] border-b border-white/5 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight">Recruitment <span className="text-[#C9922A]">Dashboard</span></h1>
            <p className="text-[#8A8E99] text-xs mt-0.5 uppercase tracking-widest font-bold">Manage listings & track leads</p>
          </div>
          <Link href="/jobs/post" style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all">
            + Post Job
          </Link>
        </header>

        <div className="p-8 max-w-[1000px]">
          {myJobs.length === 0 ? (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-20 text-center">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="text-xl font-black uppercase text-white mb-2">No Active Listings</h3>
              <p className="text-[#8A8E99] text-sm mb-6">You haven't posted any jobs to the Gun X network yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myJobs.map(job => {
                const daysLeft = calculateDaysLeft(job.expires_at);
                const applicantClicks = job.job_clicks[0]?.count || 0; 
                
                return (
                  <div key={job.id} className={`bg-[#13151A] border p-6 flex flex-col md:flex-row items-center justify-between gap-6 ${job.is_boosted ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)] rounded-md' : 'border-white/5 rounded-sm'}`}>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase tracking-tight text-white">{job.title}</h3>
                        <span className={`px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest ${job.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : job.status === 'pending_payment' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                        {job.is_boosted && <span className="px-2 py-1 rounded-sm bg-red-500 text-white text-[9px] font-black uppercase tracking-widest">Urgent Hire Active</span>}
                      </div>
                      <p className="text-[12px] text-[#8A8E99]"><span className="text-[#C9922A] font-bold">{job.category}</span> • {job.location}</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="bg-[#0D0F13] border border-white/5 p-4 rounded-sm text-center min-w-[100px]">
                        <p className="text-[10px] text-[#8A8E99] font-black uppercase tracking-widest mb-1">Time Left</p>
                        <p className={`text-2xl font-black ${daysLeft < 5 ? 'text-red-400' : 'text-white'}`}>{daysLeft} <span className="text-xs font-normal">days</span></p>
                      </div>
                      <div className="bg-[#C9922A]/10 border border-[#C9922A]/20 p-4 rounded-sm text-center min-w-[120px]">
                        <p className="text-[10px] text-[#C9922A] font-black uppercase tracking-widest mb-1">CV Leads Sent</p>
                        <p className="text-2xl font-black text-[#C9922A]">{applicantClicks}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      {job.status === 'pending_payment' && (
                         <button className="bg-[#C9922A] text-black px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:brightness-110">Complete Payment</button>
                      )}
                      {job.status === 'active' && (
                        <>
                          {!job.is_boosted && (
                            <button onClick={() => handleBoost(job.id)} className="bg-red-500 text-white px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-1">
                              <span>🔥</span> Boost (R150)
                            </button>
                          )}
                          <Link href={`/jobs`} className="border border-white/20 text-[#8A8E99] text-center px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white">View Listing</Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}