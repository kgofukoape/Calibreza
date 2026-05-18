'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Supabase handles the token from the URL automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setValidSession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) { setError(err.message); return; }
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
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
              Set New <span className="text-[#C9922A]">Password</span>
            </h1>
            <p className="text-[#8A8E99] text-[13px]">Choose a strong password for your account.</p>
          </div>

          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            {done ? (
              <div className="text-center">
                <div className="text-5xl mb-4">✓</div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-xl font-black uppercase text-[#C9922A] mb-2">Password Updated</h2>
                <p className="text-[#8A8E99] text-[13px] mb-2">Your password has been changed successfully.</p>
                <p className="text-[11px] text-[#8A8E99]">Redirecting to sign in...</p>
              </div>
            ) : !validSession ? (
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-[#8A8E99] text-[13px] mb-4">
                  This reset link is invalid or has expired.
                </p>
                <Link href="/forgot-password"
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
                  Request New Link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50 transition-colors"
                  />
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                        password.length >= (i + 1) * 3
                          ? password.length >= 12 ? 'bg-green-400'
                          : password.length >= 8 ? 'bg-[#C9922A]'
                          : 'bg-red-400'
                          : 'bg-white/10'
                      }`} />
                    ))}
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3">
                    <p className="text-red-400 text-[13px]">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                  {loading ? 'Updating...' : 'Update Password →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
