'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-[#191C23] border-b border-white/5 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between">
        
        {/* Logo with Tagline */}
        <Link href="/" className="flex flex-col group">
          <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-[28px] font-black tracking-tighter text-[#F0EDE8] leading-none uppercase">
            GUN <span className="text-[#C9922A]">X</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#8A8E99] mt-0.5">
            Firearms Classifieds
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {[
            { label: 'BROWSE', href: '/browse' },
            { label: 'DEALERS', href: '/dealers' },
            { label: 'WANTED', href: '/wanted' },
            { label: 'SERVICES', href: '/services' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className={`px-5 py-2 text-[14px] font-bold tracking-[0.1em] uppercase transition-colors rounded-sm ${
                pathname === item.href
                  ? 'text-[#C9922A] bg-[#C9922A]/10'
                  : 'text-[#8A8E99] hover:text-[#F0EDE8] hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Side - Auth & Actions */}
        <div className="flex items-center gap-3">
          {!isLoading && user ? (
            <>
              <Link
                href="/sell"
                style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                className="hidden md:flex items-center gap-2 bg-[#C9922A] text-black font-bold text-[14px] tracking-[0.1em] uppercase px-5 py-2.5 rounded-[3px] hover:brightness-110 transition-all shadow-[0_0_15px_rgba(201,146,42,0.3)]"
              >
                <span className="text-[16px]">+</span>
                POST AD
              </Link>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2 hover:border-[#C9922A] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
                    {user.avatar_url?.startsWith('preset:') ? (
                      <span className="text-lg">{user.avatar_url.replace('preset:', '')}</span>
                    ) : user.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-sm font-bold text-black">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-[14px] font-medium text-[#F0EDE8]">
                    {user.full_name?.split(' ')[0] || 'User'}
                  </span>
                  <svg className="w-4 h-4 text-[#8A8E99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-[#191C23] border border-white/10 rounded-md shadow-xl py-2 z-50">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#F0EDE8] hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span>📊</span>
                        Dashboard
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#F0EDE8] hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span>⚙️</span>
                        Settings
                      </Link>
                      <Link
                        href="/sell"
                        className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#F0EDE8] hover:bg-white/5 transition-colors md:hidden"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span>+</span>
                        Post Listing
                      </Link>
                      <div className="border-t border-white/10 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <span>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                className="text-[13px] font-bold tracking-[0.2em] uppercase text-[#F0EDE8] hover:text-[#C9922A] transition-all"
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                className="bg-[#191C23] border border-white/10 text-[#C9922A] text-[13px] font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-sm hover:bg-white/5 transition-all"
              >
                Register
              </Link>

              <Link
                href="/sell"
                style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                className="bg-[#C9922A] text-black text-[13px] font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-sm hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,146,42,0.3)]"
              >
                + Post Ad
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
