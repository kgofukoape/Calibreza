'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function SellPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [calibre, setCalibre] = useState('');
  const [condition, setCondition] = useState('');
  const [price, setPrice] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [licenceType, setLicenceType] = useState('');
  const [listingType, setListingType] = useState('private');
  const [actionType, setActionType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [barrelLength, setBarrelLength] = useState('');
  const [overallLength, setOverallLength] = useState('');

  // Reference data
  const [categories, setCategories] = useState<any[]>([]);
  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadReferenceData();
  }, []);

  const checkAuth = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/login');
    } else {
      setUser(currentUser);
    }
  };

  const loadReferenceData = async () => {
    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');
    setCategories(categoriesData || []);

    // Load makes
    const { data: makesData } = await supabase
      .from('makes')
      .select('*')
      .order('name');
    setMakes(makesData || []);

    // Load calibres
    const { data: calibresData } = await supabase
      .from('calibres')
      .select('*')
      .order('name');
    setCalibres(calibresData || []);

    // Load provinces
    const { data: provincesData } = await supabase
      .from('provinces')
      .select('*')
      .order('name');
    setProvinces(provincesData || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to post a listing');
      }

      // Find IDs for make, calibre, province
      const selectedMake = makes.find(m => m.name === make);
      const selectedCalibre = calibres.find(c => c.name === calibre);
      const selectedProvince = provinces.find(p => p.name === province);

      const { data, error: insertError } = await supabase
        .from('listings')
        .insert({
          title,
          description,
          category_id: category,
          make_id: selectedMake?.id,
          model,
          calibre_id: selectedCalibre?.id,
          condition_id: condition,
          price: parseFloat(price),
          province_id: selectedProvince?.id,
          city,
          seller_id: user.id,
          listing_type: listingType,
          licence_type: licenceType,
          action_type: actionType,
          capacity,
          barrel_length: barrelLength,
          overall_length: overallLength,
          status: 'active',
          included_items: [],
          images: [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Success! Redirect to the new listing
      router.push(`/listings/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const conditions = [
    { id: 'brand-new', name: 'Brand New' },
    { id: 'like-new', name: 'Like New' },
    { id: 'good', name: 'Good' },
    { id: 'fair', name: 'Fair' },
  ];

  const licenceTypes = [
    'Section 13 (Self-Defence)',
    'Section 15 (Occasional Sport/Hunting)',
    'Section 16 (Dedicated Sport)',
    'Section 16 (Dedicated Hunting)',
    'Dealer Stock',
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[900px] mx-auto">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-3">
            Post a <span className="text-[#C9922A]">Listing</span>
          </h1>
          <p className="text-[14px] text-[#8A8E99]">List your firearm for sale on South Africa&apos;s premier marketplace</p>
        </div>
      </div>

      <div className="flex-1 max-w-[900px] mx-auto w-full px-6 md:px-8 py-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-red-400 text-[13px]">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-6 border-b border-white/5 pb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Listing Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="e.g., Glock 19 Gen 5 9mm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select condition</option>
                  {conditions.map(cond => (
                    <option key={cond.id} value={cond.id}>{cond.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Make/Brand *</label>
                <select
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select make</option>
                  {makes.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Model *</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="e.g., 19 Gen 5"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Calibre *</label>
                <select
                  value={calibre}
                  onChange={(e) => setCalibre(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select calibre</option>
                  {calibres.map(cal => (
                    <option key={cal.id} value={cal.name}>{cal.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Price (ZAR) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="12500"
                />
              </div>
            </div>
          </div>

          {/* Location & Licence */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-6 border-b border-white/5 pb-4">
              Location & Licence
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Province *</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select province</option>
                  {provinces.map(prov => (
                    <option key={prov.id} value={prov.name}>{prov.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">City/Town *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="e.g., Pretoria"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Listing Type *</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                >
                  <option value="private">Private Seller</option>
                  <option value="dealer">Dealer</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Licence Type</label>
                <select
                  value={licenceType}
                  onChange={(e) => setLicenceType(e.target.value)}
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select licence type</option>
                  {licenceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Technical Details (Optional) */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-6 border-b border-white/5 pb-4">
              Technical Details <span className="text-[#8A8E99] text-[14px]">(Optional)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Action Type</label>
                <input
                  type="text"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="e.g., Striker-Fired"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Capacity</label>
                <input
                  type="text"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="e.g., 15+1 rounds"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Barrel Length</label>
                <input
                  type="text"
                  value={barrelLength}
                  onChange={(e) => setBarrelLength(e.target.value)}
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="e.g., 4.0&quot; (102mm)"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Overall Length</label>
                <input
                  type="text"
                  value={overallLength}
                  onChange={(e) => setOverallLength(e.target.value)}
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="e.g., 7.3&quot; (185mm)"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-6 border-b border-white/5 pb-4">
              Description *
            </h2>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">
                Describe your firearm, its condition, and what&apos;s included
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={8}
                className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] resize-none"
                placeholder="Provide details about the firearm's condition, history, any modifications, what's included in the sale, and reason for selling..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className="flex-1 bg-[#C9922A] text-black font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(201,146,42,0.3)]"
            >
              {loading ? 'Creating Listing...' : 'Publish Listing'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className="flex-1 bg-transparent border border-white/20 text-[#F0EDE8] font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
