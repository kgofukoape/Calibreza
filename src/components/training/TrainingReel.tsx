'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const skillBadge = (s: string) =>
  s === 'Advanced / Tactical' ? 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30'
  : s === 'Intermediate' ? 'bg-[#C9922A]/15 text-[#C9922A] border-[#C9922A]/30'
  : 'bg-[#2A9C6E]/15 text-[#2A9C6E] border-[#2A9C6E]/30';

export default function TrainingReel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from('training_events')
        .select('*, provinces:province_id(name)')
        .eq('status', 'active')
        .gte('date', nowIso)
        .order('date', { ascending: true })
        .limit(8);
      setEvents(data || []);
      setLoaded(true);
    })();
  }, []);

  // Render nothing until loaded, and nothing if there are no upcoming events.
  // An empty reel is worse than no reel.
  if (!loaded || events.length === 0) return null;

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });

  return (
    <section className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 lg:py-12 border-t border-white/5">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[#C9922A] text-[10px] font-black uppercase tracking-[0.4em] mb-2">Get Trained</p>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight">
            Upcoming <span className="text-[#C9922A]">Training Days</span>
          </h2>
        </div>
        <Link href="/training" className="flex-shrink-0 text-[12px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A]">
          View all
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
        {events.map(ev => (
          <Link key={ev.id} href={`/training/${ev.slug}`}
            className="flex-shrink-0 w-[260px] snap-start bg-[#13151A] border border-white/5 rounded-sm overflow-hidden hover:border-[#C9922A]/30 transition-all group">
            <div className="relative h-[140px] bg-[#191C23] overflow-hidden">
              {ev.cover_image
                ? <img src={ev.cover_image} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[#8A8E99] text-sm">No image</div>}
              <div className={`absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border ${skillBadge(ev.skill_level)}`}>
                {ev.skill_level.split(' ')[0]}
              </div>
              <div className="absolute bottom-2 left-2 bg-black/70 text-[#F0EDE8] text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-wider">
                {fmt(ev.date)}
              </div>
            </div>
            <div className="p-3">
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-tight text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors line-clamp-1">
                {ev.title}
              </h3>
              <p className="text-[11px] text-[#8A8E99] mb-1">{ev.provinces?.name || ev.city}</p>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#8A8E99]">{ev.weapon_type} · {ev.training_type}</span>
                <span className="text-[#C9922A] font-black">{ev.price > 0 ? `R${Number(ev.price).toLocaleString('en-ZA')}` : 'Free'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
