'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function SellPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [listingId, setListingId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: 'pistols',
    make_id: '',
    model: '',
    calibre_id: '',
    condition_id: '',
    barrel_length: '',
    action_type: '',
    capacity: '',
    province_id: '',
    city: '',
    fca_compliant: false,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) { router.push('/login'); return; }
    setUser(currentUser);

    const [makesData, calibresData, conditionsData, provincesData] = await Promise.all([
      supabase.from('makes').select('*').order('name'),
      supabase.from('calibres').select('*').order('name'),
      supabase.from('conditions').select('*').order('name'),
      supabase.from('provinces').select('*').order('name'),
    ]);

    setMakes(makesData.data || []);
    setCalibres(calibresData.data || []);
    setConditions(conditionsData.data || []);
    setProvinces(provincesData.data || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) { alert('Maximum 5 images allowed'); return; }
    setImages([...images, ...files]);
    setImagePreviewUrls([...imagePreviewUrls, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(formData as any).fca_compliant) { alert('Please confirm FCA compliance before submitting.'); return; }
    setLoading(true);

    try {
      const resolvedConditionId = conditions.find(c =>
        String(c.id).trim() === formData.condition_id.trim() ||
        c.name.toLowerCase() === formData.condition_id.toLowerCase()
      )?.id;

      if (!resolvedConditionId) throw new Error('Please select a valid condition.');

      const uploadedImageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const filePath = `listings/${user.id}/${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, image);
        if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        uploadedImageUrls.push(publicUrl);
      }

      const { data, error } = await supabase.from('listings').insert({
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        make_id: formData.make_id || null,
        model: formData.model,
        calibre_id: formData.calibre_id || null,
        condition_id: resolvedConditionId,
        barrel_length: formData.barrel_length || null,
        action_type: formData.action_type || null,
        capacity: formData.capacity || null,
        province_id: formData.province_id,
        city: formData.city,
        images: uploadedImageUrls,
        listing_type: 'private',
        status: 'active',
      }).select('id').single();

      if (error) throw new Error(`Failed to create listing: ${error.message}`);
      setListingId(data.id);
      setSubmitted(true);
    } catch (error: any) {
      alert(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-3">
              Listing <span className="text-[#C9922A]">Posted!</span>
            </h1>
            <p className="text-[#8A8E99] mb-8">Your listing is now live and visible to buyers across South Africa.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/listings/${listingId}`} className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-3 px-6 hover:brightness-110 transition-all text-center rounded-sm">
                View Listing
              </Link>
              <Link href="/dashboard" className="flex-1 border border-white/10 text-white font-black uppercase tracking-widest text-[13px] py-3 px-6 hover:bg-white/5 transition-all text-center rounded-sm">
                My Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[#F0EDE8] text-[14px] focus:outline-none focus:border-[#C9922A]/60 transition-colors";
  const labelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";
  const sectionClass = "bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6";

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-6 py-6 md:py-10">

        {/* Header */}
        <div className="mb-6">
          <div className="text-[11px] text-[#8A8E99] uppercase tracking-widest mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Post a Listing</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase text-[#F0EDE8] mb-1">
            Post a <span className="text-[#C9922A]">Listing</span>
          </h1>
          <p className="text-[13px] text-[#8A8E99]">Fill in the details to list your firearm for sale</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Basic Info */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest text-[#F0EDE8] mb-4 pb-3 border-b border-white/5">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Title <span className="text-red-400">*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required
                  className={inputClass} placeholder="e.g., Glock 19 Gen 5 — Excellent Condition" />
              </div>
              <div>
                <label className={labelClass}>Category <span className="text-red-400">*</span></label>
                <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className={inputClass}>
                  <option value="pistols">Pistols</option>
                  <option value="revolvers">Revolvers</option>
                  <option value="rifles">Rifles</option>
                  <option value="shotguns">Shotguns</option>
                  <option value="air-guns">Air Guns</option>
                  <option value="airsoft">Airsoft</option>
                  <option value="ammunition">Ammunition</option>
                  <option value="holsters">Holsters</option>
                  <option value="magazines">Magazines</option>
                  <option value="reloading">Reloading</option>
                  <option value="knives">Knives</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Condition <span className="text-red-400">*</span></label>
                <select name="condition_id" value={formData.condition_id} onChange={handleInputChange} required className={inputClass}>
                  <option value="">Select condition...</option>
                  {conditions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Price (ZAR) <span className="text-red-400">*</span></label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} required
                  className={inputClass} placeholder="12500" />
              </div>
            </div>
          </div>

          {/* Firearm Details */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest text-[#F0EDE8] mb-4 pb-3 border-b border-white/5">
              Firearm Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Make</label>
                <select name="make_id" value={formData.make_id} onChange={handleInputChange} className={inputClass}>
                  <option value="">Select make...</option>
                  {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Model <span className="text-red-400">*</span></label>
                <input type="text" name="model" value={formData.model} onChange={handleInputChange} required
                  className={inputClass} placeholder="e.g., 19 Gen 5" />
              </div>
              <div>
                <label className={labelClass}>Calibre</label>
                <select name="calibre_id" value={formData.calibre_id} onChange={handleInputChange} className={inputClass}>
                  <option value="">Select calibre...</option>
                  {calibres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Action Type</label>
                <input type="text" name="action_type" value={formData.action_type} onChange={handleInputChange}
                  className={inputClass} placeholder="e.g., Semi-Auto, Bolt-Action" />
              </div>
              <div>
                <label className={labelClass}>Barrel Length (inches)</label>
                <input type="number" step="0.1" name="barrel_length" value={formData.barrel_length} onChange={handleInputChange}
                  className={inputClass} placeholder="4.5" />
              </div>
              <div>
                <label className={labelClass}>Capacity (rounds)</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange}
                  className={inputClass} placeholder="15" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest text-[#F0EDE8] mb-4 pb-3 border-b border-white/5">
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Province <span className="text-red-400">*</span></label>
                <select name="province_id" value={formData.province_id} onChange={handleInputChange} required className={inputClass}>
                  <option value="">Select province...</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>City / Town <span className="text-red-400">*</span></label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} required
                  className={inputClass} placeholder="e.g., Cape Town" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest text-[#F0EDE8] mb-4 pb-3 border-b border-white/5">
              Description
            </h2>
            <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={5}
              className={`${inputClass} resize-none`}
              placeholder="Describe your firearm — condition, accessories included, reason for selling, etc." />
          </div>

          {/* Images */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest text-[#F0EDE8] mb-1 pb-3 border-b border-white/5">
              Photos
            </h2>
            <p className="text-[12px] text-[#8A8E99] mb-4">Add up to 5 photos. First photo will be the cover image.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden">
                  <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[12px] hover:bg-red-600">
                    ×
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#C9922A] text-black text-[8px] font-black uppercase tracking-wider text-center py-0.5">
                      Cover
                    </div>
                  )}
                </div>
              ))}
              {images.length < 5 && (
                <label className="aspect-square bg-[#0D0F13] border-2 border-dashed border-white/20 rounded-sm flex items-center justify-center cursor-pointer hover:border-[#C9922A]/50 transition-colors">
                  <div className="text-center">
                    <span className="text-2xl text-[#8A8E99] block">+</span>
                    <p className="text-[9px] text-[#8A8E99] mt-1">{images.length}/5</p>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* FCA Compliance */}
          <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="fca_compliant"
                checked={(formData as any).fca_compliant}
                onChange={handleInputChange}
                className="mt-0.5 w-4 h-4 accent-[#C9922A] flex-shrink-0"
              />
              <span className="text-[13px] text-[#F0EDE8] leading-relaxed">
                I confirm this listing complies with the <strong className="text-[#C9922A]">Firearms Control Act (Act 60 of 2000)</strong>. I am the lawful owner of this firearm or am authorised to sell it. I understand that all transfers must go through a licensed dealer.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={loading}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Posting...' : 'Post Listing — Free'}
            </button>
            <button type="button" onClick={() => router.push('/dashboard')}
              className="sm:w-auto px-8 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}