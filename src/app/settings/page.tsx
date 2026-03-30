'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

const PRESET_AVATARS = [
  '🎯', '🔫', '🏹', '🎖️', '⚔️', '🛡️', '🦅', '🐺', '🦁', '🐻',
  '🔥', '⚡', '💀', '🎪', '🎭', '🎨', '🎸', '🚀', '⭐', '💎'
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setAvatarUrl(profileData.avatar_url || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      setUploading(true);

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      setSelectedPreset('');
      setMessage('Image uploaded! Click Save Changes to update your profile.');
    } catch (error: any) {
      setMessage('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePresetSelect = (emoji: string) => {
    setSelectedPreset(emoji);
    setAvatarUrl(`preset:${emoji}`);
    setMessage('Preset selected! Click Save Changes to update your profile.');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone: phone,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#8A8E99] text-[15px]">Loading settings...</div>
        </div>
      </div>
    );
  }

  const displayAvatar = avatarUrl?.startsWith('preset:') 
    ? avatarUrl.replace('preset:', '') 
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      {/* Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[900px] mx-auto">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-3">
            Profile <span className="text-[#C9922A]">Settings</span>
          </h1>
          <p className="text-[14px] text-[#8A8E99]">Update your profile information and avatar</p>
        </div>
      </div>

      <div className="flex-1 max-w-[900px] mx-auto w-full px-6 md:px-8 py-12">
        <div className="flex flex-col gap-8">

          {message && (
            <div className={`p-4 rounded-md text-[13px] ${
              message.includes('Error') 
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-green-500/10 border border-green-500/30 text-green-400'
            }`}>
              {message}
            </div>
          )}

          {/* Avatar Section */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-6 border-b border-white/5 pb-4">
              Profile Picture
            </h2>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Current Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
                  {displayAvatar ? (
                    <span className="text-6xl">{displayAvatar}</span>
                  ) : avatarUrl && !avatarUrl.startsWith('preset:') ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl font-bold text-black">
                      {fullName?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-bold text-[#F0EDE8] mb-1">{fullName}</div>
                  <div className="text-[12px] text-[#8A8E99]">Current Avatar</div>
                </div>
              </div>

              {/* Avatar Options */}
              <div className="flex-1">
                {/* Upload Custom Image */}
                <div className="mb-6">
                  <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99] mb-3 block">
                    Upload Custom Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-[#F0EDE8] file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-[#C9922A] file:text-black hover:file:brightness-110 file:cursor-pointer cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm"
                  />
                  {uploading && (
                    <p className="text-[12px] text-[#C9922A] mt-2">Uploading...</p>
                  )}
                </div>

                {/* Preset Avatars */}
                <div>
                  <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99] mb-3 block">
                    Or Choose a Preset Avatar
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {PRESET_AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handlePresetSelect(emoji)}
                        className={`w-12 h-12 rounded-md flex items-center justify-center text-2xl transition-all ${
                          selectedPreset === emoji
                            ? 'bg-[#C9922A] scale-110'
                            : 'bg-[#0D0F13] hover:bg-[#C9922A]/20 border border-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-[#191C23] border border-white/5 rounded-md p-6 md:p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-6 border-b border-white/5 pb-4">
              Profile Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Email</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#8A8E99] cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A]"
                  placeholder="082 123 4567"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className="flex-1 bg-[#C9922A] text-black font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/dashboard"
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className="flex-1 bg-transparent border border-white/20 text-[#F0EDE8] font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:bg-white/5 transition-all text-center"
            >
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
