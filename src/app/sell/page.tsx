'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    city: ''
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

    const { data: makesData } = await supabase
      .from('makes')
      .select('*')
      .order('name');
    setMakes(makesData || []);

    const { data: calibresData } = await supabase
      .from('calibres')
      .select('*')
      .order('name');
    setCalibres(calibresData || []);

    const { data: conditionsData } = await supabase
      .from('conditions')
      .select('*')
      .order('name');
    setConditions(conditionsData || []);

    const { data: provincesData } = await supabase
      .from('provinces')
      .select('*')
      .order('name');
    setProvinces(provincesData || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setImages([...images, ...files]);

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviewUrls(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Resolve condition to the canonical ID from the conditions table.
      const selectedCondition = formData.condition_id?.trim();
      const resolvedConditionId = conditions.find((condition) => {
        const id = String(condition.id || '').trim();
        const name = String(condition.name || '').trim().toLowerCase();
        const selected = selectedCondition.toLowerCase();
        return id === selectedCondition || name === selected;
      })?.id;

      const conditionIdToSend = String(resolvedConditionId || '');

      if (!conditionIdToSend) {
        throw new Error('Please select a valid condition.');
      }

      // Upload images to storage
      const uploadedImageUrls: string[] = [];
      
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `listings/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      // Insert directly using the actual listings schema.
      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category_id: formData.category_id,
          make_id: formData.make_id || null,
          model: formData.model,
          calibre_id: formData.calibre_id || null,
          condition_id: conditionIdToSend,
          barrel_length: formData.barrel_length || null,
          action_type: formData.action_type || null,
          capacity: formData.capacity || null,
          province_id: formData.province_id,
          city: formData.city,
          images: uploadedImageUrls,
          listing_type: 'private',
          status: 'active'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Function error:', error);
        throw new Error(`Failed to create listing: ${error.message}`);
      }

      alert('Listing posted successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error creating listing:', error);
      alert(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-extrabold uppercase text-[#F0EDE8] mb-2">
            Post a Listing
          </h1>
          <p className="text-[14px] text-[#8A8E99]">
            Fill in the details below to list your firearm for sale
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                >
                  <option value="pistols">Pistols</option>
                  <option value="revolvers">Revolvers</option>
                  <option value="rifles">Rifles</option>
                  <option value="shotguns">Shotguns</option>
                  <option value="air-guns">Air Guns</option>
                  <option value="airsoft">Airsoft</option>
                  <option value="ammunition">Ammunition</option>
                  <option value="accessories">Accessories</option>
                  <option value="holsters">Holsters</option>
                  <option value="magazines">Magazines</option>
                  <option value="reloading">Reloading</option>
                  <option value="knives">Knives</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="e.g., Glock 19 Gen 5"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">
                  Price (ZAR) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="12500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">
                  Condition <span className="text-red-400">*</span>
                </label>
                <select
                  name="condition_id"
                  value={formData.condition_id}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select condition...</option>
                  {conditions.map(condition => (
                    <option key={condition.id} value={condition.id}>{condition.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Firearm Details */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Firearm Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">Make</label>
                <select
                  name="make_id"
                  value={formData.make_id}
                  onChange={handleInputChange}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select make...</option>
                  {makes.map(make => (
                    <option key={make.id} value={make.id}>{make.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">
                  Model <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="e.g., 19 Gen 5"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">Calibre</label>
                <select
                  name="calibre_id"
                  value={formData.calibre_id}
                  onChange={handleInputChange}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select calibre...</option>
                  {calibres.map(calibre => (
                    <option key={calibre.id} value={calibre.id}>{calibre.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">Barrel Length (inches)</label>
                <input
                  type="number"
                  step="0.1"
                  name="barrel_length"
                  value={formData.barrel_length}
                  onChange={handleInputChange}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="4.5"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">Action Type</label>
                <input
                  type="text"
                  name="action_type"
                  value={formData.action_type}
                  onChange={handleInputChange}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="e.g., Semi-Auto"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Location</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">
                  Province <span className="text-red-400">*</span>
                </label>
                <select
                  name="province_id"
                  value={formData.province_id}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                >
                  <option value="">Select province...</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#8A8E99] mb-2">
                  City/Town <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
                  placeholder="e.g., Cape Town"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Description</h2>
            
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]"
              placeholder="Describe your firearm, its condition, accessories included, etc."
            />
          </div>

          {/* Images */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
            <h2 className="text-xl font-bold text-[#F0EDE8] mb-4">Images (Max 5)</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden">
                  <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="aspect-square bg-[#0D0F13] border-2 border-dashed border-white/20 rounded-sm flex items-center justify-center cursor-pointer hover:border-[#C9922A] transition-colors">
                  <div className="text-center">
                    <span className="text-4xl text-[#8A8E99]">+</span>
                    <p className="text-xs text-[#8A8E99] mt-2">Click to add images ({images.length}/5)</p>
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
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#C9922A] text-black font-bold px-6 py-4 rounded-sm text-[14px] uppercase hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Listing'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-4 bg-transparent border border-white/20 text-[#F0EDE8] font-bold text-[14px] uppercase rounded-sm hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
