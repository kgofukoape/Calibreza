'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function TrainingDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u) { router.push('/login'); return; }

    const { data: evs } = await supabase
      .from('training_events')
      .select('*, provinces:province_id(name)')
      .eq('organizer_id', u.id)
      .order('created_at', { ascending: false });

    const list = evs || [];
    setEvents(list);

    const map: Record<string, number> = {};
    if (list.length > 0) {
      const { data: enq } = await supabase
        .from('event_enquiries')
        .select('event_id')
        .eq('organizer_id', u.id);
      (enq || []).forEach((e: any) => { map[e.event_id] = (map[e.event_id] || 0) + 1; });
    }
    setCounts(map);
    setLoading(false);
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  const totalViews = events.reduce((s, e) => s + (e.view_count || 0), 0);
  const totalInterest = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
              <Link href="/training" className="hover:text-[#C9922A]">Training</Link><span>/</span>
              <span className="text-[#F0EDE8]">My Events</span>
            </div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase">
              My Training <span className="text-[#C9922A]">Events</span>
            </h1>
          </div>
          <Link href="/training/post" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
            + Post New
          </Link>
        </div>

        {!loading && events.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-4">
              <p className="text-3xl font-black text-[#C9922A]">{events.length}</p>
              <p className="text-[11px] text-[#8A8E99] uppercase tracking-widest mt-1">Events posted</p>
            </div>
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-4">
              <p className="text-3xl font-black text-[#C9922A]">{totalViews}</p>
              <p className="text-[11px] text-[#8A8E99] uppercase tracking-widest mt-1">Total views</p>
            </div>
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-4">
              <p className="text-3xl font-black text-[#C9922A]">{totalInterest}</p>
              <p className="text-[11px] text-[#8A8E99] uppercase tracking-widest mt-1">Interested</p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-[#8A8E99] text-sm">Loading...</p>
        ) : events.length === 0 ? (
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-12 text-center">
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-[#F0EDE8] mb-1">No events yet</p>
            <p className="text-[#8A8E99] text-sm mb-5">Post your first training day to start reaching shooters.</p>
            <Link href="/training/post" className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110">Post a Training Day</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map(ev => (
              <div key={ev.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">{ev.title}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                        ev.status === 'active' ? 'bg-[#2A9C6E]/15 text-[#2A9C6E] border-[#2A9C6E]/30'
                        : ev.status === 'pending_payment' ? 'bg-[#C9922A]/15 text-[#C9922A] border-[#C9922A]/30'
                        : 'bg-white/5 text-[#8A8E99] border-white/10'}`}>
                        {ev.status === 'pending_payment' ? 'Awaiting payment' : ev.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#8A8E99]">{fmt(ev.date)} - {ev.provinces?.name || ev.city}</p>
                    <div className="flex gap-5 mt-3 text-[13px]">
                      <span className="text-[#8A8E99]">Views <span className="text-[#F0EDE8] font-black ml-1">{ev.view_count || 0}</span></span>
                      <span className="text-[#8A8E99]">Interested <span className="text-[#C9922A] font-black ml-1">{counts[ev.id] || 0}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {ev.status === 'active' && (
                      <Link href={`/training/${ev.slug}`} className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border border-white/10 text-[#8A8E99] hover:border-white/20">View</Link>
                    )}
                    <Link href={`/training/edit/${ev.id}`} className="text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border border-[#C9922A]/40 text-[#C9922A] hover:bg-[#C9922A]/10">Edit</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
