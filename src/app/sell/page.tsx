'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const CATEGORIES = [
  { value: 'pistols', label: 'Pistols' },
  { value: 'revolvers', label: 'Revolvers' },
  { value: 'rifles', label: 'Rifles' },
  { value: 'shotguns', label: 'Shotguns' },
  { value: 'air-guns', label: 'Air Guns' },
  { value: 'airsoft', label: 'Airsoft' },
  { value: 'ammunition', label: 'Ammunition' },
  { value: 'holsters', label: 'Holsters & Carry' },
  { value: 'magazines', label: 'Magazines' },
  { value: 'reloading', label: 'Reloading' },
  { value: 'knives', label: 'Knives & Blades' },
];

const ACTION_TYPES = [
  'Semi-Auto', 'Bolt Action', 'Pump Action', 'Lever Action',
  'Single Action', 'Double Action', 'Double Action Only',
  'Break Action', 'Revolver', 'Full Auto', 'Spring Piston', 'AEG',
];

export default function SellPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [successListingId, setSuccessListingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

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
    province: '',
    city: '',
    licence_type: 'Section 13',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    const [makesRes, calibresRes, conditionsRes] = await Promise.all([
      supabase.from('makes').select('*').order('name'),
      supabase.from('calibres').select('*').order('name'),
      supabase.from('conditions').select('*').order('name'),
    ]);

    setMakes(makesRes.data || []);
    setCalibres(calibresRes.data || []);
    setConditions(conditionsRes.data || []);
    setPageLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 8) {
      alert('Maximum 8 images allowed');
      return;
    }
    setImages([...images, ...files]);
    setImagePreviewUrls([...imagePreviewUrls, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complianceChecked) {
      alert('Please confirm the FCA compliance declaration before posting.');
      return;
    }

    if (!formData.province) {
      alert('Please select your province.');
      return;
    }

    setLoading(true);

    try {
      // Upload images
      const uploadedImageUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `listings/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image);

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          is_negotiable: isNegotiable,
          category_id: formData.category_id,
          make_id: formData.make_id || null,
          model: formData.model || '',
          calibre_id: formData.calibre_id || null,
          condition_id: formData.condition_id || null,
          barrel_length: formData.barrel_length || null,
          action_type: formData.action_type || null,
          capacity: formData.capacity || null,
          licence_type: formData.licence_type || null,
          city: `${formData.city}, ${formData.province}`,
          images: uploadedImageUrls,
          listing_type: 'private',
          status: 'active',
          views_count: 0,
          is_featured: false,
        })
        .select('id')
        .single();

      if (error) throw new Error(`Failed to create listing: ${error.message}`);

      setSuccessListingId(data.id);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const InputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] text-[14px] focus:outline-none focus:border-[#C9922A]/60 transition-colors placeholder-[#8A8E99]/40";
  const LabelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-2";
  const SectionClass = "bg-[#13151A] border border-white/5 rounded-sm p-6 space-y-5";

  // SUCCESS SCREEN
  if (successListingId) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-[640px]">

            {/* Success header */}
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-5xl font-black uppercase tracking-tight mb-3">
                Listing is <span className="text-[#2A9C6E]">Live!</span>
              </h1>
              <p className="text-[#8A8E99] text-sm">
                Your listing has been posted successfully. Want more eyes on it?
              </p>
            </div>

            {/* Promotion options */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-white/5 bg-[#0D0F13]">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase text-[#C9922A]">
                  ⚡ Boost Your Listing
                </h2>
                <p className="text-[#8A8E99] text-xs mt-1 uppercase tracking-widest font-bold">
                  Get more views, sell faster
                </p>
              </div>

              <div className="divide-y divide-white/5">
                {[
                  {
                    icon: '⭐',
                    title: 'Featured Listing',
                    desc: 'Pinned to the top of your category for 7 days',
                    price: 'R 99',
                    badge: 'Most Popular',
                    color: 'text-[#C9922A]',
                    border: 'border-[#C9922A]/20',
                    bg: 'bg-[#C9922A]/5',
                  },
                  {
                    icon: '🎬',
                    title: 'Reel Placement',
                    desc: 'Featured in the homepage scrolling reel for 5 days',
                    price: 'R 150',
                    badge: 'Max Exposure',
                    color: 'text-[#4CC9F0]',
                    border: 'border-[#4CC9F0]/20',
                    bg: 'bg-[#4CC9F0]/5',
                  },
                  {
                    icon: '🌍',
                    title: 'National Featured',
                    desc: 'Highlighted across all provinces for 5 days',
                    price: 'R 29',
                    badge: 'Best Value',
                    color: 'text-[#2A9C6E]',
                    border: 'border-[#2A9C6E]/20',
                    bg: 'bg-[#2A9C6E]/5',
                  },
                ].map((option) => (
                  <div key={option.title} className={`flex items-center gap-4 px-6 py-4 ${option.bg} border-l-2 ${option.border}`}>
                    <div className="text-3xl flex-shrink-0">{option.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`font-black text-sm uppercase tracking-widest ${option.color}`}>
                          {option.title}
                        </p>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm border ${option.border} ${option.color}`}>
                          {option.badge}
                        </span>
                      </div>
                      <p className="text-[#8A8E99] text-xs">{option.desc}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-xl font-black ${option.color} mb-1`}>{option.price}</p>
                      <button
                        onClick={() => alert('💳 Payment coming soon! We\'ll notify you when promotions go live.')}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-sm border ${option.border} ${option.color} hover:opacity-80 transition-all`}
                      >
                        Boost Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/listings/${successListingId}`}
                className="flex-1 bg-[#C9922A] text-black px-6 py-4 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all text-center"
              >
                View My Listing
              </Link>
              <Link
                href="/sell"
                onClick={() => setSuccessListingId(null)}
                className="flex-1 bg-white/5 border border-white/10 text-[#F0EDE8] px-6 py-4 rounded-sm font-black uppercase tracking-widest text-[13px] hover:bg-white/10 transition-all text-center"
              >
                Post Another
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 bg-transparent border border-white/10 text-[#8A8E99] px-6 py-4 rounded-sm font-black uppercase tracking-widest text-[13px] hover:bg-white/5 transition-all text-center"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* PAGE HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-6 py-8">
        <div className="max-w-[860px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Post a Listing</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-5xl font-black uppercase tracking-tight mb-2">
            Post a <span className="text-[#C9922A]">Listing</span>
          </h1>
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">
            Free to list · Reaches buyers across South Africa
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="flex-1 max-w-[860px] mx-auto w-full px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* SECTION 1 — Basic Info */}
          <div className={SectionClass}>
            <div className="border-b border-white/5 pb-4 mb-2">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase tracking-tight">
                Basic <span className="text-[#C9922A]">Information</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={LabelClass}>Category <span className="text-red-400">*</span></label>
                <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className={InputClass}>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={LabelClass}>Listing Title <span className="text-red-400">*</span></label>
                <input
                  type="text" name="title" value={formData.title}
                  onChange={handleInputChange} required
                  placeholder="e.g., Glock 19 Gen 5 — Excellent Condition"
                  className={InputClass}
                />
              </div>

              <div>
                <label className={LabelClass}>Price (ZAR) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8E99] font-bold text-sm">R</span>
                  <input
                    type="number" name="price" value={formData.price}
                    onChange={handleInputChange} required min="0"
                    placeholder="12500"
                    className={`${InputClass} pl-8`}
                  />
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={e => setIsNegotiable(e.target.checked)}
                    className="w-4 h-4 accent-[#C9922A]"
                  />
                  <span className="text-[12px] text-[#8A8E99]">Price is negotiable (ONO)</span>
                </label>
              </div>

              <div>
                <label className={LabelClass}>Condition <span className="text-red-400">*</span></label>
                <select name="condition_id" value={formData.condition_id} onChange={handleInputChange} required className={InputClass}>
                  <option value="">Select condition...</option>
                  {conditions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LabelClass}>Licence Type</label>
                <select name="licence_type" value={formData.licence_type} onChange={handleInputChange} className={InputClass}>
                  <option value="Section 13">Section 13 — Self-Defence</option>
                  <option value="Section 15">Section 15 — Occasional Hunter</option>
                  <option value="Section 16">Section 16 — Dedicated Hunter</option>
                  <option value="Section 17">Section 17 — Dedicated Sport Shooter</option>
                  <option value="No Licence Required">No Licence Required</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2 — Firearm Details */}
          <div className={SectionClass}>
            <div className="border-b border-white/5 pb-4 mb-2">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase tracking-tight">
                Item <span className="text-[#C9922A]">Details</span>
              </h2>
              <p className="text-[#8A8E99] text-xs mt-1">Fill in what's applicable — not all fields are required</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={LabelClass}>Make / Brand</label>
                <select name="make_id" value={formData.make_id} onChange={handleInputChange} className={InputClass}>
                  <option value="">Select make...</option>
                  {makes.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LabelClass}>Model</label>
                <input
                  type="text" name="model" value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g., 19 Gen 5"
                  className={InputClass}
                />
              </div>

              <div>
                <label className={LabelClass}>Calibre</label>
                <select name="calibre_id" value={formData.calibre_id} onChange={handleInputChange} className={InputClass}>
                  <option value="">Select calibre...</option>
                  {calibres.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LabelClass}>Action Type</label>
                <select name="action_type" value={formData.action_type} onChange={handleInputChange} className={InputClass}>
                  <option value="">Select action type...</option>
                  {ACTION_TYPES.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LabelClass}>Barrel Length</label>
                <input
                  type="text" name="barrel_length" value={formData.barrel_length}
                  onChange={handleInputChange}
                  placeholder="e.g., 102mm or 4 inches"
                  className={InputClass}
                />
              </div>

              <div>
                <label className={LabelClass}>Capacity</label>
                <input
                  type="text" name="capacity" value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="e.g., 15+1"
                  className={InputClass}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3 — Location */}
          <div className={SectionClass}>
            <div className="border-b border-white/5 pb-4 mb-2">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase tracking-tight">
                <span className="text-[#C9922A]">Location</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={LabelClass}>Province <span className="text-red-400">*</span></label>
                <select name="province" value={formData.province} onChange={handleInputChange} required className={InputClass}>
                  <option value="">Select province...</option>
                  {PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LabelClass}>City / Town <span className="text-red-400">*</span></label>
                <input
                  type="text" name="city" value={formData.city}
                  onChange={handleInputChange} required
                  placeholder="e.g., Cape Town"
                  className={InputClass}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4 — Description */}
          <div className={SectionClass}>
            <div className="border-b border-white/5 pb-4 mb-2">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase tracking-tight">
                <span className="text-[#C9922A]">Description</span>
              </h2>
            </div>
            <div>
              <label className={LabelClass}>Tell buyers about this item <span className="text-red-400">*</span></label>
              <textarea
                name="description" value={formData.description}
                onChange={handleInputChange} required rows={6}
                placeholder="Describe the item's condition, what's included, reason for selling, any accessories or modifications..."
                className={`${InputClass} resize-none`}
              />
              <p className="text-[#8A8E99] text-[11px] mt-2">
                {formData.description.length}/1000 characters
              </p>
            </div>
          </div>

          {/* SECTION 5 — Images */}
          <div className={SectionClass}>
            <div className="border-b border-white/5 pb-4 mb-2">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase tracking-tight">
                Photos <span className="text-[#C9922A]">({images.length}/8)</span>
              </h2>
              <p className="text-[#8A8E99] text-xs mt-1">Good photos get significantly more inquiries. Max 8 images.</p>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {index === 0 && (
                    <div className="absolute top-1 left-1 bg-[#C9922A] text-black text-[8px] font-black px-1 py-0.5 rounded-sm">
                      MAIN
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))}

              {images.length < 8 && (
                <label className="aspect-square bg-[#0D0F13] border-2 border-dashed border-white/10 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#C9922A]/40 transition-colors">
                  <span className="text-2xl text-[#8A8E99] mb-1">+</span>
                  <span className="text-[9px] text-[#8A8E99] uppercase tracking-widest font-bold">Add</span>
                  <input
                    type="file" accept="image/*" multiple
                    onChange={handleImageChange} className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* SECTION 6 — FCA Compliance */}
          <div className={`${SectionClass} border-[#C9922A]/20`}>
            <div className="border-b border-white/5 pb-4 mb-2">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase tracking-tight">
                Legal <span className="text-[#C9922A]">Declaration</span>
              </h2>
            </div>

            <label className="flex items-start gap-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={complianceChecked}
                onChange={e => setComplianceChecked(e.target.checked)}
                className="w-5 h-5 flex-shrink-0 accent-[#C9922A] mt-0.5"
              />
              <div>
                <p className="text-[13px] text-[#F0EDE8] leading-relaxed">
                  I confirm that I am the legal owner of this firearm/item and hold all required licences
                  in terms of the <strong className="text-[#C9922A]">Firearms Control Act 60 of 2000</strong>.
                  I understand that listing unlicensed firearms is a criminal offence, and that Gun X
                  reserves the right to remove any listing and report violations to the SAPS.
                </p>
                <p className="text-[11px] text-[#8A8E99] mt-2 uppercase tracking-widest font-bold">
                  ⚠️ This declaration is required by law before posting
                </p>
              </div>
            </label>
          </div>

          {/* SUBMIT */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || !complianceChecked}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black px-8 py-4 rounded-sm text-[16px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(201,146,42,0.2)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Posting...
                </span>
              ) : '🔫 Post Listing — Free'}
            </button>
            <Link
              href="/dashboard"
              className="sm:w-auto px-8 py-4 bg-transparent border border-white/10 text-[#8A8E99] font-black text-[14px] uppercase tracking-widest rounded-sm hover:bg-white/5 transition-all text-center"
            >
              Cancel
            </Link>
          </div>

          {!complianceChecked && (
            <p className="text-center text-[11px] text-[#8A8E99] uppercase tracking-widest">
              ☝️ Tick the legal declaration above to enable posting
            </p>
          )}
        </form>
      </div>
    </div>
  );
}