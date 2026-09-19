'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

const WEAPON_TYPES = ['Pistol', 'Rifle', 'Shotgun', 'Multi'];
const TRAINING_TYPES = ['Basic Competence', 'Defensive', 'CQB', 'Long Range', 'Competition', 'Other'];
const SKILL_LEVELS = ['Beginner / Competence', 'Intermediate', 'Advanced / Tactical'];

export default function EditTrainingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  const [form, setForm] = useState<any>(null);

  useEffect(() => { init(); }, [id]);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);

    const [{ data: ev }, { data: provs }] = await Promise.all([
      supabase.from('training_events').select('*').eq('id', id).maybeSingle(),
      supabase.from('provinces').select('*').order('name'),
    ]);
    setProvinces(provs || []);

    if (!ev) { setDenied(true); setLoadingInit(false); return; }
    if (ev.organizer_id !== u.id) { setDenied(true); setLoadingInit(false); return; }

    const d = new Date(ev.date);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setForm({
      title: ev.title || '', description: ev.description || '',
      province_id: ev.province_id || '', city: ev.city || '',
      date: localDate,
      length_hours: String(ev.length_hours ?? ''), price: String(ev.price ?? ''),
      total_slots: String(ev.total_slots ?? ''), rounds_required: String(ev.rounds_required ?? ''),
      weapon_type: ev.weapon_type || 'Pistol', training_type: ev.training_type || 'Basic Competence',
      skill_level: ev.skill_level || 'Beginner / Competence', instructors_bio: ev.instructors_bio || '',
    });
    setLoadingInit(false);
  };

  const set = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.province_id) { alert('Please select a province.'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('training_events')
        .update({
          title: form.title,
          description: form.description,
          province_id: form.province_id,
          city: form.city,
          date: new Date(form.date).toISOString(),
          length_hours: parseFloat(form.length_hours),
          price: parseFloat(form.price) || 0,
          total_slots: parseInt(form.total_slots),
          rounds_required: parseInt(form.rounds_required),
          weapon_type: form.weapon_type,
          training_type: form.training_type,
          skill_level: form.skill_level,
          instructors_bio: form.instructors_bio,
        })
        .eq('id', id)
        .eq('organizer_id', user.id)
        .select('id');
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error('Nothing was updated - you may not have permission.');
      router.push('/training/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[#F0EDE8] text-[14px] focus:outline-none focus:border-[#C9922A]/60";
  const lbl = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";
  const sec = "bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6";

  if (loadingInit) return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col"><Navbar />
      <div className="flex-1 flex items-center justify-center"><p className="text-[#8A8E99]">Loading...</p></div></div>
  );

  if (denied || !form) return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col"><Navbar />
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">Cannot edit this event</h1>
          <p className="text-[#8A8E99] text-sm mb-5">It does not exist, or it is not yours to edit.</p>
          <Link href="/training/dashboard" className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110">My events</Link>
        </div>
      </div></div>
  );

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        <div className="mb-6">
          <div className="text-[11px] text-[#8A8E99] uppercase tracking-widest mb-2 flex items-center gap-2">
            <Link href="/training/dashboard" className="hover:text-[#C9922A]">My Events</Link><span>/</span>
            <span className="text-[#F0EDE8]">Edit</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase">
            Edit <span className="text-[#C9922A]">Training Day</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-4 pb-3 border-b border-white/5">Course Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={lbl}>Title</label>
                <input required className={inp} value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Training Type</label>
                <select required className={inp} value={form.training_type} onChange={e => set('training_type', e.target.value)}>
                  {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Weapon Type</label>
                <select required className={inp} value={form.weapon_type} onChange={e => set('weapon_type', e.target.value)}>
                  {WEAPON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Skill Level</label>
                <select required className={inp} value={form.skill_level} onChange={e => set('skill_level', e.target.value)}>
                  {SKILL_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Length (hours)</label>
                <input required type="number" step="0.5" className={inp} value={form.length_hours} onChange={e => set('length_hours', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Description / Syllabus</label>
                <textarea required rows={5} className={inp} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Instructor Details</label>
                <textarea required rows={3} className={inp} value={form.instructors_bio} onChange={e => set('instructors_bio', e.target.value)} />
              </div>
            </div>
          </div>

          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-4 pb-3 border-b border-white/5">Logistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Date and Time</label>
                <input required type="datetime-local" className={inp} value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Price (ZAR)</label>
                <input required type="number" className={inp} value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Province</label>
                <select required className={inp} value={form.province_id} onChange={e => set('province_id', e.target.value)}>
                  <option value="">Select province...</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>City / Town</label>
                <input required className={inp} value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Total Slots</label>
                <input required type="number" className={inp} value={form.total_slots} onChange={e => set('total_slots', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Rounds Required</label>
                <input required type="number" className={inp} value={form.rounds_required} onChange={e => set('rounds_required', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/training/dashboard" className="px-8 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 transition-all flex items-center">Cancel</Link>
          </div>
          <p className="text-[11px] text-[#8A8E99]">Note: photos are kept from the original listing. To change images, contact support for now.</p>
        </form>
      </main>
    </div>
  );
}
