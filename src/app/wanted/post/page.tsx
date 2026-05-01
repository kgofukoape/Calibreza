'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

const ITEM_CATEGORIES = [
  'Pistols & Revolvers',
  'Rifles',
  'Shotguns',
  'Air Guns',
  'Airsoft',
  'Optics & Sights',
  'Holsters & Carry',
  'Magazines',
  'Ammunition',
  'Reloading Components',
  'Knives & Blades',
  'Accessories & Parts',
  'Other',
];

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
  'Anywhere in SA',
];

export default function PostWantedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [listingId, setListingId] = useState('');
  const [conditions] = useState(['Brand New', 'Like New', 'Good', 'Fair', 'Any Condition']);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    is_negotiable: false,
    item_category: 'Pistols & Revolvers',
    make: '',
    model: '',
    calibre: '',
    preferred_condition: 'Any Condition',
    province: 'Anywhere in SA',
    city: '',
    urgency: 'flexible',
    contact_preference: 'email',
  });

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u) router.push('/login');
      else setUser(u);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const title = formData.title.trim().startsWith('WTB:') || formData.title.trim().startsWith('Wanted:')
        ? formData.title.trim()
        : `WTB: ${formData.title.trim()}`;

      const description = [
        formData.description,
        formData.make ? `Make/Brand: ${formData.make}` : '',
        formData.model ? `Model: ${formData.model}` : '',
        formData.calibre ? `Calibre: ${formData.calibre}` : '',
        `Preferred Condition: ${formData.preferred_condition}`,
        `Contact Preference: ${formData.contact_preference}`,
      ].filter(Boolean).join('\n');

      const { data, error } = await supabase.from('listings').insert({
        seller_id: user.id,
        title,
        description,
        price: formData.budget ? parseFloat(formData.budget) : 0,
        is_negotiable: formData.is_negotiable,
        category_id: 'wanted',
        model: formData.model || null,
        city: formData.city || formData.province,
        listing_type: 'private',
        status: 'active',
      }).select('id').single();

      if (error) throw error;
      setListingId(data.id);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to post wanted ad');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 transition-colors";
  const labelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";
  const sectionClass = "bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6";

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-3">
              Wanted Ad <span className="text-[#C9922A]">Posted!</span>
            </h1>
            <p className="text-[#8A8E99] mb-8">Your wanted ad is now live on the Bounty Board. Sellers will reach out if they have what you're looking for.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/listings/${listingId}`}
                className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-3 px-6 hover:brightness-110 transition-all text-center rounded-sm">
                View My Ad
              </Link>
              <Link href="/wanted"
                className="flex-1 border border-white/10 text-white font-black uppercase tracking-widest text-[13px] py-3 px-6 hover:bg-white/5 transition-all text-center rounded-sm">
                Bounty Board
              </Link>
            </div>
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
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <Link href="/wanted" className="hover:text-[#C9922A]">Wanted</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Post Wanted Ad</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase mb-1">
            Post a <span className="text-[#C9922A]">Wanted Ad</span>
          </h1>
          <p className="text-[13px] text-[#8A8E99]">Tell the community what you're looking for. Sellers will contact you directly.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* What are you looking for */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-4 pb-3 border-b border-white/5">
              What are you looking for?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Ad Title <span className="text-red-400">*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  className={inputClass} placeholder='e.g. Glock 19 Gen 5 — Any Condition' />
                <p className="text-[11px] text-[#8A8E99] mt-1">"WTB:" will be added automatically if not included</p>
              </div>
              <div>
                <label className={labelClass}>Item Category <span className="text-red-400">*</span></label>
                <select name="item_category" value={formData.item_category} onChange={handleChange} required className={inputClass}>
                  {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Preferred Condition</label>
                <select name="preferred_condition" value={formData.preferred_condition} onChange={handleChange} className={inputClass}>
                  {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Make / Brand</label>
                <input type="text" name="make" value={formData.make} onChange={handleChange}
                  className={inputClass} placeholder="e.g. Glock, Musgrave, Vortex" />
              </div>
              <div>
                <label className={labelClass}>Model</label>
                <input type="text" name="model" value={formData.model} onChange={handleChange}
                  className={inputClass} placeholder="e.g. 19 Gen 5, Remington 700" />
              </div>
              <div>
                <label className={labelClass}>Calibre (if applicable)</label>
                <input type="text" name="calibre" value={formData.calibre} onChange={handleChange}
                  className={inputClass} placeholder="e.g. 9mm Luger, .308 Win" />
              </div>
              <div>
                <label className={labelClass}>Urgency</label>
                <select name="urgency" value={formData.urgency} onChange={handleChange} className={inputClass}>
                  <option value="flexible">Flexible — no rush</option>
                  <option value="within_month">Within a month</option>
                  <option value="asap">ASAP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-4 pb-3 border-b border-white/5">
              Budget
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Maximum Budget (ZAR)</label>
                <input type="number" name="budget" value={formData.budget} onChange={handleChange}
                  className={inputClass} placeholder="e.g. 15000" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="is_negotiable" checked={formData.is_negotiable}
                    onChange={handleChange} className="w-4 h-4 accent-[#C9922A]" />
                  <span className="text-[13px] text-[#F0EDE8]">Budget is flexible / negotiable</span>
                </label>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-4 pb-3 border-b border-white/5">
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Province <span className="text-red-400">*</span></label>
                <select name="province" value={formData.province} onChange={handleChange} required className={inputClass}>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>City / Town</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange}
                  className={inputClass} placeholder="e.g. Cape Town" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={sectionClass}>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-widest mb-4 pb-3 border-b border-white/5">
              Additional Details
            </h2>
            <div>
              <label className={labelClass}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Any specific requirements — serial number range, specific variant, accessories needed, etc." />
            </div>
            <div className="mt-4">
              <label className={labelClass}>Preferred Contact Method</label>
              <select name="contact_preference" value={formData.contact_preference} onChange={handleChange} className={inputClass}>
                <option value="email">Email</option>
                <option value="phone">Phone / WhatsApp</option>
                <option value="either">Either</option>
              </select>
            </div>
          </div>

          {/* Notice */}
          <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5">
            <p className="text-[13px] text-[#8A8E99] leading-relaxed">
              <strong className="text-[#C9922A]">⚠️ FCA Notice:</strong> All firearm transactions must comply with the Firearms Control Act (Act 60 of 2000). All transfers must go through a licensed dealer.
            </p>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={loading}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Posting...' : 'Post Wanted Ad — Free'}
            </button>
            <button type="button" onClick={() => router.push('/wanted')}
              className="sm:w-auto px-8 py-4 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] rounded-sm hover:bg-white/5 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
