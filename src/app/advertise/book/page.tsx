'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

// ─── LOCKED RATE CARD — must match admin/ads/page.tsx exactly ────────────────
const SLOT_RATES: Record<string, number> = {
  leaderboard_top: 1500,
  leaderboard_mid: 1200,
  sidebar_left:    800,
  sidebar_right:   800,
  square_card:     500,
};

const AD_SLOTS = [
  { id: 'leaderboard_top', label: 'Leaderboard Top',  size: '970 × 90',  rate: SLOT_RATES.leaderboard_top, desc: 'Top of page, maximum visibility' },
  { id: 'leaderboard_mid', label: 'Leaderboard Mid',  size: '728 × 90',  rate: SLOT_RATES.leaderboard_mid, desc: 'Mid-page, inline with content' },
  { id: 'sidebar_left',    label: 'Sidebar Left',     size: '160 × 600', rate: SLOT_RATES.sidebar_left,    desc: 'Tall skyscraper, left column' },
  { id: 'sidebar_right',   label: 'Sidebar Right',    size: '160 × 600', rate: SLOT_RATES.sidebar_right,   desc: 'Tall skyscraper, right column' },
  { id: 'square_card',     label: 'Square Card',      size: '300 × 250', rate: SLOT_RATES.square_card,     desc: 'Compact block, broad reach' },
];

const PAGE_OPTIONS = [
  { value: 'all',                  label: 'All Pages (Sitewide)' },
  { value: 'home',                 label: 'Homepage' },
  { value: 'browse_pistols',       label: 'Browse — Pistols' },
  { value: 'browse_rifles',        label: 'Browse — Rifles' },
  { value: 'browse_shotguns',      label: 'Browse — Shotguns' },
  { value: 'browse_revolvers',     label: 'Browse — Revolvers' },
  { value: 'browse_ammunition',    label: 'Browse — Ammunition' },
  { value: 'browse_optics',        label: 'Browse — Optics' },
  { value: 'browse_accessories',   label: 'Browse — Accessories' },
  { value: 'browse_holsters',      label: 'Browse — Holsters' },
  { value: 'browse_air_guns',      label: 'Browse — Air Guns' },
  { value: 'browse_airsoft',       label: 'Browse — Airsoft' },
  { value: 'browse_magazines',     label: 'Browse — Magazines' },
  { value: 'browse_reloading',     label: 'Browse — Reloading' },
  { value: 'browse_knives',        label: 'Browse — Knives' },
  { value: 'listings_detail',      label: 'Listing Detail Page' },
  { value: 'dealers_directory',    label: 'Dealers Directory' },
  { value: 'dealers_profile',      label: 'Dealer Profile' },
  { value: 'clubs_directory',      label: 'Clubs & Ranges Directory' },
  { value: 'clubs_profile',        label: 'Club / Range Profile' },
  { value: 'services_directory',   label: 'Services Directory' },
  { value: 'services_profile',     label: 'Service Provider Profile' },
  { value: 'jobs_board',           label: 'Jobs Board' },
  { value: 'jobs_detail',          label: 'Job Detail Page' },
  { value: 'wanted',               label: 'Wanted Ads' },
  { value: 'search',               label: 'Search Results' },
  { value: 'advisor',              label: 'FCA Match Advisor' },
  { value: 'sell',                 label: 'Sell / Post Ad' },
  { value: 'faqs',                 label: 'FAQs' },
  { value: 'firearm_ownership',    label: 'Firearm Ownership Guide' },
  { value: 'about',                label: 'About Page' },
];

const DURATION_OPTIONS = [
  { value: 1, label: '1 Month' },
  { value: 2, label: '2 Months' },
  { value: 3, label: '3 Months (Max)' },
];

