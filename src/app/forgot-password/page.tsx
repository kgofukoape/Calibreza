'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) { setError(err.message); return; }
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[440px]">

          <div className="text-center mb-8">
            <Link href="/" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl font-black uppercase tracking-tight inline-block mb-6">
              GUN <span className="text-[#C9922A]">X</span>
            </Link>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black uppercase tracking-wide mb-2">
              Reset Your <span className="text-[#C9922A]">Password</span>
            </h1>
            <p className="text-[#8A8E99] text-[13px]">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            {submitted ? (
              <div className="text-center">
                <div className="text-5xl mb-4">📧</div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-xl font-black uppercase text-[#C9922A] mb-2">Check Your Email</h2>
                <p className="text-[#8A8E99] text-[13px] mb-6">
                  We've sent a password reset link to <strong className="text-[#F0EDE8]">{email}</strong>.
                  Check your inbox and spam folder.
                </p>
                <p className="text-[11px] text-[#8A8E99]">
                  Didn't receive it?{' '}
                  <button onClick={() => setSubmitted(false)} className="text-[#C9922A] hover:brightness-125 font-bold">
                    Try again
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50 transition-colors"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3">
                    <p className="text-red-400 text-[13px]">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Reset Link →'}
                </button>

                <div className="flex items-center justify-center gap-4 pt-2">
                  <Link href="/login" className="text-[12px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">
                    Back to Sign In
                  </Link>
                  <span className="text-[#8A8E99]">·</span>
                  <Link href="/signup" className="text-[12px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">
                    Create Account
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
