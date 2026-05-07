'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DealerDashboardPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<any>(null);
  const [stats, setStats] = useState({ totalListings: 0, activeListings: 0, activeJobs: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/dealer/login'); return; }

      const { data: dealerData } = await supabase.from('dealers').select('*').eq('user_id', user.id).single();
      if (!dealerData || dealerData.status !== 'approved') { router.push('/dealer/login'); return; }
      setDealer(dealerData);

      // Fetch standard listings stats
      const { data: listings } = await supabase.from('listings').select('status').eq('dealer_id', dealerData.id);
      
      // Fetch job stats
      const { count: jobCount } = await supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('employer_id', user.id).eq('status', 'active');

      setStats({
        totalListings: listings?.length || 0,
        activeListings: listings?.filter(l => l.status === 'active').length || 0,
        activeJobs: jobCount || 0,
        totalViews: 0,
      });
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  if (loading) return <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center text-[#C9922A] font-bold">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">
      <aside className="w-[280px] bg-[#13151A] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex flex-col items-start group">
            <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase group-hover:text-[#C9922A] transition-colors">GUN <span className="text-[#C9922A] group-hover:text-[#F0EDE8]">X</span></span>
            <span className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">Dealer Dashboard</span>
          </Link>
        </div>
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#C9922A] flex items-center justify-center text-black text-xl font-black rounded-sm">{dealer?.business_name?.charAt(0) || 'D'}</div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-sm truncate">{dealer?.business_name}</h3><p className="text-xs text-[#8A8E99] uppercase tracking-wider">{dealer?.subscription_tier || 'Free'} Plan</p></div>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            <li><Link href="/dealer-dashboard" className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm"><span>📊</span><span>Overview</span></Link></li>
            <li><Link href="/dealer-dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors"><span>📦</span><span>Inventory</span></Link></li>
            <li><Link href="/dealer-dashboard/add-listing" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors"><span>➕</span><span>Add Listing</span></Link></li>
            {/* ADDED JOB LISTINGS LINK */}
            <li><Link href="/dealer-dashboard/jobs" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors"><span>💼</span><span>Recruitment (Jobs)</span></Link></li>
            <li><Link href="/dealer-dashboard/bulk-upload" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors"><span>📁</span><span>Bulk Upload</span></Link></li>
            <li><Link href="/dealer-dashboard/analytics" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors"><span>📈</span><span>Analytics</span></Link></li>
            <li><Link href="/dealer-dashboard/subscription" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors"><span>💳</span><span>Subscription</span></Link></li>
            <li><Link href="/dealer-dashboard/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors"><span>⚙️</span><span>Profile</span></Link></li>
            <li><Link href="/dealer-dashboard/promote" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors"><span>⭐</span><span>Promote Listings</span></Link></li>
          </ul>
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href={`/dealers/${dealer?.slug}`} target="_blank" className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors">View Storefront</Link>
          <button onClick={handleLogout} className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors">Logout</button>
        </div>
      </aside>

      <main className="flex-1 ml-[280px] overflow-y-auto">
        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-black uppercase tracking-tight">Dashboard <span className="text-[#C9922A]">Overview</span></h1>
          <p className="text-[#8A8E99] text-sm mt-2">Welcome back, {dealer?.business_name}</p>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#13151A] border border-white/5 p-6 rounded-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">Total Listings</span><span className="text-2xl">📦</span></div>
              <div className="text-3xl font-black text-[#C9922A]">{stats.totalListings}</div>
            </div>
            <div className="bg-[#13151A] border border-white/5 p-6 rounded-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">Active Listings</span><span className="text-2xl">✅</span></div>
              <div className="text-3xl font-black text-[#C9922A]">{stats.activeListings}</div>
            </div>
            {/* ADDED JOBS STAT BOX */}
            <div className="bg-[#13151A] border border-[#C9922A]/20 p-6 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#C9922A]/5 rounded-bl-full"></div>
              <div className="flex items-center justify-between mb-2"><span className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">Active Jobs</span><span className="text-2xl">💼</span></div>
              <div className="text-3xl font-black text-[#C9922A]">{stats.activeJobs}</div>
              <Link href="/dealer-dashboard/jobs" className="text-[10px] uppercase font-bold text-[#8A8E99] hover:text-[#C9922A] mt-2 inline-block">Manage Recruitment →</Link>
            </div>
            <div className="bg-[#13151A] border border-white/5 p-6 rounded-sm">
              <div className="flex items-center justify-between mb-2"><span className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">Total Views</span><span className="text-2xl">👁️</span></div>
              <div className="text-3xl font-black text-[#C9922A]">{stats.totalViews}</div>
              <span className="text-xs text-[#8A8E99]">Coming soon</span>
            </div>
          </div>

          <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 mb-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6">Quick <span className="text-[#C9922A]">Actions</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/dealer-dashboard/add-listing" className="bg-[#C9922A] text-black p-6 rounded-sm hover:brightness-110 transition-all"><div className="text-3xl mb-3">➕</div><h3 className="font-black uppercase text-lg mb-2">Add Listing</h3><p className="text-xs opacity-80">Create an item listing</p></Link>
              <Link href="/jobs/post" className="bg-[#1a1d24] border border-[#C9922A]/30 p-6 rounded-sm hover:border-[#C9922A] transition-all"><div className="text-3xl mb-3">💼</div><h3 className="font-black uppercase text-lg mb-2 text-[#C9922A]">Post a Job</h3><p className="text-xs text-[#8A8E99]">Hire industry staff</p></Link>
              <Link href="/dealer-dashboard/bulk-upload" className="bg-white/5 border border-white/10 p-6 rounded-sm hover:bg-white/10 transition-all"><div className="text-3xl mb-3">📁</div><h3 className="font-black uppercase text-lg mb-2 text-[#F0EDE8]">Bulk Upload</h3><p className="text-xs text-[#8A8E99]">Import via CSV</p></Link>
              <Link href="/dealer-dashboard/promote" className="bg-white/5 border border-white/10 p-6 rounded-sm hover:bg-white/10 transition-all"><div className="text-3xl mb-3">⭐</div><h3 className="font-black uppercase text-lg mb-2 text-[#F0EDE8]">Promote</h3><p className="text-xs text-[#8A8E99]">Feature listings</p></Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}