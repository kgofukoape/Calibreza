'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  { id: 'pistols', label: 'Pistols' },
  { id: 'rifles', label: 'Rifles' },
  { id: 'shotguns', label: 'Shotguns' },
  { id: 'revolvers', label: 'Revolvers' },
  { id: 'air-guns', label: 'Air Guns' },
  { id: 'airsoft', label: 'Airsoft' },
  { id: 'knives', label: 'Knives' },
  { id: 'holsters', label: 'Holsters & Carry' },
  { id: 'magazines', label: 'Magazines' },
  { id: 'ammunition', label: 'Ammunition' },
  { id: 'reloading', label: 'Reloading' },
];

const STATUSES = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'under-offer', label: 'Under Offer' },
  { id: 'sold', label: 'Sold' },
];

type Dealer = {
  id: string;
  business_name: string;
  slug: string;
  subscription_tier: string;
  status: string;
  province: string;
  city: string;
};

function AddListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    is_negotiable: false,
    category_id: 'pistols',
    make_id: '',
    model: '',
    calibre_id: '',
    condition_id: '',
    action_type: '',
    barrel_length: '',
    capacity: '',
    overall_length: '',
    weight: '',
    licence_type: '',
    province_id: '',
    city: '',
    status: 'active',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }

    setAuthUser(user);

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
    await loadLookups();

    if (isEditMode && editId) {
      await loadListing(editId, dealerData.id);
    }

    setLoading(false);
  };

  const loadLookups = async () => {
    const [makesRes, calibresRes, conditionsRes, provincesRes] = await Promise.all([
      supabase.from('makes').select('id, name').order('name'),
      supabase.from('calibres').select('id, name').order('name'),
      supabase.from('conditions').select('id, name').order('name'),
      supabase.from('provinces').select('id, name').order('name'),
    ]);
    setMakes(makesRes.data || []);
    setCalibres(calibresRes.data || []);
    setConditions(conditionsRes.data || []);
    setProvinces(provincesRes.data || []);
  };

  const loadListing = async (id: string, dealerId: string) => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .eq('dealer_id', dealerId)
      .single();

    if (error || !data) {
      router.push('/dealer-dashboard/inventory');
      return;
    }

    setFormData({
      title: data.title || '',
      description: data.description || '',
      price: data.price?.toString() || '',
      is_negotiable: data.is_negotiable || false,
      category_id: data.category_id || 'pistols',
      make_id: data.make_id || '',
      model: data.model || '',
      calibre_id: data.calibre_id || '',
      condition_id: data.condition_id || '',
      action_type: data.action_type || '',
      barrel_length: data.barrel_length || '',
      capacity: data.capacity || '',
      overall_length: data.overall_length || '',
      weight: data.weight || '',
      licence_type: data.licence_type || '',
      province_id: data.province_id || '',
      city: data.city || '',
      status: data.status || 'active',
    });

    setExistingImages(data.images || []);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + images.length + files.length;
    if (totalImages > 5) {
      alert('Maximum 5 images per listing.');
      return;
    }
    setImages((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls((prev) => [...prev, ...previews]);
  };

  const handleRemoveNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (dealerId: string): Promise<string[]> => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (const file of images) {
      const ext = file.name.split('.').pop();
      const fileName = `${dealerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('listings')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('listings')
          .getPublicUrl(data.path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    setUploadingImages(false);
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    if (!formData.title || !formData.price || !formData.category_id) {
      setSubmitError('Please fill in all required fields (Title, Price, Category).');
      setSubmitting(false);
      return;
    }

    const newImageUrls = await uploadImages(dealer!.id);
    const allImages = [...existingImages, ...newImageUrls];

    const payload = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      is_negotiable: formData.is_negotiable,
      category_id: formData.category_id,
      make_id: formData.make_id || null,
      model: formData.model,
      calibre_id: formData.calibre_id || null,
      condition_id: formData.condition_id || null,
      action_type: formData.action_type,
      barrel_length: formData.barrel_length,
      capacity: formData.capacity,
      overall_length: formData.overall_length,
      weight: formData.weight,
      licence_type: formData.licence_type,
      province_id: formData.province_id || null,
      city: formData.city,
      status: formData.status,
      images: allImages,
      dealer_id: dealer!.id,
      listing_type: 'dealer',
      updated_at: new Date().toISOString(),
    };

    let error;

    if (isEditMode && editId) {
      const { error: updateError } = await supabase
        .from('listings')
        .update(payload)
        .eq('id', editId)
        .eq('dealer_id', dealer!.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('listings')
        .insert({
          ...payload,
          views_count: 0,
          is_featured: false,
        });
      error = insertError;
    }

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    setSubmitSuccess(true);
    setTimeout(() => router.push('/dealer-dashboard/inventory'), 1500);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-[#C9922A] text-xl font-bold">Loading...</div>
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
            <div className="w-12 h-12 bg-[#C9922A] flex items-center justify-center text-black text-xl font-black rounded-sm">
              {dealer?.business_name?.charAt(0) || 'D'}
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
              <Link href="/dealer-dashboard/add-listing" className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm">
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
              <Link href="/dealer-dashboard/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
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
          <Link href={`/dealers/${dealer?.slug}`} className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors">
            View Storefront
          </Link>
          <button onClick={handleLogout} className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">

        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight">
              {isEditMode ? 'Edit' : 'Add'} <span className="text-[#C9922A]">Listing</span>
            </h1>
            <p className="text-[#8A8E99] text-sm mt-1">
              {isEditMode ? 'Update your listing details below.' : 'Fill in the details to create a new listing.'}
            </p>
          </div>
          <Link href="/dealer-dashboard/inventory" className="text-[#8A8E99] border border-white/10 px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
            ← Back to Inventory
          </Link>
        </header>

        <div className="p-8">
          {submitSuccess && (
            <div className="mb-6 p-4 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm text-[#2A9C6E] font-bold text-sm">
              ✅ Listing {isEditMode ? 'updated' : 'created'} successfully! Redirecting to inventory...
            </div>
          )}

          {submitError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 font-bold text-sm">
              ❌ {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* SECTION 1 — Basic Info */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                Basic <span className="text-[#C9922A]">Info</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Glock 19 Gen 5 — Excellent Condition"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Make</label>
                  <select
                    name="make_id"
                    value={formData.make_id}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                  >
                    <option value="">Select Make</option>
                    {makes.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g. 19 Gen 5"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Condition</label>
                  <select
                    name="condition_id"
                    value={formData.condition_id}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                  >
                    <option value="">Select Condition</option>
                    {conditions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Licence Type</label>
                  <input
                    type="text"
                    name="licence_type"
                    value={formData.licence_type}
                    onChange={handleInputChange}
                    placeholder="e.g. Section 13, Section 15"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Describe the item — condition, history, included accessories, reason for selling..."
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2 — Specifications */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Calibre</label>
                  <select
                    name="calibre_id"
                    value={formData.calibre_id}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                  >
                    <option value="">Select Calibre</option>
                    {calibres.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Action Type</label>
                  <input
                    type="text"
                    name="action_type"
                    value={formData.action_type}
                    onChange={handleInputChange}
                    placeholder="e.g. Semi-Auto, Bolt Action"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Capacity</label>
                  <input
                    type="text"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    placeholder="e.g. 15+1"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Barrel Length</label>
                  <input
                    type="text"
                    name="barrel_length"
                    value={formData.barrel_length}
                    onChange={handleInputChange}
                    placeholder="e.g. 102mm"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Overall Length</label>
                  <input
                    type="text"
                    name="overall_length"
                    value={formData.overall_length}
                    onChange={handleInputChange}
                    placeholder="e.g. 187mm"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Weight</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g. 705g"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3 — Pricing & Location */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                Pricing & <span className="text-[#C9922A]">Location</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">
                    Price (R) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 12500"
                    min="0"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                    required
                  />
                </div>

                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_negotiable"
                      checked={formData.is_negotiable}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-[#C9922A]"
                    />
                    <span className="text-sm font-bold text-[#F0EDE8]">Price Negotiable (ONO)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Province</label>
                  <select
                    name="province_id"
                    value={formData.province_id}
                    onChange={handleInputChange}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/50"
                  >
                    <option value="">Select Province</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Cape Town"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-sm text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4 — Images */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">
                Images
              </h2>
              <p className="text-[#8A8E99] text-xs mb-6">Maximum 5 images per listing. First image will be the cover photo.</p>

              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Current Images</p>
                  <div className="flex flex-wrap gap-3">
                    {existingImages.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-sm overflow-hidden border border-white/10">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-black hover:bg-red-600 transition-all"
                        >
                          ×
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-[#C9922A] text-black text-[8px] font-black uppercase text-center py-0.5">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imagePreviewUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">New Images</p>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviewUrls.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-sm overflow-hidden border border-[#C9922A]/30">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-black hover:bg-red-600 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(existingImages.length + images.length) < 5 && (
                <label className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-white/10 rounded-sm py-8 cursor-pointer hover:border-[#C9922A]/30 transition-all">
                  <span className="text-3xl">📷</span>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#F0EDE8]">Click to upload images</p>
                    <p className="text-xs text-[#8A8E99]">
                      {5 - existingImages.length - images.length} image{(5 - existingImages.length - images.length) !== 1 ? 's' : ''} remaining · JPG, PNG, WEBP
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* SUBMIT */}
            <div className="flex items-center justify-between">
              <Link
                href="/dealer-dashboard/inventory"
                className="px-6 py-3 border border-white/10 rounded-sm text-sm font-black uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || uploadingImages}
                className="bg-[#C9922A] text-black px-10 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? uploadingImages
                    ? 'Uploading Images...'
                    : 'Saving...'
                  : isEditMode
                  ? 'Update Listing'
                  : 'Publish Listing'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

export default function AddListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-[#C9922A] text-xl font-bold">Loading...</div>
      </div>
    }>
      <AddListingForm />
    </Suspense>
  );
}