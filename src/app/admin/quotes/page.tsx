'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Quote {
  id: string;
  dealer_name: string | null;
  dealer_email: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'closed'>('all');

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

  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter);

  const counts = {
    all: quotes.length,
    new: quotes.filter(q => q.status === 'new').length,
    contacted: quotes.filter(q => q.status === 'contacted').length,
    closed: quotes.filter(q => q.status === 'closed').length,
  };

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
              Quote <span className="text-[#C9922A]">Requests</span>
            </h1>
            <p className="text-[13px] text-[#8A8E99] mt-1">
              Buyer quote leads to dealers. {counts.new} new · {counts.all} total.
            </p>
          </div>
          <a href="/admin" className="text-[12px] text-[#8A8E99] hover:text-[#C9922A] uppercase tracking-widest font-black">← Admin</a>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {(['all', 'new', 'contacted', 'closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border transition-all ${
                filter === f ? 'bg-[#C9922A] text-black border-[#C9922A]' : 'bg-transparent text-[#8A8E99] border-white/10 hover:border-white/20'}`}>
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-[#8A8E99] text-sm">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-10 text-center">
            <p className="text-[#8A8E99] text-sm">No quote requests {filter !== 'all' ? `marked "${filter}"` : 'yet'}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(q => (
              <div key={q.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
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
                      To: <span className="text-[#C4C0B8]">{q.dealer_name || 'Unknown dealer'}</span> · {new Date(q.created_at).toLocaleString('en-ZA')}
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
    </div>
  );
}