const AD_FORMATS = {
  image: { label: 'Static Image', accept: 'image/jpeg,image/png,image/webp', tip: 'JPG, PNG or WebP — up to 50MB.' },
  gif:   { label: 'Animated GIF', accept: 'image/gif',                       tip: 'GIF — up to 30MB. Keep under 15 seconds.' },
  video: { label: 'Video',        accept: 'video/mp4,video/webm',            tip: 'MP4 or WebM — up to 50MB, max 30 seconds.' },
};

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export default function AdvertiseBookPage() {
  const router = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep]           = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [availabilityNote, setAvailabilityNote] = useState('');

  // form state
  const [slot, setSlot]           = useState('leaderboard_top');
  const [page, setPage]           = useState('all');
  const [duration, setDuration]   = useState(1);
  const [startDate, setStartDate] = useState('');
  const [adType, setAdType]       = useState('image');
  const [clickUrl, setClickUrl]   = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState('');
  const [title, setTitle]         = useState('');
  const [clientName, setClientName]       = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientPhone, setClientPhone]     = useState('');
  const [consented, setConsented]         = useState(false);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dealer/login?redirect=/advertise/book');
        return;
      }
      setUser(user);
      setAuthChecked(true);
    };
    check();
  }, [router]);

  // ── Availability check (soft — admin makes final call) ───────────────────────
  useEffect(() => {
    if (!startDate || !slot || !page) { setAvailabilityNote(''); return; }
    const checkAvail = async () => {
      const starts = new Date(startDate).toISOString();
      const expires = addMonths(startDate, duration);
      const { data } = await supabase
        .from('ads')
        .select('id, expires_at')
        .eq('slot', slot)
        .eq('page', page)
        .eq('status', 'active')
        .lt('starts_at', expires)
        .gt('expires_at', starts);
      if (data && data.length > 0) {
        const until = new Date(data[0].expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
        setAvailabilityNote(`⚠️ This slot is currently booked until ${until}. You can still submit — our team will confirm the earliest available date with you.`);
      } else {
        setAvailabilityNote('✓ This slot looks available for your selected dates.');
      }
    };
    checkAvail();
  }, [slot, page, startDate, duration]);

  const slotInfo   = AD_SLOTS.find(s => s.id === slot);
  const monthlyRate = slotInfo?.rate || 0;
  const totalCost  = monthlyRate * duration;
  const pageLabel  = PAGE_OPTIONS.find(p => p.value === page)?.label || page;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { setError('File is larger than 50MB. Please compress and try again.'); return; }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const canProceedStep1 = slot && page && duration && startDate;
  const canProceedStep2 = file && clickUrl && title;
  const canSubmit       = clientName && user?.email && consented;

  const handleSubmit = async () => {
    if (!file) { setError('Please upload your ad creative.'); return; }
    setSubmitting(true);
    setError('');

    // 1. Upload creative to the images bucket
    const ext  = file.name.split('.').pop();
    const path = `ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('images').upload(path, file);
    if (upErr) { setError('Upload failed: ' + upErr.message); setSubmitting(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);

    // 2. Insert booking as pending_review
    const startsIso  = new Date(startDate).toISOString();
    const expiresIso = addMonths(startDate, duration);

    const { error: insErr } = await supabase.from('ads').insert({
      client_name:    clientName,
      client_email:   user.email,
      client_phone:   clientPhone,
      client_company: clientCompany,
      title,
      slot,
      page,
      ad_type:        adType,
      file_url:       publicUrl,
      click_url:      clickUrl,
      starts_at:      startsIso,
      expires_at:     expiresIso,
      amount_paid:    totalCost,
      rate_per_day:   Math.round(monthlyRate / 30),
      status:         'pending_review',
      consent_at:     new Date().toISOString(),
      policy_version: '1.0',
      notes:          `Self-service booking · ${duration} month(s) · submitted by ${user.email}`,
    });

    if (insErr) { setError('Submission failed: ' + insErr.message); setSubmitting(false); return; }

    // 3. Notify admin (best-effort, non-blocking)
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ad_submitted',
          data: { title, slot, page: pageLabel, company: clientCompany || clientName, total: totalCost },
        }),
      });
    } catch { /* email failure shouldn't block the booking */ }

    setSubmitting(false);
    setSuccess(true);
  };

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50 transition-colors";
  const labelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-2";

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── SUCCESS STATE ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-lg text-center">
            <div className="text-6xl mb-6">✅</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight mb-4">
              Booking <span className="text-[#C9922A]">Submitted</span>
            </h1>
            <p className="text-[#8A8E99] mb-2 leading-relaxed">
              Your ad has been submitted for review. Our team checks every submission to keep the platform brand-safe — this usually takes under 24 hours.
            </p>
            <p className="text-[#8A8E99] mb-8 leading-relaxed">
              We'll email <span className="text-[#C9922A] font-bold">{user.email}</span> with payment details and confirmation once it's approved.
            </p>
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 mb-8 text-left">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Summary</p>
              <div className="space-y-1.5 text-[13px]">
                <p className="flex justify-between"><span className="text-[#8A8E99]">Slot</span><span className="font-bold">{slotInfo?.label}</span></p>
                <p className="flex justify-between"><span className="text-[#8A8E99]">Page</span><span className="font-bold">{pageLabel}</span></p>
                <p className="flex justify-between"><span className="text-[#8A8E99]">Duration</span><span className="font-bold">{duration} month{duration > 1 ? 's' : ''}</span></p>
                <p className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5"><span className="text-[#8A8E99]">Total</span><span className="font-black text-[#C9922A]">R{totalCost.toLocaleString()}</span></p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/advertise" className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
                Back to Advertise
              </Link>
              <Link href="/" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
                Return Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── BOOKING FLOW ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-[800px] mx-auto w-full px-4 md:px-6 py-8 md:py-12">

        {/* Breadcrumb */}
        <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-[#C9922A]">Home</Link><span>/</span>
          <Link href="/advertise" className="hover:text-[#C9922A]">Advertise</Link><span>/</span>
          <span className="text-[#F0EDE8]">Book a Slot</span>
        </div>

        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2">
          Book Your <span className="text-[#C9922A]">Ad Slot</span>
        </h1>
        <p className="text-[#8A8E99] text-sm mb-8">Signed in as {user.email}</p>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(n => (
            <React.Fragment key={n}>
              <div className={`flex items-center justify-center w-9 h-9 rounded-sm font-black text-[13px] flex-shrink-0 ${
                step === n ? 'bg-[#C9922A] text-black' : step > n ? 'bg-[#C9922A]/20 text-[#C9922A]' : 'bg-[#13151A] border border-white/10 text-[#8A8E99]'
              }`}>
                {step > n ? '✓' : n}
              </div>
              {n < 3 && <div className={`flex-1 h-[2px] ${step > n ? 'bg-[#C9922A]/40' : 'bg-white/5'}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-sm font-bold mb-6">{error}</div>}

        {/* ── STEP 1: SLOT, PAGE, DURATION ───────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Choose Your Slot</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AD_SLOTS.map(s => (
                  <button key={s.id} onClick={() => setSlot(s.id)}
                    className={`text-left p-4 rounded-sm border transition-all ${slot === s.id ? 'border-[#C9922A] bg-[#C9922A]/5' : 'border-white/10 bg-[#13151A] hover:border-white/20'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-[14px] uppercase tracking-wide">{s.label}</span>
                      <span className="text-[#C9922A] font-black text-[15px]">R{s.rate.toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-[#8A8E99] font-mono mb-1">{s.size} px</p>
                    <p className="text-[11px] text-[#8A8E99]">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Show On Page</label>
                <select value={page} onChange={e => setPage(e.target.value)} className={inputClass}>
                  {PAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Duration</label>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputClass}>
                  {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Preferred Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} min={new Date().toISOString().split('T')[0]} />
            </div>

            {availabilityNote && (
              <div className={`rounded-sm p-3 text-[13px] ${availabilityNote.startsWith('✓') ? 'bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]' : 'bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]'}`}>
                {availabilityNote}
              </div>
            )}

            {/* Cost preview */}
            <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Total Cost</p>
                <p className="text-[13px] text-[#8A8E99]">{slotInfo?.label} · {duration} month{duration > 1 ? 's' : ''}</p>
              </div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A]">R{totalCost.toLocaleString()}</p>
            </div>

            <button onClick={() => setStep(2)} disabled={!canProceedStep1}
              className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              Continue to Creative →
            </button>
          </div>
        )}

        {/* ── STEP 2: CREATIVE + CLICK URL ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Campaign Name</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Winter Promo 2026" />
            </div>

            <div>
              <label className={labelClass}>Ad Format</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(AD_FORMATS).map(([id, f]) => (
                  <button key={id} onClick={() => { setAdType(id); setFile(null); setPreview(''); }}
                    className={`p-3 rounded-sm border text-center transition-all ${adType === id ? 'border-[#C9922A] bg-[#C9922A]/5' : 'border-white/10 bg-[#13151A] hover:border-white/20'}`}>
                    <p className="font-black text-[12px] uppercase">{f.label}</p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#8A8E99] mt-2">{AD_FORMATS[adType as keyof typeof AD_FORMATS].tip}</p>
            </div>

            <div>
              <label className={labelClass}>Upload Creative — {slotInfo?.size} px</label>
              <label className="flex flex-col items-center justify-center w-full h-[140px] bg-[#13151A] border-2 border-dashed border-white/20 rounded-sm cursor-pointer hover:border-[#C9922A]/50 transition-all">
                <span className="text-3xl mb-2">📁</span>
                <span className="text-[12px] text-[#8A8E99] font-bold uppercase tracking-widest">{file ? file.name : 'Click to upload'}</span>
                <input type="file" accept={AD_FORMATS[adType as keyof typeof AD_FORMATS].accept} onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {preview && (
              <div>
                <label className={labelClass}>Preview</label>
                <div className="w-full bg-[#13151A] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center p-4" style={{ minHeight: '120px' }}>
                  {adType === 'video'
                    ? <video src={preview} autoPlay muted loop playsInline className="max-w-full max-h-[300px]" />
                    : <img src={preview} alt="Preview" className="max-w-full max-h-[300px] object-contain" />}
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Click-Through URL</label>
              <input value={clickUrl} onChange={e => setClickUrl(e.target.value)} className={inputClass} placeholder="https://your-website.co.za" />
              <p className="text-[11px] text-[#8A8E99] mt-1.5">Where people go when they click your ad.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-6 py-4 rounded-sm hover:bg-white/5 transition-all">
                ← Back
              </button>
              <button onClick={() => setStep(3)} disabled={!canProceedStep2}
                className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Continue to Details →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: CONTACT + REVIEW ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Your Name *</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} className={inputClass} placeholder="Full name" />
              </div>
              <div>
                <label className={labelClass}>Company</label>
                <input value={clientCompany} onChange={e => setClientCompany(e.target.value)} className={inputClass} placeholder="Company name (optional)" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input value={user.email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className={inputClass} placeholder="082 123 4567" />
              </div>
            </div>

            {/* Final review */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] mb-4">Review Your Booking</p>
              <div className="space-y-2 text-[13px]">
                <p className="flex justify-between"><span className="text-[#8A8E99]">Campaign</span><span className="font-bold">{title || '—'}</span></p>
                <p className="flex justify-between"><span className="text-[#8A8E99]">Slot</span><span className="font-bold">{slotInfo?.label} ({slotInfo?.size})</span></p>
                <p className="flex justify-between"><span className="text-[#8A8E99]">Page</span><span className="font-bold">{pageLabel}</span></p>
                <p className="flex justify-between"><span className="text-[#8A8E99]">Duration</span><span className="font-bold">{duration} month{duration > 1 ? 's' : ''}</span></p>
                <p className="flex justify-between"><span className="text-[#8A8E99]">Start</span><span className="font-bold">{startDate ? new Date(startDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span></p>
                <p className="flex justify-between border-t border-white/10 pt-2 mt-2"><span className="text-[#8A8E99] font-black uppercase tracking-widest text-[11px] self-center">Total</span><span className="font-black text-[#C9922A] text-xl">R{totalCost.toLocaleString()}</span></p>
              </div>
            </div>

            <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
              <p className="text-[12px] text-[#8A8E99] leading-relaxed">
                Your ad enters our review queue. We check every submission against our advertising standards before approval — usually within 24 hours. <strong className="text-[#F0EDE8]">No payment is taken now.</strong> If approved, we'll email you an invoice and you'll have <strong className="text-[#F0EDE8]">24 hours to pay</strong> before the slot is released. A reminder is sent before the window closes.
              </p>
            </div>

            {/* POPIA-compliant consent — unticked by default, links to full policy */}
            <label className="flex items-start gap-3 cursor-pointer bg-[#13151A] border border-white/10 rounded-sm p-4 hover:border-[#C9922A]/30 transition-all">
              <input
                type="checkbox"
                checked={consented}
                onChange={e => setConsented(e.target.checked)}
                className="w-5 h-5 accent-[#C9922A] flex-shrink-0 mt-0.5"
              />
              <span className="text-[12px] text-[#8A8E99] leading-relaxed">
                I agree to the Gun X{' '}
                <Link href="/advertising-policy" target="_blank" className="text-[#C9922A] hover:brightness-125 underline">
                  Advertising Terms and Guidelines
                </Link>
                . I understand that ads are reviewed before going live, that payment is due within 24 hours of approval or the slot is released, and that ads which violate the policy may be removed.
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-6 py-4 rounded-sm hover:bg-white/5 transition-all">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit || submitting}
                className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting ? 'Submitting...' : 'Submit for Review →'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
