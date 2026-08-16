'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { signUpBusiness } from '@/lib/auth';
import { BUSINESS_TYPE_LIST, BUSINESS_TYPES, type BusinessTypeId } from '@/lib/business';
import {
  agreementsForContext,
  noticesForContext,
  MARKETING_CONSENT_COPY,
} from '@/lib/legal';

// ─── BUSINESS REGISTRATION ───────────────────────────────────────────────────
// Creates the login that owns a dealer, club, range or service listing.
//
// Deliberately separate from /signup. A business account belongs to the
// business and may be shared by its staff; a personal account belongs to one
// person. Keeping them apart means an employee at a gun shop can hold their own
// account for buying and selling without it colliding with the shop's.
//
// Two steps: choose what kind of business, then create the login. The type
// determines which application form comes next — those forms are genuinely
// different (a dealer needs SAPS licensing, a security provider needs PSIRA, a
// club needs neither) so there is no single universal form to send them to.

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

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [businessType, setBusinessType] = useState<BusinessTypeId | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [responsibleEmail, setResponsibleEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = businessType ? BUSINESS_TYPES[businessType] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!businessType) return;
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Business passwords must be at least 8 characters'); return; }
    if (!acceptedTerms) { setError('Please accept the Terms of Use to continue'); return; }

    setLoading(true);

    try {
      const result = await signUpBusiness({
        email,
        password,
        businessType,
        responsiblePerson,
        responsiblePersonEmail: responsibleEmail,
      }, marketingConsent);

      if (result.needsEmailConfirmation) {
        setNotice('Business account created. Check your email for a confirmation link, then sign in to complete your application.');
        setLoading(false);
        return;
      }

      if (!result.consentRecorded) {
        console.error('[business/register] consent record was not written for', email);
      }

      router.push(BUSINESS_TYPES[businessType].applyPath);

    } catch (err: any) {
      setError(err.message || 'Could not create the business account');
      setLoading(false);
    }
  };

  // ── Step 1: choose a business type ─────────────────────────────────────────
  if (!businessType) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="flex-1 max-w-[900px] mx-auto w-full px-6 py-16">
          <div className="text-center mb-8">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-3">
              Create <span className="text-[#C9922A]">Account</span>
            </h1>
            <p className="text-[#8A8E99] text-[14px]">Join South Africa&apos;s premier firearms marketplace</p>
          </div>

          {/* ── ACCOUNT TYPE TABS ──────────────────────────────────────────
              Mirrors /signup so the two entry points look and behave the same
              way round. Whichever page you land on, the other is one click. */}
          <div className="grid grid-cols-2 gap-0 max-w-[520px] mx-auto">
            <Link href="/signup"
              className="text-center py-3.5 border-b-2 border-white/5 bg-[#13151A] rounded-t-md hover:bg-[#191C23] transition-colors"
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}>
              <span className="font-black uppercase tracking-widest text-[13px] text-[#8A8E99]">Personal</span>
              <p className="text-[11px] text-[#8A8E99] normal-case tracking-normal mt-0.5">Buy &amp; sell</p>
            </Link>
            <div
              className="text-center py-3.5 border-b-2 border-[#C9922A] bg-[#191C23] rounded-t-md"
              style={{fontFamily:"'Barlow Condensed', sans-serif"}}>
              <span className="font-black uppercase tracking-widest text-[13px] text-[#C9922A]">Business</span>
              <p className="text-[11px] text-[#8A8E99] normal-case tracking-normal mt-0.5">Dealer · Club · Range · Service</p>
            </div>
          </div>

          <div className="max-w-[520px] mx-auto bg-[#191C23] border border-white/5 border-t-0 rounded-b-md px-6 py-5 mb-8">
            <p className="text-[#8A8E99] text-[13px] leading-relaxed text-center">
              Choose what you are listing. Each type has its own dashboard, its own pricing
              and its own application requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUSINESS_TYPE_LIST.map(type => (
              <button key={type.id} onClick={() => setBusinessType(type.id)}
                className="text-left bg-[#13151A] border border-white/5 rounded-sm p-6 hover:border-[#C9922A]/40 transition-all group">
                <div className="text-3xl mb-3">{type.icon}</div>
                <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                  className="text-2xl font-black uppercase tracking-tight mb-2 group-hover:text-[#C9922A] transition-colors">
                  {type.label}
                </h2>
                <p className="text-[13px] text-[#8A8E99] leading-relaxed mb-4">{type.blurb}</p>
                <p className="text-[11px] text-[#5A5E69] leading-relaxed">
                  <span className="font-black uppercase tracking-widest text-[#8A8E99]">Requires: </span>
                  {type.requirements}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-10 bg-[#13151A] border border-white/5 rounded-sm p-6 text-center">
            <p className="text-[13px] text-[#8A8E99] leading-relaxed">
              If you work for a dealer or club, you can hold a personal account of your own as
              well as access to the business account. The two are separate and do not affect
              each other.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Step 2: create the login ───────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[520px]">

          <button onClick={() => setBusinessType(null)}
            className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A] transition-colors mb-6">
            ← Change business type
          </button>

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">{selected!.icon}</div>
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}}
              className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              {selected!.label} <span className="text-[#C9922A]">Account</span>
            </h1>
            <p className="text-[13px] text-[#8A8E99]">
              Next step after this: your application form.
            </p>
          </div>

          <div className="bg-[#191C23] border border-white/5 rounded-md p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4 text-red-400 text-[13px]">{error}</div>
              )}
              {notice && (
                <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-md p-4 text-[#C9922A] text-[13px]">{notice}</div>
              )}

              <div className="border-l-2 border-[#C9922A] bg-[#C9922A]/[0.07] pl-4 pr-4 py-3">
                <p className="text-[12.5px] text-[#C4C0B8] leading-relaxed">
                  This login belongs to the business and can be shared by your staff. Use whichever
                  address suits you — a shared one like info@yourbusiness.co.za works well.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Login Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="info@yourbusiness.co.za" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="At least 8 characters" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="••••••••" />
              </div>

              <div className="border-t border-white/5 pt-6 flex flex-col gap-6">
                <div>
                  <p style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                    className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] mb-2">
                    Person responsible for this account
                  </p>
                  <p className="text-[12.5px] text-[#8A8E99] leading-relaxed">
                    We need a named person who is accountable for this account and authorised to
                    accept our agreements on behalf of the business.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Full Name</label>
                  <input type="text" value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} required
                    className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                    placeholder="Johan van der Merwe" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold tracking-wider uppercase text-[#8A8E99]">Their Email Address</label>
                  <input type="email" value={responsibleEmail} onChange={e => setResponsibleEmail(e.target.value)} required
                    className="bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] outline-none focus:border-[#C9922A] transition-colors"
                    placeholder="johan@yourbusiness.co.za" />
                  <p className="text-[12px] text-[#8A8E99]">
                    Used for notices about this account. May be the same as the login email.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 flex flex-col gap-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)}
                    className="mt-[3px] w-4 h-4 flex-shrink-0 accent-[#C9922A] cursor-pointer" />
                  <span className="text-[13px] text-[#8A8E99] leading-relaxed">
                    I agree to the <DocumentLinks docs={AGREEMENTS} />, confirm I have read the{' '}
                    <DocumentLinks docs={NOTICES} />, and I am authorised to accept them for this business.
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
                {loading ? 'Creating account...' : 'Create Business Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[13px] text-[#8A8E99]">
                Business already registered?{' '}
                <Link href="/business/login" className="text-[#C9922A] font-bold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}