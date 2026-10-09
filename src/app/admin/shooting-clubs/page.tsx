'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';
import DecisionModal, { type DecisionKind } from '@/components/admin/DecisionModal';
import { openDocument, DOCUMENT_BUCKETS } from '@/lib/documents';

// --- ADMIN: SHOOTING CLUBS ---------------------------------------------------
// Shooting clubs have their own table (Oct 2026). Approve also verifies:
// approving means the compliance documents were checked. Reads go through
// /api/admin/records and writes through /api/admin/suspend, both behind the
// admin session, because the browser reads as the anon user.

const TABS = [
  ['pending', 'Pending'],
  ['info_requested', 'More info'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['suspended', 'Suspended'],
  ['all', 'All'],
] as const;

const DOCS: Array<[string, string]> = [
  ['affiliation_letter_url', 'Affiliation letter'],
  ['accreditation_cert_url', 'SAPS accreditation certificate'],
  ['business_registration_url', 'CIPC registration'],
  ['constitution_url', 'Club constitution'],
];

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  info_requested: 'bg-[#4CC9F0]/15 text-[#4CC9F0]',
  approved: 'bg-[#10B981]/15 text-[#10B981]',
  rejected: 'bg-[#E63946]/15 text-[#E63946]',
  suspended: 'bg-[#E63946]/15 text-[#E63946]',
};

const today = () => new Date().toISOString().slice(0, 10);
const isExpired = (c: any) => !!c?.compliance_valid_until && c.compliance_valid_until < today();
const fmt = (d?: string | null) => d
  ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
  : '-';

