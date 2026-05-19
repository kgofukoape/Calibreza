'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const ALL_DISCIPLINES = [
  'Pistol', 'Rifle', 'Shotgun', 'Long Range / Precision', 'Practical Shooting (IPSC/IDPA)',
  'Air Gun', 'Archery', 'Benchrest', 'Black Powder', 'Skeet / Trap', 'Field Shooting', 'Other',
];

const ALL_ASSOCIATIONS = [
  { code: 'SAPSA', full: 'South African Practical Shooting Association' },
  { code: 'SADPA', full: 'South African Defensive Pistol Association' },
  { code: 'NHSA', full: 'National Hunting & Shooting Association' },
  { code: 'NRPA', full: 'National Rifle & Pistol Association' },
  { code: 'SAIRO', full: 'SA Institute of Range Officers & Instructors' },
  { code: 'Natshoot', full: 'National Shooting Sport Foundation of SA' },
  { code: 'SAHGCA', full: 'SA Hunters & Game Conservation Association' },
  { code: 'CTSASA', full: 'Cape Town Sport & Target Shooting Association' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function RangeApplyInner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [shootDays, setShootDays] = useState([
    { day: '', discipline: '', time: '', fee: '', notes: '' }
  ]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    lat: '',
    lng: '',
    city: '',
    province: 'Gauteng',
    postal_code: '',
    facility_type: 'outdoor' as 'indoor' | 'outdoor' | 'both',
    lane_count: '',
    max_distance_m: '',
    covered_lanes: false,
    public_shoot_days: false,
    booking_required: false,
    range_officer_on_duty: false,
    range_fee: '',
    disciplines: [] as string[],
    associations: [] as string[],
    is_members_only: false,
    membership_fee: '',
  });

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleDiscipline = (d: string) =>
    set('disciplines', form.disciplines.includes(d)
      ? form.disciplines.filter(x => x !== d)
      : [...form.disciplines, d]);

  const toggleAssociation = (code: string) =>
    set('associations', form.associations.includes(code)
      ? form.associations.filter(x => x !== code)
      : [...form.associations, code]);

  const addShootDay = () =>
    setShootDays(prev => [...prev, { day: '', discipline: '', time: '', fee: '', notes: '' }]);

  const updateShootDay = (index: number, field: string, value: string) =>
    setShootDays(prev => prev.map((sd, i) => i === index ? { ...sd, [field]: value } : sd));

  const removeShootDay = (index: number) =>
    setShootDays(prev => prev.filter((_, i) => i !== index));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logo_url = '';
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `ranges/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('club-images').upload(fileName, logoFile, { upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('club-images').getPublicUrl(fileName);
          logo_url = publicUrl;
        }
      }

      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { error } = await supabase.from('clubs').insert({
        name: form.name,
        slug,
        description: form.description,
        email: form.email,
        phone: form.phone,
        website: form.website,
        address: form.address,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
        logo_url,
        disciplines: form.disciplines,
        associations: form.associations,
        shoot_days: shootDays.filter(sd => sd.day),
        range_fee: form.range_fee ? parseFloat(form.range_fee) : null,
        is_range: true,
        facility_type: form.facility_type,
        lane_count: form.lane_count ? parseInt(form.lane_count) : null,
        max_distance_m: form.max_distance_m ? parseInt(form.max_distance_m) : null,
        covered_lanes: form.covered_lanes,
        public_shoot_days: form.public_shoot_days,
        booking_required: form.booking_required,
        range_officer_on_duty: form.range_officer_on_duty,
        is_members_only: form.is_members_only,
        membership_fee: form.membership_fee ? parseFloat(form.membership_fee) : null,
        status: 'pending',
        is_verified: false,
      });

      if (error) throw error;

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
      alert(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50 transition-colors";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2";
  const sectionClass = "bg-[#13151A] border border-white/5 rounded-sm p-6 md:p-8 flex flex-col gap-5";

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase mb-3">
              Range <span className="text-[#C9922A]">Submitted!</span>
            </h1>
            <p className="text-[#8A8E99] mb-8">Your range application has been received. Our team will review and verify your listing within 1–2 business days.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/clubs" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
                View Ranges
              </Link>
              <Link href="/" className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:bg-white/5 transition-all">
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
      <div className="max-w-[860px] mx-auto w-full px-4 py-10 md:py-16 flex flex-col gap-6">

        <div>
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <Link href="/clubs" className="hover:text-[#C9922A]">Clubs & Ranges</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Register Range</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
            Register Your <span className="text-[#C9922A]">Shooting Range</span>
          </h1>
          <p className="text-[#8A8E99]">List your range in the Gun X directory and connect with shooters across South Africa.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Range Identity */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Range <span className="text-[#C9922A]">Identity</span>
            </h2>
            <div>
              <label className={labelClass}>Range Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                  {logoPreview
                    ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    : <span className="text-3xl opacity-20">🎯</span>}
                </div>
                <label className="cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-sm text-sm font-bold hover:bg-white/10 transition-all">
                  📷 Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Range Name <span className="text-red-400">*</span></label>
                <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                  className={inputClass} placeholder="e.g. Cape Point Shooting Range" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Description <span className="text-red-400">*</span></label>
                <textarea required rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="Describe your range — facilities, history, what shooters can expect..." />
              </div>
            </div>
          </div>

          {/* Range Facilities */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Range <span className="text-[#C9922A]">Facilities</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Facility Type <span className="text-red-400">*</span></label>
                <select required value={form.facility_type} onChange={e => set('facility_type', e.target.value)} className={inputClass}>
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                  <option value="both">Both Indoor & Outdoor</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Number of Lanes</label>
                <input type="number" min="1" value={form.lane_count} onChange={e => set('lane_count', e.target.value)}
                  className={inputClass} placeholder="e.g. 12" />
              </div>
              <div>
                <label className={labelClass}>Maximum Distance (metres)</label>
                <input type="number" min="1" value={form.max_distance_m} onChange={e => set('max_distance_m', e.target.value)}
                  className={inputClass} placeholder="e.g. 300" />
              </div>
              <div>
                <label className={labelClass}>Range Fee (R per session)</label>
                <input type="number" min="0" value={form.range_fee} onChange={e => set('range_fee', e.target.value)}
                  className={inputClass} placeholder="e.g. 150" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                ['covered_lanes', 'Covered Shooting Lanes'],
                ['booking_required', 'Booking Required'],
                ['range_officer_on_duty', 'Range Officer On Duty'],
                ['public_shoot_days', 'Hosts Public Shoot Days'],
                ['is_members_only', 'Members Only'],
              ].map(([field, label]) => (
                <label key={field} className="flex items-center gap-3 cursor-pointer group bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 hover:border-[#C9922A]/30 transition-colors">
                  <input type="checkbox" checked={(form as any)[field]} onChange={e => set(field, e.target.checked)} className="w-4 h-4 accent-[#C9922A]" />
                  <span className="text-[13px] text-[#F0EDE8]">{label}</span>
                </label>
              ))}
            </div>
            {form.is_members_only && (
              <div>
                <label className={labelClass}>Annual Membership Fee (R)</label>
                <input type="number" value={form.membership_fee} onChange={e => set('membership_fee', e.target.value)}
                  className={inputClass} placeholder="e.g. 1200" />
              </div>
            )}
          </div>

          {/* Disciplines */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Shooting <span className="text-[#C9922A]">Disciplines</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_DISCIPLINES.map(d => (
                <label key={d} className={`flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-sm border transition-all ${
                  form.disciplines.includes(d) ? 'border-[#C9922A]/50 bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'
                }`}>
                  <input type="checkbox" checked={form.disciplines.includes(d)} onChange={() => toggleDiscipline(d)} className="accent-[#C9922A]" />
                  <span className="text-[12px] text-[#F0EDE8]">{d}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Shoot Days */}
          {form.public_shoot_days && (
            <div className={sectionClass}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
                Public <span className="text-[#C9922A]">Shoot Days</span>
              </h2>
              <div className="flex flex-col gap-3">
                {shootDays.map((sd, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#0D0F13] border border-white/10 rounded-sm p-4">
                    <select value={sd.day} onChange={e => updateShootDay(i, 'day', e.target.value)} className={inputClass}>
                      <option value="">Day...</option>
                      {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <select value={sd.discipline} onChange={e => updateShootDay(i, 'discipline', e.target.value)} className={inputClass}>
                      <option value="">Discipline...</option>
                      {ALL_DISCIPLINES.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <input type="text" placeholder="Time (e.g. 08:00)" value={sd.time} onChange={e => updateShootDay(i, 'time', e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Fee (R)" value={sd.fee} onChange={e => updateShootDay(i, 'fee', e.target.value)} className={inputClass} />
                    <div className="flex gap-2">
                      <input type="text" placeholder="Notes" value={sd.notes} onChange={e => updateShootDay(i, 'notes', e.target.value)} className={`${inputClass} flex-1`} />
                      {shootDays.length > 1 && (
                        <button type="button" onClick={() => removeShootDay(i)} className="text-red-400 hover:text-red-300 px-2 font-bold">✕</button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addShootDay} className="text-[#C9922A] text-[12px] font-black uppercase tracking-widest hover:brightness-125 text-left">
                  + Add Shoot Day
                </button>
              </div>
            </div>
          )}

          {/* Associations */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Affiliated Associations <span className="text-[#8A8E99] text-base font-normal normal-case tracking-normal">(optional)</span>
            </h2>
            <div className="flex flex-col gap-2">
              {ALL_ASSOCIATIONS.map(a => (
                <label key={a.code} className={`flex items-start gap-3 cursor-pointer px-4 py-3 rounded-sm border transition-all ${
                  form.associations.includes(a.code) ? 'border-[#C9922A]/50 bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'
                }`}>
                  <input type="checkbox" checked={form.associations.includes(a.code)} onChange={() => toggleAssociation(a.code)} className="accent-[#C9922A] mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-[#F0EDE8]">{a.code}</p>
                    <p className="text-[11px] text-[#8A8E99]">{a.full}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Contact & Location */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Contact & <span className="text-[#C9922A]">Location</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Contact Name</label>
                <input type="text" value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                  className={inputClass} placeholder="Range Manager / Contact Person" />
              </div>
              <div>
                <label className={labelClass}>Email Address <span className="text-red-400">*</span></label>
                <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                  className={inputClass} placeholder="range@example.co.za" />
              </div>
              <div>
                <label className={labelClass}>Phone Number <span className="text-red-400">*</span></label>
                <input type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)}
                  className={inputClass} placeholder="011 555 1234" />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input type="text" value={form.website} onChange={e => set('website', e.target.value)}
                  className={inputClass} placeholder="www.yourrange.co.za" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Physical Address <span className="text-red-400">*</span></label>
                <input type="text" required value={form.address} onChange={e => set('address', e.target.value)}
                  className={inputClass} placeholder="Street address" />
              </div>
              <div>
                <label className={labelClass}>City / Town <span className="text-red-400">*</span></label>
                <input type="text" required value={form.city} onChange={e => set('city', e.target.value)}
                  className={inputClass} placeholder="Cape Town" />
              </div>
              <div>
                <label className={labelClass}>Province <span className="text-red-400">*</span></label>
                <select required value={form.province} onChange={e => set('province', e.target.value)} className={inputClass}>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Postal Code</label>
                <input type="text" value={form.postal_code} onChange={e => set('postal_code', e.target.value)}
                  className={inputClass} placeholder="8001" />
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5">
            <p className="text-[13px] text-[#8A8E99] leading-relaxed">
              <strong className="text-[#C9922A]">⚠️ Note:</strong> All ranges must comply with the Firearms Control Act (Act 60 of 2000) and applicable SAPS requirements. Submitting this form does not guarantee listing — our team will verify your range before approval.
            </p>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={loading}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Range Application'}
            </button>
            <button type="button" onClick={() => router.push('/clubs')}
              className="sm:w-auto px-8 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RangeApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RangeApplyInner />
    </Suspense>
  );
}
