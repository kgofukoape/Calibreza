'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

// ─── BUSINESS LOGIN ──────────────────────────────────────────────────────────
// Signs the user in, then works out which kind of business account they hold
// and sends them to the matching dashboard.
//
// EACH ACCOUNT TYPE HAS ITS OWN STATUS VOCABULARY. This is not cosmetic — the
// admin API at /api/admin/suspend validates status changes against a fixed
// whitelist per type:
//
//   dealers  → pending | approved | rejected
//   clubs    → pending | active   | rejected
//   services → pending | active   | rejected
//
// This page previously required 'approved' for all three. Because the admin
// route will not accept 'approved' for a club or a service, those accounts
// could never satisfy the check — every club and every service provider was
// locked out permanently, with no setting in the admin console able to fix it.
//
// Kept in one constant so the two halves cannot drift apart again. If the
// vocabulary changes, it changes here and in the admin route together.
const APPROVED_STATUS = {
  dealer: 'approved',
  club: 'active',
  service: 'active',
} as const;

export default function DealerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const userId = data.user.id;

      // maybeSingle() rather than single(): a user with no business account is
      // an expected outcome here, not an error to be thrown.

      // 1. Dealers
      const { data: dealerData } = await supabase
        .from('dealers')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (dealerData) {
        if (dealerData.status !== APPROVED_STATUS.dealer) {
          await supabase.auth.signOut();
          setError(`Your dealer application is ${dealerData.status}. Please wait for approval.`);
          setLoading(false);
          return;
        }
        router.push('/dealer-dashboard');
        return;
      }

      // 2. Clubs and ranges (distinguished by facility_type)
      const { data: clubData } = await supabase
        .from('clubs')
        .select('status, facility_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (clubData) {
        if (clubData.status !== APPROVED_STATUS.club) {
          await supabase.auth.signOut();
          setError(`Your ${clubData.facility_type || 'club'} application is ${clubData.status}. Please wait for approval.`);
          setLoading(false);
          return;
        }
        router.push('/club-dashboard');
        return;
      }

      // 3. Service providers
      const { data: serviceData } = await supabase
        .from('services')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (serviceData) {
        if (serviceData.status !== APPROVED_STATUS.service) {
          await supabase.auth.signOut();
          setError(`Your service application is ${serviceData.status}. Please wait for approval.`);
          setLoading(false);
          return;
        }
        router.push('/service-dashboard');
        return;
      }

      // 4. Signed in, but no business account attached to this user.
      await supabase.auth.signOut();
      setError('No business account is linked to this login. If you have applied, use the same account you applied with — or apply below.');
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      <main className="max-w-[500px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm mb-6">
            <span className="text-4xl">🏪</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Business <span className="text-[#C9922A]">Login</span>
          </h1>
          <p className="text-[#8A8E99] text-[14px] uppercase tracking-widest font-bold">
            Dealers · Clubs · Ranges · Service Providers
          </p>
        </div>

        <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-sm text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link href="/forgot-password" className="text-[#C9922A] hover:brightness-110 transition-all">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-6 py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#13151A] px-4 text-[#5A5E69] font-bold tracking-widest">Or</span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-[#8A8E99] text-sm">
              Don&apos;t have a business account?{' '}
              <Link href="/dealer/apply" className="text-[#C9922A] font-bold hover:brightness-110 transition-all">
                Apply Now
              </Link>
            </p>
            <p className="text-[#8A8E99] text-sm">
              Regular user?{' '}
              <Link href="/login" className="text-[#C9922A] font-bold hover:brightness-110 transition-all">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 bg-[#13151A] border border-white/5 rounded-sm p-6">
          <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-xl font-black uppercase mb-4 text-center">
            Dashboard Features
          </h3>
          <ul className="space-y-3 text-sm text-[#8A8E99]">
            <li className="flex items-center gap-3">
              <span className="text-[#C9922A]">✓</span>
              Manage your entire inventory in one place
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#C9922A]">✓</span>
              Bulk upload via CSV for fast listing
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#C9922A]">✓</span>
              Track views, inquiries, and performance
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#C9922A]">✓</span>
              Promote individual listings (R19/R29)
            </li>
            <li className="flex items-center gap-3">
              <span className="text-[#C9922A]">✓</span>
              Dedicated storefront with your branding
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
