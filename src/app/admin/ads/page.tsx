'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin',           icon: '⚡', label: 'Overview' },
  { href: '/admin/dealers',   icon: '🏪', label: 'Dealers' },
  { href: '/admin/clubs',     icon: '⊕', label: 'Clubs' },
  { href: '/admin/listings',  icon: '📋', label: 'Listings' },
  { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
  { href: '/admin/ads',       icon: '📢', label: 'Ad Manager', active: true },
  { href: '/admin/crm',       icon: '💰', label: 'CRM' },
  { href: '/admin/users',     icon: '👥', label: 'Users' },
];

// ─── LOCKED RATE CARD — matches AdBanner.tsx and /advertise page ─────────────
const SLOT_RATES: Record<string, number> = {
  leaderboard_top: 1500,
  leaderboard_mid: 1200,
  sidebar_left:    800,
  sidebar_right:   800,
  square_card:     500,
};

const AD_SLOTS = [
  { id: 'leaderboard_top', label: 'Leaderboard Top',  size: '970×90',  rate: SLOT_RATES.leaderboard_top },
  { id: 'leaderboard_mid', label: 'Leaderboard Mid',  size: '728×90',  rate: SLOT_RATES.leaderboard_mid },
  { id: 'sidebar_left',    label: 'Sidebar Left',     size: '160×600', rate: SLOT_RATES.sidebar_left },
  { id: 'sidebar_right',   label: 'Sidebar Right',    size: '160×600', rate: SLOT_RATES.sidebar_right },
  { id: 'square_card',     label: 'Square Card',      size: '300×250', rate: SLOT_RATES.square_card },
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
  image: { label: 'Static Image', accept: 'image/jpeg,image/png,image/webp', tip: 'JPG/PNG/WebP — max 50MB. Best: 72dpi, sRGB colour space.' },
  gif:   { label: 'Animated GIF', accept: 'image/gif',                       tip: 'GIF — max 30MB. Keep under 15 seconds. No audio.' },
  video: { label: 'Video',        accept: 'video/mp4,video/webm',            tip: 'MP4/WebM — max 50MB. H.264 codec. No audio for autoplay. Max 30 seconds.' },
};

