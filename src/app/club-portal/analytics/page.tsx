'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useClubPortal } from '@/components/club-portal/ClubPortalContext';
import { PortalTitle, Panel, sastMonth } from '@/components/club-portal/ui';

// One row per month (club_page_views). A visitor counts once per day; the
// club's own visits are not counted.

export default function ClubPortalAnalytics() {
  const { club } = useClubPortal();
  const [rows, setRows] = useState<Array<{ month: string; views: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('club_page_views').select('month, views')
        .eq('club_id', club.id).order('month', { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, [club.id]);

  const byMonth = new Map(rows.map((r) => [r.month, r.views]));
  const thisMonth = byMonth.get(sastMonth()) || 0;
  const lastMonth = byMonth.get(sastMonth(-1)) || 0;
  const year = sastMonth().slice(0, 4);
  const thisYear = rows.filter((r) => r.month.startsWith(year)).reduce((s, r) => s + r.views, 0);
  const allTime = rows.reduce((s, r) => s + r.views, 0);

  const last12 = Array.from({ length: 12 }, (_, i) => {
    const m = sastMonth(-i);
    return { month: m, views: byMonth.get(m) || 0 };
  });
  const max = Math.max(1, ...last12.map((r) => r.views));

  const years = Array.from(new Set(rows.map((r) => r.month.slice(0, 4)))).sort().reverse()
    .map((y) => ({ year: y, views: rows.filter((r) => r.month.startsWith(y)).reduce((s, r) => s + r.views, 0) }));

  const label = (m: string) => new Date(m + 'T00:00:00Z').toLocaleDateString('en-ZA', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });

  const stat = (t: string, v: number) => (
    <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">{t}</p>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A] leading-none">{v}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PortalTitle a="Page" b="views" sub="How many people viewed your club page. Each visitor counts once a day." />
      {loading ? <p className="text-[#8A8E99] text-sm">Loading...</p> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stat('This month', thisMonth)}
            {stat('Last month', lastMonth)}
            {stat(`This year (${year})`, thisYear)}
            {stat('All time', allTime)}
          </div>
          <Panel title="Last 12 months">
            <div className="flex flex-col gap-2">
              {last12.map((r) => (
                <div key={r.month} className="flex items-center gap-3">
                  <span className="w-[130px] text-[12px] text-[#8A8E99] flex-shrink-0">{label(r.month)}</span>
                  <div className="flex-1 h-3 bg-[#0D0F13] rounded-sm overflow-hidden">
                    <div className="h-full bg-[#C9922A]" style={{ width: `${(r.views / max) * 100}%` }} />
                  </div>
                  <span className="w-[50px] text-right text-[13px] font-black">{r.views}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="By year">
            {years.length === 0 ? <p className="text-[13px] text-[#8A8E99]">No views recorded yet.</p> : (
              <div className="flex flex-col divide-y divide-white/5">
                {years.map((y) => (
                  <div key={y.year} className="flex justify-between py-2.5 text-[13px]">
                    <span>{y.year}</span><span className="font-black">{y.views}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