export default function AdminShootingClubsPage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [decision, setDecision] = useState<DecisionKind | null>(null);

  useEffect(() => {
    if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
      router.push('/admin/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/records?type=shooting_club');
      const data = await res.json();
      if (res.ok) setClubs(data.records || []);
      else setMsg({ kind: 'err', text: data.error || 'Could not load clubs.' });
    } catch {
      setMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setLoading(false);
  };

  const act = async (payload: Record<string, any>) => {
    const res = await fetch('/api/admin/suspend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: 'shooting_club', entityId: selected.id, ...payload }),
    });
    return { res, data: await res.json() };
  };

  const patch = (p: Record<string, any>) => {
    setClubs((prev) => prev.map((c) => (c.id === selected.id ? { ...c, ...p } : c)));
    setSelected((prev: any) => ({ ...prev, ...p }));
  };

  const run = async (payload: Record<string, any>, after: (data: any) => Record<string, any>) => {
    setBusy(true);
    setMsg(null);
    try {
      const { res, data } = await act(payload);
      if (res.ok) {
        patch(after(data));
        setDecision(null);
        setMsg({ kind: 'ok', text: data.message || 'Done.' });
      } else {
        setMsg({ kind: 'err', text: data.error || 'Something went wrong.' });
      }
    } catch {
      setMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setBusy(false);
  };

  const setStatus = (status: string, extra: Record<string, any> = {}) =>
    run({ action: 'set_status', status, ...extra }, (data) => ({
      ...(data.update || { status }),
      ...(status === 'approved' ? { is_verified: true } : {}),
    }));

  const suspendOrReinstate = () => {
    if (selected.status === 'suspended') {
      if (!confirm(`Reinstate ${selected.name}?`)) return;
      run({ action: 'reinstate' }, (d) => ({ status: d.status || 'approved', suspended_reason: null, suspended_at: null }));
      return;
    }
    const reason = prompt(`Suspend ${selected.name}?\n\nTheir page is hidden from the public. ` +
      'They can still open their portal, read-only, and see this reason.\n\nReason (required):');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setMsg({ kind: 'err', text: 'A reason is required to suspend.' });
      return;
    }
    run({ action: 'suspend', reason: reason.trim() }, (d) => ({
      status: d.status || 'suspended', suspended_reason: reason.trim(),
    }));
  };

  const removeVerified = () =>
    run({ action: 'set_field', field: 'is_verified', value: false }, () => ({ is_verified: false }));

  const remove = async () => {
    if (!confirm(`Permanently delete ${selected.name}? This cannot be undone.\n\nSuspending hides the club without deleting anything.`)) return;
    setBusy(true);
    try {
      const { res, data } = await act({ action: 'delete' });
      if (res.ok) {
        setClubs((prev) => prev.filter((c) => c.id !== selected.id));
        setSelected(null);
        setMsg({ kind: 'ok', text: 'Club deleted.' });
      } else {
        setMsg({ kind: 'err', text: data.error || 'Could not delete.' });
      }
    } catch {
      setMsg({ kind: 'err', text: 'Could not reach the server.' });
    }
    setBusy(false);
  };

  const list = clubs.filter((c) => {
    if (tab !== 'all' && c.status !== tab) return false;
    const q = search.trim().toLowerCase();
    if (q && !`${c.name} ${c.city} ${c.province}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const count = (t: string) => (t === 'all' ? clubs.length : clubs.filter((c) => c.status === t).length);

  const panel = 'bg-[#0D1420] border border-white/5 rounded-sm p-5';
  const h3 = (a: string, b: string) => (
    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-white">
      {a} <span className="text-[#4CC9F0]">{b}</span>
    </h3>
  );
  const item = (k: string, v: React.ReactNode) => (
    <div key={k}>
      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{k}</p>
      <div className="text-[13px] text-white/80 break-words">{v || '-'}</div>
    </div>
  );
  const btn = 'font-black uppercase tracking-widest text-[11px] px-4 py-2.5 rounded-sm transition-all disabled:opacity-40';

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">
      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5">
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
          <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1"><AdminNav /></ul>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => { localStorage.removeItem('gunx_admin_session'); router.push('/admin/login'); }}
            className="w-full px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest text-left">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[260px]">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 sticky top-0 z-40">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
            Shooting <span className="text-[#E63946]">Clubs</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            Applications, compliance and listings. Approve also verifies.
          </p>
        </header>

        <div className="flex h-[calc(100vh-81px)]">
          {/* LIST */}
          <div className="w-[380px] border-r border-white/5 flex flex-col">
            <div className="p-4 border-b border-white/5 flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {TABS.map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`px-2.5 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest ${
                      tab === id ? 'bg-[#E63946] text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
                    {label} ({count(id)})
                  </button>
                ))}
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or town"
                className="bg-[#080B12] border border-white/10 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:border-[#E63946]/50" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading && <p className="p-6 text-white/40 text-sm">Loading...</p>}
              {!loading && list.length === 0 && <p className="p-6 text-white/40 text-sm">No clubs here.</p>}
              {list.map((c) => (
                <button key={c.id} onClick={() => { setSelected(c); setDecision(null); setMsg(null); }}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 ${selected?.id === c.id ? 'bg-white/5' : ''}`}>
                  <p className="font-black text-[13px] text-white truncate">{c.name}</p>
                  <p className="text-[11px] text-white/40">{[c.city, c.province].filter(Boolean).join(', ')}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${STATUS_STYLE[c.status] || 'bg-white/10'}`}>
                      {c.status === 'info_requested' ? 'more info' : c.status}
                    </span>
                    {c.is_verified && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[#10B981]/15 text-[#10B981]">Verified</span>}
                    {isExpired(c) && <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[#E63946] text-white">Expired</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DETAIL */}
          <div className="flex-1 overflow-y-auto p-6">
            {msg && (
              <div className={`mb-4 p-3 rounded-sm text-[13px] font-bold border ${
                msg.kind === 'ok' ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'}`}>
                {msg.text}
              </div>
            )}
            {!selected ? (
              <p className="text-white/40 text-sm">Choose a club on the left.</p>
            ) : (
              <div className="flex flex-col gap-4 max-w-[900px]">
                <div className={panel}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase text-white">{selected.name}</h2>
                      <p className="text-white/50 text-[13px]">
                        {[selected.city, selected.province].filter(Boolean).join(', ')} . Applied {fmt(selected.created_at)}
                        {selected.approved_at ? ` . Approved ${fmt(selected.approved_at)}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${STATUS_STYLE[selected.status] || 'bg-white/10'}`}>
                        {selected.status === 'info_requested' ? 'more info' : selected.status}
                      </span>
                      {selected.is_verified && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-[#10B981]/15 text-[#10B981]">Verified</span>}
                      {isExpired(selected) && <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-[#E63946] text-white">Expired</span>}
                    </div>
                  </div>
                  {selected.status === 'suspended' && selected.suspended_reason && (
                    <p className="mt-3 text-[12px] text-[#E63946]">Suspended: {selected.suspended_reason}</p>
                  )}
                </div>

                {/* DECISION */}
                <div className={panel}>
                  {h3('Application', 'decision')}
                  <div className="flex flex-wrap gap-2">
                    <button disabled={busy || selected.status === 'approved'} onClick={() => setStatus('approved')}
                      className={`${btn} bg-[#10B981] text-white hover:brightness-110`}>Approve and verify</button>
                    <button disabled={busy} onClick={() => setDecision('info_requested')}
                      className={`${btn} bg-[#4CC9F0]/15 text-[#4CC9F0] hover:bg-[#4CC9F0]/25`}>Request info</button>
                    <button disabled={busy || selected.status === 'rejected'} onClick={() => setDecision('rejected')}
                      className={`${btn} bg-[#E63946]/15 text-[#E63946] hover:bg-[#E63946]/25`}>Reject</button>
                    <button disabled={busy || selected.status === 'pending'} onClick={() => setStatus('pending')}
                      className={`${btn} bg-white/5 text-white/60 hover:text-white`}>Back to pending</button>
                  </div>
                  {selected.review_note && (
                    <p className="text-[12px] text-white/60 mt-3 whitespace-pre-wrap">
                      <span className="text-white/40 uppercase tracking-widest font-black text-[9px]">Last note sent: </span>
                      {selected.review_note}
                    </p>
                  )}
                  {decision && (
                    <DecisionModal
                      kind={decision}
                      name={selected.name}
                      busy={busy}
                      docs={DOCS.map(([key, label]) => ({ key, label, present: !!selected[key] }))}
                      onCancel={() => setDecision(null)}
                      onSubmit={(note, clearDocs) => setStatus(decision, { reason: note, clearDocs })}
                    />
                  )}
                </div>

                {/* COMPLIANCE */}
                <div className={panel}>
                  {h3('Club', 'compliance')}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {item('Status', selected.compliance_status === 'accredited' ? 'SAPS-accredited association'
                      : selected.compliance_status === 'affiliated' ? 'Affiliated club' : 'Not stated')}
                    {item('Affiliated to', (selected.associations || []).join(', '))}
                    {item('SAPS accreditation no.', selected.accreditation_number)}
                    {item('Valid until', selected.compliance_valid_until
                      ? <span className={isExpired(selected) ? 'text-[#E63946] font-black' : ''}>
                          {fmt(selected.compliance_valid_until)}{isExpired(selected) ? ' (EXPIRED)' : ''}
                        </span>
                      : null)}
                    {item('CIPC no.', selected.cipc_number)}
                    {item('Responsible person', [selected.responsible_person_name, selected.responsible_person_role].filter(Boolean).join(', '))}
                    {item('Their email', selected.responsible_person_email)}
                    {item('Their phone', selected.responsible_person_phone)}
                  </div>
                </div>

                {/* DOCUMENTS */}
                <div className={panel}>
                  {h3('Uploaded', 'documents')}
                  <div className="grid grid-cols-2 gap-3">
                    {DOCS.map(([key, label]) => (
                      <div key={key}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{label}</p>
                        {selected[key] ? (
                          <button onClick={() => openDocument(DOCUMENT_BUCKETS.business, selected[key])}
                            className="w-full bg-[#4CC9F0]/10 border border-[#4CC9F0]/20 px-3 py-2 rounded-sm text-[#4CC9F0] text-[10px] font-black uppercase tracking-widest hover:bg-[#4CC9F0]/20">
                            View
                          </button>
                        ) : (
                          <span className="text-white/20 text-xs">Not uploaded</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* DETAILS */}
                <div className={panel}>
                  {h3('Club', 'details')}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">{item('About', <span className="whitespace-pre-wrap">{selected.description}</span>)}</div>
                    {item('Disciplines', (selected.disciplines || []).join(', '))}
                    {item('Founded', selected.founded_year)}
                    {item('Address', selected.address)}
                    {item('Shoots at', selected.shoots_at === 'own'
                      ? `Own range (${selected.range_setting || 'type not given'})`
                      : selected.shoots_at === 'other' ? selected.shoots_at_range : null)}
                    {item('Club phone', selected.phone)}
                    {item('Club email', selected.email)}
                    {item('WhatsApp', selected.whatsapp)}
                    {item('Website', selected.website)}
                    {item('Facebook', selected.facebook_url)}
                    {item('Instagram', selected.instagram_url)}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className={panel}>
                  {h3('Other', 'actions')}
                  <div className="flex flex-wrap gap-2">
                    {['approved', 'suspended'].includes(selected.status) && (
                      <button disabled={busy} onClick={suspendOrReinstate}
                        className={`${btn} ${selected.status === 'suspended' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'}`}>
                        {selected.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                      </button>
                    )}
                    {selected.is_verified && (
                      <button disabled={busy} onClick={removeVerified} className={`${btn} bg-white/5 text-white/60 hover:text-white`}>
                        Remove verified badge
                      </button>
                    )}
                    {selected.status === 'approved' && (
                      <Link href={`/clubs/${selected.slug}`} target="_blank" className={`${btn} bg-white/5 text-white/60 hover:text-white`}>
                        View public page
                      </Link>
                    )}
                    <button disabled={busy} onClick={remove} className={`${btn} bg-[#E63946]/10 text-[#E63946] hover:bg-[#E63946]/20`}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
