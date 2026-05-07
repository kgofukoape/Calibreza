'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const PROVINCES = [
  'Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape',
  'Free State','Limpopo','Mpumalanga','North West','Northern Cape',
];

const SERVICE_CATEGORIES = [
  {
    id: 'legal',
    label: '⚖️ Legal & Licensing',
    desc: 'Motivation writers, firearm lawyers, proficiency centres, FCA appeals',
    subcategories: [
      'Motivation Writer (S13/S15/S16)',
      'Firearm Lawyer / Legal Advisor',
      'Proficiency / Competency Centre',
      'Record Clearance / Expungement',
      'FCA Appeals Specialist',
      'Licence Renewal Assistance',
    ],
  },
  {
    id: 'gunsmith',
    label: '🔧 Gunsmithing & Customization',
    desc: 'Repairs, Cerakote, polymer work, optic cuts, trigger jobs',
    subcategories: [
      'Master Gunsmith / Repairs',
      'Cerakote & Finishing',
      'Polymer Customization (Stippling)',
      'Machining & Milling',
      'Optic Cuts / Slide Milling',
      'Trigger Jobs',
      'Barrel Threading',
      'Bluing & Restoration',
    ],
  },
  {
    id: 'training',
    label: '🎯 Training & Instruction',
    desc: 'Tactical, EDC, competition coaching, long-range, medical',
    subcategories: [
      'Tactical & EDC Training',
      'Competition Coaching (IPSC / IDPA)',
      'Long-Range / Precision Clinics',
      'Medical / Stop-the-Bleed',
      'Basic SAPS Competency Training',
      'Low-Light / Vehicle Defense',
      '3-Gun Coaching',
    ],
  },
  {
    id: 'logistics',
    label: '🔒 Logistics & Estate Management',
    desc: 'Licensed storage, deceased estate, valuators, couriers',
    subcategories: [
      'Licensed Storage Facility',
      'Deceased Estate Management',
      'Firearm Valuator / Appraiser',
      'Specialized Courier / Transport',
      'Insurance Appraisals',
    ],
  },
  {
    id: 'hunting',
    label: '🌿 Hunting & Field',
    desc: 'Professional hunters, outfitters, taxidermy, meat processing',
    subcategories: [
      'Professional Hunter (PH) & Outfitter',
      'Taxidermy',
      'Meat Processing / Slaghuis',
      'Guided Hunts',
      'Trophy Management',
    ],
  },
  {
    id: 'range',
    label: '🎯 Shooting Range',
    desc: 'Day passes, zeroing lanes, chronograph testing',
    subcategories: [
      'Indoor Range',
      'Outdoor Range',
      'Zeroing Lanes',
      'Chronograph Testing',
    ],
  },
  {
    id: 'other',
    label: '📋 Other',
    desc: "Anything firearm-related that doesn't fit above",
    subcategories: [],
  },
];

