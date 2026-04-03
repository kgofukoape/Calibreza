'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function SellPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    make_id: '',
    calibre_id: '',
    price: '',
    condition: '',
    category: '',
    province: '',
    city: '',
    description: '',
    listing_type: 'private' as 'private' | 'dealer',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: makesData } = await supabase.from('makes').select('*').order('name');
      setMakes(makesData || []);

      const { data: calibresData } = await supabase.from('calibres').select('*').order('name');
      setCalibres(calibresData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setImages([...images, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];

    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `listings/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const imageUrls = await uploadImages();

      const { data, error } = await supabase
        .from('listings')
        .insert({
          title: formData.title,
          make_id: formData.make_id || null,
          calibre_id: formData.calibre_id || null,
          price: parseFloat(formData.price),
          condition: formData.condition,
          category: formData.category,
          province: formData.province,
          city: formData.city,
          description: formData.description,
          listing_type: formData.listing_type,
          images: imageUrls,
          seller_id: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      alert('Listing posted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C9922A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8A8E99]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] py-8 px-6">
      <div className="max-w-[900px] mx-auto">
        <div className="mb-8">
          <a href="/dashboard" className="text-[#C9922A] text-[14px] hover:underline mb-4 inline-block">← Back to Dashboard</a>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-extrabold uppercase text-[#F0EDE8] mb-2">Post a Listing</h1>
          <p className="text-[#8A8E99] text-[14px]">Fill in the details below to create your listing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Listing Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]" placeholder="e.g., Glock 19 Gen 5 9mm" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Make/Brand</label>
                  <select value={formData.make_id} onChange={(e) => setFormData({...formData, make_id: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]">
                    <option value="">Select make...</option>
                    {makes.map(make => <option key={make.id} value={make.id}>{make.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Calibre</label>
                  <select value={formData.calibre_id} onChange={(e) => setFormData({...formData, calibre_id: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]">
                    <option value="">Select calibre...</option>
                    {calibres.map(calibre => <option key={calibre.id} value={calibre.id}>{calibre.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Price (R) *</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]" placeholder="12500" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Condition *</label>
                  <select value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]" required>
                    <option value="">Select...</option>
                    <option value="Brand New">Brand New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]" required>
                    <option value="">Select...</option>
                    <option value="pistols">Pistols</option>
                    <option value="rifles">Rifles</option>
                    <option value="shotguns">Shotguns</option>
                    <option value="revolvers">Revolvers</option>
                    <option value="air-guns">Air Guns</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Listing Type *</label>
                  <select value={formData.listing_type} onChange={(e) => setFormData({...formData, listing_type: e.target.value as 'private' | 'dealer'})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]" required>
                    <option value="private">Private</option>
                    <option value="dealer">Dealer</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Province *</label>
                <select value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]" required>
                  <option value="">Select province...</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="North West">North West</option>
                  <option value="Northern Cape">Northern Cape</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">City/Town *</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]" placeholder="e.g., Cape Town" required />
              </div>
            </div>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Description</h2>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A] min-h-[150px]" placeholder="Describe the item, its condition, what's included, reason for selling, etc." />
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Images (Max 5)</h2>
            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden group">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {images.length < 5 && (
              <div>
                <label className="block w-full bg-[#0D0F13] border-2 border-dashed border-white/20 rounded-sm p-8 text-center cursor-pointer hover:border-[#C9922A] transition-colors">
                  <span className="text-[14px] text-[#8A8E99]">Click to add images ({images.length}/5)</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={submitting} className="flex-1 bg-[#C9922A] text-black font-bold text-[16px] uppercase py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">{submitting ? 'Posting...' : 'Post Listing'}</button>
            <a href="/dashboard" className="flex-1 bg-transparent border border-white/20 text-[#F0EDE8] font-bold text-[16px] uppercase py-4 rounded-sm text-center hover:bg-white/5 transition-all">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  );
}
