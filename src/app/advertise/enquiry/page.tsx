'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── ADVERTISER ENQUIRY FORM ─────────────────────────────────────────────────
// This page is intentionally NOT linked anywhere on the site. It's sent by link
// to outside companies who want to advertise. It captures their details and the
// way they'd like to proceed, then emails the sales team (pewpew@gunx.co.za).
//
// Note: "unlisted" is not the same as "private" — anyone with the link can open
// it. It collects personal information, so it includes a POPIA consent line.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdvertiseEnquiryPage() {
  const [name, setName]         = useState('');
  const [company, setCompany]   = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [preference, setPreference] = useState('');
  const [message, setMessage]   = useState('');
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const canSubmit = name && company && email && preference && consented;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'advertiser_enquiry',
          data: { name, company, email, phone, preference, message },
        }),
      });
      if (!res.ok) throw new Error('Submission failed. Please try again or email pewpew@gunx.co.za directly.');
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99]/50 focus:outline-none focus:border-[#C9922A]/50 transition-colors";
  const labelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-2";

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-lg text-center">
            <div className="text-6xl mb-6">✅</div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight mb-4">
              Enquiry <span className="text-[#C9922A]">Received</span>
            </h1>
            <p className="text-[#8A8E99] mb-8 leading-relaxed">
              Thanks, {name.split(' ')[0]}. Our sales team has your details and will be in touch at <span className="text-[#C9922A] font-bold">{email}</span> to get your campaign set up.
            </p>
            <Link href="/" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all inline-block">
              Return Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-[720px] mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2">
          Advertise on <span className="text-[#C9922A]">Gun X</span>
        </h1>
        <p className="text-[#8A8E99] text-sm mb-8 leading-relaxed">
          Tell us about your business and how you'd like to proceed. Our team will set you up — whether you want to manage your campaign yourself or have us handle it for you.
        </p>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-sm font-bold mb-6">{error}</div>}

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Your Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Full name" />
            </div>
            <div>
              <label className={labelClass}>Company *</label>
              <input value={company} onChange={e => setCompany(e.target.value)} className={inputClass} placeholder="Company name" />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} placeholder="you@company.co.za" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} placeholder="082 123 4567" />
            </div>
          </div>

          <div>
            <label className={labelClass}>How would you like to proceed? *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => setPreference('self_service_card')}
                className={`text-left p-4 rounded-sm border transition-all ${preference === 'self_service_card' ? 'border-[#C9922A] bg-[#C9922A]/5' : 'border-white/10 bg-[#13151A] hover:border-white/20'}`}>
                <p className="font-black text-[13px] uppercase tracking-wide mb-1">Self-Service</p>
                <p className="text-[11px] text-[#8A8E99]">Set me up with an account so I can upload and pay by card myself.</p>
              </button>
              <button onClick={() => setPreference('managed_eft')}
                className={`text-left p-4 rounded-sm border transition-all ${preference === 'managed_eft' ? 'border-[#C9922A] bg-[#C9922A]/5' : 'border-white/10 bg-[#13151A] hover:border-white/20'}`}>
                <p className="font-black text-[13px] uppercase tracking-wide mb-1">Managed + EFT</p>
                <p className="text-[11px] text-[#8A8E99]">Handle it for me — I'll send creative and pay by EFT.</p>
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Anything else? (slot, dates, budget, questions)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} className={`${inputClass} min-h-[100px]`} placeholder="Tell us what you have in mind..." />
          </div>

          {/* POPIA consent */}
          <label className="flex items-start gap-3 cursor-pointer bg-[#13151A] border border-white/10 rounded-sm p-4 hover:border-[#C9922A]/30 transition-all">
            <input type="checkbox" checked={consented} onChange={e => setConsented(e.target.checked)} className="w-5 h-5 accent-[#C9922A] flex-shrink-0 mt-0.5" />
            <span className="text-[12px] text-[#8A8E99] leading-relaxed">
              I consent to Gun X processing the details I've provided to respond to this enquiry, in line with the{' '}
              <Link href="/advertising-policy" target="_blank" className="text-[#C9922A] hover:brightness-125 underline">Advertising Policy</Link>{' '}
              and POPIA.
            </span>
          </label>

          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? 'Sending...' : 'Submit Enquiry →'}
          </button>

          <p className="text-[11px] text-[#8A8E99] text-center">
            Prefer email? Reach us directly at <a href="mailto:pewpew@gunx.co.za" className="text-[#C9922A] hover:brightness-125">pewpew@gunx.co.za</a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