export default function ServiceApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = category, 2 = form
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: '',
    subcategory: '',
    description: '',
    contact_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    city: '',
    province: 'Gauteng',
    postal_code: '',
    specializations: [] as string[],
    service_area_note: '',
    years_experience: '',
    saps_accredited: false,
    accreditation_number: '',
  });

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const selectedCat = SERVICE_CATEGORIES.find(c => c.id === form.type);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
  };

  const toggleSpec = (s: string) => {
    setForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(s)
        ? prev.specializations.filter(x => x !== s)
        : [...prev.specializations, s],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let logo_url = '';
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `services/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('club-images').upload(fileName, logoFile, { upsert: true });
        if (!upErr) {
          logo_url = supabase.storage.from('club-images').getPublicUrl(fileName).data.publicUrl;
        }
      }

      const { error } = await supabase.from('services').insert({
        name: form.name,
        type: form.type,
        subcategory: form.subcategory,
        description: form.description,
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        website: form.website,
        address: form.address,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
        specializations: form.specializations,
        service_area_note: form.service_area_note,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        saps_accredited: form.saps_accredited,
        accreditation_number: form.accreditation_number,
        contact_name: form.contact_name,
        logo_url,
        status: 'pending',
        is_verified: false,
        is_featured: false,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50 transition-colors";
  const lbl = "block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2";
  const sec = "bg-[#13151A] border border-white/5 rounded-sm p-6 md:p-8 flex flex-col gap-5";

  // SUCCESS STATE
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-6">✅</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase mb-3">
              Listing <span className="text-[#C9922A]">Submitted!</span>
            </h1>
            <p className="text-[#8A8E99] mb-8">
              Your service listing has been received. Our team will review and activate it within 1–2 business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/services" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
                Browse Services
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

  // STEP 1 — CATEGORY PICKER
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="max-w-[860px] mx-auto w-full px-4 py-10 md:py-16">
          <div className="mb-2 text-[11px] text-[#8A8E99] tracking-widest uppercase flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-[#C9922A]">Services</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">List Your Service</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
            List Your <span className="text-[#C9922A]">Service</span>
          </h1>
          <p className="text-[#8A8E99] mb-8">First, select the category that best describes your service.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICE_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => { set('type', cat.id); setStep(2); }}
                className={`text-left p-5 rounded-sm border transition-all group ${
                  form.type === cat.id
                    ? 'border-[#C9922A] bg-[#C9922A]/10'
                    : 'border-white/10 bg-[#13151A] hover:border-[#C9922A]/40 hover:bg-[#C9922A]/5'
                }`}>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black text-[17px] uppercase mb-1">{cat.label}</p>
                <p className="text-[12px] text-[#8A8E99]">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // STEP 2 — FULL FORM
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <div className="max-w-[860px] mx-auto w-full px-4 py-10 md:py-16 flex flex-col gap-6">

        {/* Header */}
        <div>
          <div className="mb-2 text-[11px] text-[#8A8E99] tracking-widest uppercase flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-[#C9922A]">Services</Link>
            <span>/</span>
            <button onClick={() => setStep(1)} className="hover:text-[#C9922A]">Choose Category</button>
            <span>/</span>
            <span className="text-[#F0EDE8]">{selectedCat?.label}</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-1">
            List Your <span className="text-[#C9922A]">Service</span>
          </h1>
          <p className="text-[#8A8E99] text-[13px]">
            Category: <button onClick={() => setStep(1)} className="text-[#C9922A] font-bold hover:brightness-125">{selectedCat?.label} ↩ Change</button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* IDENTITY */}
          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Service <span className="text-[#C9922A]">Identity</span>
            </h2>

            {/* Logo */}
            <div>
              <label className={lbl}>Logo / Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                  {logoPreview
                    ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                    : <span className="text-3xl opacity-20">📷</span>}
                </div>
                <label className="cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-sm text-sm font-bold hover:bg-white/10 transition-all">
                  📷 Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={lbl}>Business / Service Name <span className="text-red-400">*</span></label>
                <input required value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="e.g. Cape Town Firearms Legal" />
              </div>

              {selectedCat && selectedCat.subcategories.length > 0 && (
                <div className="md:col-span-2">
                  <label className={lbl}>Specialization / Sub-Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedCat.subcategories.map(sub => (
                      <label key={sub} className={`flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-sm border text-[12px] transition-all ${
                        form.specializations.includes(sub)
                          ? 'border-[#C9922A]/50 bg-[#C9922A]/10 text-[#F0EDE8]'
                          : 'border-white/10 hover:border-white/20 text-[#8A8E99]'
                      }`}>
                        <input type="checkbox" className="accent-[#C9922A]" checked={form.specializations.includes(sub)} onChange={() => toggleSpec(sub)} />
                        {sub}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className={lbl}>Description <span className="text-red-400">*</span></label>
                <textarea required rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                  className={`${inp} resize-none`}
                  placeholder="Describe your service — what you offer, your experience, what sets you apart..." />
              </div>

              <div>
                <label className={lbl}>Years in Business</label>
                <input type="number" min="0" value={form.years_experience} onChange={e => set('years_experience', e.target.value)} className={inp} placeholder="e.g. 8" />
              </div>

              <div>
                <label className={lbl}>Service Area</label>
                <input value={form.service_area_note} onChange={e => set('service_area_note', e.target.value)} className={inp} placeholder="e.g. Nationwide · Cape Town & surrounds" />
              </div>
            </div>
          </div>

          {/* ACCREDITATION */}
          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Accreditation <span className="text-[#C9922A]">(Optional)</span>
            </h2>
            <label className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 hover:border-[#C9922A]/30 transition-colors">
              <input type="checkbox" className="accent-[#C9922A] w-4 h-4" checked={form.saps_accredited} onChange={e => set('saps_accredited', e.target.checked)} />
              <div>
                <p className="text-[13px] font-bold text-[#F0EDE8]">SAPS Accredited / Registered</p>
                <p className="text-[11px] text-[#8A8E99]">Tick if your service is officially recognised or registered with SAPS</p>
              </div>
            </label>
            {form.saps_accredited && (
              <div>
                <label className={lbl}>Accreditation / Registration Number</label>
                <input value={form.accreditation_number} onChange={e => set('accreditation_number', e.target.value)} className={inp} placeholder="e.g. WC/INSTR/2024/001" />
              </div>
            )}
          </div>

          {/* CONTACT */}
          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Contact <span className="text-[#C9922A]">Details</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Contact Person</label>
                <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className={inp} placeholder="Your name" />
              </div>
              <div>
                <label className={lbl}>Email Address <span className="text-red-400">*</span></label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} placeholder="you@example.co.za" />
              </div>
              <div>
                <label className={lbl}>Phone Number <span className="text-red-400">*</span></label>
                <input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} placeholder="011 234 5678" />
              </div>
              <div>
                <label className={lbl}>WhatsApp Number</label>
                <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={inp} placeholder="082 123 4567" />
              </div>
              <div className="md:col-span-2">
                <label className={lbl}>Website</label>
                <input type="url" value={form.website} onChange={e => set('website', e.target.value)} className={inp} placeholder="https://www.yoursite.co.za" />
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className={sec}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={lbl}>Physical Address</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} className={inp} placeholder="Street address (or 'Mobile / By appointment')" />
              </div>
              <div>
                <label className={lbl}>City / Town <span className="text-red-400">*</span></label>
                <input required value={form.city} onChange={e => set('city', e.target.value)} className={inp} placeholder="Cape Town" />
              </div>
              <div>
                <label className={lbl}>Province <span className="text-red-400">*</span></label>
                <select required value={form.province} onChange={e => set('province', e.target.value)} className={inp}>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Postal Code</label>
                <input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} className={inp} placeholder="8001" />
              </div>
            </div>
          </div>

          {/* NOTICE */}
          <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5">
            <p className="text-[13px] text-[#8A8E99] leading-relaxed">
              <strong className="text-[#C9922A]">⚠️ Note:</strong> Listings are reviewed by our team before going live. We may contact you to verify your credentials. All service providers must comply with the Firearms Control Act and applicable South African law.
            </p>
          </div>

          {/* SUBMIT */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={submitting}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Service Listing'}
            </button>
            <button type="button" onClick={() => router.push('/services')}
              className="sm:w-auto px-8 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
