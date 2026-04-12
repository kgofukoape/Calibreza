'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    loadClubs();
  }, []);

  const loadClubs = async () => {
    const { data } = await supabase.from('clubs').select('*').order('created_at', { ascending: false });
    setClubs(data || []);
    setLoading(false);
  };

  const handleVerify = async (id: string) => {
    await supabase.from('clubs').update({ is_verified: true }).eq('id', id);
    setClubs(prev => prev.map(c => c.id === id ? { ...c, is_verified: true } : c));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, is_verified: true }));
  };

  const handleUnverify = async (id: string) => {
    await supabase.from('clubs').update({ is_verified: false }).eq('id', id);
    setClubs(prev => prev.map(c => c.id === id ? { ...c, is_verified: false } : c));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, is_verified: false }));
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('clubs').update({ status }).eq('id', id);
    setClubs(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this club?')) return;
    await supabase.from('clubs').delete().eq('id', id);
    setClubs(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('gunx_admin_session');
    router.push('/admin/login');
  };

  const filtered = clubs.filter(c => {
    if (filter === 'verified' && !c.is_verified) return false;
    if (filter === 'unverified' && c.is_verified) return false;
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase()) && !c.city?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  const NAV_ITEMS = [
    { href: '/admin', icon: '⚡', label: 'Overview' },
    { href: '/admin/dealers', icon: '🏪', label: 'Dealers' },
    { href: '/admin/clubs', icon: '⊕', label: 'Clubs & Ranges', active: true },
    { href: '/admin/listings', icon: '📋', label: 'Listings' },
    { href: '/admin/users', icon: '👥', label: 'Users' },
    { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center"><span className="text-white font-black text-sm">GX</span></div>
            <div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
              <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white font-black text-xs">K</div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Kgofu</p>
              <p className="text-[9px] text-[#E63946] font-bold uppercase tracking-widest">Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Main</p>
          <ul className="space-y-1">
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                  item.active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 px-3 mb-2">Quick Links</p>
            <ul className="space-y-1">
              <li><Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"><span>🌐</span><span>View Site</span></Link></li>
              <li><Link href="/clubs" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"><span>⊕</span><span>Clubs Page</span></Link></li>
              <li><Link href="https://supabase.com/dashboard/project/xklyirzvbjncedymrjqj" target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/50 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"><span>🗄️</span><span>Supabase</span></Link></li>
            </ul>
          </div>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-[260px] overflow-y-auto">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
            Clubs & <span className="text-[#E63946]">Ranges</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">Manage club listings and verification</p>
        </header>

        <div className="flex h-[calc(100vh-81px)]">

          {/* LEFT PANEL — Club List */}
          <div className="w-[380px] flex-shrink-0 border-r border-white/5 flex flex-col">

            {/* Search + Filter */}
            <div className="p-4 border-b border-white/5 flex flex-col gap-3">
              <input type="text" placeholder="Search clubs..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#080B12] border border-white/10 rounded-sm px-3 py-2 text-[12px] text-white placeholder-white/30 focus:outline-none focus:border-[#E63946]/50" />
              <div className="flex gap-1">
                {(['all', 'unverified', 'verified'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${filter === f ? 'bg-[#E63946] text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{filtered.length} club{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Club List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#E63946] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-white/30 text-sm">No clubs found</div>
              ) : filtered.map(club => (
                <div key={club.id}
                  onClick={() => setSelected(club)}
                  className={`px-4 py-4 cursor-pointer transition-all hover:bg-white/5 ${selected?.id === club.id ? 'bg-white/5 border-l-2 border-[#E63946]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-[#C9922A]/10 border border-[#C9922A]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {club.logo_url ? (
                        <img src={club.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#C9922A] font-black text-sm">{club.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{club.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">{club.city}, {club.province}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                        club.is_verified ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20'
                      }`}>
                        {club.is_verified ? '✓ Verified' : 'Unverified'}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                        club.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white/30'
                      }`}>
                        {club.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL — Club Detail */}
          <div className="flex-1 overflow-y-auto">
            {!selected ? (
              <div className="flex items-center justify-center h-full flex-col gap-4 text-white/20">
                <span className="text-6xl">⊕</span>
                <p className="text-sm uppercase tracking-widest font-bold">Select a club to manage</p>
              </div>
            ) : (
              <div className="p-8 space-y-6">

                {/* Club Header */}
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-sm bg-[#C9922A]/10 border border-[#C9922A]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {selected.logo_url ? (
                      <img src={selected.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#C9922A] font-black text-3xl">{selected.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase text-white mb-1">{selected.name}</h2>
                    <p className="text-white/50 text-sm mb-2">📍 {selected.city}, {selected.province}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border ${
                        selected.is_verified ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]' : 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]'
                      }`}>
                        {selected.is_verified ? '✓ Verified' : '⚠ Unverified'}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border ${
                        selected.status === 'active' ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]' : 'border-white/10 bg-white/5 text-white/40'
                      }`}>
                        {selected.status}
                      </span>
                      {selected.disciplines?.map((d: string) => (
                        <span key={d} className="text-[10px] font-black uppercase px-2 py-1 rounded-sm border border-[#C9922A]/20 bg-[#C9922A]/5 text-[#C9922A]">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-white">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    {!selected.is_verified ? (
                      <button onClick={() => handleVerify(selected.id)}
                        className="bg-[#10B981] text-white font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all">
                        ✓ Verify Club
                      </button>
                    ) : (
                      <button onClick={() => handleUnverify(selected.id)}
                        className="bg-[#F59E0B] text-black font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all">
                        Remove Verification
                      </button>
                    )}

                    {selected.status === 'active' ? (
                      <button onClick={() => handleStatusChange(selected.id, 'suspended')}
                        className="border border-[#E63946]/30 text-[#E63946] font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:bg-[#E63946]/10 transition-all">
                        Suspend Club
                      </button>
                    ) : (
                      <button onClick={() => handleStatusChange(selected.id, 'active')}
                        className="border border-[#10B981]/30 text-[#10B981] font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:bg-[#10B981]/10 transition-all">
                        Restore Club
                      </button>
                    )}

                    <Link href={`/clubs/${selected.slug}`} target="_blank"
                      className="border border-white/10 text-white/60 font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:bg-white/5 transition-all">
                      🌐 View Public Page
                    </Link>

                    <button onClick={() => handleDelete(selected.id)}
                      className="border border-red-500/30 text-red-400 font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:bg-red-500/10 transition-all ml-auto">
                      Delete Club
                    </button>
                  </div>
                </div>

                {/* Club Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-white">Contact</h3>
                    <div className="space-y-3">
                      {[
                        ['Email', selected.email],
                        ['Phone', selected.phone],
                        ['Address', selected.address],
                        ['Website', selected.website],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label as string}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
                          <p className="text-[13px] text-white font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-white">Fees</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">Annual Membership</p>
                        <p className="text-xl font-black text-[#C9922A]">{selected.membership_fee ? `R ${Number(selected.membership_fee).toLocaleString('en-ZA')}` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">Range Fee</p>
                        <p className="text-xl font-black text-[#C9922A]">{selected.range_fee ? `R ${Number(selected.range_fee).toLocaleString('en-ZA')}` : '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-0.5">Registered</p>
                        <p className="text-[13px] text-white">{formatDate(selected.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shoot Days */}
                {selected.shoot_days?.length > 0 && (
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-white">Shoot Days</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selected.shoot_days.map((day: any, idx: number) => (
                        <div key={idx} className="bg-[#080B12] rounded-sm p-3 border border-white/5">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-black text-sm text-white">{day.day}</p>
                              {day.discipline && <p className="text-[11px] text-[#C9922A]">{day.discipline}</p>}
                              {day.time && <p className="text-[11px] text-white/40">{day.time}</p>}
                            </div>
                            {day.fee && <p className="text-sm font-black text-[#C9922A]">R{day.fee}</p>}
                          </div>
                          {day.notes && <p className="text-[11px] text-white/30 mt-1">{day.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selected.description && (
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-3 text-white">Description</h3>
                    <p className="text-[13px] text-white/60 leading-relaxed">{selected.description}</p>
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