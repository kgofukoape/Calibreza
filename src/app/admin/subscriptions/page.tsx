'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminNav from '@/components/admin/AdminNav';

// ─── ADMIN: SUBSCRIPTION MANAGEMENT ──────────────────────────────────────────
// Gives you direct control over dealer and club/range subscriptions:
// view status, change tier, cancel, or correct a billing error.
//
// IMPORTANT: changing a tier here changes PLATFORM ACCESS only. It does NOT
// stop or start a recurring charge at PayFast — that must be done in the
// PayFast dashboard. The banner in the UI says so, so nobody is misled.

const TIERS = ['free', 'pro', 'premium'];

export default function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<'dealers' | 'clubs'>('dealers');
  const [rows, setRows] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => { fetchRows(); }, [tab]);

  const fetchRows = async () => {
    setLoading(true);
    const table = tab === 'dealers' ? 'dealers' : 'clubs';
    const { data } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    setRows(data || []);

    const { data: ev } = await supabase
      .from('subscription_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);
    setEvents(ev || []);
    setLoading(false);
  };

  // logEvent removed: the admin routes write their own audit entries
  // server-side, so recording it again from the browser would either duplicate
  // the trail or, more likely, fail against RLS and leave a gap.

  // Changes go through /api/admin/subscription, which holds the service key.
  // Written from the browser with the anon key, an update to another party's
  // dealer row is judged as if an ordinary visitor made it — so it either
  // failed silently or was available to anyone holding that key.
  const changeTier = async (entity: any, newTier: string) => {
    const label = entity.business_name || entity.name || 'this account';
    if (!confirm(
      `Change ${label} to "${newTier}"?\n\n` +
      `This changes PLATFORM ACCESS immediately.\n` +
      `It does NOT stop or start any recurring charge at PayFast — do that in the PayFast dashboard.`
    )) return;

    setBusyId(entity.id);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_tier',
          kind: tab === 'dealers' ? 'dealer' : 'club',
          id: entity.id,
          tier: newTier,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Change failed');

      setMsg({ kind: 'ok', text: `${json.message} Remember to reflect this in PayFast if a recurring charge exists.` });
      fetchRows();
    } catch (err: any) {
      setMsg({ kind: 'err', text: `Failed: ${err.message}` });
    } finally {
      setBusyId(null);
    }
  };

  // Grants a paid tier at no charge — for a launch partner, or goodwill after
  // an outage. Marked as comped so it never looks like a payment that went
  // missing when you reconcile revenue later.
  const grantFree = async (entity: any) => {
    const label = entity.business_name || entity.name || 'this account';
    const tier = prompt(
      `Grant ${label} a paid tier free of charge.\n\nWhich tier? (pro or premium)`,
      'premium',
    );
    if (!tier) return;

    const months = prompt('For how many months?', '3');
    if (!months) return;

    const reason = prompt('Why? (Recorded against the account and in the audit log.)');
    if (!reason || reason.trim().length < 5) {
      setMsg({ kind: 'err', text: 'A reason of at least 5 characters is required.' });
      return;
    }

    setBusyId(entity.id);
    try {
      const res = await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant',
          kind: tab === 'dealers' ? 'dealer' : 'club',
          id: entity.id,
          tier: tier.trim().toLowerCase(),
          months: Number(months),
          reason: reason.trim(),
          // Required for money operations: a repeat within 24 hours returns the
          // original result rather than granting twice.
          idempotency_key: `grant-${entity.id}-${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Grant failed');

      setMsg({ kind: 'ok', text: json.message });
      fetchRows();
    } catch (err: any) {
      setMsg({ kind: 'err', text: `Failed: ${err.message}` });
    } finally {
      setBusyId(null);
    }
  };

  const cancelSub = async (entity: any) => {
    const label = entity.business_name || entity.name || 'this account';
    if (!confirm(
      `Mark ${label}'s subscription as cancelling?\n\n` +
      `They keep access until their paid period ends.\n` +
      `You must also cancel the recurring charge in the PayFast dashboard.`
    )) return;

    const reason = prompt('Why is it being cancelled? (Recorded in the audit log.)');
    if (!reason || reason.trim().length < 5) {
      setMsg({ kind: 'err', text: 'A reason of at least 5 characters is required.' });
      return;
    }

    setBusyId(entity.id);
    try {
      const res = await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          kind: tab === 'dealers' ? 'dealer' : 'club',
          id: entity.id,
          reason: reason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cancel failed');

      setMsg({ kind: 'ok', text: `${json.message} Now cancel the recurring charge in PayFast.` });
      fetchRows();
    } catch (err: any) {
      setMsg({ kind: 'err', text: `Failed: ${err.message}` });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = rows.filter(r => {
    const hay = `${r.business_name || ''} ${r.name || ''} ${r.email || ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const paidCount = rows.filter(r => ['pro', 'premium', 'active'].includes(r.subscription_tier)).length;
  const cancellingCount = rows.filter(r => r.subscription_status === 'cancelling').length;

  return (
    <div className="min-h-screen bg-[#080B12] text-white flex">

      {/* This page had no sidebar at all — only a "back" link — which is part of
          why the console felt inconsistent as you moved through it. */}
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
        <nav className="flex-1 p-4 overflow-y-auto">
          <AdminNav />
        </nav>
      </aside>

      <div className="flex-1 ml-[260px]">
      <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight">
            Subscription <span className="text-[#E63946]">Management</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            View · Change Tier · Cancel · Audit
          </p>
        </div>

      </header>

      <div className="p-8 space-y-6">

        {/* PAYFAST WARNING — this is the honest bit */}
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-4">
          <p className="text-[12px] text-[#F59E0B] leading-relaxed">
            <strong className="uppercase tracking-widest font-black">Platform access only</strong><br />
            Changes here control what the account can do on Gun X. They do <strong>not</strong> start or stop money
            moving. Any recurring PayFast charge must be created or cancelled in the PayFast dashboard — otherwise
            someone keeps being billed for a plan you cancelled here, or gets a free plan they should be paying for.
          </p>
        </div>

        {msg && (
          <div className={`p-3 rounded-sm text-[13px] font-bold border ${
            msg.kind === 'ok'
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
          }`}>
            {msg.text}
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Accounts', rows.length],
            ['On a paid plan', paidCount],
            ['Cancelling', cancellingCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-[#0D1420] border border-white/5 rounded-sm p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{label}</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black">{value}</p>
            </div>
          ))}
        </div>

        {/* TABS + SEARCH */}
        <div className="flex flex-wrap items-center gap-3">
          {(['dealers', 'clubs'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm transition-all ${
                tab === t ? 'bg-[#E63946] text-white' : 'border border-white/10 text-white/50 hover:text-white'
              }`}>
              {t === 'dealers' ? 'Dealers' : 'Clubs & Ranges'}
            </button>
          ))}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="flex-1 min-w-[220px] bg-[#0D1420] border border-white/10 rounded-sm px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:outline-none focus:border-[#E63946]/50"
          />
        </div>

        {/* TABLE */}
        <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-x-auto">
          {loading ? (
            <p className="p-8 text-white/40 text-sm">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-white/40 text-sm">No accounts found.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="border-b border-white/5">
                <tr>
                  {['Account', 'Tier', 'Status', 'Paid Until', 'Pending', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      <p className="font-bold text-[13px] text-white">{r.business_name || r.name || '—'}</p>
                      <p className="text-[11px] text-white/40">{r.email || ''}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[10px] font-black uppercase px-2 py-1 rounded-sm border border-[#C9922A]/30 bg-[#C9922A]/10 text-[#C9922A]">
                        {r.subscription_tier || 'free'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border ${
                        r.subscription_status === 'active'     ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                        r.subscription_status === 'cancelling' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30' :
                        r.subscription_status === 'past_due'   ? 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/30' :
                        'bg-white/5 text-white/40 border-white/10'
                      }`}>
                        {(r.subscription_status || 'free').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-white/60">
                      {r.current_period_end
                        ? new Date(r.current_period_end).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-4 text-[12px] text-white/60">
                      {r.pending_tier ? `→ ${r.pending_tier}` : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={r.subscription_tier || 'free'}
                          disabled={busyId === r.id}
                          onChange={e => changeTier(r, e.target.value)}
                          className="bg-[#080B12] border border-white/10 rounded-sm px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#E63946]/50"
                        >
                          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={() => grantFree(r)} disabled={busyId === r.id}
                          className="text-[10px] font-black uppercase px-2 py-1.5 border border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-sm transition-all disabled:opacity-40">
                          Grant Free
                        </button>
                        {['pro', 'premium'].includes(r.subscription_tier) && r.subscription_status !== 'cancelling' && (
                          <button onClick={() => cancelSub(r)} disabled={busyId === r.id}
                            className="text-[10px] font-black uppercase px-2 py-1.5 border border-[#E63946]/30 text-[#E63946] hover:bg-[#E63946]/10 rounded-sm transition-all disabled:opacity-40">
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* AUDIT TRAIL */}
        <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-1">
            Recent <span className="text-[#E63946]">Changes</span>
          </h2>
          <p className="text-[11px] text-white/40 mb-4">Your evidence trail if a billing dispute arises.</p>
          {events.length === 0 ? (
            <p className="text-white/30 text-sm">No subscription changes recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 text-[12px]">
                  <span className="text-white/70">
                    <span className="font-black uppercase text-[#C9922A]">{e.event_type?.replace(/_/g, ' ')}</span>
                    {' · '}{e.entity_type}
                    {e.from_tier || e.to_tier ? ` · ${e.from_tier || '?'} → ${e.to_tier || '?'}` : ''}
                    {e.notes ? ` · ${e.notes}` : ''}
                  </span>
                  <span className="text-white/30 whitespace-nowrap">
                    {e.actor} · {new Date(e.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
      </div>
  );
}