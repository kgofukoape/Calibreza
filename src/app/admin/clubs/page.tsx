'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';
import { openDocument, DOCUMENT_BUCKETS } from '@/lib/documents';

export default function AdminClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modMsg, setModMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
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

  // Read through the admin route rather than the browser client. Admin pages
  // query as the ANON user, so any restrictive RLS policy silently hides rows
  // (this is exactly what was hiding pending dealer applications).
  const loadClubs = async () => {
    try {
      const res = await fetch('/api/admin/records?type=club');
      const data = await res.json();
      if (res.ok) setClubs(data.records || []);
      else setModMsg({ kind: 'err', text: data.error || 'Could not load clubs.' });
    } catch {
      setModMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setLoading(false);
  };

  // Shared caller for every admin write on this page
  const adminAction = async (payload: Record<string, any>) => {
    const res = await fetch('/api/admin/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: 'club', ...payload }),
    });
    return { res, data: await res.json() };
  };

  const patchClub = (id: string, patch: Record<string, any>) => {
    setClubs(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, ...patch }));
  };

  const handleSuspend = async (club: any) => {
    const isSuspended = club.status === 'suspended';
    let reason = '';
    if (!isSuspended) {
      const input = prompt(
        `Suspend ${club.name}?\n\n` +
        `Their range will be hidden from the public directory. They keep dashboard access.\n\n` +
        `Reason (required — recorded in the audit trail):`
      );
      if (input === null) return;
      if (input.trim().length < 3) {
        setModMsg({ kind: 'err', text: 'A reason is required to suspend an account.' });
        return;
      }
      reason = input.trim();
    } else if (!confirm(`Reinstate ${club.name}?`)) return;

    setBusyId(club.id);
    setModMsg(null);
    try {
      const { res, data } = await adminAction({
        entityId: club.id,
        action: isSuspended ? 'reinstate' : 'suspend',
        reason,
      });
      if (res.ok) {
        setModMsg({ kind: 'ok', text: data.message || 'Done.' });
        patchClub(club.id, {
          status: data.status,
          suspended_reason: data.suspended_reason ?? null,
          suspended_at: data.suspended_at ?? null,
        });
      } else setModMsg({ kind: 'err', text: data.error || 'Something went wrong.' });
    } catch {
      setModMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setBusyId(null);
  };

  const setVerified = async (id: string, value: boolean) => {
    setBusyId(id);
    setModMsg(null);
    try {
      const { res, data } = await adminAction({ entityId: id, action: 'set_field', field: 'is_verified', value });
      if (res.ok) patchClub(id, { is_verified: value });
      else setModMsg({ kind: 'err', text: data.error || 'Could not update.' });
    } catch {
      setModMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setBusyId(null);
  };

  const handleVerify = (id: string) => setVerified(id, true);
  const handleUnverify = (id: string) => setVerified(id, false);

  const handleStatusChange = async (id: string, status: string) => {
    setBusyId(id);
    setModMsg(null);
    try {
      const { res, data } = await adminAction({ entityId: id, action: 'set_status', status });
      if (res.ok) {
        patchClub(id, { status });
        setModMsg({ kind: 'ok', text: data.message || 'Updated.' });
      } else setModMsg({ kind: 'err', text: data.error || 'Could not change status.' });
    } catch {
      setModMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setBusyId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this club? This cannot be undone.\n\nConsider suspending instead — that hides them without destroying anything.')) return;
    setBusyId(id);
    try {
      const { res, data } = await adminAction({ entityId: id, action: 'delete' });
      if (res.ok) {
        setClubs(prev => prev.filter(c => c.id !== id));
        if (selected?.id === id) setSelected(null);
        setModMsg({ kind: 'ok', text: 'Club deleted.' });
      } else setModMsg({ kind: 'err', text: data.error || 'Could not delete.' });
    } catch {
      setModMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setBusyId(null);
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
            <AdminNav />
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

                    {/* Routed through handleSuspend so a reason is captured, the
                        range is hidden from the directory, and an audit entry
                        is written — the old version only flipped the status. */}
                    <button onClick={() => handleSuspend(selected)} disabled={busyId === selected.id}
                      className={`border font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm transition-all disabled:opacity-40 ${
                        selected.status === 'suspended'
                          ? 'border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10'
                          : 'border-[#E63946]/30 text-[#E63946] hover:bg-[#E63946]/10'
                      }`}>
                      {busyId === selected.id
                        ? '...'
                        : selected.status === 'suspended' ? '✓ Reinstate Club' : '⊘ Suspend Club'}
                    </button>

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

                                {modMsg && (
                  <div className={`p-3 rounded-sm text-[12px] font-bold border mb-4 ${
                    modMsg.kind === 'ok'
                      ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                      : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
                  }`}>
                    {modMsg.text}
                  </div>
                )}

                {selected.status === 'suspended' && (
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-4 mb-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#F59E0B] mb-1">Suspended</p>
                    <p className="text-[12px] text-white/70 leading-relaxed">
                      {selected.suspended_reason || 'No reason recorded.'}
                      {selected.suspended_at
                        ? ` — ${new Date(selected.suspended_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : ''}
                    </p>
                  </div>
                )}

                {/* Club Info */}
                <div className="grid grid-cols-2 gap-4">
                  {/* ── APPLICATION DOCUMENTS ─────────────────────────────
                      Uploaded at application into a private bucket. The column
                      holds a path, so a signed link is generated on demand —
                      these are compliance certificates and should not carry
                      permanent public URLs. */}
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5 mb-4">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-white">
                      Uploaded <span className="text-[#4CC9F0]">Documents</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'SAPS Registration', path: (selected as any)?.saps_registration_url },
                        { label: 'Compliance Certificate', path: (selected as any)?.compliance_cert_url },
                      ].map(doc => (
                        <div key={doc.label}>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{doc.label}</p>
                          {doc.path ? (
                            <button onClick={() => openDocument(DOCUMENT_BUCKETS.business, doc.path)}
                              className="w-full flex items-center gap-2 bg-[#4CC9F0]/10 border border-[#4CC9F0]/20 px-3 py-2 rounded-sm text-[#4CC9F0] text-[10px] font-black uppercase tracking-widest hover:bg-[#4CC9F0]/20 transition-all">
                              📄 View
                            </button>
                          ) : (
                            <span className="text-white/20 text-xs">Not uploaded</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

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