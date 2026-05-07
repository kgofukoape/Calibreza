'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin', icon: '⚡', label: 'Overview' },
  { href: '/admin/dealers', icon: '🏪', label: 'Dealers' },
  { href: '/admin/clubs', icon: '⊕', label: 'Clubs' },
  { href: '/admin/listings', icon: '📋', label: 'Listings' },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { href: '/admin/ads', icon: '📢', label: 'Ad Manager' },
  { href: '/admin/crm', icon: '💰', label: 'CRM' },
  { href: '/admin/verification', icon: '🛡️', label: 'Verification', active: true },
  { href: '/admin/users', icon: '👥', label: 'Users' },
];

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-[#C9922A]/10 text-[#C9922A] border border-[#C9922A]/30',
  approved: 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/30',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export default function AdminVerificationPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [entityFilter, setEntityFilter] = useState<'all' | 'club' | 'range' | 'dealer'>('all');
  const [rejectModal, setRejectModal] = useState<{ doc: any } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login');
        return;
      }
    }
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('verification_documents')
      .select('*')
      .order('uploaded_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  const handleApprove = async (doc: any) => {
    setProcessing(doc.id);
    await supabase.from('verification_documents').update({
      status: 'approved',
      rejection_reason: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin',
    }).eq('id', doc.id);

    await checkAndVerifyEntity(doc.entity_type, doc.entity_id);
    await loadDocs();
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;
    setProcessing(rejectModal.doc.id);
    await supabase.from('verification_documents').update({
      status: 'rejected',
      rejection_reason: rejectReason.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin',
    }).eq('id', rejectModal.doc.id);
    setRejectModal(null);
    setRejectReason('');
    await loadDocs();
    setProcessing(null);
  };

  const checkAndVerifyEntity = async (entityType: string, entityId: string) => {
    const { data: entityDocs } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    const allApproved = entityDocs && entityDocs.length >= 3 && entityDocs.every(d => d.status === 'approved');
    if (allApproved) {
      if (entityType === 'dealer') {
        await supabase.from('dealers').update({ is_verified: true }).eq('id', entityId);
      } else {
        await supabase.from('clubs').update({ is_verified: true }).eq('id', entityId);
      }
    }
  };

  const filteredDocs = docs.filter(d => {
    const statusMatch = filter === 'all' || d.status === filter;
    const entityMatch = entityFilter === 'all' || d.entity_type === entityFilter;
    return statusMatch && entityMatch;
  });

  const pendingCount = docs.filter(d => d.status === 'pending').length;
  const approvedCount = docs.filter(d => d.status === 'approved').length;
  const rejectedCount = docs.filter(d => d.status === 'rejected').length;

  const fmtDate = (d: string) => d
    ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const fmtSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      {/* SIDEBAR */}
      <aside className="w-[240px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {NAV.map(item => (
              <li key={item.href}>
                <Link href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${(item as any).active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.href === '/admin/verification' && pendingCount > 0 && (
                    <span className="ml-auto bg-[#C9922A] text-black text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">{pendingCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={() => { localStorage.removeItem('gunx_admin_session'); router.push('/admin/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-[240px] overflow-y-auto">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
                Document <span className="text-[#E63946]">Verification</span>
              </h1>
              <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">Review · Approve · Reject</p>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-[#C9922A]/10 border border-[#C9922A]/30 px-4 py-2 rounded-sm">
                <span className="w-2 h-2 rounded-full bg-[#C9922A] animate-pulse" />
                <span className="text-[#C9922A] font-black text-[12px] uppercase tracking-widest">{pendingCount} Pending Review</span>
              </div>
            )}
          </div>
        </header>

        <div className="p-8 space-y-6">

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending Review', value: pendingCount, color: 'text-[#C9922A]', border: 'border-[#C9922A]/20' },
              { label: 'Approved', value: approvedCount, color: 'text-[#2A9C6E]', border: 'border-[#2A9C6E]/20' },
              { label: 'Rejected', value: rejectedCount, color: 'text-red-400', border: 'border-red-500/20' },
            ].map(s => (
              <div key={s.label} className={`bg-[#0D1420] border ${s.border} rounded-sm p-5`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">{s.label}</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-4xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* FILTERS */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-1 bg-[#0D1420] border border-white/5 rounded-sm p-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className={`px-4 py-1.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${filter === f ? 'bg-[#E63946] text-white' : 'text-white/40 hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-[#0D1420] border border-white/5 rounded-sm p-1">
              {(['all', 'club', 'range', 'dealer'] as const).map(f => (
                <button key={f} onClick={() => setEntityFilter(f)}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className={`px-4 py-1.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${entityFilter === f ? 'bg-[#C9922A] text-black' : 'text-white/40 hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>
            <span className="text-white/30 text-[12px]">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</span>
          </div>

          {/* DOCUMENT LIST */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="bg-[#0D1420] border border-white/5 rounded-sm p-16 text-center">
              <p className="text-5xl mb-4">🛡️</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white mb-2">No Documents</p>
              <p className="text-white/40 text-sm">No documents match the current filters</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredDocs.map(doc => (
                <div key={doc.id} className={`bg-[#0D1420] border rounded-sm overflow-hidden ${
                  doc.status === 'pending' ? 'border-[#C9922A]/20' :
                  doc.status === 'approved' ? 'border-[#2A9C6E]/20' :
                  'border-red-500/20'
                }`}>
                  <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                          doc.entity_type === 'dealer' ? 'bg-[#4CC9F0]/10 text-[#4CC9F0] border-[#4CC9F0]/20' :
                          doc.entity_type === 'range' ? 'bg-[#C9922A]/10 text-[#C9922A] border-[#C9922A]/20' :
                          'bg-[#2A9C6E]/10 text-[#2A9C6E] border-[#2A9C6E]/20'
                        }`}>{doc.entity_type}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${STATUS_STYLES[doc.status]}`}>
                          {doc.status === 'pending' ? '⏳ Pending' : doc.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                        </span>
                        <span className="text-white/30 text-[11px]">{fmtDate(doc.uploaded_at)}</span>
                      </div>
                      <p className="font-black text-[15px] text-white mb-0.5">{doc.doc_label}</p>
                      <p className="text-white/40 text-[11px] truncate">
                        ID: <span className="font-mono text-[10px]">{doc.entity_id}</span>
                        {doc.file_name && <> · {doc.file_name} ({fmtSize(doc.file_size)})</>}
                      </p>
                      {doc.rejection_reason && (
                        <div className="mt-2 bg-red-500/5 border border-red-500/20 rounded-sm px-3 py-2">
                          <p className="text-[11px] text-red-400"><strong>Reason:</strong> {doc.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-sm text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                          👁 View
                        </a>
                      )}
                      {doc.status !== 'approved' && (
                        <button onClick={() => handleApprove(doc)} disabled={processing === doc.id}
                          className="px-3 py-2 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm text-[11px] font-black uppercase tracking-widest text-[#2A9C6E] hover:bg-[#2A9C6E]/20 transition-all disabled:opacity-50">
                          {processing === doc.id ? '...' : '✓ Approve'}
                        </button>
                      )}
                      {doc.status !== 'rejected' && (
                        <button onClick={() => { setRejectModal({ doc }); setRejectReason(''); }}
                          className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-sm text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all">
                          ✕ Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1420] border border-white/10 rounded-sm p-6 max-w-md w-full">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white mb-2">Reject Document</h3>
            <p className="text-white/40 text-[13px] mb-4">
              Rejecting: <strong className="text-white">{rejectModal.doc.doc_label}</strong>
            </p>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Reason for rejection *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="e.g., Document is expired, illegible, or incorrect document type..."
              className="w-full bg-[#080B12] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#E8EAF0] resize-none focus:outline-none focus:border-[#E63946]/50 mb-4" />
            <div className="flex gap-3">
              <button onClick={handleReject} disabled={!rejectReason.trim() || !!processing}
                className="flex-1 bg-red-500 text-white font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:brightness-110 disabled:opacity-50">
                Reject Document
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