const EMPTY_FORM = {
  client_name: '', client_email: '', client_phone: '', client_company: '',
  title: '', slot: 'leaderboard_top', page: 'all', ad_type: 'image',
  click_url: '', starts_at: '', duration_months: 1,
  expires_at: '', rate_per_day: '', amount_paid: '',
  invoice_number: '', notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function calcAmount(slot: string, months: number): number {
  return (SLOT_RATES[slot] || 0) * months;
}

export default function AdManagerPage() {
  const router = useRouter();
  const [ads, setAds]               = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState<any>({ ...EMPTY_FORM });
  const [file, setFile]             = useState<File | null>(null);
  const [preview, setPreview]       = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [conflictWarning, setConflictWarning] = useState('');
  const [reviewingAd, setReviewingAd] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('gunx_admin_session') !== 'authenticated') {
        router.push('/admin/login'); return;
      }
    }
    fetchAds();
  }, []);

  useEffect(() => {
    if (form.starts_at && form.duration_months) {
      const expires = addMonths(form.starts_at, form.duration_months);
      const amount  = calcAmount(form.slot, form.duration_months);
      setForm((prev: any) => ({ ...prev, expires_at: expires, amount_paid: amount.toString() }));
    }
  }, [form.starts_at, form.duration_months, form.slot]);

  useEffect(() => {
    if (form.slot && form.page && form.starts_at && form.expires_at) {
      checkConflict();
    } else {
      setConflictWarning('');
    }
  }, [form.slot, form.page, form.starts_at, form.expires_at]);

  const fetchAds = async () => {
    const { data } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    setAds(data || []);
    setLoading(false);
    checkExpiring(data || []);
  };

  const checkExpiring = (adList: any[]) => {
    const soon = new Date(Date.now() + 3 * 86400000);
    const expiring = adList.filter(a =>
      a.status === 'active' &&
      !a.expiry_notified &&
      new Date(a.expires_at) < soon &&
      new Date(a.expires_at) > new Date()
    );
    expiring.forEach(async (ad) => {
      await supabase.from('ads').update({ expiry_notified: true }).eq('id', ad.id);
    });
  };

  const checkConflict = async () => {
    if (!form.starts_at || !form.expires_at) return;

    // Conflict check only against APPROVED (active) ads — pending ads don't block
    let query = supabase
      .from('ads')
      .select('id, client_name, client_company, starts_at, expires_at')
      .eq('slot', form.slot)
      .eq('page', form.page)
      .eq('status', 'active')
      .lt('starts_at', form.expires_at)
      .gt('expires_at', form.starts_at);

    if (selectedAd?.id) query = query.neq('id', selectedAd.id);

    const { data } = await query;

    if (data && data.length > 0) {
      const conflict = data[0];
      const name = conflict.client_company || conflict.client_name;
      const from = new Date(conflict.starts_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
      const to   = new Date(conflict.expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
      setConflictWarning(`⚠️ Conflict: "${name}" already has this slot booked from ${from} to ${to}. Choose a different slot, page, or date range.`);
    } else {
      setConflictWarning('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((prev: any) => ({ ...prev, [e.target.name]: val }));
  };

  // ─── REVIEW HANDLERS — admin-created ads bypass review (already trusted) ───
  // Self-service submissions land as pending_review and require approval here.
  const handleApprove = async (ad: any) => {
    if (!confirm(`Approve "${ad.title}" by ${ad.client_company || ad.client_name}? Ad will go live immediately.`)) return;
    const { error } = await supabase.from('ads').update({
      status: 'active',
      reviewed_at: new Date().toISOString(),
      review_notes: null,
    }).eq('id', ad.id);
    if (error) { alert('Approve failed: ' + error.message); return; }
    setReviewingAd(null);
    fetchAds();
  };

  const handleReject = async (ad: any) => {
    if (!rejectReason.trim()) { alert('Please provide a reason for rejection.'); return; }
    const { error } = await supabase.from('ads').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      review_notes: rejectReason,
    }).eq('id', ad.id);
    if (error) { alert('Reject failed: ' + error.message); return; }
    setReviewingAd(null);
    setRejectReason('');
    fetchAds();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !selectedAd?.file_url) { setError('Please upload an ad creative file.'); return; }
    if (conflictWarning) { setError('Resolve the booking conflict before saving.'); return; }

    setSaving(true); setError(''); setSuccess('');

    let fileUrl = selectedAd?.file_url || '';

    if (file) {
      setUploading(true);
      const ext  = file.name.split('.').pop();
      const path = `ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('images').upload(path, file);
      if (upErr) { setError('Upload failed: ' + upErr.message); setSaving(false); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      fileUrl = publicUrl;
      setUploading(false);
    }

    const payload = {
      client_name:    form.client_name,
      client_email:   form.client_email,
      client_phone:   form.client_phone,
      client_company: form.client_company,
      title:          form.title,
      slot:           form.slot,
      page:           form.page,
      ad_type:        form.ad_type,
      file_url:       fileUrl,
      click_url:      form.click_url,
      starts_at:      form.starts_at,
      expires_at:     form.expires_at,
      rate_per_day:   parseInt(form.rate_per_day) || 0,
      amount_paid:    parseInt(form.amount_paid)  || 0,
      invoice_number: form.invoice_number,
      notes:          form.notes,
      // Admin-created ads go live immediately (trusted source)
      status:         'active',
      reviewed_at:    new Date().toISOString(),
    };

    if (selectedAd) {
      const { error: err } = await supabase.from('ads').update(payload).eq('id', selectedAd.id);
      if (err) { setError(err.message); setSaving(false); return; }
      setSuccess('Ad updated successfully.');
    } else {
      const { error: err } = await supabase.from('ads').insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
      setSuccess('Ad created and is now live.');
    }

    setSaving(false);
    setShowForm(false);
    setSelectedAd(null);
    setForm({ ...EMPTY_FORM });
    setFile(null);
    setPreview('');
    setConflictWarning('');
    fetchAds();
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
      client_name:    ad.client_name    || '',
      client_email:   ad.client_email   || '',
      client_phone:   ad.client_phone   || '',
      client_company: ad.client_company || '',
      title:          ad.title          || '',
      slot:           ad.slot           || 'leaderboard_top',
      page:           ad.page           || 'all',
      ad_type:        ad.ad_type        || 'image',
      click_url:      ad.click_url      || '',
      starts_at:      ad.starts_at?.slice(0, 16) || '',
      expires_at:     ad.expires_at?.slice(0, 16) || '',
      duration_months: 1,
      rate_per_day:   ad.rate_per_day?.toString() || '',
      amount_paid:    ad.amount_paid?.toString()  || '',
      invoice_number: ad.invoice_number || '',
      notes:          ad.notes          || '',
    });
    setPreview(ad.file_url || '');
    setShowForm(true);
    setConflictWarning('');
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedAd(null);
    setForm({ ...EMPTY_FORM });
    setFile(null);
    setPreview('');
    setError('');
    setSuccess('');
    setConflictWarning('');
  };

  const filtered         = ads.filter(a => filterStatus === 'all' || a.status === filterStatus);
  const now              = new Date();
  const pendingCount     = ads.filter(a => a.status === 'pending_review').length;
  const expiringSoon     = ads.filter(a => a.status === 'active' && new Date(a.expires_at) < new Date(Date.now() + 3 * 86400000) && new Date(a.expires_at) > now);
  const totalRevenue     = ads.filter(a => a.status === 'active').reduce((s, a) => s + (a.amount_paid || 0), 0);
  const activeAds        = ads.filter(a => a.status === 'active').length;
  const totalImpressions = ads.reduce((s, a) => s + (a.impressions  || 0), 0);
  const totalClicks      = ads.reduce((s, a) => s + (a.clicks       || 0), 0);

  const selectedSlotInfo = AD_SLOTS.find(s => s.id === form.slot);
  const monthlyRate      = selectedSlotInfo?.rate || 0;
  const totalValue       = monthlyRate * (form.duration_months || 1);

  const inputClass = "w-full bg-[#080B12] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#E8EAF0] focus:outline-none focus:border-[#E63946]/50 transition-colors";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5";
  const fmtDate    = (d: string) => d ? new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

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
            <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">Upload · Review · Schedule · Track · Invoice</p>
          </div>
          <button onClick={() => showForm ? resetForm() : setShowForm(true)}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="bg-[#E63946] text-white font-black uppercase tracking-widest text-[13px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all">
            {showForm ? '✕ Cancel' : '+ New Ad'}
          </button>
        </header>

        <div className="p-8 space-y-6">

          {/* PENDING REVIEW ALERT */}
          {pendingCount > 0 && (
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-sm p-4 flex items-center gap-3">
              <span className="text-[#F59E0B] text-2xl">🛡️</span>
              <div className="flex-1">
                <p className="text-[#F59E0B] font-black text-sm uppercase tracking-widest">
                  {pendingCount} ad{pendingCount > 1 ? 's' : ''} awaiting review
                </p>
                <p className="text-white/40 text-[11px] mt-0.5">
                  Self-service submissions waiting for approval before going live. Click "Pending Review" tab below.
                </p>
              </div>
              <button onClick={() => setFilterStatus('pending_review')}
                className="text-[11px] font-black uppercase tracking-widest text-[#F59E0B] border border-[#F59E0B]/30 px-4 py-2 rounded-sm hover:bg-[#F59E0B]/10 transition-all">
                Review Now →
              </button>
            </div>
          )}

          {/* EXPIRY ALERT */}
          {expiringSoon.length > 0 && (
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-4 flex items-center gap-3">
              <span className="text-[#F59E0B] text-xl">⚠️</span>
              <div>
                <p className="text-[#F59E0B] font-black text-sm uppercase tracking-widest">
                  {expiringSoon.length} ad{expiringSoon.length > 1 ? 's' : ''} expiring within 3 days
                </p>
                <p className="text-white/40 text-[11px] mt-0.5">
                  {expiringSoon.map(a => a.client_company || a.client_name).join(', ')} — contact clients to renew
                </p>
              </div>
            </div>
          )}

          {/* OVERVIEW STATS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Pending Review',    value: pendingCount,                       color: 'text-[#F59E0B]', border: 'border-[#F59E0B]/20' },
              { label: 'Active Ads',        value: activeAds,                          color: 'text-[#10B981]', border: 'border-[#10B981]/20' },
              { label: 'Revenue (active)',  value: `R${totalRevenue.toLocaleString()}`, color: 'text-[#C9922A]', border: 'border-[#C9922A]/20' },
              { label: 'Impressions',       value: totalImpressions.toLocaleString(),   color: 'text-[#4CC9F0]', border: 'border-[#4CC9F0]/20' },
              { label: 'Clicks',            value: totalClicks.toLocaleString(),        color: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/20' },
            ].map(s => (
              <div key={s.label} className={`bg-[#0D1420] border ${s.border} rounded-sm p-4`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">{s.label}</p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* AD SLOTS GUIDE */}
          <div className="bg-[#0D1420] border border-white/5 rounded-sm p-5">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase text-white mb-4">
              Available Ad Slots — Rate Card
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {AD_SLOTS.map(slot => {
                const activeOnSlot = ads.filter(a => a.slot === slot.id && a.status === 'active');
                return (
                  <div key={slot.id} className={`border rounded-sm p-3 ${activeOnSlot.length > 0 ? 'border-[#10B981]/30 bg-[#10B981]/5' : 'border-white/10'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-black text-white uppercase tracking-wide">{slot.label}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${activeOnSlot.length > 0 ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white/30'}`}>
                        {activeOnSlot.length > 0 ? `${activeOnSlot.length} live` : 'vacant'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#C9922A] font-bold">{slot.size}px</p>
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[15px] font-black text-white mt-1">
                      R{slot.rate.toLocaleString()}<span className="text-[10px] text-white/30 font-normal">/mo</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CREATE / EDIT FORM */}
          {showForm && (
            <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">
                  {selectedAd ? 'Edit Ad' : 'Create New Ad (Admin — Auto-Approved)'}
                </h2>
                <p className="text-[11px] text-white/40 mt-1">
                  Ads created here bypass review and go live immediately. Self-service submissions land in the Pending Review queue.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">

                {error           && <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-sm font-bold">{error}</div>}
                {success         && <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-sm p-3 text-[#10B981] text-sm font-bold">{success}</div>}
                {conflictWarning && (
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-sm p-4 flex items-start gap-3">
                    <span className="text-[#F59E0B] text-lg flex-shrink-0">🚫</span>
                    <div>
                      <p className="text-[#F59E0B] font-black text-[12px] uppercase tracking-widest mb-1">Booking Conflict Detected</p>
                      <p className="text-[#F59E0B]/80 text-[12px]">{conflictWarning}</p>
                    </div>
                  </div>
                )}

                {/* CLIENT INFO */}
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#E63946] mb-4">Client Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className={labelClass}>Client Name *</label><input name="client_name" value={form.client_name} onChange={handleChange} required className={inputClass} placeholder="John Smith" /></div>
                    <div><label className={labelClass}>Client Email *</label><input name="client_email" type="email" value={form.client_email} onChange={handleChange} required className={inputClass} placeholder="john@company.co.za" /></div>
                    <div><label className={labelClass}>Phone</label><input name="client_phone" value={form.client_phone} onChange={handleChange} className={inputClass} placeholder="082 123 4567" /></div>
                    <div><label className={labelClass}>Company</label><input name="client_company" value={form.client_company} onChange={handleChange} className={inputClass} placeholder="Company Name (Pty) Ltd" /></div>
                  </div>
                </div>

                {/* AD DETAILS */}
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#E63946] mb-4">Ad Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Ad Title / Campaign Name *</label>
                      <input name="title" value={form.title} onChange={handleChange} required className={inputClass} placeholder="Summer Promo — Calibre Arms" />
                    </div>

                    <div>
                      <label className={labelClass}>Ad Slot *</label>
                      <select name="slot" value={form.slot} onChange={handleChange} className={inputClass}>
                        {AD_SLOTS.map(s => (
                          <option key={s.id} value={s.id}>{s.label} ({s.size}) — R{s.rate.toLocaleString()}/mo</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Show On Page *</label>
                      <select name="page" value={form.page} onChange={handleChange} className={inputClass}>
                        {PAGE_OPTIONS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Ad Format</label>
                      <select name="ad_type" value={form.ad_type} onChange={handleChange} className={inputClass}>
                        {Object.entries(AD_FORMATS).map(([id, f]) => (
                          <option key={id} value={id}>{f.label}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-white/30 mt-1">{AD_FORMATS[form.ad_type as keyof typeof AD_FORMATS]?.tip}</p>
                    </div>

                    <div>
                      <label className={labelClass}>Click URL</label>
                      <input name="click_url" value={form.click_url} onChange={handleChange} className={inputClass} placeholder="https://client-website.co.za" />
                    </div>
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
                          {form.ad_type === 'video'
                            ? <video src={preview} autoPlay muted loop playsInline className="max-w-full max-h-full" />
                            : <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SCHEDULE & BILLING */}
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#E63946] mb-4">Schedule & Billing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div>
                      <label className={labelClass}>Start Date *</label>
                      <input type="datetime-local" name="starts_at" value={form.starts_at} onChange={handleChange} required className={inputClass} />
                    </div>

                    <div>
                      <label className={labelClass}>Duration *</label>
                      <select name="duration_months" value={form.duration_months} onChange={handleChange} className={inputClass}>
                        {DURATION_OPTIONS.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-white/30 mt-1">Max 3 months per booking</p>
                    </div>

                    <div>
                      <label className={labelClass}>End Date (auto-calculated)</label>
                      <div className={`${inputClass} bg-[#0D1420] text-white/50 cursor-not-allowed`}>
                        {form.expires_at ? new Date(form.expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '— select start date —'}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Amount Paid (R) — auto-filled</label>
                      <input type="number" name="amount_paid" value={form.amount_paid} onChange={handleChange} className={inputClass} placeholder="0" />
                    </div>

                    <div>
                      <label className={labelClass}>Invoice Number</label>
                      <input name="invoice_number" value={form.invoice_number} onChange={handleChange} className={inputClass} placeholder="INV-1001" />
                    </div>

                    <div>
                      <label className={labelClass}>Notes</label>
                      <input name="notes" value={form.notes} onChange={handleChange} className={inputClass} placeholder="Special instructions..." />
                    </div>
                  </div>

                  {form.starts_at && (
                    <div className="mt-4 bg-[#080B12] border border-white/5 rounded-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Slot Rate</p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black text-[#C9922A]">R{monthlyRate.toLocaleString()}/mo</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Duration</p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black text-white">{form.duration_months} month{form.duration_months > 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Total Value</p>
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black text-[#10B981]">R{totalValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Conflict Status</p>
                        <p className={`text-[12px] font-black uppercase ${conflictWarning ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                          {conflictWarning ? '🚫 Conflict' : '✓ Slot Available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving || !!conflictWarning}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="bg-[#E63946] text-white font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {uploading ? 'Uploading...' : saving ? 'Saving...' : selectedAd ? 'Update Ad' : '🚀 Launch Ad'}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="border border-white/10 text-white/50 font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADS TABLE */}
          <div className="bg-[#0D1420] border border-white/5 rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">
                All Ads <span className="text-white/30">({filtered.length})</span>
              </h2>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'pending_review', label: `Pending Review (${pendingCount})`, accent: 'bg-[#F59E0B] text-black' },
                  { id: 'active',         label: 'Active',     accent: 'bg-[#10B981] text-white' },
                  { id: 'paused',         label: 'Paused',     accent: 'bg-[#E63946] text-white' },
                  { id: 'rejected',       label: 'Rejected',   accent: 'bg-red-700 text-white' },
                  { id: 'expired',        label: 'Expired',    accent: 'bg-white/10 text-white' },
                  { id: 'all',            label: 'All',        accent: 'bg-[#E63946] text-white' },
                ].map(s => (
                  <button key={s.id} onClick={() => setFilterStatus(s.id)}
                    className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-sm transition-all ${filterStatus === s.id ? s.accent : 'bg-white/5 text-white/40 hover:text-white'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="text-5xl mb-4">📢</div>
                <p className="text-white/30 text-sm uppercase tracking-widest">No ads in this status</p>
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
                      const isExpired      = new Date(ad.expires_at) < now;
                      const isExpiringSoon = !isExpired && new Date(ad.expires_at) < new Date(Date.now() + 3 * 86400000);
                      const ctr            = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
                      const pageLabel      = PAGE_OPTIONS.find(p => p.value === ad.page)?.label || ad.page;
                      const isPending      = ad.status === 'pending_review';
                      return (
                        <tr key={ad.id} className={`hover:bg-white/[0.02] transition-all ${isPending ? 'bg-[#F59E0B]/5' : ''}`}>
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
                            <p className="text-[10px] text-white/30 truncate max-w-[140px]">{pageLabel}</p>
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
                              ad.status === 'active'         ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                              ad.status === 'pending_review' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30 animate-pulse' :
                              ad.status === 'paused'         ? 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20' :
                              ad.status === 'rejected'       ? 'bg-red-700/10 text-red-400 border-red-700/30' :
                              'bg-white/5 text-white/30 border-white/10'
                            }`}>{(ad.status || 'unknown').replace('_', ' ')}</span>
                            {ad.review_notes && (
                              <p className="text-[9px] text-red-400 mt-1 italic">{ad.review_notes}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isPending ? (
                                <button onClick={() => setReviewingAd(ad)}
                                  className="text-[10px] font-black uppercase px-3 py-1 border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20 rounded-sm transition-all">
                                  🛡️ Review
                                </button>
                              ) : (
                                <>
                                  <button onClick={() => handleEdit(ad)}
                                    className="text-[10px] font-black uppercase px-2 py-1 border border-white/10 text-white/40 hover:text-white hover:border-white/30 rounded-sm transition-all">
                                    Edit
                                  </button>
                                  <button onClick={() => handlePause(ad)}
                                    className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border transition-all ${ad.status === 'active' ? 'border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/10' : 'border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10'}`}>
                                    {ad.status === 'active' ? 'Pause' : 'Resume'}
                                  </button>
                                </>
                              )}
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

      {/* ── REVIEW MODAL ─────────────────────────────────────────────────────── */}
      {reviewingAd && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setReviewingAd(null)}>
          <div className="bg-[#0D1420] border border-white/10 rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0D1420] z-10">
              <div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-white">
                  Review Submission
                </h3>
                <p className="text-[11px] text-white/40 mt-0.5">Verify content meets platform standards before approving</p>
              </div>
              <button onClick={() => { setReviewingAd(null); setRejectReason(''); }}
                className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white text-xl">×</button>
            </div>

            <div className="p-6 space-y-5">

              {/* CLIENT */}
              <div className="bg-[#080B12] border border-white/5 rounded-sm p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Submitted by</p>
                <p className="text-[15px] font-bold text-white">{reviewingAd.client_name}</p>
                <p className="text-[12px] text-[#C9922A]">{reviewingAd.client_company || '—'}</p>
                <p className="text-[12px] text-white/60 mt-1">{reviewingAd.client_email} · {reviewingAd.client_phone || '—'}</p>
              </div>

              {/* CAMPAIGN */}
              <div className="bg-[#080B12] border border-white/5 rounded-sm p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Campaign</p>
                <p className="text-[16px] font-black text-white mb-3">{reviewingAd.title}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[12px]">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Slot</p>
                    <p className="text-white/80 capitalize">{reviewingAd.slot?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Page</p>
                    <p className="text-white/80">{PAGE_OPTIONS.find(p => p.value === reviewingAd.page)?.label || reviewingAd.page}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Format</p>
                    <p className="text-white/80 uppercase">{reviewingAd.ad_type}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Schedule</p>
                    <p className="text-white/80">{fmtDate(reviewingAd.starts_at)} → {fmtDate(reviewingAd.expires_at)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Amount Paid</p>
                    <p className="text-[#10B981] font-black">R{(reviewingAd.amount_paid || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase font-bold">Click URL</p>
                    {reviewingAd.click_url ? (
                      <a href={reviewingAd.click_url} target="_blank" rel="noopener noreferrer"
                        className="text-[#4CC9F0] hover:underline truncate block">{reviewingAd.click_url}</a>
                    ) : <p className="text-white/40">—</p>}
                  </div>
                </div>
                {reviewingAd.notes && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-white/40 text-[10px] uppercase font-bold mb-1">Advertiser Notes</p>
                    <p className="text-[12px] text-white/70 italic">{reviewingAd.notes}</p>
                  </div>
                )}
              </div>

              {/* CREATIVE PREVIEW */}
              <div className="bg-[#080B12] border border-white/5 rounded-sm p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Creative Preview</p>
                <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-4 flex items-center justify-center min-h-[200px]">
                  {reviewingAd.file_url ? (
                    reviewingAd.ad_type === 'video' ? (
                      <video src={reviewingAd.file_url} controls autoPlay muted loop playsInline className="max-w-full max-h-[400px]" />
                    ) : (
                      <img src={reviewingAd.file_url} alt={reviewingAd.title} className="max-w-full max-h-[400px] object-contain" />
                    )
                  ) : (
                    <p className="text-white/30 italic">No creative uploaded</p>
                  )}
                </div>
              </div>

              {/* REVIEW CHECKLIST */}
              <div className="bg-[#080B12] border border-[#F59E0B]/20 rounded-sm p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#F59E0B] mb-3">📋 Pre-Approval Checklist</p>
                <ul className="space-y-2 text-[12px] text-white/70">
                  <li>✓ Creative is appropriate for a firearms-focused platform</li>
                  <li>✓ No sexual, pornographic, or violent content</li>
                  <li>✓ No competitor platforms or scams</li>
                  <li>✓ Click URL points to a legitimate, related business</li>
                  <li>✓ Branding and messaging align with FCA / POPI compliance</li>
                  <li>✓ Image quality is acceptable for the slot dimensions</li>
                </ul>
              </div>

              {/* REJECT REASON */}
              <div>
                <label className={labelClass}>Rejection Reason (only required if rejecting)</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  className={`${inputClass} min-h-[80px]`}
                  placeholder="e.g. Creative contains adult content / Click URL is broken / Competitor platform" />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button onClick={() => handleApprove(reviewingAd)}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="flex-1 bg-[#10B981] text-white font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:brightness-110 transition-all">
                  ✓ Approve & Go Live
                </button>
                <button onClick={() => handleReject(reviewingAd)}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="flex-1 bg-red-700 text-white font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!rejectReason.trim()}>
                  ✕ Reject
                </button>
                <button onClick={() => { setReviewingAd(null); setRejectReason(''); }}
                  className="border border-white/10 text-white/50 font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
