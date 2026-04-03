'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [makes, setMakes] = useState<any[]>([]);
  const [calibres, setCalibres] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('active');

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
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single();

      if (listingError) throw listingError;

      if (listing.seller_id !== currentUser.id) {
        alert('You do not have permission to edit this listing');
        router.push('/dashboard');
        return;
      }

      setFormData({
        title: listing.title || '',
        make_id: listing.make_id || '',
        calibre_id: listing.calibre_id || '',
        price: listing.price?.toString() || '',
        condition: listing.condition || '',
        category: listing.category || '',
        province: listing.province || '',
        city: listing.city || '',
        description: listing.description || '',
        listing_type: listing.listing_type || 'private',
      });

      setCurrentStatus(listing.status || 'active');
      setExistingImages(listing.images || []);

      const { data: makesData } = await supabase.from('makes').select('*').order('name');
      setMakes(makesData || []);

      const { data: calibresData } = await supabase.from('calibres').select('*').order('name');
      setCalibres(calibresData || []);

    } catch (error) {
      console.error('Error loading listing:', error);
      alert('Failed to load listing');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;

    if (totalImages > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setNewImages([...newImages, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (newImages.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of newImages) {
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
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const newUploadedUrls = await uploadImages();
      const allImages = [...existingImages, ...newUploadedUrls];

      const { error } = await supabase
        .from('listings')
        .update({
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
          images: allImages,
          status: currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) throw error;

      alert('Listing updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.from('listings').delete().eq('id', params.id);
      if (error) throw error;

      alert('Listing deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    }
  };

  const toggleStatus = (newStatus: string) => {
    setCurrentStatus(currentStatus === newStatus ? 'active' : newStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#C9922A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8A8E99]">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] py-8 px-6">
      <div className="max-w-[900px] mx-auto">
        <div className="mb-8">
          <a href="/dashboard" className="text-[#C9922A] text-[14px] hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </a>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-extrabold uppercase text-[#F0EDE8] mb-2">
            Edit Listing
          </h1>
          <p className="text-[#8A8E99] text-[14px]">Update your listing details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Toggles */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Listing Status</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStatus('active')}
                className={`px-6 py-3 rounded-sm font-bold text-[14px] uppercase transition-all ${
                  currentStatus === 'active'
                    ? 'bg-[#2A9C6E] text-white'
                    : 'bg-transparent border border-white/20 text-[#8A8E99] hover:bg-white/5'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => toggleStatus('under_offer')}
                className={`px-6 py-3 rounded-sm font-bold text-[14px] uppercase transition-all ${
                  currentStatus === 'under_offer'
                    ? 'bg-[#C9922A] text-black'
                    : 'bg-transparent border border-white/20 text-[#8A8E99] hover:bg-white/5'
                }`}
              >
                Under Offer
              </button>
              <button
                type="button"
                onClick={() => toggleStatus('sold')}
                className={`px-6 py-3 rounded-sm font-bold text-[14px] uppercase transition-all ${
                  currentStatus === 'sold'
                    ? 'bg-red-500 text-white'
                    : 'bg-transparent border border-white/20 text-[#8A8E99] hover:bg-white/5'
                }`}
              >
                Sold
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Listing Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="e.g., Glock 19 Gen 5 9mm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Make/Brand</label>
                  <select
                    value={formData.make_id}
                    onChange={(e) => setFormData({...formData, make_id: e.target.value})}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  >
                    <option value="">Select make...</option>
                    {makes.map(make => (
                      <option key={make.id} value={make.id}>{make.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Calibre</label>
                  <select
                    value={formData.calibre_id}
                    onChange={(e) => setFormData({...formData, calibre_id: e.target.value})}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  >
                    <option value="">Select calibre...</option>
                    {calibres.map(calibre => (
                      <option key={calibre.id} value={calibre.id}>{calibre.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Price (R) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="12500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Condition *</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                    required
                  >
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
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                    required
                  >
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
                  <select
                    value={formData.listing_type}
                    onChange={(e) => setFormData({...formData, listing_type: e.target.value as 'private' | 'dealer'})}
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                    required
                  >
                    <option value="private">Private</option>
                    <option value="dealer">Dealer</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-[#F0EDE8] mb-2">Province *</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({...formData, province: e.target.value})}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  required
                >
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
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="e.g., Cape Town"
                  required
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Description</h2>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm p-3 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A] min-h-[150px]"
              placeholder="Describe the item, its condition, what's included, reason for selling, etc."
            />
          </div>

          {/* Images */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Images (Max 5)</h2>
            
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-[13px] text-[#8A8E99] mb-3">Current Images:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {existingImages.map((url, idx) => (
                    <div key={idx} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newImages.length > 0 && (
              <div className="mb-4">
                <p className="text-[13px] text-[#8A8E99] mb-3">New Images to Upload:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden group">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(existingImages.length + newImages.length) < 5 && (
              <div>
                <label className="block w-full bg-[#0D0F13] border-2 border-dashed border-white/20 rounded-sm p-8 text-center cursor-pointer hover:border-[#C9922A] transition-colors">
                  <span className="text-[14px] text-[#8A8E99]">
                    Click to add images ({existingImages.length + newImages.length}/5)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              type="submit"
              disabled={saving || uploadingImages}
              className="flex-1 bg-[#C9922A] text-black font-bold text-[16px] uppercase py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : uploadingImages ? 'Uploading Images...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 bg-red-500 text-white font-bold text-[16px] uppercase py-4 rounded-sm hover:brightness-110 transition-all"
            >
              Delete Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
