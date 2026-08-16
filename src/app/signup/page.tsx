'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { signUp } from '@/lib/auth';
import {
  agreementsForContext,
  noticesForContext,
  MARKETING_CONSENT_COPY,
} from '@/lib/legal';

// ─── SIGNUP ──────────────────────────────────────────────────────────────────
// Two separate consent controls, deliberately.
//
// The first is required: the Terms of Use and Legal Disclaimer are contract
// terms the user is bound by, so they must actively accept them. The Privacy
// Policy and POPI Notice sit in the same sentence but are worded as "I have
// read" — you are not asked to agree to a privacy notice, you are given one.
//
// The second is optional and unticked. Under POPIA consent must be voluntary,
// specific and informed. Folding marketing into the terms checkbox fails both
// "specific" (one tick covering two unrelated things) and "voluntary" (you
// could not register without it). Registration succeeds either way.
//
// The document names and links are read from src/lib/legal.ts so the copy here
// can never fall out of step with what is actually recorded.

const AGREEMENTS = agreementsForContext('signup');
const NOTICES = noticesForContext('signup');

function DocumentLinks({ docs }: { docs: { href: string; title: string }[] }) {
  return (
    <>
      {docs.map((doc, i) => (
        <React.Fragment key={doc.href}>
          {i > 0 && (i === docs.length - 1 ? ' and ' : ', ')}
          <Link
            href={doc.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C9922A] underline underline-offset-2 hover:brightness-125"
          >
            {doc.title}
          </Link>
        </React.Fragment>
      ))}
    </>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms of Use to create an account');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, fullName, marketingConsent);

      if (result.needsEmailConfirmation) {
        setNotice(
          'Account created. Check your email for a confirmation link, then sign in.',
        );
        setLoading(false);
        return;
      }

      // The account exists but the consent record did not save. Surfaced rather
      // than hidden: an account with no consent record is a gap you would
      // otherwise only discover during a dispute.
      if (!result.consentRecorded) {
        console.error('[signup] consent record was not written for', email);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[480px]">
          <div className="text-center mb-10">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-3">
              Create <span className="text-[#C9922A]">Account</span>
            </h1>
            <p className="text-[14px] text-[#8A8E99]">Join South Africa&apos;s premier firearms marketplace</p>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-red-400 text-[13px]">
                  {error}
                </div>
              )}

              {notice && (
                <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-md p-4 text-[#C9922A] text-[13px]">
                  {notice}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="Johan van der Merwe"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {/* ── REQUIRED: contract acceptance ─────────────────────────── */}
              <div className="border-t border-white/5 pt-6 flex flex-col gap-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#C9922A] cursor-pointer"
                  />
                  <span className="text-[13px] text-[#8A8E99] leading-relaxed">
                    I agree to the <DocumentLinks docs={AGREEMENTS} />, and confirm I have read the{' '}
                    <DocumentLinks docs={NOTICES} />.
                  </span>
                </label>

                {/* ── OPTIONAL: marketing, deliberately separate ───────────── */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#C9922A] cursor-pointer"
                  />
                  <span className="text-[13px] text-[#8A8E99] leading-relaxed">
                    {MARKETING_CONSENT_COPY}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !acceptedTerms}
                style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                className="w-full bg-[#C9922A] text-black font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(201,146,42,0.3)]"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3 text-center">
              <p className="text-[13px] text-[#8A8E99]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#C9922A] font-bold hover:underline">
                  Sign in
                </Link>
              </p>
              {/* Without this signpost a dealer or club owner lands here, makes a
                  personal account, and then cannot find their dashboard. */}
              <p className="text-[13px] text-[#8A8E99]">
                Registering a dealer, club, range or service provider?{' '}
                <Link href="/business/register" className="text-[#C9922A] font-bold hover:underline">
                  Business registration &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
