'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  dealer_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  reported: boolean;
  hidden: boolean;
  created_at: string;
  dealer_response: string | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'reported' | 'hidden' | 'all'>('reported');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/records?type=review');
      const json = await res.json();
      if (json.ok) setReviews(json.records);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const hide = async (id: string, h: boolean) => {
    const { error } = await supabase.rpc('admin_hide_review', { p_review_id: id, p_hide: h });
    if (error) { alert('Failed: ' + error.message); return; }
    load();
  };

  const dismiss = async (id: string) => {
    const { error } = await supabase.rpc('admin_dismiss_report', { p_review_id: id });
    if (error) { alert('Failed: ' + error.message); return; }
    load();
  };

  const filtered = reviews.filter(r =>
    filter === 'reported' ? r.reported && !r.hidden
    : filter === 'hidden' ? r.hidden
    : true
  );

  const counts = {
    reported: reviews.filter(r => r.reported && !r.hidden).length,
    hidden: reviews.filter(r => r.hidden).length,
    all: reviews.length,
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] p-6 md:p-10">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase">
              Review <span className="text-[#C9922A]">Moderation</span>
            </h1>
            <p className="text-[13px] text-[#8A8E99] mt-1">
              {counts.reported} reported, {counts.hidden} hidden, {counts.all} total.
            </p>
          </div>
          <a href="/admin" className="text-[12px] text-[#8A8E99] hover:text-[#C9922A] uppercase tracking-widest font-black">Back to Admin</a>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {(['reported', 'hidden', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border transition-all ${
                filter === f ? 'bg-[#C9922A] text-black border-[#C9922A]' : 'bg-transparent text-[#8A8E99] border-white/10 hover:border-white/20'}`}>
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-[#8A8E99] text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-10 text-center">
            <p className="text-[#8A8E99] text-sm">
              {filter === 'reported' ? 'No reported reviews. Nothing needs your attention.' : 'None to show.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(r => (
              <div key={r.id} className={`bg-[#13151A] border rounded-sm p-5 ${r.reported && !r.hidden ? 'border-[#E63946]/30' : 'border-white/5'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-[15px]">{r.reviewer_name || 'User'}</span>
                      <span className="text-[#C9922A] text-sm">{'*'.repeat(r.rating)}{'\u00b7'.repeat(0)}</span>
                      <span className="text-[11px] text-[#8A8E99]">({r.rating}/5)</span>
                      {r.reported && !r.hidden && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30">Reported</span>
                      )}
                      {r.hidden && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border bg-white/5 text-[#8A8E99] border-white/10">Hidden</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8A8E99] mb-2">{fmt(r.created_at)}</p>
                    {r.comment && (
                      <p className="text-[14px] text-[#C4C0B8] leading-relaxed bg-[#0D0F13] border border-white/5 rounded-sm p-3">{r.comment}</p>
                    )}
                    {r.dealer_response && (
                      <p className="text-[12px] text-[#8A8E99] mt-2 ml-3 pl-3 border-l-2 border-[#C9922A]/40">Dealer replied: {r.dealer_response}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!r.hidden ? (
                      <>
                        <button onClick={() => hide(r.id, true)}
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border border-[#E63946]/40 text-[#E63946] hover:bg-[#E63946]/10">
                          Hide
                        </button>
                        {r.reported && (
                          <button onClick={() => dismiss(r.id)}
                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border border-white/10 text-[#8A8E99] hover:border-white/20">
                            Dismiss report
                          </button>
                        )}
                      </>
                    ) : (
                      <button onClick={() => hide(r.id, false)}
                        className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border border-[#2A9C6E]/40 text-[#2A9C6E] hover:bg-[#2A9C6E]/10">
                        Restore
                      </button>
                    )}
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
