'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

// ─── PERSONAL LOGIN ──────────────────────────────────────────────────────────
// For individuals buying and selling. Business accounts sign in at
// /business/login instead.
//
// This page used to check the dealers, clubs and services tables and route into
// business dashboards from here — which is why a dealer signing in on the wrong
// page sometimes worked and sometimes dumped them on a personal dashboard with
// none of their listings. Now it checks one thing: is this a business account?
// If so it says so and points across, rather than guessing.
//
// The three lookups also used .single(), which errors when there is no row —
// the normal case for a personal user. Removing them takes three failing
// queries off every single login.

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsBusinessAccount(false);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from('users')
        .select('account_type')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.account_type === 'business') {
        await supabase.auth.signOut();
        setIsBusinessAccount(true);
        setLoading(false);
        return;
      }

      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email and password.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-[440px]">

          <div className="text-center mb-8">
            <Link href="/">
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-4xl font-black uppercase tracking-tighter text-[#F0EDE8]">
                GUN <span className="text-[#C9922A]">X</span>
              </span>
            </Link>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl md:text-4xl font-black uppercase mt-4 mb-1">
              Sign <span className="text-[#C9922A]">In</span>
            </h1>
            <p className="text-[13px] text-[#8A8E99]">Welcome back to Gun X</p>
          </div>

          <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 md:p-8">

            {isBusinessAccount && (
              <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm p-4 mb-5">
                <p className="text-[13px] text-[#C4C0B8] leading-relaxed mb-3">
                  That&apos;s a business account. Dealers, clubs, ranges and service providers
                  sign in on the business page.
                </p>
                <Link href="/business/login"
                  className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all">
                  Go to Business Login
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-[13px]">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="••••••••"
                />
                <div className="flex justify-end mt-2">
                  <Link href="/forgot-password" className="text-[11px] font-bold uppercase tracking-widest text-[#C9922A] hover:brightness-125 transition-all">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="w-full bg-[#C9922A] text-black font-black text-[15px] tracking-widest uppercase py-3.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(201,146,42,0.2)]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-white/5 flex flex-col gap-3 text-center">
              <p className="text-[13px] text-[#8A8E99]">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-[#C9922A] font-bold hover:underline">
                  Register free
                </Link>
              </p>
              <p className="text-[13px] text-[#8A8E99]">
                Dealer, club, range or service provider?{' '}
                <Link href="/business/login" className="text-[#C9922A] font-bold hover:underline">
                  Business login →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
