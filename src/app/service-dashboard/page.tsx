'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const PROVINCES = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Free State','Limpopo','Mpumalanga','North West','Northern Cape'];

const SERVICE_TYPES = [
  { id: 'legal',    label: '⚖️ Legal & Licensing' },
  { id: 'gunsmith', label: '🔧 Gunsmithing & Customization' },
  { id: 'training', label: '🎯 Training & Instruction' },
  { id: 'logistics',label: '🔒 Logistics & Storage' },
  { id: 'hunting',  label: '🌿 Hunting & Field' },
  { id: 'range',    label: '🎯 Shooting Range' },
  { id: 'other',    label: '📋 Other' },
];

export default function ServiceDashboardPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [service, setService]   = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [form, setForm] = useState({
    name: '', type: '', description: '', contact_name: '',
    email: '', phone: '', whatsapp: '', website: '',
    address: '', city: '', province: 'Gauteng',
    service_area_note: '', years_experience: '',
    saps_accredited: false, accreditation_number: '',
  });

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase.from('services').select('*').eq('email', user.email).maybeSingle();
    if (data) {
      setService(data);
      setLogoPreview(data.logo_url || '');
      setForm({
        name: data.name || '', type: data.type || '',
        description: data.description || '', contact_name: data.contact_name || '',
        email: data.email || '', phone: data.phone || '',
        whatsapp: data.whatsapp || '', website: data.website || '',
        address: data.address || '', city: data.city || '', province: data.province || 'Gauteng',
        service_area_note: data.service_area_note || '',
        years_experience: data.years_experience?.toString() || '',
        saps_accredited: data.saps_accredited || false,
        accreditation_number: data.accreditation_number || '',
      });
    } else {
      // Pre-fill email from auth
      setForm(p => ({ ...p, email: user.email || '' }));
    }
    setLoading(false);
  };

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      let logo_url = service?.logo_url || '';
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `services/${service?.id || Date.now()}/logo.${ext}`;
        const { error: upErr } = await supabase.storage.from('club-images').upload(path, logoFile, { upsert: true });
        if (!upErr) logo_url = supabase.storage.from('club-images').getPublicUrl(path).data.publicUrl;
      }
      const payload = {
        name: form.name, type: form.type, description: form.description,
        contact_name: form.contact_name, email: form.email, phone: form.phone,
        whatsapp: form.whatsapp, website: form.website, address: form.address,
        city: form.city, province: form.province, service_area_note: form.service_area_note,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        saps_accredited: form.saps_accredited, accreditation_number: form.accreditation_number,
        logo_url,
      };
      if (service) {
        await supabase.from('services').update(payload).eq('id', service.id);
        setService({ ...service, ...payload });
        setSaveMsg('✓ Profile updated');
      } else {
        const { data, error } = await supabase.from('services').insert({ ...payload, status: 'pending' }).select().single();
        if (error) throw error;
        setService(data);
        setSaveMsg('✓ Listing submitted — our team will review within 48 hours');
      }
    } catch (err: any) {
      setSaveMsg('✗ ' + (err.message || 'Save failed'));
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 5000);
    }
  };

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50 placeholder-[#8A8E99]/50";
  const lbl = "block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2";
  const sec = "bg-[#13151A] border border-white/5 rounded-sm p-6 flex flex-col gap-5";

  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[240px] bg-[#0A0C10] border-r border-white/5 flex flex-col flex-shrink-0 min-h-screen">
        <div className="p-5 border-b border-white/5">
          <Link href="/"><span style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="text-2xl font-black uppercase">GUN <span className="text-[#C9922A]">X</span></span></Link>
          <p className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">Service Provider</p>
        </div>
        <div className="p-4 border-b border-white/5">
          <div className="w-12 h-12 rounded-sm overflow-hidden bg-[#C9922A]/10 border border-[#C9922A]/20 flex items-center justify-center mb-2">
            {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🔧</span>}
          </div>
          <p className="font-black text-[12px] truncate">{form.name || 'Your Service'}</p>
          <span className={`mt-1 inline-block px-1.5 py-0.5 text-[8px] font-black uppercase rounded-sm ${
            service?.status === 'active'  ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
            service?.status === 'pending' ? 'bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A]' :
            'bg-white/5 border border-white/10 text-[#8A8E99]'
          }`}>{service?.status || 'Not Listed'}</span>
        </div>
        <nav className="flex-1 p-2">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A]">
            <span>📋</span> My Listing
          </div>
        </nav>
        <div className="p-3 border-t border-white/5 space-y-2">
          <Link href="/services" className="block text-center px-3 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-[11px] font-black uppercase tracking-widest">View Directory ↗</Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="w-full text-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-[11px] font-black uppercase tracking-widest">
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-[#0A0C10] border-b border-white/5 px-8 py-5 sticky top-0 z-10">
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="text-3xl font-black uppercase">
            {service ? 'Edit' : 'Create'} <span className="text-[#C9922A]">Your Listing</span>
          </h1>
          <p className="text-[#8A8E99] text-[12px] mt-0.5">
            {service
              ? `${SERVICE_TYPES.find(t => t.id === service.type)?.label || 'Service'} · ${service.city}`
              : 'Get listed in the Gun X Services directory — free to join'}
          </p>
        </header>

        <form onSubmit={handleSave}>
          <div className="p-8 space-y-6 max-w-3xl">

            {/* Status banner */}
            {service && (
              <div className={`rounded-sm p-4 border ${
                service.status === 'active'  ? 'bg-[#2A9C6E]/5 border-[#2A9C6E]/30 text-[#2A9C6E]' :
                service.status === 'pending' ? 'bg-[#C9922A]/5 border-[#C9922A]/30 text-[#C9922A]' :
                'bg-red-500/5 border-red-500/20 text-red-400'
              }`}>
                <p className="font-black text-[12px] uppercase tracking-widest">
                  {service.status === 'active'  ? '✓ Active — Visible on directory' :
                   service.status === 'pending' ? '⏳ Under Review — Live within 48 hours' :
                   '✕ Inactive — Contact support'}
                </p>
              </div>
            )}

            {/* Logo */}
            <div className={sec}>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="text-xl font-black uppercase pb-3 border-b border-white/5">Logo</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                  {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl opacity-20">📷</span>}
                </div>
                <label className="cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-sm text-sm font-bold hover:bg-white/10 transition-all">
                  📷 Upload Logo
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }}} className="hidden" />
                </label>
              </div>
            </div>

            {/* Identity */}
            <div className={sec}>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="text-xl font-black uppercase pb-3 border-b border-white/5">
                Service <span className="text-[#C9922A]">Identity</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className={lbl}>Service / Business Name *</label><input required value={form.name} onChange={e => set('name', e.target.value)} className={inp} placeholder="e.g. Cape Town Firearms Legal" /></div>
                <div><label className={lbl}>Category *</label>
                  <select required value={form.type} onChange={e => set('type', e.target.value)} className={inp}>
                    <option value="">Select category...</option>
                    {SERVICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div><label className={lbl}>Years in Business</label><input type="number" min="0" value={form.years_experience} onChange={e => set('years_experience', e.target.value)} className={inp} placeholder="e.g. 8" /></div>
                <div className="md:col-span-2"><label className={lbl}>Description *</label><textarea required rows={4} value={form.description} onChange={e => set('description', e.target.value)} className={`${inp} resize-none`} placeholder="What you offer, your experience, what sets you apart..." /></div>
                <div className="md:col-span-2"><label className={lbl}>Service Area</label><input value={form.service_area_note} onChange={e => set('service_area_note', e.target.value)} className={inp} placeholder="e.g. Nationwide · Cape Town & surrounds" /></div>
              </div>
            </div>

            {/* Accreditation */}
            <div className={sec}>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="text-xl font-black uppercase pb-3 border-b border-white/5">Accreditation</h2>
              <label className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 hover:border-[#C9922A]/30">
                <input type="checkbox" className="accent-[#C9922A] w-4 h-4" checked={form.saps_accredited} onChange={e => set('saps_accredited', e.target.checked)} />
                <div><p className="text-[13px] font-bold">SAPS Accredited / Registered</p><p className="text-[11px] text-[#8A8E99]">Officially recognised or registered with SAPS</p></div>
              </label>
              {form.saps_accredited && (
                <div><label className={lbl}>Accreditation Number</label><input value={form.accreditation_number} onChange={e => set('accreditation_number', e.target.value)} className={inp} placeholder="e.g. WC/INSTR/2024/001" /></div>
              )}
            </div>

            {/* Contact */}
            <div className={sec}>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="text-xl font-black uppercase pb-3 border-b border-white/5">
                Contact <span className="text-[#C9922A]">Details</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={lbl}>Contact Person</label><input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className={inp} placeholder="Your name" /></div>
                <div><label className={lbl}>Email *</label><input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} placeholder="you@example.co.za" /></div>
                <div><label className={lbl}>Phone *</label><input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} placeholder="011 234 5678" /></div>
                <div><label className={lbl}>WhatsApp</label><input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className={inp} placeholder="082 123 4567" /></div>
                <div className="md:col-span-2"><label className={lbl}>Website</label><input type="url" value={form.website} onChange={e => set('website', e.target.value)} className={inp} placeholder="https://yoursite.co.za" /></div>
              </div>
            </div>

            {/* Location */}
            <div className={sec}>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif" }} className="text-xl font-black uppercase pb-3 border-b border-white/5">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className={lbl}>Physical Address</label><input value={form.address} onChange={e => set('address', e.target.value)} className={inp} placeholder="Street address (or 'Mobile / By appointment')" /></div>
                <div><label className={lbl}>City / Town *</label><input required value={form.city} onChange={e => set('city', e.target.value)} className={inp} placeholder="Cape Town" /></div>
                <div><label className={lbl}>Province *</label><select required value={form.province} onChange={e => set('province', e.target.value)} className={inp}>{PROVINCES.map(p => <option key={p}>{p}</option>)}</select></div>
              </div>
            </div>

            {saveMsg && (
              <div className={`p-4 rounded-sm border text-[13px] font-bold ${saveMsg.startsWith('✓') ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {saveMsg}
              </div>
            )}

            <div className="flex gap-3 pb-8">
              <button type="submit" disabled={saving} style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
                className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 disabled:opacity-50">
                {saving ? 'Saving...' : service ? 'Save Changes' : 'Submit for Review'}
              </button>
              <Link href="/services" className="px-6 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 text-center">
                View Directory
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
