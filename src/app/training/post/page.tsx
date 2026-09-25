'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

const PAID_PRICE = 299;

const WEAPON_TYPES = ['Pistol', 'Rifle', 'Shotgun', 'Multi'];
const TRAINING_TYPES = ['Basic Competence', 'Defensive', 'CQB', 'Long Range', 'Competition', 'Other'];
const SKILL_LEVELS = ['Beginner / Competence', 'Intermediate', 'Advanced / Tactical'];

export default function PostTrainingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [allowance, setAllowance] = useState<any>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading, setLoading] = useState(false);

  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [gallery, setGallery] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '', description: '', province_id: '', city: '',
    date: '', length_hours: '', price: '', total_slots: '',
    rounds_required: '', weapon_type: 'Pistol', training_type: 'Basic Competence',
    skill_level: 'Beginner / Competence', instructors_bio: '', fca_compliant: false,
  });

  useEffect(() => { init(); }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);
    const [{ data: provs }, { data: allow }] = await Promise.all([
      supabase.from('provinces').select('*').order('name'),
      supabase.rpc('training_allowance', { p_user_id: u.id }),
    ]);
    setProvinces(provs || []);
    setAllowance(allow || null);
    setLoadingInit(false);
  };

  const allowanceLoaded = allowance !== null;
  const remaining = allowance?.remaining ?? 1;
  const isPaid = allowanceLoaded && remaining <= 0;
  const periodWord = allowance?.period === 'month' ? 'this month' : 'this year';
  const allowanceTotal = allowance?.allowance ?? 1;
  const periodNoun = allowance?.period === 'month' ? 'month' : 'year';

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const onCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setCover(f); setCoverPreview(URL.createObjectURL(f)); }
  };
  const onGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (gallery.length + files.length > 5) { alert('Maximum 5 gallery photos'); return; }
    setGallery([...gallery, ...files]);
    setGalleryPreviews([...galleryPreviews, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeGallery = (i: number) => {
    setGallery(gallery.filter((_, idx) => idx !== i));
    setGalleryPreviews(galleryPreviews.filter((_, idx) => idx !== i));
  };

  const uploadOne = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `training/${user.id}/${Math.random()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw new Error('Image upload failed: ' + error.message);
    return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fca_compliant) { alert('Please confirm FCA compliance before submitting.'); return; }
    if (!cover) { alert('A cover image is required.'); return; }
    if (!form.province_id) { alert('Please select a province.'); return; }
    setLoading(true);

    try {
      const coverUrl = await uploadOne(cover);
      const galleryUrls: string[] = [];
      for (const g of gallery) galleryUrls.push(await uploadOne(g));

      const payload = {
        organizer_id: user.id,
        organizer_name: user.user_metadata?.full_name || null,
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
        cover_image: coverUrl,
        gallery_images: galleryUrls,
        fca_compliant: true,
        status: isPaid ? 'pending_payment' : 'active',
        is_paid: false,
      };

      const { data: created, error } = await supabase
        .from('training_events').insert(payload).select('id').single();
      if (error) throw new Error(error.message);

      if (isPaid) {
        // The checkout is built and SIGNED on the server: the PayFast
        // passphrase is a server-only secret, so a form built here cannot be
        // signed, and PayFast rejects unsigned checkouts. The price comes from
        // the server too.
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          throw new Error('Your session has expired. Please sign in again.');
        }

        const res = await fetch('/api/payfast/training-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ eventId: created.id }),
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.payfast_url || !Array.isArray(json?.fields)) {
          throw new Error(json?.error || 'Could not start checkout. Please try again.');
        }

        const f = document.createElement('form');
        f.method = 'POST';
        f.action = json.payfast_url;
        (json.fields as Array<[string, string]>).forEach(([k, v]) => {
          const i = document.createElement('input');
          i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i);
        });
        document.body.appendChild(f);
        f.submit();
        return;
      }

      router.push('/training?posted=1');
    } catch (err: any) {
      alert(err.message || 'Failed to post training event');
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[#F0EDE8] text-[14px] focus:outline-none focus:border-[#C9922A]/60";
  const lbl = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";
  const sec = "bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6";

  if (loadingInit) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center"><p className="text-[#8A8E99]">Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        <div className="mb-6">
          <div className="text-[11px] text-[#8A8E99] uppercase tracking-widest mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link><span>/</span>
            <Link href="/training" className="hover:text-[#C9922A]">Training</Link><span>/</span>
            <span className="text-[#F0EDE8]">Post</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase mb-1">
            Post a <span className="text-[#C9922A]">Training Day</span>
          </h1>
          <p className="text-[13px] text-[#8A8E99]">List a live-fire course, clinic or class</p>
        </div>

        <div className={`mb-5 rounded-sm p-4 ${isPaid ? 'bg-[#C9922A]/10 border border-[#C9922A]/30' : 'bg-[#13151A] border border-white/5'}`}>
          <p className="text-[12px] font-black uppercase tracking-widest text-[#F0EDE8]">
            {isPaid ? `Free listing used up ${periodWord}` : `${remaining} free training listing${remaining === 1 ? '' : 's'} left ${periodWord}`}
          </p>
          <p className="text-[11px] text-[#8A8E99] mt-0.5">
            {isPaid ? `This listing costs R${PAID_PRICE}, paid securely via PayFast.` : `You get ${allowanceTotal} free training listing${allowanceTotal === 1 ? '' : 's'} per ${periodNoun}.`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-4 pb-3 border-b border-white/5">Course Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={lbl}>Title <span className="text-red-400">*</span></label>
                <input required className={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Defensive Pistol Level 1" />
              </div>
              <div>
                <label className={lbl}>Training Type <span className="text-red-400">*</span></label>
                <select required className={inp} value={form.training_type} onChange={e => set('training_type', e.target.value)}>
                  {TRAINING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Weapon Type <span className="text-red-400">*</span></label>
                <select required className={inp} value={form.weapon_type} onChange={e => set('weapon_type', e.target.value)}>
                  {WEAPON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Skill Level <span className="text-red-400">*</span></label>
                <select required className={inp} value={form.skill_level} onChange={e => set('skill_level', e.target.value)}>
                  {SKILL_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Length (hours) <span className="text-red-400">*</span></label>
                <input required type="number" step="0.5" className={inp} value={form.length_hours} onChange={e => set('length_hours', e.target.value)} placeholder="4" />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Description / Syllabus <span className="text-red-400">*</span></label>
                <textarea required rows={5} className={inp} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What the course covers, prerequisites, what to bring..." />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Instructor Details <span className="text-red-400">*</span></label>
                <textarea required rows={3} className={inp} value={form.instructors_bio} onChange={e => set('instructors_bio', e.target.value)} placeholder="Instructor name, credentials, experience" />
              </div>
            </div>
          </div>

          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-4 pb-3 border-b border-white/5">Logistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Date &amp; Time <span className="text-red-400">*</span></label>
                <input required type="datetime-local" className={inp} value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Price (ZAR) <span className="text-red-400">*</span></label>
                <input required type="number" className={inp} value={form.price} onChange={e => set('price', e.target.value)} placeholder="1500" />
              </div>
              <div>
                <label className={lbl}>Province <span className="text-red-400">*</span></label>
                <select required className={inp} value={form.province_id} onChange={e => set('province_id', e.target.value)}>
                  <option value="">Select province...</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>City / Town <span className="text-red-400">*</span></label>
                <input required className={inp} value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Pretoria" />
              </div>
              <div>
                <label className={lbl}>Total Slots <span className="text-red-400">*</span></label>
                <input required type="number" className={inp} value={form.total_slots} onChange={e => set('total_slots', e.target.value)} placeholder="12" />
              </div>
              <div>
                <label className={lbl}>Rounds Required <span className="text-red-400">*</span></label>
                <input required type="number" className={inp} value={form.rounds_required} onChange={e => set('rounds_required', e.target.value)} placeholder="200" />
              </div>
            </div>
          </div>

          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-1 pb-3 border-b border-white/5">Photos</h2>
            <p className="text-[12px] text-[#8A8E99] mb-4">A cover image is required. Add up to 5 gallery photos.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={lbl}>Cover Image <span className="text-red-400">*</span></label>
                {coverPreview && <img src={coverPreview} alt="" className="w-full h-32 object-cover rounded-sm mb-2 border border-white/10" />}
                <input type="file" accept="image/*" onChange={onCover}
                  className={inp + " file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-bold file:bg-[#C9922A] file:text-black"} />
              </div>
              <div>
                <label className={lbl}>Gallery ({gallery.length}/5)</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {galleryPreviews.map((u, i) => (
                    <div key={i} className="relative aspect-square rounded-sm overflow-hidden border border-white/10">
                      <img src={u} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGallery(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">x</button>
                    </div>
                  ))}
                </div>
                {gallery.length < 5 && (
                  <input type="file" accept="image/*" multiple onChange={onGallery}
                    className={inp + " file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white"} />
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.fca_compliant} onChange={e => set('fca_compliant', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#C9922A] flex-shrink-0" />
              <span className="text-[13px] text-[#F0EDE8] leading-relaxed">
                I confirm this training complies with the <strong className="text-[#C9922A]">Firearms Control Act (Act 60 of 2000)</strong> and all applicable range and safety regulations. I am authorised to run this training and hold the necessary accreditation.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
            {loading ? (isPaid ? 'Redirecting to payment...' : 'Posting...') : isPaid ? `Post Training - R${PAID_PRICE}` : 'Post Training - Free'}
          </button>
          {isPaid && <p className="text-[11px] text-[#8A8E99] text-center">Your listing goes live after payment is confirmed.</p>}
        </form>
      </main>
    </div>
  );
}
