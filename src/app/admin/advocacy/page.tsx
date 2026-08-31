'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminNav from '@/components/admin/AdminNav';

// ─── ADMIN: ADVOCACY ORGANISATIONS ───────────────────────────────────────────
// /admin/advocacy
//
// Approve, reject or suspend directory listings. Writes go through
// /api/admin/suspend, which holds the service key — the browser's anon key
// cannot change another party's row, and an update it is not permitted to make
// matches zero rows and reports success.

interface Group {
  id: string;
  name: string;
  slug: string;
  status: string;
  mission_statement: string | null;
  about_text: string | null;
  website_url: string | null;
  contact_email: string | null;
  created_at: string;
}

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

export default function AdminAdvocacyPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Group | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [releaseCounts, setReleaseCounts] = useState<Record<string, number>>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase
      .from('advocacy_groups')
      .select('id, name, slug, status, mission_statement, about_text, website_url, contact_email, created_at')
      .order('created_at', { ascending: false });

    setGroups((data || []) as Group[]);

    const { data: releases } = await supabase.from('press_releases').select('group_id');
    const counts: Record<string, number> = {};
    for (const r of releases || []) counts[r.group_id] = (counts[r.group_id] || 0) + 1;
    setReleaseCounts(counts);

    setLoading(false);
  };

  const setStatus = async (group: Group, status: string) => {
    const verb = status === 'active' ? 'approve' : status === 'suspended' ? 'suspend' : 'reject';
    if (!confirm(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${group.name}?`)) return;

    setBusy(group.id);
    try {
      await adminAction({
        entityType: 'advocacy', entityId: group.id,
        action: 'set_status', status,
      });
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, status } : g));
      setSelected(prev => prev && prev.id === group.id ? { ...prev, status } : prev);
    } catch (err: any) {
      alert(`Could not update: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const filtered = filter === 'all' ? groups : groups.filter(g => g.status === filter);
  const pendingCount = groups.filter(g => g.status === 'pending').length;

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  const statusStyle = (s: string) =>
    s === 'active'    ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
    s === 'suspended' ? 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/30' :
                        'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30';

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

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
        <nav className="flex-1 p-4 overflow-y-auto"><AdminNav counts={{ pendingAdvocacy: pendingCount }} /></nav>
      </aside>

      <div className="flex-1 ml-[260px]">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight">
            Advocacy <span className="text-[#E63946]">Organisations</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            {groups.length} total · {pendingCount} pending approval
          </p>
        </header>

        <div className="p-8">

          {/* What approval means, said where the decision is made. */}
          <div className="bg-[#0D1420] border-l-2 border-[#C9922A] rounded-sm px-4 py-3 mb-6">
            <p className="text-[12.5px] text-white/60 leading-relaxed">
              Approving a listing publishes the organisation's profile and lets it post
              press releases under its own name. Confirm the applicant actually speaks
              for the organisation — an email to the address on their own website is
              usually enough — before approving.
            </p>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'pending', 'active', 'suspended'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm transition-all ${
                  filter === f ? 'bg-[#E63946] text-white' : 'border border-white/10 text-white/50 hover:text-white'
                }`}>
                {f} ({f === 'all' ? groups.length : groups.filter(g => g.status === f).length})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LIST */}
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              {loading ? (
                <p className="p-8 text-white/40 text-sm">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="p-8 text-white/40 text-sm">No organisations{filter !== 'all' ? ` with status "${filter}"` : ''}.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {filtered.map(g => (
                    <button key={g.id} onClick={() => setSelected(g)}
                      className={`w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-all ${
                        selected?.id === g.id ? 'bg-white/[0.03] border-l-2 border-[#E63946]' : ''
                      }`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-[14px] text-white truncate">{g.name}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            {fmt(g.created_at)} · {releaseCounts[g.id] || 0} release{(releaseCounts[g.id] || 0) === 1 ? '' : 's'}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-sm border ${statusStyle(g.status)}`}>
                          {g.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DETAIL */}
            <div>
              {!selected ? (
                <div className="bg-[#0D1420] border border-white/5 rounded-sm p-12 text-center">
                  <div className="text-4xl mb-3 opacity-20">⚖️</div>
                  <p className="text-white/30 text-sm">Select an organisation to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                          className="text-2xl font-black uppercase text-white">{selected.name}</h2>
                        <p className="text-[11px] text-white/40 mt-1">/advocacy/{selected.slug}</p>
                      </div>
                      <span className={`flex-shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-sm border ${statusStyle(selected.status)}`}>
                        {selected.status}
                      </span>
                    </div>

                    <div className="space-y-4 text-[13px]">
                      {selected.mission_statement && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Mission</p>
                          <p className="text-white/70 leading-relaxed">{selected.mission_statement}</p>
                        </div>
                      )}
                      {selected.about_text && (
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">About</p>
                          <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{selected.about_text}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Website</p>
                          {selected.website_url ? (
                            <a href={selected.website_url} target="_blank" rel="noopener noreferrer nofollow"
                              className="text-[#4CC9F0] hover:underline break-all">{selected.website_url}</a>
                          ) : <span className="text-white/20">Not provided</span>}
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Contact</p>
                          {selected.contact_email ? (
                            <a href={`mailto:${selected.contact_email}`} className="text-[#4CC9F0] hover:underline break-all">
                              {selected.contact_email}
                            </a>
                          ) : <span className="text-white/20">Not provided</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.status !== 'active' && (
                        <button onClick={() => setStatus(selected, 'active')} disabled={busy === selected.id}
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 border border-[#10B981]/30 text-[#10B981] rounded-sm hover:bg-[#10B981]/10 transition-all disabled:opacity-40">
                          ✓ Approve & publish
                        </button>
                      )}
                      {selected.status === 'active' && (
                        <button onClick={() => setStatus(selected, 'suspended')} disabled={busy === selected.id}
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 border border-[#E63946]/30 text-[#E63946] rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-40">
                          ⊘ Suspend
                        </button>
                      )}
                      {selected.status !== 'pending' && (
                        <button onClick={() => setStatus(selected, 'pending')} disabled={busy === selected.id}
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 border border-white/10 text-white/60 rounded-sm hover:bg-white/5 transition-all disabled:opacity-40">
                          Return to pending
                        </button>
                      )}
                      {selected.status === 'active' && (
                        <Link href={`/advocacy/${selected.slug}`} target="_blank"
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 border border-[#4CC9F0]/30 text-[#4CC9F0] rounded-sm hover:bg-[#4CC9F0]/10 transition-all">
                          View public page →
                        </Link>
                      )}
                    </div>

                    {/* Suspending hides the organisation's releases too, which
                        is not obvious from the button. */}
                    {selected.status === 'active' && (releaseCounts[selected.id] || 0) > 0 && (
                      <p className="text-[11px] text-white/30 mt-4 pt-4 border-t border-white/5 leading-relaxed">
                        Suspending also removes this organisation's {releaseCounts[selected.id]} press
                        release{releaseCounts[selected.id] === 1 ? '' : 's'} from the public feed.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}