'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState('active');

  const [formData, setFormData] = useState({
    title: '',
    make_id: '',
    calibre_id: '',
    condition_id: '',
    price: '',
    category_id: '',
    city: '',
    description: '',
    model: '',
    action_type: '',
    barrel_length: '',
    capacity: '',
  });

  useEffect(() => { loadData(); }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) { router.push('/login'); return; }
      setUser(currentUser);

      const [listingRes, makesRes, calibresRes, conditionsRes] = await Promise.all([
        supabase.from('listings').select('*').eq('id', params.id).single(),
        supabase.from('makes').select('*').order('name'),
        supabase.from('calibres').select('*').order('name'),
        supabase.from('conditions').select('*').order('name'),
      ]);

      if (listingRes.error) throw listingRes.error;
      const listing = listingRes.data;

      if (listing.seller_id !== currentUser.id) {
        alert('You do not have permission to edit this listing');
        router.push('/dashboard');
        return;
      }

      setFormData({
        title: listing.title || '',
        make_id: listing.make_id || '',
        calibre_id: listing.calibre_id || '',
        condition_id: listing.condition_id || '',
        price: listing.price?.toString() || '',
        category_id: listing.category_id || '',
        city: listing.city || '',
        description: listing.description || '',
        model: listing.model || '',
        action_type: listing.action_type || '',
        barrel_length: listing.barrel_length || '',
        capacity: listing.capacity || '',
      });

      setCurrentStatus(listing.status || 'active');
      setExistingImages(listing.images || []);
      setMakes(makesRes.data || []);
      setCalibres(calibresRes.data || []);
      setConditions(conditionsRes.data || []);
    } catch (error) {
      console.error('Error loading listing:', error);
      alert('Failed to load listing');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = existingImages.length + newImages.length + files.length;
    if (total > 5) { alert('Maximum 5 images allowed'); return; }
    setNewImages(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const uploadImages = async () => {
    if (newImages.length === 0) return [];
    const uploadedUrls: string[] = [];
    for (const file of newImages) {
      const ext = file.name.split('.').pop();
      const filePath = `listings/${user.id}/${Math.random().toString(36).substring(2)}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newUrls = await uploadImages();
      const { error } = await supabase.from('listings').update({
        title: formData.title,
        make_id: formData.make_id || null,
        calibre_id: formData.calibre_id || null,
        condition_id: formData.condition_id || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        city: formData.city,
        description: formData.description,
        model: formData.model,
        action_type: formData.action_type || null,
        barrel_length: formData.barrel_length || null,
        capacity: formData.capacity || null,
        images: [...existingImages, ...newUrls],
        status: currentStatus,
      }).eq('id', params.id);

      if (error) throw error;
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this listing permanently?')) return;
    try {
      await supabase.from('listings').delete().eq('id', params.id);
      router.push('/dashboard');
    } catch (error) {
      alert('Failed to delete listing');
    }
  };

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 transition-colors";
  const labelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";
  const sectionClass = "bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#C9922A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#8A8E99]">Loading listing...</p>
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
            <Link href="/dashboard" className="hover:text-[#C9922A]">Dashboard</Link>
            <span>/</span>
            <Link href="/dashboard/listings" className="hover:text-[#C9922A]">My Listings</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Edit</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase mb-1">
            Edit <span className="text-[#C9922A]">Listing</span>
          </h1>
          <p className="text-[13px] text-[#8A8E99]">Update your listing details below</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Status */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Listing Status
            </h2>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'active', label: 'Active', color: 'bg-[#2A9C6E] text-white' },
                { id: 'under_offer', label: 'Under Offer', color: 'bg-[#C9922A] text-black' },
                { id: 'sold', label: 'Sold', color: 'bg-red-500 text-white' },
              ].map(s => (
                <button key={s.id} type="button" onClick={() => setCurrentStatus(s.id)}
                  className={`px-5 py-2.5 rounded-sm font-black text-[13px] uppercase tracking-widest transition-all ${
                    currentStatus === s.id ? s.color : 'border border-white/20 text-[#8A8E99] hover:bg-white/5'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Title <span className="text-red-400">*</span></label>
                <input name="title" value={formData.title} onChange={handleChange} required className={inputClass} placeholder="e.g., Glock 19 Gen 5 9mm" />
              </div>
              <div>
                <label className={labelClass}>Category <span className="text-red-400">*</span></label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} required className={inputClass}>
                  <option value="">Select category...</option>
                  {['pistols','revolvers','rifles','shotguns','air-guns','airsoft','ammunition','holsters','magazines','reloading','knives'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Price (R) <span className="text-red-400">*</span></label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required className={inputClass} placeholder="12500" />
              </div>
              <div>
                <label className={labelClass}>Make</label>
                <select name="make_id" value={formData.make_id} onChange={handleChange} className={inputClass}>
                  <option value="">Select make...</option>
                  {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Model</label>
                <input name="model" value={formData.model} onChange={handleChange} className={inputClass} placeholder="e.g., 19 Gen 5" />
              </div>
              <div>
                <label className={labelClass}>Calibre</label>
                <select name="calibre_id" value={formData.calibre_id} onChange={handleChange} className={inputClass}>
                  <option value="">Select calibre...</option>
                  {calibres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Condition <span className="text-red-400">*</span></label>
                <select name="condition_id" value={formData.condition_id} onChange={handleChange} required className={inputClass}>
                  <option value="">Select condition...</option>
                  {conditions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Action Type</label>
                <input name="action_type" value={formData.action_type} onChange={handleChange} className={inputClass} placeholder="e.g., Semi-Auto" />
              </div>
              <div>
                <label className={labelClass}>Barrel Length (inches)</label>
                <input type="number" step="0.1" name="barrel_length" value={formData.barrel_length} onChange={handleChange} className={inputClass} placeholder="4.5" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Location
            </h2>
            <div>
              <label className={labelClass}>City / Province <span className="text-red-400">*</span></label>
              <input name="city" value={formData.city} onChange={handleChange} required className={inputClass} placeholder="e.g., Cape Town, Western Cape" />
            </div>
          </div>

          {/* Description */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Description
            </h2>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={5}
              className={`${inputClass} resize-none`}
              placeholder="Describe your firearm — condition, accessories included, reason for selling..." />
          </div>

          {/* Images */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest border-b border-white/5 pb-3 mb-4">
              Photos <span className="text-[#8A8E99] normal-case font-normal text-sm">({existingImages.length + newImages.length}/5)</span>
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
              {existingImages.map((url, idx) => (
                <div key={`e-${idx}`} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#C9922A] text-black text-[8px] font-black uppercase text-center py-0.5">Cover</div>}
                  <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ))}
              {imagePreviews.map((preview, idx) => (
                <div key={`n-${idx}`} className="relative aspect-square bg-[#0D0F13] border border-[#C9922A]/30 rounded-sm overflow-hidden group">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-1 left-1 bg-[#C9922A] text-black text-[7px] font-black px-1 rounded-sm">New</div>
                  <button type="button" onClick={() => {
                    setNewImages(prev => prev.filter((_, i) => i !== idx));
                    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                  }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    ×
                  </button>
                </div>
              ))}
              {(existingImages.length + newImages.length) < 5 && (
                <label className="aspect-square bg-[#0D0F13] border-2 border-dashed border-white/20 rounded-sm flex items-center justify-center cursor-pointer hover:border-[#C9922A]/50 transition-colors">
                  <div className="text-center">
                    <span className="text-2xl text-[#8A8E99]">+</span>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={saving}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/dashboard/listings"
              className="sm:w-auto px-8 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 transition-all text-center">
              Cancel
            </Link>
            <button type="button" onClick={handleDelete}
              className="sm:w-auto px-6 py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-red-500/20 transition-all">
              Delete
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}