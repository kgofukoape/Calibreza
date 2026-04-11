'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[480px]">

          <div className="text-center mb-10">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-3">
              Welcome <span className="text-[#C9922A]">Back</span>
            </h1>
            <p className="text-[14px] text-[#8A8E99]">Sign in to your Gun X account</p>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-red-400 text-[13px]">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Password</label>
                  <Link href="/forgot-password" className="text-[12px] text-[#C9922A] hover:brightness-125">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="w-full bg-[#C9922A] text-black font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(201,146,42,0.3)]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-[13px] text-[#8A8E99]">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[#C9922A] font-bold hover:underline">
                  Register free
                </Link>
              </p>
              <p className="text-[13px] text-[#8A8E99]">
                Are you a dealer?{' '}
                <Link href="/dealer/login" className="text-[#C9922A] font-bold hover:underline">
                  Dealer login →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}