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

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const INTERESTS = [
  'Pistols', 'Rifles', 'Shotguns', 'Revolvers', 'Air Guns',
  'Ammunition', 'Reloading', 'Optics & Sights', 'Holsters',
  'Hunting', 'Sport Shooting', 'Self-Defence', 'Collecting', 'Accessories',
];

const AGREEMENTS = agreementsForContext('signup');
const NOTICES = noticesForContext('signup');

function DocumentLinks({ docs }: { docs: { href: string; title: string }[] }) {
  return (
    <>
      {docs.map((doc, i) => (
        <React.Fragment key={doc.href}>
          {i > 0 && (i === docs.length - 1 ? ' and ' : ', ')}
          <Link href={doc.href} target="_blank" rel="noopener noreferrer"
            className="text-[#C9922A] underline underline-offset-2 hover:brightness-125">
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
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // When true, the form is replaced by a clear 'check your email' screen.
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (item: string) =>
    setInterests(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!province) { setError('Please select your province'); return; }
    if (!acceptedTerms) { setError('Please accept the Terms of Use to create an account'); return; }

    setLoading(true);

    try {
      const result = await signUp(
        email,
        password,
        { fullName, phone, province, city, interests },
        marketingConsent,
      );

      if (result.needsEmailConfirmation) {
        setEmailSent(true);
        setLoading(false);
        return;
      }

      if (!result.consentRecorded) {
        console.error('[signup] consent record was not written for', email);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const inputClass = "bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors w-full";
  const labelClass = "text-[13px] font-bold tracking-wider uppercase text-[#8A8E99] mb-2 block";

  // ── CONFIRMATION SCREEN ──────────────────────────────────────────────────
  // Replaces the form after a successful signup, so "did my account get
  // created?" is answered plainly instead of by a banner above a filled form.
  if (emailSent) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-[480px] text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#C9922A]/10 border border-[#C9922A]/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#C9922A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-3">
              Check Your <span className="text-[#C9922A]">Email</span>
            </h1>

            <p className="text-[15px] text-[#C4C0B8] leading-relaxed mb-2">
              Your account has been created. We&apos;ve sent a confirmation link to:
            </p>
            <p className="text-[15px] font-bold text-[#F0EDE8] mb-6 break-all">{email}</p>

            <div className="bg-[#191C23] border border-white/5 rounded-md p-5 text-left mb-6">
              <p className="text-[13px] text-[#8A8E99] leading-relaxed">
                Click the link in that email to activate your account, then sign in.
                The link can take a minute to arrive.
              </p>
              <p className="text-[13px] text-[#8A8E99] leading-relaxed mt-3">
                Not there? Check your spam or promotions folder — and make sure the
                address above is correct.
              </p>
            </div>

            <Link href="/login"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3.5 rounded-sm hover:brightness-110 transition-all">
              Go to Sign In
            </Link>

            <p className="text-[12px] text-[#8A8E99] mt-6">
              Wrong address?{' '}
              <button onClick={() => { setEmailSent(false); }}
                className="text-[#C9922A] hover:underline font-bold">
                Start over
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[520px]">

          <div className="text-center mb-8">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className="font-extrabold text-4xl md:text-5xl uppercase text-[#F0EDE8] mb-3">
              Create <span className="text-[#C9922A]">Account</span>
            </h1>
            <p className="text-[14px] text-[#8A8E99]">Join South Africa&apos;s premier firearms marketplace</p>
          </div>

          <div className="grid grid-cols-2 gap-0 mb-0">
            <div
              className="text-center py-3.5 border-b-2 border-[#C9922A] bg-[#191C23] rounded-t-md"
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}>
              <span className="font-black uppercase tracking-widest text-[13px] text-[#C9922A]">Personal</span>
              <p className="text-[11px] text-[#8A8E99] normal-case tracking-normal mt-0.5">Buy &amp; sell</p>
            </div>
            <Link href="/business/register"
              className="text-center py-3.5 border-b-2 border-white/5 bg-[#13151A] rounded-t-md hover:bg-[#191C23] transition-colors"
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}>
              <span className="font-black uppercase tracking-widest text-[13px] text-[#8A8E99]">Business</span>
              <p className="text-[11px] text-[#8A8E99] normal-case tracking-normal mt-0.5">Dealer · Club · Range · Service</p>
            </Link>
          </div>

          <div className="bg-[#191C23] border border-white/5 border-t-0 rounded-b-md p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-red-400 text-[13px]">{error}</div>
              )}
              {notice && (
                <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-md p-4 text-[#C9922A] text-[13px]">{notice}</div>
              )}

              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  className={inputClass} placeholder="Johan van der Merwe" />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className={inputClass} placeholder="your@email.com" />
              </div>

              <div>
                <label className={labelClass}>Mobile Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                  className={inputClass} placeholder="082 123 4567" />
                <p className="text-[12px] text-[#8A8E99] mt-2">
                  Shown to a seller only when you choose to share it in an enquiry.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Province</label>
                  <select value={province} onChange={e => setProvince(e.target.value)} required className={inputClass}>
                    <option value="">Select…</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>City <span className="text-[#5A5E69] normal-case font-normal">(optional)</span></label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    className={inputClass} placeholder="Cape Town" />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Interests <span className="text-[#5A5E69] normal-case font-normal">(optional)</span>
                </label>
                <p className="text-[12px] text-[#8A8E99] mb-3">
                  Pick what you care about and we&apos;ll put it first. You can change this any time.
                </p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(item => {
                    const on = interests.includes(item);
                    return (
                      <button key={item} type="button" onClick={() => toggleInterest(item)}
                        className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${
                          on
                            ? 'border-[#C9922A] bg-[#C9922A]/10 text-[#C9922A]'
                            : 'border-white/10 text-[#8A8E99] hover:border-white/20'
                        }`}>
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className={inputClass} placeholder="••••••••" />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    className={inputClass} placeholder="••••••••" />
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 flex flex-col gap-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                    className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#C9922A] cursor-pointer" />
                  <span className="text-[13px] text-[#8A8E99] leading-relaxed">
                    I agree to the <DocumentLinks docs={AGREEMENTS} />, and confirm I have read the{' '}
                    <DocumentLinks docs={NOTICES} />.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)}
                    className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#C9922A] cursor-pointer" />
                  <span className="text-[13px] text-[#8A8E99] leading-relaxed">{MARKETING_CONSENT_COPY}</span>
                </label>
              </div>

              <button type="submit" disabled={loading || !acceptedTerms}
                style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                className="w-full bg-[#C9922A] text-black font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(201,146,42,0.3)]">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[13px] text-[#8A8E99]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#C9922A] font-bold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}