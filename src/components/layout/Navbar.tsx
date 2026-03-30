'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      setProfile(profileData);
    } else {
      setProfile(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setShowDropdown(false);
    router.push('/');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0];
  };

  return (
    <nav className="bg-[#0D0F13] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
        
        <Link href="/" className="flex flex-col group">
          <div className="flex items-baseline gap-1">
            <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-black text-[28px] tracking-tight uppercase text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">
              GUN
            </span>
            <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-black text-[28px] tracking-tight uppercase text-[#C9922A]">
              X
            </span>
          </div>
          <div className="text-[9px] tracking-[0.2em] uppercase text-[#8A8E99] -mt-1.5">
            FIREARMS CLASSIFIEDS
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99] hover:text-[#C9922A] transition-colors">
            Browse
          </Link>
          <Link href="/dealers" className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99] hover:text-[#C9922A] transition-colors">
            Dealers
          </Link>
          <Link href="/listings" className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99] hover:text-[#C9922A] transition-colors">
            Listings
          </Link>
          <Link href="/services" className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99] hover:text-[#C9922A] transition-colors">
            Services
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user && profile ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 bg-[#191C23] border border-white/10 rounded-md px-4 py-2 hover:border-[#C9922A]/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url?.startsWith('preset:') ? (
                    <span className="text-lg">{profile.avatar_url.replace('preset:', '')}</span>
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-sm font-bold text-black">
                      {getInitials(profile.full_name || 'User')}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-[14px] font-bold text-[#F0EDE8]">
                  {profile.full_name?.split(' ')[0] || 'User'}
                </span>
                <svg className="w-4 h-4 text-[#8A8E99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-[#191C23] border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <div className="font-bold text-[15px] text-[#F0EDE8] mb-1">{profile.full_name}</div>
                      <div className="text-[12px] text-[#8A8E99]">{profile.email}</div>
                    </div>
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-[#F0EDE8] hover:bg-[#C9922A]/10 hover:text-[#C9922A] transition-colors"
                      >
                        <span>📊</span>
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-[#F0EDE8] hover:bg-[#C9922A]/10 hover:text-[#C9922A] transition-colors"
                      >
                        <span>📝</span>
                        <span>My Listings</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-[#F0EDE8] hover:bg-[#C9922A]/10 hover:text-[#C9922A] transition-colors"
                      >
                        <span>💬</span>
                        <span>Messages</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[14px] text-[#F0EDE8] hover:bg-[#C9922A]/10 hover:text-[#C9922A] transition-colors"
                      >
                        <span>⚙️</span>
                        <span>Settings</span>
                      </Link>
                      <div className="border-t border-white/10 my-2" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-[14px] text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:block text-[13px] font-bold tracking-wider uppercase text-[#F0EDE8] hover:text-[#C9922A] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="hidden md:block bg-transparent border-2 border-[#C9922A] text-[#C9922A] text-[13px] font-bold tracking-wider uppercase px-5 py-2 rounded-[3px] hover:bg-[#C9922A] hover:text-black transition-all"
              >
                Register
              </Link>
            </>
          )}

          <Link
            href="/sell"
            style={{fontFamily:"'Barlow Condensed', sans-serif"}}
            className="bg-[#C9922A] text-black text-[14px] font-bold tracking-[0.1em] uppercase px-6 py-2.5 rounded-[3px] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,146,42,0.3)]"
          >
            + Post Ad
          </Link>
        </div>
      </div>
    </nav>
  );
}
