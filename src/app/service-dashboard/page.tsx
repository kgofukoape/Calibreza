'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type Service = {
  id: string;
  name: string;
  type: string;
  slug: string;
  city: string;
  province: string;
  logo_url: string;
  description: string;
  contact_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  address: string;
  postal_code: string;
  service_area_note: string;
  years_experience: number | null;
  saps_accredited: boolean;
  accreditation_number: string;
  specializations: string[];
  status: string;
  is_verified: boolean;
  is_featured: boolean;
  user_id: string | null;
};

type Package = {
  id: string;
  service_id: string;
  name: string;
  description: string;
  price: number | null;
  duration: string;
  is_active: boolean;
  sort_order: number;
};

type PortfolioItem = {
  id: string;
  service_id: string;
  image_url: string;
  caption: string;
  sort_order: number;
};

const PROVINCES = [
  'Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape',
  'Free State','Limpopo','Mpumalanga','North West','Northern Cape',
];

const inp  = 'w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50 transition-colors';
const lbl  = 'block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2';

const EMPTY_PKG = { name: '', description: '', price: '', duration: '', is_active: true };

// ─── Component ────────────────────────────────────────────────────────────────
export default function ServiceDashboardPage() {
  const router = useRouter();

  const [service, setService]         = useState<Service | null>(null);
  const [packages, setPackages]       = useState<Package[]>([]);
  const [portfolio, setPortfolio]     = useState<PortfolioItem[]>([]);
  const [reviews, setReviews]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<'overview' | 'packages' | 'portfolio' | 'profile'>('overview');

  // Packages state
  const [pkgForm, setPkgForm]         = useState(EMPTY_PKG);
  const [editingPkg, setEditingPkg]   = useState<Package | null>(null);
  const [pkgSaving, setPkgSaving]     = useState(false);
  const [pkgError, setPkgError]       = useState('');
  const [showPkgForm, setShowPkgForm] = useState(false);

  // Portfolio state
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // Profile state
  const [profileForm, setProfileForm] = useState<Partial<Service>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);

  // ── Auth & data load ─────────────────────────────────────────────────────
  useEffect(() => { init(); }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }

    // Try user_id first, fall back to email match for older records
    let svcData: Service | null = null;

    const { data: byUid } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (byUid) {
      svcData = byUid;
    } else {
      const { data: byEmail } = await supabase
        .from('services')
        .select('*')
        .eq('email', user.email!)
        .maybeSingle();
      svcData = byEmail;
    }

    if (!svcData) {
      // User authenticated but no service found
      setLoading(false);
      setService(null);
      return;
    }

    // Patch user_id if missing (backfill for email-matched records)
    if (!svcData.user_id) {
      await supabase.from('services').update({ user_id: user.id }).eq('id', svcData.id);
    }

    setService(svcData);
    setProfileForm(svcData);
    await loadRelated(svcData.id);
    setLoading(false);
  };

  const loadRelated = async (serviceId: string) => {
    const [pkgRes, portRes, revRes] = await Promise.all([
      supabase.from('service_packages').select('*').eq('service_id', serviceId).order('sort_order'),
      supabase.from('service_portfolio').select('*').eq('service_id', serviceId).order('sort_order'),
      supabase.from('service_reviews').select('*').eq('service_id', serviceId).order('created_at', { ascending: false }),
    ]);
    setPackages(pkgRes.data || []);
    setPortfolio(portRes.data || []);
    setReviews(revRes.data || []);
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  // ── Packages ─────────────────────────────────────────────────────────────
  const openNewPkg = () => {
    setEditingPkg(null);
    setPkgForm(EMPTY_PKG);
    setPkgError('');
    setShowPkgForm(true);
  };

  const openEditPkg = (pkg: Package) => {
    setEditingPkg(pkg);
    setPkgForm({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price != null ? String(pkg.price) : '',
      duration: pkg.duration || '',
      is_active: pkg.is_active,
    });
    setPkgError('');
    setShowPkgForm(true);
  };

  const savePkg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgForm.name.trim()) { setPkgError('Package name is required.'); return; }
    setPkgSaving(true);
    setPkgError('');

    const payload = {
      service_id:  service!.id,
      name:        pkgForm.name.trim(),
      description: pkgForm.description.trim() || null,
      price:       pkgForm.price !== '' ? parseFloat(pkgForm.price as string) : null,
      duration:    pkgForm.duration.trim() || null,
      is_active:   pkgForm.is_active,
      sort_order:  editingPkg ? editingPkg.sort_order : packages.length,
    };

    if (editingPkg) {
      const { error } = await supabase.from('service_packages').update(payload).eq('id', editingPkg.id);
      if (error) { setPkgError(error.message); setPkgSaving(false); return; }
    } else {
      const { error } = await supabase.from('service_packages').insert(payload);
      if (error) { setPkgError(error.message); setPkgSaving(false); return; }
    }

    await loadRelated(service!.id);
    setShowPkgForm(false);
    setPkgSaving(false);
  };

  const deletePkg = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    await supabase.from('service_packages').delete().eq('id', id);
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  const togglePkgActive = async (pkg: Package) => {
    await supabase.from('service_packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id);
    setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, is_active: !p.is_active } : p));
  };

  // ── Portfolio ─────────────────────────────────────────────────────────────
  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (portfolio.length + files.length > 20) {
      setUploadError('Maximum 20 portfolio images allowed.');
      return;
    }
    setUploading(true);
    setUploadError('');

    for (const file of files) {
      const ext      = file.name.split('.').pop();
      const path     = `portfolio/${service!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from('services')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (upErr) { setUploadError(upErr.message); continue; }

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(data.path);

      const { error: dbErr } = await supabase.from('service_portfolio').insert({
        service_id: service!.id,
        image_url:  publicUrl,
        sort_order: portfolio.length,
      });
      if (dbErr) { setUploadError(dbErr.message); }
    }

    await loadRelated(service!.id);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deletePortfolioItem = async (id: string, imageUrl: string) => {
    if (!confirm('Remove this photo from your portfolio?')) return;
    // Extract storage path from public URL
    const path = imageUrl.split('/services/')[1];
    if (path) await supabase.storage.from('services').remove([path]);
    await supabase.from('service_portfolio').delete().eq('id', id);
    setPortfolio(prev => prev.filter(p => p.id !== id));
  };

  const updateCaption = async (id: string, caption: string) => {
    await supabase.from('service_portfolio').update({ caption }).eq('id', id);
    setPortfolio(prev => prev.map(p => p.id === id ? { ...p, caption } : p));
  };

  // ── Profile ───────────────────────────────────────────────────────────────
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    const { error } = await supabase
      .from('services')
      .update({
        name:                 profileForm.name,
        description:          profileForm.description,
        contact_name:         profileForm.contact_name,
        phone:                profileForm.phone,
        whatsapp:             profileForm.whatsapp,
        website:              profileForm.website,
        address:              profileForm.address,
        city:                 profileForm.city,
        province:             profileForm.province,
        postal_code:          profileForm.postal_code,
        service_area_note:    profileForm.service_area_note,
        years_experience:     profileForm.years_experience || null,
        saps_accredited:      profileForm.saps_accredited,
        accreditation_number: profileForm.accreditation_number,
      })
      .eq('id', service!.id);

    if (!error) {
      setService(prev => prev ? { ...prev, ...profileForm } as Service : prev);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
    setProfileSaving(false);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const pendingReviews  = reviews.filter(r => !r.is_approved).length;
  const approvedReviews = reviews.filter(r =>  r.is_approved).length;

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── No service found ─────────────────────────────────────────────────────
  if (!service) return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex items-center justify-center flex-col gap-6 px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🔧</div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="text-3xl font-black uppercase mb-2">No Service Found</h1>
        <p className="text-[#8A8E99] text-sm mb-6">
          We couldn't find a service listing linked to your account. Apply to list your service first.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/services/apply"
            className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
            Apply Now
          </Link>
          <button onClick={handleLogout}
            className="border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  const NAV = [
    { id: 'overview',  icon: '📊', label: 'Overview'  },
    { id: 'packages',  icon: '💼', label: 'Packages'  },
    { id: 'portfolio', icon: '📸', label: 'Portfolio' },
    { id: 'profile',   icon: '⚙️', label: 'Profile'   },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="w-[280px] bg-[#13151A] border-r border-white/5 flex flex-col flex-shrink-0">

        {/* Brand */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex flex-col items-start group">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase group-hover:text-[#C9922A] transition-colors">
              GUN <span className="text-[#C9922A] group-hover:text-[#F0EDE8]">X</span>
            </span>
            <span className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">
              Service Dashboard
            </span>
          </Link>
        </div>

        {/* Provider identity */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: service.logo_url ? 'transparent' : '#C9922A' }}>
              {service.logo_url
                ? <img src={service.logo_url} alt="" className="w-full h-full object-cover" />
                : <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-xl">
                    {service.name?.charAt(0)}
                  </span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{service.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                  service.status === 'active'  ? 'bg-[#2A9C6E]/20 text-[#2A9C6E]' :
                  service.status === 'pending' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                  'bg-white/10 text-[#8A8E99]'
                }`}>{service.status}</span>
                {service.is_verified && <span className="text-[9px] font-black text-[#2A9C6E]">✓ Verified</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {NAV.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm font-bold text-sm transition-colors text-left ${
                    activeTab === item.id
                      ? 'bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A]'
                      : 'hover:bg-white/5 text-[#8A8E99] hover:text-[#F0EDE8]'
                  }`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'packages'  && packages.length  > 0 && (
                    <span className="ml-auto text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded-sm">{packages.length}</span>
                  )}
                  {item.id === 'portfolio' && portfolio.length > 0 && (
                    <span className="ml-auto text-[9px] font-black bg-white/10 px-1.5 py-0.5 rounded-sm">{portfolio.length}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          {service.slug && (
            <Link href={`/services/${service.slug}`} target="_blank"
              className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors">
              View Public Profile ↗
            </Link>
          )}
          <button onClick={handleLogout}
            className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">

        {/* ── OVERVIEW ────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="p-8">
            <header className="mb-8">
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl font-black uppercase tracking-tight">
                Overview <span className="text-[#C9922A]">Dashboard</span>
              </h1>
              <p className="text-[#8A8E99] text-sm mt-1">Welcome back, {service.contact_name || service.name}</p>
            </header>

            {/* Status notice for pending */}
            {service.status === 'pending' && (
              <div className="mb-6 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-sm p-5">
                <p className="text-[#F59E0B] font-black uppercase tracking-widest text-[12px] mb-1">⏳ Listing Under Review</p>
                <p className="text-[#8A8E99] text-[13px]">
                  Your service listing is being reviewed by our team. It will go live within 1–2 business days.
                  You can still set up your packages and portfolio now.
                </p>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Packages',       value: packages.length,  icon: '💼', action: () => setActiveTab('packages')  },
                { label: 'Portfolio Photos', value: portfolio.length, icon: '📸', action: () => setActiveTab('portfolio') },
                { label: 'Total Reviews',  value: reviews.length,   icon: '⭐', action: () => {} },
                { label: 'Pending Reviews',value: pendingReviews,   icon: '🕐', action: () => {} },
              ].map((stat, i) => (
                <button key={i} onClick={stat.action}
                  className="bg-[#13151A] border border-white/5 hover:border-[#C9922A]/20 rounded-sm p-5 text-left transition-all group">
                  <div className="text-2xl mb-3">{stat.icon}</div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-3xl font-black group-hover:text-[#C9922A] transition-colors">{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mt-1">{stat.label}</p>
                </button>
              ))}
            </div>

            {/* Rating + quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Rating */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-xl font-black uppercase mb-4">Ratings</h2>
                {approvedReviews > 0 ? (
                  <div className="flex items-center gap-4">
                    <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-5xl font-black text-[#C9922A]">{avgRating}</p>
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-lg ${s <= Math.round(Number(avgRating)) ? 'text-[#C9922A]' : 'text-white/10'}`}>★</span>
                        ))}
                      </div>
                      <p className="text-[12px] text-[#8A8E99]">{approvedReviews} approved review{approvedReviews !== 1 ? 's' : ''}</p>
                      {pendingReviews > 0 && (
                        <p className="text-[11px] text-[#F59E0B] mt-1">⏳ {pendingReviews} awaiting moderation</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[#8A8E99] text-sm">No reviews yet. Reviews from customers appear here once approved.</p>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-xl font-black uppercase mb-4">Quick Actions</h2>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setActiveTab('packages'); setShowPkgForm(true); openNewPkg(); }}
                    className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm hover:bg-[#C9922A]/20 transition-all text-left">
                    <span>➕</span> Add New Package
                  </button>
                  <button onClick={() => setActiveTab('portfolio')}
                    className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-sm text-[#F0EDE8] font-bold text-sm hover:bg-white/10 transition-all text-left">
                    <span>📸</span> Upload Portfolio Photos
                  </button>
                  <button onClick={() => setActiveTab('profile')}
                    className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-sm text-[#F0EDE8] font-bold text-sm hover:bg-white/10 transition-all text-left">
                    <span>⚙️</span> Edit Profile Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PACKAGES ────────────────────────────────────────────────── */}
        {activeTab === 'packages' && (
          <div className="p-8">
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-4xl font-black uppercase tracking-tight">
                  Service <span className="text-[#C9922A]">Packages</span>
                </h1>
                <p className="text-[#8A8E99] text-sm mt-1">
                  List your specific services and pricing. These appear on your public profile.
                </p>
              </div>
              <button onClick={openNewPkg}
                className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all">
                + Add Package
              </button>
            </header>

            {/* Package form */}
            {showPkgForm && (
              <div className="bg-[#13151A] border border-[#C9922A]/30 rounded-sm p-6 mb-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-xl font-black uppercase mb-5">
                  {editingPkg ? 'Edit' : 'New'} <span className="text-[#C9922A]">Package</span>
                </h2>
                {pkgError && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-sm p-3 text-red-400 text-sm font-bold">
                    {pkgError}
                  </div>
                )}
                <form onSubmit={savePkg} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={lbl}>Package Name <span className="text-red-400">*</span></label>
                    <input required value={pkgForm.name}
                      onChange={e => setPkgForm(p => ({ ...p, name: e.target.value }))}
                      className={inp} placeholder="e.g. Slide Milling & Optic Cut" />
                  </div>
                  <div>
                    <label className={lbl}>Price (R)</label>
                    <input type="number" min="0" step="0.01" value={pkgForm.price}
                      onChange={e => setPkgForm(p => ({ ...p, price: e.target.value }))}
                      className={inp} placeholder="e.g. 2500" />
                  </div>
                  <div>
                    <label className={lbl}>Duration / Turnaround</label>
                    <input value={pkgForm.duration}
                      onChange={e => setPkgForm(p => ({ ...p, duration: e.target.value }))}
                      className={inp} placeholder="e.g. 3–5 days, 2 hours" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={lbl}>Description</label>
                    <textarea rows={3} value={pkgForm.description}
                      onChange={e => setPkgForm(p => ({ ...p, description: e.target.value }))}
                      className={`${inp} resize-none`}
                      placeholder="What's included, requirements, any conditions..." />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-[#C9922A]"
                        checked={pkgForm.is_active}
                        onChange={e => setPkgForm(p => ({ ...p, is_active: e.target.checked }))} />
                      <span className="text-sm font-bold">Active (visible on profile)</span>
                    </label>
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <button type="submit" disabled={pkgSaving}
                      className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                      {pkgSaving ? 'Saving...' : editingPkg ? 'Update Package' : 'Add Package'}
                    </button>
                    <button type="button" onClick={() => setShowPkgForm(false)}
                      className="border border-white/10 text-[#8A8E99] font-bold text-sm px-5 py-2.5 rounded-sm hover:bg-white/5 transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Package list */}
            {packages.length === 0 && !showPkgForm ? (
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
                <div className="text-5xl mb-4 opacity-20">💼</div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase mb-2">No Packages Yet</h3>
                <p className="text-[#8A8E99] text-sm mb-6">
                  Add your specific services and pricing so clients know exactly what you offer.
                </p>
                <button onClick={openNewPkg}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
                  Add Your First Package
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {packages.map(pkg => (
                  <div key={pkg.id}
                    className={`bg-[#13151A] border rounded-sm p-5 flex items-start gap-4 transition-all ${
                      pkg.is_active ? 'border-white/5' : 'border-white/5 opacity-50'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                          className="text-lg font-black uppercase">{pkg.name}</h3>
                        {!pkg.is_active && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-white/10 text-[#8A8E99] rounded-sm">Hidden</span>
                        )}
                      </div>
                      {pkg.description && <p className="text-[13px] text-[#8A8E99] mb-2">{pkg.description}</p>}
                      <div className="flex items-center gap-4">
                        {pkg.price != null && (
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                            className="text-xl font-black text-[#C9922A]">R{Number(pkg.price).toLocaleString()}</span>
                        )}
                        {pkg.duration && <span className="text-[11px] text-[#8A8E99]">⏱ {pkg.duration}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => togglePkgActive(pkg)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${
                          pkg.is_active
                            ? 'border-[#2A9C6E]/30 text-[#2A9C6E] hover:bg-[#2A9C6E]/10'
                            : 'border-white/10 text-[#8A8E99] hover:bg-white/5'
                        }`}>
                        {pkg.is_active ? 'Active' : 'Hidden'}
                      </button>
                      <button onClick={() => openEditPkg(pkg)}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border border-white/10 text-[#8A8E99] hover:bg-white/5 transition-all">
                        Edit
                      </button>
                      <button onClick={() => deletePkg(pkg.id)}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PORTFOLIO ───────────────────────────────────────────────── */}
        {activeTab === 'portfolio' && (
          <div className="p-8">
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-4xl font-black uppercase tracking-tight">
                  Work <span className="text-[#C9922A]">Portfolio</span>
                </h1>
                <p className="text-[#8A8E99] text-sm mt-1">
                  {portfolio.length} / 20 photos · Showcase your best work to win clients.
                </p>
              </div>
              {portfolio.length < 20 && (
                <label className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all cursor-pointer">
                  {uploading ? 'Uploading...' : '+ Upload Photos'}
                  <input
                    ref={fileInputRef}
                    type="file" accept="image/*" multiple
                    onChange={handlePortfolioUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </header>

            {uploadError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-sm p-4 text-red-400 text-sm font-bold">
                ❌ {uploadError}
              </div>
            )}

            {uploading && (
              <div className="mb-6 bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <p className="text-[#C9922A] font-bold text-sm">Uploading photos...</p>
              </div>
            )}

            {portfolio.length === 0 ? (
              <label className="block cursor-pointer">
                <div className="bg-[#13151A] border-2 border-dashed border-white/10 rounded-sm p-16 text-center hover:border-[#C9922A]/30 transition-all">
                  <div className="text-6xl mb-4 opacity-20">📸</div>
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-2xl font-black uppercase mb-2">No Photos Yet</h3>
                  <p className="text-[#8A8E99] text-sm">Click to upload your first portfolio photos (max 20 images)</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple
                  onChange={handlePortfolioUpload} className="hidden" disabled={uploading} />
              </label>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {portfolio.map(item => (
                  <div key={item.id} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-sm border border-white/5 bg-[#13151A]">
                      <img src={item.image_url} alt={item.caption || ''}
                        className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                    </div>
                    {/* Caption */}
                    <input
                      type="text"
                      value={item.caption || ''}
                      onChange={e => setPortfolio(prev => prev.map(p => p.id === item.id ? { ...p, caption: e.target.value } : p))}
                      onBlur={e => updateCaption(item.id, e.target.value)}
                      placeholder="Add caption..."
                      className="w-full mt-1.5 bg-[#0D0F13] border border-white/10 rounded-sm px-2.5 py-1.5 text-[11px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    />
                    {/* Delete overlay */}
                    <button
                      onClick={() => deletePortfolioItem(item.id, item.image_url)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-xs font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                      ×
                    </button>
                  </div>
                ))}

                {/* Upload more slot */}
                {portfolio.length < 20 && (
                  <label className="cursor-pointer">
                    <div className="aspect-square border-2 border-dashed border-white/10 rounded-sm flex flex-col items-center justify-center hover:border-[#C9922A]/30 transition-all">
                      <span className="text-3xl opacity-20 mb-2">+</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Add More</span>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple
                      onChange={handlePortfolioUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE ─────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="p-8">
            <header className="mb-8">
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl font-black uppercase tracking-tight">
                Profile <span className="text-[#C9922A]">Settings</span>
              </h1>
              <p className="text-[#8A8E99] text-sm mt-1">
                Update your public profile information. Changes go live immediately.
              </p>
            </header>

            {profileSaved && (
              <div className="mb-6 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm p-4 text-[#2A9C6E] font-bold text-sm">
                ✅ Profile updated successfully.
              </div>
            )}

            <form onSubmit={saveProfile} className="flex flex-col gap-6">

              {/* Identity */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase mb-6 pb-3 border-b border-white/5">
                  Identity <span className="text-[#C9922A]">& Description</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={lbl}>Business / Service Name *</label>
                    <input required value={profileForm.name || ''}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      className={inp} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={lbl}>Description</label>
                    <textarea rows={5} value={profileForm.description || ''}
                      onChange={e => setProfileForm(p => ({ ...p, description: e.target.value }))}
                      className={`${inp} resize-none`} />
                  </div>
                  <div>
                    <label className={lbl}>Years in Business</label>
                    <input type="number" min="0" value={profileForm.years_experience || ''}
                      onChange={e => setProfileForm(p => ({ ...p, years_experience: parseInt(e.target.value) || undefined }))}
                      className={inp} placeholder="e.g. 8" />
                  </div>
                  <div>
                    <label className={lbl}>Service Area Note</label>
                    <input value={profileForm.service_area_note || ''}
                      onChange={e => setProfileForm(p => ({ ...p, service_area_note: e.target.value }))}
                      className={inp} placeholder="e.g. Nationwide · Western Cape" />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase mb-6 pb-3 border-b border-white/5">
                  Contact <span className="text-[#C9922A]">Details</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>Contact Person</label>
                    <input value={profileForm.contact_name || ''}
                      onChange={e => setProfileForm(p => ({ ...p, contact_name: e.target.value }))}
                      className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Phone</label>
                    <input value={profileForm.phone || ''}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>WhatsApp</label>
                    <input value={profileForm.whatsapp || ''}
                      onChange={e => setProfileForm(p => ({ ...p, whatsapp: e.target.value }))}
                      className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Website</label>
                    <input type="url" value={profileForm.website || ''}
                      onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))}
                      className={inp} placeholder="https://" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase mb-6 pb-3 border-b border-white/5">
                  Location
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={lbl}>Address</label>
                    <input value={profileForm.address || ''}
                      onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                      className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>City *</label>
                    <input required value={profileForm.city || ''}
                      onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                      className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Province *</label>
                    <select required value={profileForm.province || ''}
                      onChange={e => setProfileForm(p => ({ ...p, province: e.target.value }))}
                      className={inp}>
                      {PROVINCES.map(prov => <option key={prov}>{prov}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Postal Code</label>
                    <input value={profileForm.postal_code || ''}
                      onChange={e => setProfileForm(p => ({ ...p, postal_code: e.target.value }))}
                      className={inp} />
                  </div>
                </div>
              </div>

              {/* Accreditation */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-2xl font-black uppercase mb-6 pb-3 border-b border-white/5">
                  Accreditation
                </h2>
                <label className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 hover:border-[#C9922A]/30 transition-colors mb-4">
                  <input type="checkbox" className="accent-[#C9922A] w-4 h-4"
                    checked={!!profileForm.saps_accredited}
                    onChange={e => setProfileForm(p => ({ ...p, saps_accredited: e.target.checked }))} />
                  <div>
                    <p className="text-[13px] font-bold">SAPS Accredited / Registered</p>
                    <p className="text-[11px] text-[#8A8E99]">Displays a trust badge on your public profile</p>
                  </div>
                </label>
                {profileForm.saps_accredited && (
                  <div>
                    <label className={lbl}>Accreditation / Registration Number</label>
                    <input value={profileForm.accreditation_number || ''}
                      onChange={e => setProfileForm(p => ({ ...p, accreditation_number: e.target.value }))}
                      className={inp} placeholder="e.g. WC/INSTR/2024/001" />
                  </div>
                )}
              </div>

              {/* Save */}
              <div className="flex items-center gap-4">
                <button type="submit" disabled={profileSaving}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-10 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
