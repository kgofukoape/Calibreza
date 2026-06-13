'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin',              icon: '⚡', label: 'Overview'      },
  { href: '/admin/dealers',      icon: '🏪', label: 'Dealers'       },
  { href: '/admin/clubs',        icon: '⊕',  label: 'Clubs'         },
  { href: '/admin/services',     icon: '🔧', label: 'Services', active: true },
  { href: '/admin/jobs',         icon: '💼', label: 'Jobs'          },
  { href: '/admin/listings',     icon: '📋', label: 'Listings'      },
  { href: '/admin/users',        icon: '👥', label: 'Users'         },
  { href: '/admin/analytics',    icon: '📈', label: 'Analytics'     },
  { href: '/admin/crm',          icon: '💰', label: 'CRM'           },
  { href: '/admin/sentinel',     icon: '👁️', label: 'Tokoloshe'     },
];

const TYPE_LABEL: Record<string, string> = {
  gunsmith:  '🔧 Gunsmith',
  training:  '🎯 Training',
  legal:     '⚖️ Legal',
  logistics: '🔒 Logistics',
  hunting:   '🌿 Hunting',
  range:     '🎯 Range',
  other:     '📋 Other',
};

const STATUS_FILTERS = ['all', 'pending', 'active', 'rejected'];

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices]         = useState<any[]>([]);
  const [filtered, setFiltered]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch]             = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal]   = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    loadServices();
  }, []);

  useEffect(() => {
    let result = services;
    if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter);
    if (search) result = result.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [statusFilter, search, services]);

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
    setServices(data || []);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    await supabase.from('services').update({ status: 'active' }).eq('id', id);
    setServices(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
    if (selected?.id === id) setSelected((p: any) => ({ ...p, status: 'active' }));

    // Email notification to provider
    const svc = services.find(s => s.id === id);
    if (svc?.email) {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:    'service_approved',
          to:      svc.email,
          name:    svc.name,
          contact: svc.contact_name,
          slug:    svc.slug,
        }),
      });
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionLoading(rejectModal.id);
    await supabase.from('services').update({ status: 'rejected' }).eq('id', rejectModal.id);
    setServices(prev => prev.map(s => s.id === rejectModal.id ? { ...s, status: 'rejected' } : s));
    if (selected?.id === rejectModal.id) setSelected((p: any) => ({ ...p, status: 'rejected' }));
    setRejectModal(null);
    setRejectReason('');
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this service listing?')) return;
    setActionLoading(id);
    await supabase.from('services').delete().eq('id', id);
    setServices(prev => prev.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
    setActionLoading(null);
  };

  const fmt    = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  const counts = {
    all:      services.length,
    pending:  services.filter(s => s.status === 'pending').length,
    active:   services.filter(s => s.status === 'active').length,
    rejected: services.filter(s => s.status === 'rejected').length,
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
                  {item.href === '/admin/services' && counts.pending > 0 && (
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
            Service <span className="text-[#E63946]">Providers</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            {services.length} total · {counts.pending} pending approval
          </p>
        </header>

        <div className="flex h-[calc(100vh-73px)]">

          {/* LEFT — List */}
          <div className="w-[400px] flex-shrink-0 border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 space-y-3">
              <input type="text" placeholder="Search by name, city or email..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#080B12] border border-white/10 rounded-sm px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E63946]/50" />
              <div className="flex gap-1">
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
                <div className="p-8 text-center text-white/30 text-sm">No services found</div>
              ) : filtered.map(svc => (
                <button key={svc.id} onClick={() => setSelected(svc)}
                  className={`w-full text-left px-4 py-4 hover:bg-white/5 transition-all ${selected?.id === svc.id ? 'bg-[#E63946]/5 border-l-2 border-[#E63946]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-black text-sm flex-shrink-0 overflow-hidden">
                      {svc.logo_url ? <img src={svc.logo_url} alt="" className="w-full h-full object-cover" /> : svc.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{svc.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">{svc.city}, {svc.province}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                        svc.status === 'active'   ? 'bg-[#10B981]/10 text-[#10B981]' :
                        svc.status === 'pending'  ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                        'bg-[#E63946]/10 text-[#E63946]'
                      }`}>{svc.status}</span>
                      <span className="text-[8px] text-white/20 uppercase">{svc.type}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Detail */}
          <div className="flex-1 overflow-y-auto">
            {!selected ? (
              <div className="h-full flex items-center justify-center flex-col gap-4 text-white/20">
                <span className="text-6xl">🔧</span>
                <p className="text-sm uppercase tracking-widest font-bold">Select a provider to review</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-sm bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] font-black text-2xl flex-shrink-0 overflow-hidden">
                      {selected.logo_url ? <img src={selected.logo_url} alt="" className="w-full h-full object-cover" /> : selected.name?.charAt(0)}
                    </div>
                    <div>
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">{selected.name}</h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">
                        {TYPE_LABEL[selected.type] || selected.type} · {selected.city}, {selected.province}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">Applied {fmt(selected.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selected.slug && (
                      <Link href={`/services/${selected.slug}`} target="_blank"
                        className="text-[10px] font-black uppercase tracking-widest text-[#4CC9F0] border border-[#4CC9F0]/30 px-3 py-2 rounded-sm hover:bg-[#4CC9F0]/10 transition-all">
                        View Profile ↗
                      </Link>
                    )}
                    <button onClick={() => handleDelete(selected.id)} disabled={actionLoading === selected.id}
                      className="text-[10px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 px-3 py-2 rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-40">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Approval actions */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Approval Status</p>
                  <div className="flex gap-3 flex-wrap">
                    {selected.status !== 'active' && (
                      <button onClick={() => handleApprove(selected.id)} disabled={actionLoading === selected.id}
                        className="bg-[#10B981] text-white font-black uppercase tracking-widest text-[11px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                        {actionLoading === selected.id ? '...' : '✓ Approve & Activate'}
                      </button>
                    )}
                    {selected.status !== 'rejected' && (
                      <button onClick={() => { setRejectModal(selected); setRejectReason(''); }}
                        className="border border-[#E63946]/30 text-[#E63946] font-black uppercase tracking-widest text-[11px] px-6 py-2.5 rounded-sm hover:bg-[#E63946]/10 transition-all">
                        ✕ Reject
                      </button>
                    )}
                    {selected.status === 'active' && (
                      <span className="flex items-center gap-2 text-[#10B981] font-black text-[11px] uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Live on Site
                      </span>
                    )}
                  </div>
                </div>

                {/* Business details */}
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-4">
                    Provider <span className="text-[#8B5CF6]">Details</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Contact Person',    value: selected.contact_name },
                      { label: 'Email',             value: selected.email },
                      { label: 'Phone',             value: selected.phone },
                      { label: 'WhatsApp',          value: selected.whatsapp },
                      { label: 'Website',           value: selected.website },
                      { label: 'Address',           value: selected.address },
                      { label: 'Years in Business', value: selected.years_experience ? `${selected.years_experience} years` : null },
                      { label: 'Service Area',      value: selected.service_area_note },
                      { label: 'SAPS Accredited',   value: selected.saps_accredited ? '✓ Yes' : 'No' },
                      { label: 'Accreditation No.', value: selected.accreditation_number },
                    ].map(item => item.value ? (
                      <div key={item.label}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">{item.label}</p>
                        <p className="text-sm font-bold text-white break-all">{item.value}</p>
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

                {/* Specializations */}
                {selected.specializations?.length > 0 && (
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.specializations.map((s: string) => (
                        <span key={s} className="text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1420] border border-white/10 rounded-sm p-6 max-w-md w-full">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white mb-2">Reject Application</h3>
            <p className="text-white/40 text-[13px] mb-4">
              Rejecting: <strong className="text-white">{rejectModal.name}</strong>
            </p>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="e.g. Incomplete information, unable to verify credentials..."
              className="w-full bg-[#080B12] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#E8EAF0] resize-none focus:outline-none focus:border-[#E63946]/50 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={!rejectReason.trim()}
                className="flex-1 bg-red-500 text-white font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:brightness-110 disabled:opacity-50">
                Reject
              </button>
              <button onClick={() => setRejectModal(null)}
                className="px-5 border border-white/20 text-white/60 font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}