'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin', icon: '⚡', label: 'Overview' },
  { href: '/admin/dealers', icon: '🏪', label: 'Dealers' },
  { href: '/admin/clubs', icon: '⊕', label: 'Clubs' },
  { href: '/admin/listings', icon: '📋', label: 'Listings' },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { href: '/admin/ads', icon: '📢', label: 'Ad Manager', active: true },
  { href: '/admin/crm', icon: '💰', label: 'CRM' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
];

const AD_SLOTS = [
  { id: 'leaderboard_top', label: 'Leaderboard Top', size: '970×90', pages: ['all pages'] },
  { id: 'sidebar_left', label: 'Sidebar Left', size: '160×600', pages: ['browse', 'listings', 'dealers'] },
  { id: 'sidebar_right', label: 'Sidebar Right', size: '160×600', pages: ['browse', 'listings', 'dealers'] },
  { id: 'leaderboard_mid', label: 'Leaderboard Mid', size: '728×90', pages: ['homepage'] },
  { id: 'square_card', label: 'Square Card', size: '300×250', pages: ['sidebar', 'mobile'] },
];

const PAGE_OPTIONS = ['all', 'home', 'browse', 'listings', 'dealers', 'clubs', 'services', 'jobs', 'wanted'];

const AD_FORMATS = {
  image: { label: 'Static Image', accept: 'image/jpeg,image/png,image/webp', tip: 'JPG/PNG/WebP — max 2MB. Best: 72dpi, sRGB colour space.' },
  gif: { label: 'Animated GIF', accept: 'image/gif', tip: 'GIF — max 5MB. Keep under 15 seconds. No audio.' },
  video: { label: 'Video', accept: 'video/mp4,video/webm', tip: 'MP4/WebM — max 20MB. H.264 codec. No audio for autoplay. Max 30 seconds.' },
};

const EMPTY_FORM = {
  client_name: '', client_email: '', client_phone: '', client_company: '',
  title: '', slot: 'leaderboard_top', page: 'all', ad_type: 'image',
  click_url: '', starts_at: '', expires_at: '', rate_per_day: '', amount_paid: '',
  invoice_number: '', notes: '',
};

