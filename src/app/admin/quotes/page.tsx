'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Quote {
  id: string;
  dealer_id: string | null;
  dealer_name: string | null;
  dealer_email: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

interface DealerGroup {
  key: string;
  dealerName: string;
  quotes: Quote[];
}

type RangeMonths = 3 | 6 | 9 | 12;

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [range, setRange] = useState<RangeMonths>(6);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/records?type=quote');
      const json = await res.json();
      if (json.ok) setQuotes(json.records);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const setStatus = async (id: string, status: string) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    await supabase.from('quote_requests').update({ status }).eq('id', id);
  };

  // ── FILTER TO THE SELECTED RANGE ───────────────────────────────────────────
  // Everything below — the chart, the totals, the dealer groups — respects this
  // window, so "last 3 months" is a genuine report on that period.
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - range);
  const inRange = quotes.filter(q => new Date(q.created_at) >= cutoff);

  // ── MONTHLY BUCKETS FOR THE CHART ──────────────────────────────────────────
  // One bar per month across the window. Built from the data itself — no chart
  // library, so nothing to install and nothing that can break the build.
  const months: { label: string; key: string; count: number }[] = [];
  const now = new Date();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    months.push({
      key,
      label: d.toLocaleDateString('en-ZA', { month: 'short' }),
      count: 0,
    });
  }
  for (const q of inRange) {
    const d = new Date(q.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = months.find(m => m.key === key);
    if (bucket) bucket.count++;
  }
  const maxCount = Math.max(1, ...months.map(m => m.count));

  // ── GROUP BY DEALER (within range) ─────────────────────────────────────────
  const groups: DealerGroup[] = (() => {
    const map: Record<string, DealerGroup> = {};
    for (const q of inRange) {
      const key = q.dealer_id || q.dealer_name || 'unknown';
      if (!map[key]) map[key] = { key, dealerName: q.dealer_name || 'Unknown dealer', quotes: [] };
      map[key].quotes.push(q);
    }
    return Object.values(map).sort((a, b) => b.quotes.length - a.quotes.length);
  })();

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const badge = (s: string) =>
    s === 'new' ? 'bg-[#C9922A]/15 text-[#C9922A] border-[#C9922A]/30'
    : s === 'contacted' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : 'bg-white/5 text-[#8A8E99] border-white/10';

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl md:text-4xl font-black uppercase">
              Quote <span className="text-[#C9922A]">Leads</span>
            </h1>
            <p className="text-[13px] text-[#8A8E99] mt-1">
              {inRange.length} quote{inRange.length !== 1 ? 's' : ''} in the last {range} months · {groups.length} dealer{groups.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <a href="/admin" className="text-[12px] text-[#8A8E99] hover:text-[#C9922A] uppercase tracking-widest font-black">← Admin</a>
        </div>

        {/* RANGE TOGGLE */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {([3, 6, 9, 12] as RangeMonths[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border transition-all ${
                range === r ? 'bg-[#C9922A] text-black border-[#C9922A]' : 'bg-transparent text-[#8A8E99] border-white/10 hover:border-white/20'}`}>
              {r} Months
            </button>
          ))}
        </div>

        {/* MONTHLY BAR CHART */}
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 mb-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-5">
            Quote volume — last {range} months
          </p>
          <div className="flex items-end justify-between gap-2" style={{ height: '160px' }}>
            {months.map(m => (
              <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className="text-[12px] font-black text-[#C9922A]">{m.count > 0 ? m.count : ''}</span>
                <div
                  className="w-full bg-gradient-to-t from-[#C9922A]/40 to-[#C9922A] rounded-t-sm transition-all"
                  style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: m.count > 0 ? '4px' : '0' }}
                />
                <span className="text-[10px] text-[#8A8E99] uppercase tracking-widest">{m.label}</span>
             m p-10 text-center">
            <p className="text-[#8A8E99] text-sm">No quote requests in this period.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map(g => {
              const isOpen = expanded[g.key] ?? false;
              const newCount = g.quotes.filter(q => q.status === 'new').length;
              return (
                <div key={g.key} className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
                  <button onClick={() => toggle(g.key)}
                    className="w-full flex items-center justify-between gap-4 p-5 hover:bg-white/[0.02] transition-all text-left">
                    <div className="flex items-center gap-3">
                      <span className={`text-[#8A8E99] text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-xl font-black uppercase">{g.dealerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {newCount > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border bg-[#C9922A]/15 text-[#C9922A] border-[#C9922A]/30">
                          {newCount} new
                        </span>
                      )}
                      <span className="text-[13px] font-black text-[#C9922A]">{g.quotes.length}</span>
                      <span className="text-[11px] text-[#8A8E99] uppercase tracking-widest">quote{g.quotes.length !== 1 ? 's' : ''}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/5 flex flex-col divide-y divide-white/5">
                      {g.quotes.map(q => (
                        <div key={q.id} className="p-5">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-[240px]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-[15px]">{q.buyer_name}</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${badge(q.status)}`}>
                                  {q.status}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#8A8E99]">
                                <a href={`mailto:${q.buyer_email}`} className="text-[#C9922A] hover:underline">{q.buyer_email}</a>
                                {q.buyer_phone && <> · {q.buyer_phone}</>}
                              </p>
                              <p className="text-[11px] text-[#8A8E99] mt-0.5">
                                {new Date(q.created_at).toLocaleString('en-ZA')}
                              </p>
                              <p className="text-[13px] text-[#C4C0B8] mt-3 leading-relaxed whitespace-pre-wrap bg-[#0D0F13] border border-white/5 rounded-sm p-3">
                                {q.message}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {(['new', 'contacted', 'closed'] as const).map(st => (
                                <button key={st} onClick={() => setStatus(q.id, st)}
                                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${
                                    q.status === st ? badge(st) : 'text-[#8A8E99] border-white/10 hover:border-white/20'}`}>
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
