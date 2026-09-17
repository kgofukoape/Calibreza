'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

const skillBadge = (s: string) =>
  s === 'Advanced / Tactical' ? 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30'
  : s === 'Intermediate' ? 'bg-[#C9922A]/15 text-[#C9922A] border-[#C9922A]/30'
  : 'bg-[#2A9C6E]/15 text-[#2A9C6E] border-[#2A9C6E]/30';

export default function TrainingDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => { if (slug) load(); }, [slug]);

  const load = async () => {
    const { data } = await supabase.from('training_events').select('*, provinces:province_id(name)').eq('slug', slug).eq('status', 'active').maybeSingle();
    if (!data) { setNotFound(true); setLoading(false); return; }
    setEvent(data); setActiveImg(data.cover_image); setLoading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true);
    try {
      await supabase.from('event_enquiries').insert({ event_id: event.id, event_title: event.title, organizer_id: event.organizer_id, buyer_name: f.name, buyer_email: f.email, buyer_phone: f.phone || null, message: f.message || null });
      await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'event_enquiry', organizerId: event.organizer_id, eventTitle: event.title, name: f.name, email: f.email, phone: f.phone, message: f.message }) });
      setSent(true);
      setTimeout(() => { setShowModal(false); setSent(false); setF({ name: '', email: '', phone: '', message: '' }); }, 2500);
    } catch (err: any) { alert('Could not send: ' + (err.message || 'try again')); } finally { setSending(false); }
  };

  const fmt = (d: string) => new Date(d).toLocaleString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return (<div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]"><Navbar /><div className="max-w-[1000px] mx-auto px-4 py-24 text-center"><p className="text-[#8A8E99] uppercase tracking-widest text-sm font-bold">Loading...</p></div><Footer /></div>);

  if (notFound || !event) return (<div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]"><Navbar /><div className="max-w-[1000px] mx-auto px-4 py-24 text-center"><h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-2">Training day not found</h1><p className="text-[#8A8E99] text-sm mb-6">This course is not listed, or it has already taken place.</p><Link href="/training" className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110">All training days</Link></div><Footer /></div>);

  const gallery: string[] = [event.cover_image, ...(event.gallery_images || [])].filter(Boolean);
  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60";

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-[#C9922A]">Home</Link><span>/</span>
          <Link href="/training" className="hover:text-[#C9922A]">Training</Link><span>/</span>
          <span className="text-[#F0EDE8] line-clamp-1">{event.title}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div>
              <div className="relative h-[280px] md:h-[380px] bg-[#191C23] rounded-sm overflow-hidden mb-3">
                {activeImg ? <img src={activeImg} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#8A8E99]">No image</div>}
                <div className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border ${skillBadge(event.skill_level)}`}>{event.skill_level}</div>
              </div>
              {gallery.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {gallery.map((g, i) => (<button key={i} onClick={() => setActiveImg(g)} className={`w-20 h-16 rounded-sm overflow-hidden border-2 ${activeImg === g ? 'border-[#C9922A]' : 'border-white/10'}`}><img src={g} alt="" className="w-full h-full object-cover" /></button>))}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#191C23] text-[#8A8E99] text-[11px] font-black px-2 py-1 rounded-sm uppercase tracking-wider">{event.weapon_type}</span>
                <span className="bg-[#191C23] text-[#8A8E99] text-[11px] font-black px-2 py-1 rounded-sm uppercase tracking-wider">{event.training_type}</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3">{event.title}</h1>
              <p className="text-[14px] text-[#8A8E99] mb-6">{event.provinces?.name ? `${event.city}, ${event.provinces.name}` : event.city}</p>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2 text-[#C9922A]">About this course</h2>
              <p className="text-[14.5px] text-[#C4C0B8] leading-relaxed whitespace-pre-wrap mb-6">{event.description}</p>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2 text-[#C9922A]">Instructor</h2>
              <p className="text-[14.5px] text-[#C4C0B8] leading-relaxed whitespace-pre-wrap">{event.instructors_bio}</p>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 lg:sticky lg:top-6">
              <p className="text-3xl font-black text-[#C9922A] mb-1">{event.price > 0 ? `R${Number(event.price).toLocaleString('en-ZA')}` : 'Free'}</p>
              <p className="text-[12px] text-[#8A8E99] uppercase tracking-widest mb-5">per attendee</p>
              <div className="flex flex-col gap-3 text-[13px] mb-6">
                <div className="flex justify-between"><span className="text-[#8A8E99]">Date</span><span className="text-[#F0EDE8] font-bold text-right">{fmt(event.date)}</span></div>
                <div className="flex justify-between"><span className="text-[#8A8E99]">Duration</span><span className="text-[#F0EDE8] font-bold">{event.length_hours} hrs</span></div>
                <div className="flex justify-between"><span className="text-[#8A8E99]">Rounds required</span><span className="text-[#F0EDE8] font-bold">{event.rounds_required}</span></div>
                <div className="flex justify-between"><span className="text-[#8A8E99]">Total slots</span><span className="text-[#F0EDE8] font-bold">{event.total_slots}</span></div>
                <div className="flex justify-between"><span className="text-[#8A8E99]">Weapon</span><span className="text-[#F0EDE8] font-bold">{event.weapon_type}</span></div>
                <div className="flex justify-between"><span className="text-[#8A8E99]">Skill level</span><span className="text-[#F0EDE8] font-bold text-right">{event.skill_level}</span></div>
              </div>
              <button onClick={() => setShowModal(true)} className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-3.5 rounded-sm hover:brightness-110 transition-all">I&apos;m Interested</button>
              <p className="text-[11px] text-[#8A8E99] text-center mt-3">Booking and payment are handled by the organizer.</p>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#191C23] border border-white/10 rounded-sm p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-2xl uppercase">Register Interest</h3>
              <button onClick={() => setShowModal(false)} className="text-[#8A8E99] hover:text-white text-2xl leading-none">&times;</button>
            </div>
            {sent ? (<div className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm p-4 text-center"><p className="text-[#2A9C6E] font-bold">Sent. The organizer will be in touch.</p></div>) : (
              <form onSubmit={submit} className="flex flex-col gap-3">
                <p className="text-[13px] text-[#8A8E99] mb-1">Your details go to the course organizer, who will contact you about booking.</p>
                <input required placeholder="Your name" className={inp} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
                <input required type="email" placeholder="Your email" className={inp} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
                <input placeholder="Your phone (optional)" className={inp} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
                <textarea rows={3} placeholder="Message (optional)" className={inp} value={f.message} onChange={e => setF({ ...f, message: e.target.value })} />
                <button type="submit" disabled={sending} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:brightness-110 disabled:opacity-40">{sending ? 'Sending...' : 'Send to organizer'}</button>
              </form>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
