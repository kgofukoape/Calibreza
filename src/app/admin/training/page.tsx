'use client';

import { useState, useEffect } from 'react';

interface Ev { id: string; title: string; province_id: string; city: string; training_type: string; weapon_type: string; skill_level: string; price: number; view_count: number; status: string; created_at: string; date: string; }

export default function AdminTrainingPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [er, qr] = await Promise.all([
        fetch('/api/admin/records?type=training').then(r => r.json()),
        fetch('/api/admin/records?type=training_enquiry').then(r => r.json()),
      ]);
      if (er.ok) setEvents(er.records);
      if (qr.ok) setEnquiries(qr.records);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const active = events.filter(e => e.status === 'active');
  const totalViews = events.reduce((s, e) => s + (e.view_count || 0), 0);
  const enqByEvent: Record<string, number> = {};
  enquiries.forEach(q => { enqByEvent[q.event_id] = (enqByEvent[q.event_id] || 0) + 1; });

  const byType: Record<string, number> = {};
  active.forEach(e => { byType[e.training_type] = (byType[e.training_type] || 0) + 1; });
  const bySkill: Record<string, number> = {};
  active.forEach(e => { bySkill[e.skill_level] = (bySkill[e.skill_level] || 0) + 1; });

  const topByInterest = [...active]
    .map(e => ({ ...e, interest: enqByEvent[e.id] || 0 }))
    .sort((a, b) => b.interest - a.interest)
    .slice(0, 5);

  const card = "bg-[#13151A] border border-white/5 rounded-sm p-4";
  const stat = "text-3xl md:text-4xl font-black text-[#C9922A]";
  const lbl = "text-[11px] text-[#8A8E99] uppercase tracking-widest mt-1";

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] p-6 md:p-10">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase">
              Training <span className="text-[#C9922A]">Analytics</span>
            </h1>
            <p className="text-[13px] text-[#8A8E99] mt-1">Platform-wide training demand for BD and marketing.</p>
          </div>
          <a href="/admin" className="text-[12px] text-[#8A8E99] hover:text-[#C9922A] uppercase tracking-widest font-black">Back to Admin</a>
        </div>

        {loading ? <p className="text-[#8A8E99] text-sm">Loading...</p> : (
          <>
            <div className="bg-gradient-to-br from-[#C9922A]/10 to-[#13151A] border border-[#C9922A]/20 rounded-sm p-6 mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C9922A] mb-4">Marketing Snapshot</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className={stat}>{active.length}</p><p className={lbl}>Active courses</p></div>
                <div><p className={stat}>{totalViews}</p><p className={lbl}>Total views</p></div>
                <div><p className={stat}>{enquiries.length}</p><p className={lbl}>Total enquiries</p></div>
                <div><p className={stat}>{events.length}</p><p className={lbl}>Courses ever posted</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={card}>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">By training type</p>
                {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[13px] py-1"><span className="text-[#C4C0B8]">{k}</span><span className="text-[#C9922A] font-black">{v}</span></div>
                ))}
                {Object.keys(byType).length === 0 && <p className="text-[#8A8E99] text-sm">No active courses.</p>}
              </div>
              <div className={card}>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">By skill level</p>
                {Object.entries(bySkill).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[13px] py-1"><span className="text-[#C4C0B8]">{k}</span><span className="text-[#C9922A] font-black">{v}</span></div>
                ))}
                {Object.keys(bySkill).length === 0 && <p className="text-[#8A8E99] text-sm">No active courses.</p>}
              </div>
            </div>

            <div className={card}>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Top courses by interest</p>
              {topByInterest.length === 0 ? <p className="text-[#8A8E99] text-sm">No courses yet.</p> : (
                <div className="flex flex-col divide-y divide-white/5">
                  {topByInterest.map(e => (
                    <div key={e.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-bold text-[14px] truncate">{e.title}</p>
                        <p className="text-[11px] text-[#8A8E99]">{e.city} - {e.training_type}</p>
                      </div>
                      <div className="flex gap-5 flex-shrink-0 text-[13px]">
                        <span className="text-[#8A8E99]">Views <span className="text-[#F0EDE8] font-black">{e.view_count || 0}</span></span>
                        <span className="text-[#8A8E99]">Interest <span className="text-[#C9922A] font-black">{e.interest}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