export default function AdManagerPage() {
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    setAds(data || []);
    setLoading(false);
    checkExpiring(data || []);
  };

  const checkExpiring = (adList: any[]) => {
    const soon = new Date(Date.now() + 3 * 86400000); // 3 days
    const expiring = adList.filter(a =>
      a.status === 'active' &&
      !a.expiry_notified &&
      new Date(a.expires_at) < soon &&
      new Date(a.expires_at) > new Date()
    );
    if (expiring.length > 0) {
      expiring.forEach(async (ad) => {
        // Mark as notified (in real app, also send email here)
        await supabase.from('ads').update({ expiry_notified: true }).eq('id', ad.id);
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !selectedAd?.file_url) { setError('Please upload an ad file.'); return; }
    setSaving(true); setError(''); setSuccess('');

    let fileUrl = selectedAd?.file_url || '';

    if (file) {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const path = `ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('images').upload(path, file);
      if (upErr) { setError('Upload failed: ' + upErr.message); setSaving(false); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      fileUrl = publicUrl;
      setUploading(false);
    }

    const payload = {
      client_name: form.client_name,
      client_email: form.client_email,
      client_phone: form.client_phone,
      client_company: form.client_company,
      title: form.title,
      slot: form.slot,
      page: form.page,
      ad_type: form.ad_type,
      file_url: fileUrl,
      click_url: form.click_url,
      starts_at: form.starts_at,
      expires_at: form.expires_at,
      rate_per_day: parseInt(form.rate_per_day) || 0,
      amount_paid: parseInt(form.amount_paid) || 0,
      invoice_number: form.invoice_number,
      notes: form.notes,
      status: 'active',
    };

    if (selectedAd) {
      const { error: err } = await supabase.from('ads').update(payload).eq('id', selectedAd.id);
      if (err) { setError(err.message); } else { setSuccess('Ad updated successfully.'); }
    } else {
      const { error: err } = await supabase.from('ads').insert(payload);
      if (err) { setError(err.message); } else { setSuccess('Ad created and is now live.'); }
    }

    setSaving(false);
    if (!error) {
      setShowForm(false);
      setSelectedAd(null);
      setForm({ ...EMPTY_FORM });
      setFile(null);
      setPreview('');
      fetchAds();
    }
  };

  const handlePause = async (ad: any) => {
    const next = ad.status === 'active' ? 'paused' : 'active';
    await supabase.from('ads').update({ status: next }).eq('id', ad.id);
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: next } : a));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this ad?')) return;
    await supabase.from('ads').delete().eq('id', id);
    setAds(prev => prev.filter(a => a.id !== id));
  };

  const handleEdit = (ad: any) => {
    setSelectedAd(ad);
    setForm({
      client_name: ad.client_name || '', client_email: ad.client_email || '',
      client_phone: ad.client_phone || '', client_company: ad.client_company || '',
      title: ad.title || '', slot: ad.slot || 'leaderboard_top',
      page: ad.page || 'all', ad_type: ad.ad_type || 'image',
      click_url: ad.click_url || '',
      starts_at: ad.starts_at?.slice(0, 16) || '',
      expires_at: ad.expires_at?.slice(0, 16) || '',
      rate_per_day: ad.rate_per_day?.toString() || '',
      amount_paid: ad.amount_paid?.toString() || '',
      invoice_number: ad.invoice_number || '',
      notes: ad.notes || '',
    });
    setPreview(ad.file_url || '');
    setShowForm(true);
  };

  const filtered = ads.filter(a => filterStatus === 'all' || a.status === filterStatus);
  const now = new Date();
  const expiringSoon = ads.filter(a => a.status === 'active' && new Date(a.expires_at) < new Date(Date.now() + 3 * 86400000) && new Date(a.expires_at) > now);
  const totalRevenue = ads.reduce((s, a) => s + (a.amount_paid || 0), 0);
  const activeAds = ads.filter(a => a.status === 'active').length;
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s, a) => s + (a.clicks || 0), 0);

  const inputClass = "w-full bg-[#080B12] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#E8EAF0] focus:outline-none focus:border-[#E63946]/50 transition-colors";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5";
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="min-h-screen bg-[#080B12] text-[#E8EAF0] flex">

      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {NAV.map(item => (
              <li key={item.href}>
                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${(item as any).active ? 'bg-[#E63946]/10 border border-[#E63946]/20 text-[#E63946]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => { localStorage.removeItem('gunx_admin_session'); router.push('/admin/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-red-400 hover:bg-red-500/10 font-black text-[11px] uppercase tracking-widest transition-all">
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[260px] overflow-y-auto">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5 flex items-center justify-between sticky top-0 z-40">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight text-white">
              Ad <span className="text-[#E63946]">Manager</span>
            </h1>
            <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">Upload · Schedule · Track · Invoice</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setSelectedAd(null); setForm({ ...EMPTY_FORM }); setPreview(''); }}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="bg-[#E63946] text-white font-black uppercase tracking-widest text-[13px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all">
            {showForm ? '✕ Cancel' : '+ New Ad'}
          </button>
        </header>

        <div className="p-8 space-y-6">

          {/* EXPIRY ALERT */}
          {expiringSoon.length > 0 && (
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-4 flex items-center gap-3">
              <span className="text-[#F59E0B] text-xl">⚠️</span>
              <div>
                <p className="text-[#F59E0B] font-black text-sm uppercase tracking-widest">
                  {expiringSoon.length} ad{expiringSoon.length > 1 ? 's' : ''} expiring within 3 days
                </p>
                <p className="text-white/40 text-[11px] mt-0.5">
                  {expiringSoon.map(a => a.client_name).join(', ')} — contact clients to renew
                </p>
              </div>
            </div>
          )}

          {/* OVERVIEW STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active Ads', value: activeAds, color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
              { label: 'Total Revenue', value: `R${totalRevenue.toLocaleString()}`, color: 'text-[#C9922A]', border: 'border-[#C9922A]/20' },
              { label: 'Total Impressions', value: totalImpressions.toLocaleString(), color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20' },
              { label: 'Total Clicks', value: totalClicks.toLocaleString(), color: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20' },
            ].map(s => (
              <div key={s.label} className={`bg-[#0D1420] border ${s.border} rounded-sm p-4`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">{s.label}</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* AD SLOTS GUIDE */}
          <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-lg font-black uppercase text-white mb-4">Available Ad Slots</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {AD_SLOTS.map(slot => {
                const active = ads.filter(a => a.slot === slot.id && a.status === 'active').length;
                return (
                  <div key={slot.id} className={`border rounded-sm p-3 ${active > 0 ? 'border-[#10B981]/30 bg-[#10B981]/5' : 'border-white/10'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[12px] font-black text-white uppercase tracking-wide">{slot.label}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${active > 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white/30'}`}>
                        {active > 0 ? `${active} live` : 'vacant'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#C9922A] font-bold">{slot.size}px</p>
                    <p className="text-[10px] text-white/30">{slot.pages.join(', ')}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CREATE/EDIT FORM */}
          {showForm && (
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">
                  {selectedAd ? 'Edit Ad' : 'Create New Ad'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-sm">{error}</div>}
                {success && <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-sm p-3 text-[#10B981] text-sm">{success}</div>}

                {/* CLIENT INFO */}
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#E63946] mb-4">Client Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Client Name *</label><input name="client_name" value={form.client_name} onChange={handleChange} required className={inputClass} placeholder="John Smith" /></div>
                    <div><label className={labelClass}>Client Email *</label><input name="client_email" type="email" value={form.client_email} onChange={handleChange} required className={inputClass} placeholder="john@company.co.za" /></div>
                    <div><label className={labelClass}>Phone</label><input name="client_phone" value={form.client_phone} onChange={handleChange} className={inputClass} placeholder="082 123 4567" /></div>
                    <div><label className={labelClass}>Company</label><input name="client_company" value={form.client_company} onChange={handleChange} className={inputClass} placeholder="Company Name" /></div>
                  </div>
                </div>

                {/* AD DETAILS */}
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#E63946] mb-4">Ad Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><label className={labelClass}>Ad Title / Campaign Name *</label><input name="title" value={form.title} onChange={handleChange} required className={inputClass} placeholder="Summer Promo — Calibre Arms" /></div>
                    <div>
                      <label className={labelClass}>Ad Slot *</label>
                      <select name="slot" value={form.slot} onChange={handleChange} className={inputClass}>
                        {AD_SLOTS.map(s => <option key={s.id} value={s.id}>{s.label} ({s.size})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Show On Page</label>
                      <select name="page" value={form.page} onChange={handleChange} className={inputClass}>
                        {PAGE_OPTIONS.map(p => <option key={p} value={p}>{p === 'all' ? 'All Pages' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Ad Format</label>
                      <select name="ad_type" value={form.ad_type} onChange={handleChange} className={inputClass}>
                        {Object.entries(AD_FORMATS).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}
                      </select>
                      <p className="text-[10px] text-white/30 mt-1">{AD_FORMATS[form.ad_type as keyof typeof AD_FORMATS]?.tip}</p>
                    </div>
                    <div><label className={labelClass}>Click URL</label><input name="click_url" value={form.click_url} onChange={handleChange} className={inputClass} placeholder="https://client-website.co.za" /></div>
                  </div>
                </div>

                {/* FILE UPLOAD */}
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#E63946] mb-4">Ad Creative</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Upload File *</label>
                      <label className="flex flex-col items-center justify-center w-full h-[120px] bg-[#080B12] border-2 border-dashed border-white/20 rounded-sm cursor-pointer hover:border-[#E63946]/50 transition-all">
                        <span className="text-3xl mb-2">📁</span>
                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-widest">
                          {file ? file.name : 'Click to upload'}
                        </span>
                        <input type="file" accept={AD_FORMATS[form.ad_type as keyof typeof AD_FORMATS]?.accept} onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                    {preview && (
                      <div>
                        <label className={labelClass}>Preview</label>
                        <div className="w-full h-[120px] bg-[#080B12] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center">
                          {form.ad_type === 'video' ? (
                            <video src={preview} autoPlay muted loop playsInline className="max-w-full max-h-full" />
                          ) : (
                            <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SCHEDULE */}
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#E63946] mb-4">Schedule & Billing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Start Date *</label><input type="datetime-local" name="starts_at" value={form.starts_at} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>End Date *</label><input type="datetime-local" name="expires_at" value={form.expires_at} onChange={handleChange} required className={inputClass} /></div>
                    <div><label className={labelClass}>Rate per Day (R)</label><input type="number" name="rate_per_day" value={form.rate_per_day} onChange={handleChange} className={inputClass} placeholder="500" /></div>
                    <div><label className={labelClass}>Amount Paid (R)</label><input type="number" name="amount_paid" value={form.amount_paid} onChange={handleChange} className={inputClass} placeholder="7000" /></div>
                    <div><label className={labelClass}>Invoice Number</label><input name="invoice_number" value={form.invoice_number} onChange={handleChange} className={inputClass} placeholder="INV-1001" /></div>
                    <div><label className={labelClass}>Notes</label><input name="notes" value={form.notes} onChange={handleChange} className={inputClass} placeholder="Special instructions..." /></div>
                  </div>
                  {form.starts_at && form.expires_at && form.rate_per_day && (
                    <div className="mt-3 bg-[#080B12] border border-white/5 rounded-sm p-3">
                      <p className="text-[11px] text-white/40 uppercase tracking-widest">
                        Duration: {Math.ceil((new Date(form.expires_at).getTime() - new Date(form.starts_at).getTime()) / 86400000)} days ·
                        Total value: <strong className="text-[#C9922A]">R{(Math.ceil((new Date(form.expires_at).getTime() - new Date(form.starts_at).getTime()) / 86400000) * parseInt(form.rate_per_day || '0')).toLocaleString()}</strong>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="bg-[#E63946] text-white font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                    {uploading ? 'Uploading...' : saving ? 'Saving...' : selectedAd ? 'Update Ad' : '🚀 Launch Ad'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setSelectedAd(null); }}
                    className="border border-white/10 text-white/50 font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADS TABLE */}
          <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">
                All Ads <span className="text-white/30">({filtered.length})</span>
              </h2>
              <div className="flex gap-2">
                {['all', 'active', 'paused', 'expired'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-sm transition-all ${filterStatus === s ? 'bg-[#E63946] text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-5xl mb-4">📢</div>
                <p className="text-white/30 text-sm uppercase tracking-widest">No ads found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#080B12]">
                      {['Client', 'Campaign', 'Slot / Page', 'Schedule', 'Performance', 'Billing', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(ad => {
                      const isExpired = new Date(ad.expires_at) < new Date();
                      const isExpiringSoon = !isExpired && new Date(ad.expires_at) < new Date(Date.now() + 3 * 86400000);
                      const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={ad.id} className="hover:bg-white/[0.02] transition-all">
                          <td className="px-4 py-4">
                            <p className="text-[13px] font-bold text-white">{ad.client_name}</p>
                            <p className="text-[10px] text-white/30">{ad.client_email}</p>
                            {ad.client_company && <p className="text-[10px] text-[#C9922A]">{ad.client_company}</p>}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[13px] font-bold text-white/70">{ad.title}</p>
                            <span className="text-[9px] bg-white/5 text-white/30 px-2 py-0.5 rounded-sm uppercase">{ad.ad_type}</span>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[12px] font-bold text-white/60 uppercase">{ad.slot?.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-white/30">{ad.page}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[11px] text-white/60">{fmtDate(ad.starts_at)}</p>
                            <p className={`text-[11px] font-bold ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-[#F59E0B]' : 'text-white/40'}`}>
                              {isExpired ? '⚠ Expired' : isExpiringSoon ? '⏳ Exp soon' : ''} {fmtDate(ad.expires_at)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[12px] font-black text-[#4CC9F0]">{(ad.impressions || 0).toLocaleString()} imp</p>
                            <p className="text-[11px] text-white/40">{(ad.clicks || 0)} clicks · {ctr}% CTR</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[12px] font-black text-[#10B981]">R{(ad.amount_paid || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-white/30">{ad.invoice_number || '—'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-sm border ${
                              ad.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                              ad.status === 'paused' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
                              'bg-white/5 text-white/30 border-white/10'
                            }`}>{ad.status}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEdit(ad)}
                                className="text-[10px] font-black uppercase px-2 py-1 border border-white/10 text-white/40 hover:text-white hover:border-white/30 rounded-sm transition-all">
                                Edit
                              </button>
                              <button onClick={() => handlePause(ad)}
                                className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border transition-all ${ad.status === 'active' ? 'border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10' : 'border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10'}`}>
                                {ad.status === 'active' ? 'Pause' : 'Resume'}
                              </button>
                              <button onClick={() => handleDelete(ad.id)}
                                className="text-[10px] font-black uppercase px-2 py-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-sm transition-all">
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}