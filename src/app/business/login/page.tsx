'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { BUSINESS_TYPES, BUSINESS_TYPE_LIST, type BusinessTypeId } from '@/lib/business';

// ─── BUSINESS LOGIN ──────────────────────────────────────────────────────────
// One login for dealers, clubs, ranges and service providers. There are no
// tabs, because tabs imply separate credentials and that misconception is what
// caused the confusion this page replaces. One email, one password; where you
// land is determined by what the account actually holds.
//
// Two behaviours worth noting.
//
// PENDING APPLICATIONS NO LONGER SIGN YOU OUT. The old page signed the user out
// and showed an error if their status was not approved — throwing a business
// out of an account they legitimately hold, while they wait on a review they
// cannot hurry. They now stay signed in and are shown where things stand.
//
// APPROVED STATUS COMES FROM src/lib/business.ts. Dealers use 'approved';
// clubs, ranges and services use 'active'. Hard-coding one value for all three
// is precisely the bug that locked every club and service provider out.

type Outcome =
  | { kind: 'pending'; label: string; status: string }
  | { kind: 'incomplete'; typeId: BusinessTypeId | null }
  | { kind: 'personal' };

export default function BusinessLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOutcome(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const user = data.user;

      // ── Personal accounts belong on /login ───────────────────────────────
      const { data: profile } = await supabase
        .from('users')
        .select('account_type')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.account_type === 'personal') {
        await supabase.auth.signOut();
        setOutcome({ kind: 'personal' });
        setLoading(false);
        return;
      }

      // ── Dealers ──────────────────────────────────────────────────────────
      const { data: dealer } = await supabase
        .from('dealers').select('status').eq('user_id', user.id).maybeSingle();

      if (dealer) {
        if (dealer.status !== BUSINESS_TYPES.dealer.approvedStatus) {
          setOutcome({ kind: 'pending', label: 'dealer application', status: dealer.status });
          setLoading(false);
          return;
        }
        router.push(BUSINESS_TYPES.dealer.dashboardPath);
        return;
      }

      // ── Clubs and ranges (one table, facility_type distinguishes them) ────
      const { data: club } = await supabase
        .from('clubs').select('status, facility_type').eq('user_id', user.id).maybeSingle();

      if (club) {
        const isRange = club.facility_type === 'range';
        const type = isRange ? BUSINESS_TYPES.range : BUSINESS_TYPES.club;
        if (club.status !== type.approvedStatus) {
          setOutcome({ kind: 'pending', label: `${type.label.toLowerCase()} application`, status: club.status });
          setLoading(false);
          return;
        }
        router.push(type.dashboardPath);
        return;
      }

      // ── Service providers ────────────────────────────────────────────────
      const { data: service } = await supabase
        .from('services').select('status').eq('user_id', user.id).maybeSingle();

      if (service) {
        if (service.status !== BUSINESS_TYPES.service.approvedStatus) {
          setOutcome({ kind: 'pending', label: 'service application', status: service.status });
          setLoading(false);
          return;
        }
        router.push(BUSINESS_TYPES.service.dashboardPath);
        return;
      }

      // ── Registered but the application was never completed ───────────────
      const intended = user.user_metadata?.business_type as BusinessTypeId | undefined;
      setOutcome({ kind: 'incomplete', typeId: intended ?? null });
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  // ── Outcome screens ────────────────────────────────────────────────────────
  if (outcome?.kind === 'personal') {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[520px] mx-auto px-6 py-24 text-center">
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-10">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-black uppercase mb-4">
              That&apos;s a <span className="text-[#C9922A]">Personal</span> Account
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              Personal accounts sign in on the main login page. This page is for dealers, clubs,
              ranges and service providers.
            </p>
            <Link href="/login"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:brightness-110 transition-all">
              Go to Personal Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (outcome?.kind === 'pending') {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[520px] mx-auto px-6 py-24 text-center">
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-10">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-black uppercase mb-4">
              Application <span className="text-[#C9922A]">{outcome.status}</span>
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              Your {outcome.label} is {outcome.status}. You are signed in, but your dashboard opens
              once the application is approved. We review applications within 2–3 business days.
              Questions: <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-110">support@gunx.co.za</a>
            </p>
            <Link href="/"
              className="inline-block border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:bg-white/5 transition-all">
              Back to Gun X
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (outcome?.kind === 'incomplete') {
    const type = outcome.typeId ? BUSINESS_TYPES[outcome.typeId] : null;
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[560px] mx-auto px-6 py-24 text-center">
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-10">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-black uppercase mb-4">
              Finish Your <span className="text-[#C9922A]">Application</span>
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              This account is registered but has no business listing attached yet. Complete the
              application to get your dashboard.
            </p>
            {type ? (
              <Link href={type.applyPath}
                className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:brightness-110 transition-all">
                {type.icon} Continue as {type.label}
              </Link>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_TYPE_LIST.map(t => (
                  <Link key={t.id} href={t.applyPath}
                    className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-4 py-4 rounded-sm hover:border-[#C9922A]/40 hover:text-[#C9922A] transition-all">
                    {t.icon} {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-[500px] mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm mb-6">
            <span className="text-4xl">🏪</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}}
            className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Business <span className="text-[#C9922A]">Login</span>
          </h1>
          <p className="text-[#8A8E99] text-[13px] uppercase tracking-widest font-bold">
            Dealers · Clubs · Ranges · Service Providers
          </p>
        </div>

        <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-sm text-sm">{error}</div>
            )}

            <div>
              <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Business Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                placeholder="info@yourbusiness.co.za" />
            </div>

            <div>
              <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                placeholder="••••••••" />
            </div>

            <div className="flex items-center justify-end text-sm">
              <Link href="/forgot-password" className="text-[#C9922A] hover:brightness-110 transition-all">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-6 py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#13151A] px-4 text-[#5A5E69] font-bold tracking-widest">Or</span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-[#8A8E99] text-sm">
              New business?{' '}
              <Link href="/business/register" className="text-[#C9922A] font-bold hover:brightness-110 transition-all">Register here</Link>
            </p>
            <p className="text-[#8A8E99] text-sm">
              Buying or selling as an individual?{' '}
              <Link href="/login" className="text-[#C9922A] font-bold hover:brightness-110 transition-all">Personal login</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
