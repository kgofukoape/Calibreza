'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';

interface Ev { id: string; title: string; slug: string; city: string; training_type: string; weapon_type: string; skill_level: string; price: number; view_count: number; status: string; created_at: string; date: string; organizer_name: string; }

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

export default function AdminTrainingPage() {
  const [events, setEvents] = useState<Ev[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

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

  const suspend = async (ev: Ev) => {
    const target = ev.status === 'active' ? 'cancelled' : 'active';
    const reason = ev.status === 'active'
      ? prompt('Reason for suspending this training event?') : 'Reinstated by admin';
    if (ev.status === 'active' && !reason) return;
    setBusy(ev.id);
    try {
      await adminAction({ entityType: 'training', entityId: ev.id, action: 'set_status', status: target, reason });
      await load();
    } catch (err: any) { alert('Failed: ' + err.message); }
    finally { setBusy(null); }
  };

  const remove = async (ev: Ev) => {
    const reason = prompt('Reason for deleting this training event? This cannot be undone.');
    if (!reason) return;
    setBusy(ev.id);
    try {
      await adminAction({ entityType: 'training', entityId: ev.id, action: 'delete', reason });
      await load();
    } catch (err: any) { alert('Failed: ' + err.message); }
    finally { setBusy(null); }
  };

  const active = events.filter(e => e.status === 'active');
  const totalViews = events.reduce((s, e) => s + (e.view_count || 0), 0);
  const enqByEvent: Record<string, number> = {};
  enquiries.forEach(q => { enqByEvent[q.event_id] = (enqByEvent[q.event_id] || 0) + 1; });

  const byType: Record<string, number> = {};
  active.forEach(e => { byType[e.training_type] = (byType[e.training_type] || 0) + 1; });
  const bySkill: Record<string, number> = {};
  active.forEach(e => { bySkill[e.skill_level] = (bySkill[e.skill_level] || 0) + 1; });

  const card = "bg-[#13151A] border border-white/5 rounded-sm p-4";
  const stat = "text-3xl md:text-4xl font-black text-[#C9922A]";
  const lbl = "text-[11px] text-[#8A8E99] uppercase tracking-widest mt-1";

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">
      <aside className="hidden lg:block w-56 flex-shrink-0 border-r border-white/5 p-4">
        <AdminNav />
      </aside>

      <div className="flex-1 p-6 md:p-10 min-w-0">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase">
                Training <span className="text-[#C9922A]">Analytics</span>
              </h1>
              <p className="text-[13px] text-[#8A8E99] mt-1">Platform-wide training demand, and event moderation.</p>
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
                <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-4">All events - moderation</p>
                {events.length === 0 ? <p className="text-[#8A8E99] text-sm">No events yet.</p> : (
                  <div className="flex flex-col divide-y divide-white/5">
                    {events.map(e => (
                      <div key={e.id} className="flex items-center justify-between gap-3 py-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[14px] truncate">{e.title}</p>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                              e.status === 'active' ? 'bg-[#2A9C6E]/15 text-[#2A9C6E] border-[#2A9C6E]/30'
                              : e.status === 'pending_payment' ? 'bg-[#C9922A]/15 text-[#C9922A] border-[#C9922A]/30'
                              : 'bg-white/5 text-[#8A8E99] border-white/10'}`}>{e.status}</span>
                          </div>
                          <p className="text-[11px] text-[#8A8E99]">{e.organizer_name || 'Unknown'} - {e.city} - Views {e.view_count || 0} - Interest {enqByEvent[e.id] || 0}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {e.status === 'active' && (
                            <a href={`/training/${e.slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-sm border border-white/10 text-[#8A8E99] hover:border-white/20">View</a>
                          )}
                          <button disabled={busy === e.id} onClick={() => suspend(e)}
                            className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-sm border border-[#C9922A]/40 text-[#C9922A] hover:bg-[#C9922A]/10 disabled:opacity-40">
                            {e.status === 'active' ? 'Suspend' : 'Reinstate'}
                          </button>
                          <button disabled={busy === e.id} onClick={() => remove(e)}
                            className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-sm border border-[#E63946]/40 text-[#E63946] hover:bg-[#E63946]/10 disabled:opacity-40">
                            Delete
                          </button>
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
    </div>
  );
}
