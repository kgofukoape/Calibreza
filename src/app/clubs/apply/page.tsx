'use client';
 
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { recordConsent } from '@/lib/auth';
import { LEGAL_DOCUMENTS } from '@/lib/legal';

// ─── CLUB APPLICATION ────────────────────────────────────────────────────────
// Previously anonymous, which caused three faults:
//   1. clubs.user_id was never set, so /business/login and /club-dashboard —
//      both of which look the club up by user_id — could never find it. Every
//      club that applied was locked out of its own dashboard.
//   2. status was inserted as 'active', meaning a club went live on the public
//      directory the moment it applied, with no review at all. Ranges used
//      'pending' correctly, so the two disagreed with each other.
//   3. Nothing was shown or recorded about the terms being accepted.

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const ALL_DISCIPLINES = [
  'IPSC', 'IDPA', 'Practical Shooting', 'Target Shooting', 'Hunting',
  'Long Range', 'Skeet', 'Trap', 'Air Gun', 'Airsoft', 'Benchrest', 'Field Shooting',
];

const ALL_ASSOCIATIONS = [
  { code: 'SAPSA', name: 'SAPSA', full: 'South African Practical Shooting Association — IPSC governing body' },
  { code: 'SADPA', name: 'SADPA', full: 'South African Defensive Pistol Association' },
  { code: 'NHSA', name: 'NHSA', full: 'National Hunting & Shooting Association' },
  { code: 'NRPA', name: 'NRPA', full: 'National Rifle & Pistol Association' },
  { code: 'SAIRO', name: 'SAIRO', full: 'SA Institute of Range Officers & Instructors' },
  { code: 'Natshoot', name: 'Natshoot', full: 'National Shooting Sport Foundation of SA' },
  { code: 'GOSA', name: 'GOSA', full: 'Gun Owners of South Africa' },
  { code: 'SAHGCA', name: 'SAHGCA', full: 'SA Hunters & Game Conservation Association' },
  { code: 'CTSASA', name: 'CTSASA', full: 'Cape Town Sport & Target Shooting Association' },
  { code: 'SABU', name: 'SABU', full: 'South African Biathlon Union' },
  { code: 'SASSETA', name: 'SASSETA', full: 'Safety & Security Sector Education & Training Authority' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function ClubApplyInner() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPersonalAccount, setIsPersonalAccount] = useState(false);
  const [existingApplication, setExistingApplication] = useState<string | null>(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acknowledgePrivacy, setAcknowledgePrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const [shootDays, setShootDays] = useState([
    { day: '', discipline: '', time: '', fee: '', notes: '' }
  ]);

  const [form, setForm] = useState({
    name: '',
    responsible_person: '',
    responsible_person_email: '',
    description: '',
    province: '',
    city: '',
    address: '',
    lat: '',
    lng: '',
    phone: '',
    email: '',
    website: '',
    membership_fee: '',
    range_fee: '',
    disciplines: [] as string[],
    associations: [] as string[],
  });

  // ── Auth gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('users').select('account_type').eq('id', user.id).maybeSingle();

        if (profile?.account_type === 'personal') {
          setIsPersonalAccount(true);
          setCheckingAuth(false);
          return;
        }

        setUserId(user.id);

        // One business account holds one club. The login lookup uses
        // maybeSingle(), which a second row would break.
        const { data: existing } = await supabase
          .from('clubs').select('status').eq('user_id', user.id).maybeSingle();
        if (existing) setExistingApplication(existing.status);

        const meta = user.user_metadata || {};
        setForm(prev => ({
          ...prev,
          email: prev.email || user.email || '',
          responsible_person: meta.responsible_person || '',
          responsible_person_email: meta.responsible_person_email || '',
        }));
      }

      setCheckingAuth(false);
    };
    check();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleDiscipline = (d: string) => {
    setForm(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(d) ? prev.disciplines.filter(x => x !== d) : [...prev.disciplines, d]
    }));
  };

  const toggleAssociation = (code: string) => {
    setForm(prev => ({
      ...prev,
      associations: prev.associations.includes(code) ? prev.associations.filter(x => x !== code) : [...prev.associations, code]
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - galleryFiles.length;
    const toAdd = files.slice(0, remaining);
    setGalleryFiles(prev => [...prev, ...toAdd]);
    setGalleryPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
  };

  const removeGallery = (idx: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== idx));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const updateShootDay = (idx: number, field: string, value: string) => {
    setShootDays(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const addShootDay = () => {
    setShootDays(prev => [...prev, { day: '', discipline: '', time: '', fee: '', notes: '' }]);
  };

  const removeShootDay = (idx: number) => {
    setShootDays(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadFile = async (file: File, path: string) => {
    const ext = file.name.split('.').pop();
    const filePath = `${path}/${Math.random()}.${ext}`;
    const { error } = await supabase.storage.from('club-images').upload(filePath, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('club-images').getPublicUrl(filePath);
    return publicUrl;
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.province || !form.city || !form.email) {
      alert('Please fill in all required fields.');
      return;
    }
    if (!userId) {
      alert('Your session has expired. Please sign in again.');
      return;
    }
    if (!acceptedTerms || !acknowledgePrivacy) {
      alert('Please accept the Terms of Use and confirm you have read the Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      let logo_url = '';
      let cover_url = '';
      const imageUrls: string[] = [];

      if (logoFile) logo_url = await uploadFile(logoFile, 'logos');
      if (coverFile) cover_url = await uploadFile(coverFile, 'covers');
      for (const f of galleryFiles) {
        const url = await uploadFile(f, 'gallery');
        imageUrls.push(url);
      }

      const slug = generateSlug(form.name);
      const validShootDays = shootDays.filter(d => d.day);

      const { error } = await supabase.from('clubs').insert({
        user_id: userId,
        name: form.name,
        slug,
        facility_type: 'club',
        responsible_person: form.responsible_person,
        responsible_person_email: form.responsible_person_email,
        description: form.description,
        province: form.province,
        city: form.city,
        address: form.address,
        phone: form.phone,
        email: form.email,
        website: form.website,
        logo_url,
        cover_url,
        images: imageUrls,
        shoot_days: validShootDays,
        membership_fee: form.membership_fee ? parseFloat(form.membership_fee) : null,
        range_fee: form.range_fee ? parseFloat(form.range_fee) : null,
        disciplines: form.disciplines,
        associations: form.associations,
        // 'pending' until reviewed. Inserting 'active' published the club to
        // the public directory instantly, with no verification of anything.
        status: 'pending',
        is_verified: false,
      });

      if (error) throw error;

      // ── Record what was agreed to ────────────────────────────────────────
      const consentRecorded = await recordConsent('club_application', false, form.name);
      if (!consentRecorded) {
        console.error('[clubs/apply] consent record was not written for', form.name);
      }

      // ── Notify admin ─────────────────────────────────────────────────────
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type:     'club_applied',
            name:     form.name,
            city:     form.city,
            province: form.province,
            email:    form.email,
          }),
        });
      } catch (notifyErr) {
        console.error('Notify failed (non-blocking):', notifyErr);
      }
      // ─────────────────────────────────────────────────────────────────────

      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 transition-colors";
  const labelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";
  const sectionClass = "bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6";

  // ── Gate screens ───────────────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
        </div>
      </div>
    );
  }

  if (!userId && !isPersonalAccount) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-[560px] w-full bg-[#13151A] border border-white/5 rounded-sm p-10 text-center">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase mb-4">
              Business <span className="text-[#C9922A]">Account</span> Needed
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-4">
              A club listing is owned by a business account, not by a person. That account is the
              login your committee members share to manage shoot days, results and your listing.
            </p>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              If you are also a club member who buys and sells, keep your own personal Gun X
              account as well. The two are separate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/business/register"
                className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-4 rounded-sm hover:brightness-110 transition-all">
                Register Business
              </Link>
              <Link href="/business/login"
                className="flex-1 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-6 py-4 rounded-sm hover:bg-white/5 transition-all">
                Business Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPersonalAccount) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-[560px] w-full bg-[#13151A] border border-white/5 rounded-sm p-10 text-center">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase mb-4">
              That&apos;s a <span className="text-[#C9922A]">Personal</span> Account
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              You are signed in with a personal account. A club listing needs its own business
              account so the club — not one member — owns it.
            </p>
            <Link href="/business/register"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:brightness-110 transition-all">
              Register a Club Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-[560px] w-full bg-[#13151A] border border-white/5 rounded-sm p-10 text-center">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase mb-4">
              Application <span className="text-[#C9922A]">{existingApplication}</span>
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              This account already has a club on file. If something needs correcting, email{' '}
              <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-110">support@gunx.co.za</a>.
            </p>
            <Link href="/business/login"
              className="inline-block border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:bg-white/5 transition-all">
              Business Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-3">
              Application <span className="text-[#C9922A]">Submitted!</span>
            </h1>
            <p className="text-[#8A8E99] mb-3">Your club application is with our team for review.</p>
            <p className="text-[#8A8E99] text-sm mb-8">We review applications within 2–3 business days. Once approved, sign in with this same account to reach your club dashboard.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/clubs" className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:brightness-110 transition-all text-center">
                View All Clubs
              </Link>
              <Link href="/" className="flex-1 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-6 py-6 md:py-10">

        <div className="mb-6">
          <div className="text-[11px] text-[#8A8E99] uppercase tracking-widest mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <Link href="/clubs" className="hover:text-[#C9922A]">Clubs</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">List Your Club</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase mb-1">
            List Your <span className="text-[#C9922A]">Club</span>
          </h1>
          <p className="text-[13px] text-[#8A8E99]">Get your club discovered by thousands of shooters across South Africa — free listing</p>
          <div className="mt-4 p-4 bg-[#13151A] border border-white/5 rounded-sm flex items-center justify-between">
            <p className="text-[13px] text-[#8A8E99]">Registering a shooting range instead?</p>
            <Link href="/clubs/range-apply" className="text-[#C9922A] font-black uppercase tracking-widest text-[11px] hover:brightness-125 transition-all">
              Range Application →
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Basic Info */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Club Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Club Name <span className="text-red-400">*</span></label>
                <input name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="e.g., Cape Town Practical Shooting Club" />
              </div>

              <div>
                <label className={labelClass}>Person Responsible <span className="text-red-400">*</span></label>
                <input name="responsible_person" value={form.responsible_person} onChange={handleChange} required className={inputClass} placeholder="Full name" />
                <p className="text-[11px] text-[#8A8E99] mt-1.5">Accountable for this account and authorised to accept our terms for the club.</p>
              </div>

              <div>
                <label className={labelClass}>Their Email <span className="text-red-400">*</span></label>
                <input type="email" name="responsible_person_email" value={form.responsible_person_email} onChange={handleChange} required className={inputClass} placeholder="chairman@yourclub.co.za" />
                <p className="text-[11px] text-[#8A8E99] mt-1.5">For notices about this account. Not published.</p>
              </div>
              <div>
                <label className={labelClass}>Province <span className="text-red-400">*</span></label>
                <select name="province" value={form.province} onChange={handleChange} required className={inputClass}>
                  <option value="">Select province...</option>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>City / Town <span className="text-red-400">*</span></label>
                <input name="city" value={form.city} onChange={handleChange} required className={inputClass} placeholder="e.g., Cape Town" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Physical Address</label>
                <AddressAutocomplete
                  value={form.address}
                  onChange={val => setForm(prev => ({ ...prev, address: val }))}
                  onSelect={({ address, lat, lng, city, province }) => setForm(prev => ({
                    ...prev,
                    address,
                    lat: lat.toString(),
                    lng: lng.toString(),
                    city: city || prev.city,
                    province: province || prev.province,
                  }))}
                  label="Address"
                  placeholder="Start typing your club address..."
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>About Your Club</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                  className={`${inputClass} resize-none`} placeholder="Tell shooters about your club, history, facilities, what makes you unique..." />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="e.g., 021 555 1234" />
              </div>
              <div>
                <label className={labelClass}>Email Address <span className="text-red-400">*</span></label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} placeholder="info@yourclub.co.za" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Website (optional)</label>
                <input name="website" value={form.website} onChange={handleChange} className={inputClass} placeholder="https://yourclub.co.za" />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Photos & Branding
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={labelClass}>Club Logo</label>
                <label className="block cursor-pointer">
                  <div className={`h-[120px] border-2 border-dashed rounded-sm flex items-center justify-center overflow-hidden transition-colors ${logoPreview ? 'border-[#C9922A]/50' : 'border-white/20 hover:border-[#C9922A]/40'}`}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <p className="text-2xl mb-1">🏆</p>
                        <p className="text-[11px] text-[#8A8E99] font-bold uppercase tracking-widest">Upload Logo</p>
                        <p className="text-[10px] text-[#8A8E99]/60">PNG, JPG recommended</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
              <div>
                <label className={labelClass}>Cover Photo <span className="text-[#8A8E99] normal-case font-normal">(Facebook/X style banner)</span></label>
                <label className="block cursor-pointer">
                  <div className={`h-[120px] border-2 border-dashed rounded-sm flex items-center justify-center overflow-hidden transition-colors ${coverPreview ? 'border-[#C9922A]/50' : 'border-white/20 hover:border-[#C9922A]/40'}`}>
                    {coverPreview ? (
                      <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <p className="text-2xl mb-1">🖼️</p>
                        <p className="text-[11px] text-[#8A8E99] font-bold uppercase tracking-widest">Upload Cover</p>
                        <p className="text-[10px] text-[#8A8E99]/60">Wide banner image works best</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <label className={labelClass}>Gallery Photos <span className="text-[#8A8E99] normal-case font-normal">(max 10)</span></label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {galleryPreviews.map((url, idx) => (
                  <div key={idx} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeGallery(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600">×</button>
                  </div>
                ))}
                {galleryFiles.length < 10 && (
                  <label className="aspect-square bg-[#0D0F13] border-2 border-dashed border-white/20 rounded-sm flex items-center justify-center cursor-pointer hover:border-[#C9922A]/40 transition-colors">
                    <div className="text-center">
                      <span className="text-xl text-[#8A8E99]">+</span>
                      <p className="text-[8px] text-[#8A8E99] mt-0.5">{galleryFiles.length}/10</p>
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Disciplines */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Disciplines
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {ALL_DISCIPLINES.map(d => (
                <label key={d} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-sm border transition-all ${
                  form.disciplines.includes(d) ? 'border-[#C9922A]/50 bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'
                }`}>
                  <input type="checkbox" checked={form.disciplines.includes(d)} onChange={() => toggleDiscipline(d)} className="accent-[#C9922A]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[#F0EDE8]">{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Associations */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-1">
              Affiliated Associations
            </h2>
            <p className="text-[12px] text-[#8A8E99] mb-4">Select all associations your club is affiliated with</p>
            <div className="flex flex-col gap-2">
              {ALL_ASSOCIATIONS.map(a => (
                <label key={a.code} className={`flex items-start gap-3 cursor-pointer p-3 rounded-sm border transition-all ${
                  form.associations.includes(a.code) ? 'border-[#C9922A]/50 bg-[#C9922A]/5' : 'border-white/10 hover:border-white/20'
                }`}>
                  <input type="checkbox" checked={form.associations.includes(a.code)} onChange={() => toggleAssociation(a.code)}
                    className="accent-[#C9922A] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-[13px] font-black uppercase tracking-wider text-[#F0EDE8]">{a.name}</span>
                    <span className="text-[11px] text-[#8A8E99] ml-2">{a.full}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Shoot Days */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest">Shoot Days</h2>
              <button type="button" onClick={addShootDay} className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">
                + Add Day
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {shootDays.map((sd, idx) => (
                <div key={idx} className="bg-[#0D0F13] border border-white/10 rounded-sm p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className={labelClass}>Day</label>
                      <select value={sd.day} onChange={e => updateShootDay(idx, 'day', e.target.value)} className={inputClass}>
                        <option value="">Select day...</option>
                        {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Discipline</label>
                      <input value={sd.discipline} onChange={e => updateShootDay(idx, 'discipline', e.target.value)} className={inputClass} placeholder="e.g., IPSC" />
                    </div>
                    <div>
                      <label className={labelClass}>Time</label>
                      <input value={sd.time} onChange={e => updateShootDay(idx, 'time', e.target.value)} className={inputClass} placeholder="e.g., 08:00 – 13:00" />
                    </div>
                    <div>
                      <label className={labelClass}>Range Fee (R)</label>
                      <input type="number" value={sd.fee} onChange={e => updateShootDay(idx, 'fee', e.target.value)} className={inputClass} placeholder="150" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Notes</label>
                      <input value={sd.notes} onChange={e => updateShootDay(idx, 'notes', e.target.value)} className={inputClass} placeholder="e.g., Members only, pre-registration required" />
                    </div>
                  </div>
                  {shootDays.length > 1 && (
                    <button type="button" onClick={() => removeShootDay(idx)} className="text-[11px] text-red-400 font-bold uppercase tracking-widest hover:text-red-300">
                      Remove this day
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fees */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Membership & Fees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Annual Membership Fee (R)</label>
                <input type="number" name="membership_fee" value={form.membership_fee} onChange={handleChange} className={inputClass} placeholder="e.g., 1500" />
              </div>
              <div>
                <label className={labelClass}>Standard Range Fee per Session (R)</label>
                <input type="number" name="range_fee" value={form.range_fee} onChange={handleChange} className={inputClass} placeholder="e.g., 150" />
              </div>
            </div>
          </div>

          {/* Agreements */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-xl font-black uppercase text-[#C9922A] mb-4">
              Agreements
            </h2>
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                  className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#C9922A] cursor-pointer" />
                <span className="text-[13px] text-[#8A8E99] leading-relaxed">
                  I agree to the{' '}
                  <Link href={LEGAL_DOCUMENTS.terms.href} target="_blank" className="text-[#C9922A] hover:brightness-110">Terms of Use</Link>{' '}
                  and I am authorised to accept them on behalf of this club <span className="text-red-400">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acknowledgePrivacy} onChange={e => setAcknowledgePrivacy(e.target.checked)}
                  className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#C9922A] cursor-pointer" />
                <span className="text-[13px] text-[#8A8E99] leading-relaxed">
                  I have read the{' '}
                  <Link href={LEGAL_DOCUMENTS.privacy.href} target="_blank" className="text-[#C9922A] hover:brightness-110">Privacy Policy</Link>{' '}
                  and{' '}
                  <Link href={LEGAL_DOCUMENTS.popi.href} target="_blank" className="text-[#C9922A] hover:brightness-110">POPI Act Notice</Link>{' '}
                  <span className="text-red-400">*</span>
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={loading || !acceptedTerms || !acknowledgePrivacy}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Submitting...' : 'Submit Club Application'}
            </button>
            <Link href="/clubs" className="sm:w-auto px-8 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 transition-all text-center">
              Cancel
            </Link>
          </div>

          <p className="text-[12px] text-[#8A8E99] text-center">
            Free listing · Verified badge awarded after our team reviews your submission (48hrs)
          </p>
        </form>
      </main>
    </div>
  );
}

export default function ClubApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ClubApplyInner />
    </Suspense>
  );
}