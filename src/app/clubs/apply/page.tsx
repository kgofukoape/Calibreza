'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

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

export default function ClubApplyPage() {
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
    description: '',
    province: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    membership_fee: '',
    range_fee: '',
    disciplines: [] as string[],
    associations: [] as string[],
  });

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
        name: form.name,
        slug,
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
        status: 'active',
        is_verified: false,
      });

      if (error) throw error;
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-3">
              Club <span className="text-[#C9922A]">Listed!</span>
            </h1>
            <p className="text-[#8A8E99] mb-3">Your club is now live on Gun X.</p>
            <p className="text-[#8A8E99] text-sm mb-8">Our team will verify your details within 48 hours to award a verified badge.</p>
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

        {/* Header */}
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
                <input name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Street address or GPS coordinates" />
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
              {/* Logo */}
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

              {/* Cover Photo */}
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

            {/* Gallery */}
            <div>
              <label className={labelClass}>Gallery Photos <span className="text-[#8A8E99] normal-case font-normal">(max 10)</span></label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {galleryPreviews.map((url, idx) => (
                  <div key={idx} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeGallery(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600">
                      ×
                    </button>
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

          {/* Associations — UPDATED */}
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
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest">
                Shoot Days
              </h2>
              <button type="button" onClick={addShootDay}
                className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">
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
                      <input value={sd.discipline} onChange={e => updateShootDay(idx, 'discipline', e.target.value)}
                        className={inputClass} placeholder="e.g., IPSC" />
                    </div>
                    <div>
                      <label className={labelClass}>Time</label>
                      <input value={sd.time} onChange={e => updateShootDay(idx, 'time', e.target.value)}
                        className={inputClass} placeholder="e.g., 08:00 – 13:00" />
                    </div>
                    <div>
                      <label className={labelClass}>Range Fee (R)</label>
                      <input type="number" value={sd.fee} onChange={e => updateShootDay(idx, 'fee', e.target.value)}
                        className={inputClass} placeholder="150" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Notes</label>
                      <input value={sd.notes} onChange={e => updateShootDay(idx, 'notes', e.target.value)}
                        className={inputClass} placeholder="e.g., Members only, pre-registration required" />
                    </div>
                  </div>
                  {shootDays.length > 1 && (
                    <button type="button" onClick={() => removeShootDay(idx)}
                      className="text-[11px] text-red-400 font-bold uppercase tracking-widest hover:text-red-300">
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
                <input type="number" name="membership_fee" value={form.membership_fee} onChange={handleChange}
                  className={inputClass} placeholder="e.g., 1500" />
              </div>
              <div>
                <label className={labelClass}>Standard Range Fee per Session (R)</label>
                <input type="number" name="range_fee" value={form.range_fee} onChange={handleChange}
                  className={inputClass} placeholder="e.g., 150" />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={loading}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Submitting...' : 'List My Club — Free'}
            </button>
            <Link href="/clubs"
              className="sm:w-auto px-8 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 transition-all text-center">
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