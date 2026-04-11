'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS = {
  Monday:    { open: true,  from: '08:00', to: '17:00' },
  Tuesday:   { open: true,  from: '08:00', to: '17:00' },
  Wednesday: { open: true,  from: '08:00', to: '17:00' },
  Thursday:  { open: true,  from: '08:00', to: '17:00' },
  Friday:    { open: true,  from: '08:00', to: '17:00' },
  Saturday:  { open: true,  from: '08:00', to: '13:00' },
  Sunday:    { open: false, from: '08:00', to: '13:00' },
};

type BusinessHours = {
  [day: string]: { open: boolean; from: string; to: string };
};

type Dealer = {
  id: string;
  business_name: string;
  slug: string;
  subscription_tier: string;
  status: string;
  email: string;
  phone: string;
  alternate_phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  website: string;
  description: string;
  logo_url: string;
  banner_url: string;
  business_hours: BusinessHours | null;
  saps_dealer_number: string;
};

export default function DealerProfilePage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Image states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [uploadingImages, setUploadingImages] = useState(false);

  // Editable form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    alternate_phone: '',
    city: '',
    province: 'Gauteng',
    postal_code: '',
    website: '',
    description: '',
  });

  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }

    const { data: dealerData } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!dealerData || dealerData.status !== 'approved') {
      router.push('/dealer/login');
      return;
    }

    setDealer(dealerData);
    setFormData({
      email: dealerData.email || '',
      phone: dealerData.phone || '',
      alternate_phone: dealerData.alternate_phone || '',
      city: dealerData.city || '',
      province: dealerData.province || 'Gauteng',
      postal_code: dealerData.postal_code || '',
      website: dealerData.website || '',
      description: dealerData.description || '',
    });

    setLogoPreview(dealerData.logo_url || '');
    setBannerPreview(dealerData.banner_url || '');

    if (dealerData.business_hours) {
      setBusinessHours(dealerData.business_hours);
    }

    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleHoursChange = (day: string, field: 'open' | 'from' | 'to', value: any) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${dealer!.id}/${path}-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('dealer-profiles')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from('dealer-profiles')
      .getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      let logo_url = dealer!.logo_url;
      let banner_url = dealer!.banner_url;

      setUploadingImages(true);
      if (logoFile) logo_url = await uploadImage(logoFile, 'logo');
      if (bannerFile) banner_url = await uploadImage(bannerFile, 'banner');
      setUploadingImages(false);

      const { error } = await supabase
        .from('dealers')
        .update({
          email: formData.email,
          phone: formData.phone,
          alternate_phone: formData.alternate_phone,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          website: formData.website,
          description: formData.description,
          logo_url,
          banner_url,
          business_hours: businessHours,
        })
        .eq('id', dealer!.id);

      if (error) throw error;

      setDealer((prev) => prev ? {
        ...prev,
        ...formData,
        logo_url,
        banner_url,
        business_hours: businessHours,
      } : prev);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
      setUploadingImages(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-[#C9922A] text-xl font-bold">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#13151A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex flex-col items-start group">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase group-hover:text-[#C9922A] transition-colors">
              GUN <span className="text-[#C9922A] group-hover:text-[#F0EDE8]">X</span>
            </span>
            <span className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">Dealer Dashboard</span>
          </Link>
        </div>

        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C9922A] flex items-center justify-center text-black text-xl font-black rounded-sm overflow-hidden">
              {dealer?.logo_url ? (
                <img src={logoPreview || dealer.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                dealer?.business_name?.charAt(0) || 'D'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{dealer?.business_name}</h3>
              <p className="text-xs text-[#8A8E99] uppercase tracking-wider">{dealer?.subscription_tier || 'Free'} Plan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/dealer-dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📊</span><span>Overview</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📦</span><span>Inventory</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/add-listing" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>➕</span><span>Add Listing</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/bulk-upload" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📁</span><span>Bulk Upload</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/analytics" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📈</span><span>Analytics</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/subscription" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>💳</span><span>Subscription</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/profile" className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm">
                <span>⚙️</span><span>Profile</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/promote" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>⭐</span><span>Promote Listings</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link href={`/dealers/${dealer?.slug}`} target="_blank" className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors">
            View Storefront
          </Link>
          <button onClick={handleLogout} className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight">
              Storefront <span className="text-[#C9922A]">Profile</span>
            </h1>
            <p className="text-[#8A8E99] text-sm mt-1">Manage your public dealer profile and storefront appearance.</p>
          </div>
          <Link href={`/dealers/${dealer?.slug}`} target="_blank" className="text-[#C9922A] border border-[#C9922A]/30 px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-[#C9922A]/10 transition-all">
            View Storefront →
          </Link>
        </header>

        <form onSubmit={handleSave}>
          <div className="p-8 space-y-8">

            {/* Success / Error */}
            {saveSuccess && (
              <div className="p-4 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm text-[#2A9C6E] font-bold text-sm">
                ✅ Profile saved successfully!
              </div>
            )}
            {saveError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 font-bold text-sm">
                ❌ {saveError}
              </div>
            )}

            {/* LOCKED INFO NOTICE */}
            <div className="p-5 bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm flex items-start gap-4">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-[#C9922A] mb-1">Locked Fields</p>
                <p className="text-sm text-[#8A8E99]">
                  <strong className="text-[#F0EDE8]">Business name, SAPS dealer number, and trading address</strong> are locked after approval. To request changes, email{' '}
                  <a href="mailto:admin@gunx.co.za" className="text-[#C9922A] hover:brightness-125">admin@gunx.co.za</a> with your request and supporting documentation.
                </p>
              </div>
            </div>

            {/* SECTION 1 — Locked Info */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                Business <span className="text-[#C9922A]">Identity</span>
                <span className="ml-3 text-[11px] font-bold text-[#8A8E99] border border-white/10 px-2 py-1 rounded-sm normal-case tracking-normal">🔒 Locked</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Business Name</label>
                  <div className="w-full bg-[#0D0F13]/50 border border-white/5 rounded-sm px-4 py-3 text-sm text-[#8A8E99] cursor-not-allowed">
                    {dealer?.business_name}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">SAPS Dealer Number</label>
                  <div className="w-full bg-[#0D0F13]/50 border border-white/5 rounded-sm px-4 py-3 text-sm text-[#8A8E99] cursor-not-allowed">
                    {dealer?.saps_dealer_number}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Trading Address</label>
                  <div className="w-full bg-[#0D0F13]/50 border border-white/5 rounded-sm px-4 py-3 text-sm text-[#8A8E99] cursor-not-allowed">
                    {dealer?.address || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2 — Storefront Visuals */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                Storefront <span className="text-[#C9922A]">Visuals</span>
              </h2>

              {/* Banner */}
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">
                  Banner Image <span className="text-[#8A8E99] font-normal normal-case tracking-normal">(recommended 1400×320px)</span>
                </label>
                <div className="relative w-full h-[160px] bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden mb-3">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[#8A8E99] text-sm font-bold">No banner uploaded</span>
                    </div>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-sm text-sm font-bold hover:bg-white/10 transition-all">
                  📷 Upload Banner
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">
                  Logo <span className="text-[#8A8E99] font-normal normal-case tracking-normal">(recommended 400×400px, square)</span>
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-[#C9922A]">
                        {dealer?.business_name?.charAt(0) || 'D'}
                      </span>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 px-4 py-2 rounded-sm text-sm font-bold hover:bg-white/10 transition-all">
                    📷 Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION 3 — About */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                About <span className="text-[#C9922A]">Your Business</span>
              </h2>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">
                  Business Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Tell customers about your dealership — your specialties, history, services offered..."
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50 resize-none"
                />
                <p className="text-[10px] text-[#8A8E99] mt-2">This appears on your public storefront under the "About" tab.</p>
              </div>
            </div>

            {/* SECTION 4 — Contact Details */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                Contact <span className="text-[#C9922A]">Details</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    placeholder="dealer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    placeholder="e.g. 011 234 5678"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Alternate Phone</label>
                  <input
                    type="tel"
                    name="alternate_phone"
                    value={formData.alternate_phone}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    placeholder="e.g. 082 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    placeholder="https://www.yoursite.co.za"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    placeholder="e.g. Cape Town"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Province</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    placeholder="e.g. 8001"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5 — Business Hours */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                Business <span className="text-[#C9922A]">Hours</span>
              </h2>
              <div className="space-y-3">
                {DAYS.map((day) => (
                  <div key={day} className="grid grid-cols-[140px_80px_1fr] items-center gap-4 py-3 border-b border-white/5 last:border-0">

                    {/* Day label */}
                    <span className="text-sm font-black uppercase tracking-widest text-[#F0EDE8]">{day}</span>

                    {/* Open/Closed toggle */}
                    <button
                      type="button"
                      onClick={() => handleHoursChange(day, 'open', !businessHours[day]?.open)}
                      className={`px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                        businessHours[day]?.open
                          ? 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/30'
                          : 'bg-white/5 text-[#8A8E99] border border-white/10'
                      }`}
                    >
                      {businessHours[day]?.open ? 'Open' : 'Closed'}
                    </button>

                    {/* Time inputs */}
                    {businessHours[day]?.open ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={businessHours[day]?.from || '08:00'}
                          onChange={(e) => handleHoursChange(day, 'from', e.target.value)}
                          className="bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                        />
                        <span className="text-[#8A8E99] text-sm font-bold">to</span>
                        <input
                          type="time"
                          value={businessHours[day]?.to || '17:00'}
                          onChange={(e) => handleHoursChange(day, 'to', e.target.value)}
                          className="bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                        />
                      </div>
                    ) : (
                      <span className="text-[#8A8E99] text-sm font-bold">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="flex items-center justify-end gap-4 pb-8">
              <Link
                href="/dealer-dashboard"
                className="px-6 py-3 border border-white/10 rounded-sm text-sm font-black uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#C9922A] text-black px-10 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? uploadingImages
                    ? 'Uploading Images...'
                    : 'Saving...'
                  : 'Save Profile'}
              </button>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}