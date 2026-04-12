'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { signUp } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
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
              Create <span className="text-[#C9922A]">Account</span>
            </h1>
            <p className="text-[13px] text-[#8A8E99]">Join South Africa's premier firearms marketplace</p>
          </div>

          <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 md:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-[13px]">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="Johan van der Merwe" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="w-full bg-[#C9922A] text-black font-black text-[15px] tracking-widest uppercase py-3.5 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(201,146,42,0.2)]">
                {loading ? 'Creating account...' : 'Create Account — Free'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-white/5 flex flex-col gap-3 text-center">
              <p className="text-[13px] text-[#8A8E99]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#C9922A] font-bold hover:underline">Sign in</Link>
              </p>
              <p className="text-[13px] text-[#8A8E99]">
                Registering as a dealer?{' '}
                <Link href="/dealer/apply" className="text-[#C9922A] font-bold hover:underline">Apply here →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}