'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject || !form.message.trim()) {
      setError('Please complete all fields before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact_form',
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError('Something went wrong. Email us directly at support@gunx.co.za.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[13px] text-[#F0EDE8] focus:border-[#C9922A]/50 focus:outline-none placeholder-[#8A8E99]/40 transition-colors";

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-[900px] mx-auto">
          <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em] mb-3">Get In Touch</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight leading-none mb-4">
            Contact <span className="text-[#C9922A]">The Desk</span>
          </h1>
          <p className="text-[#8A8E99] text-sm md:text-base max-w-xl leading-relaxed">
            Direct channels for verified dealers, platform support, and commercial operations.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* LEFT — DIRECT CHANNELS */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-xl font-black uppercase tracking-widest text-[#F0EDE8] mb-1">
                Direct <span className="text-[#C9922A]">Channels</span>
              </h2>
              <p className="text-[#8A8E99] text-[13px]">Route your query to the right desk for the fastest response.</p>
            </div>

            {/* Support Card */}
            <a href="mailto:support@gunx.co.za"
              className="group bg-[#13151A] border border-white/5 rounded-sm p-6 hover:border-[#C9922A]/30 hover:bg-[#C9922A]/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9922A]/20 transition-all">
                  <span className="text-lg">🛡️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="font-black text-[15px] uppercase tracking-widest text-[#F0EDE8] mb-1 group-hover:text-[#C9922A] transition-colors">
                    Platform & Verification Support
                  </p>
                  <p className="text-[#C9922A] font-bold text-[13px] mb-2">support@gunx.co.za</p>
                  <p className="text-[#8A8E99] text-[12px] leading-relaxed">
                    Technical issues, user verification, account queries, and dealer onboarding documentation.
                  </p>
                </div>
                <span className="text-[#8A8E99] group-hover:text-[#C9922A] transition-colors text-lg flex-shrink-0">→</span>
              </div>
            </a>

            {/* Operations Card */}
            <a href="mailto:pewpew@gunx.co.za"
              className="group bg-[#13151A] border border-white/5 rounded-sm p-6 hover:border-[#C9922A]/30 hover:bg-[#C9922A]/5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9922A]/20 transition-all">
                  <span className="text-lg">🎯</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="font-black text-[15px] uppercase tracking-widest text-[#F0EDE8] mb-1 group-hover:text-[#C9922A] transition-colors">
                    The Marketplace Desk
                  </p>
                  <p className="text-[#C9922A] font-bold text-[13px] mb-2">pewpew@gunx.co.za</p>
                  <p className="text-[#8A8E99] text-[12px] leading-relaxed">
                    High-volume dealer inquiries, banner advertisement placement, premium listings, and commercial partnerships.
                  </p>
                </div>
                <span className="text-[#8A8E99] group-hover:text-[#C9922A] transition-colors text-lg flex-shrink-0">→</span>
              </div>
            </a>

            {/* Response time */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Response Times</p>
              <div className="space-y-2">
                {[
                  { label: 'General Support',    time: 'Within 1 business day' },
                  { label: 'Dealer Verification', time: 'Within 48 hours' },
                  { label: 'Commercial / Ads',    time: 'Within 4 business hours' },
                  { label: 'Urgent / Compliance', time: 'Same day' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between text-[12px]">
                    <span className="text-[#8A8E99]">{item.label}</span>
                    <span className="text-[#F0EDE8] font-bold">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Quick Links</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['FAQs', '/faqs'],
                  ['Dealer Apply', '/dealer/apply'],
                  ['Report a Listing', '/report'],
                  ['FA Ownership', '/firearm-ownership'],
                ].map(([label, href]) => (
                  <Link key={href} href={href}
                    className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:border-[#C9922A]/40 hover:text-[#C9922A] transition-all">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div>
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 md:p-8">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-xl font-black uppercase tracking-widest text-[#F0EDE8] mb-1">
                Send a <span className="text-[#C9922A]">Message</span>
              </h2>
              <p className="text-[#8A8E99] text-[12px] mb-6">We read every message. No bots, no autoresponders.</p>

              {submitted ? (
                <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm p-6 text-center">
                  <div className="text-4xl mb-3">✓</div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="font-black text-xl uppercase text-[#C9922A] mb-2">Message Logged</p>
                  <p className="text-[#8A8E99] text-[13px]">Our team will review and respond within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)}
                    className="mt-4 text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] transition-colors">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Full Name</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange}
                      placeholder="Your full name" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Email Address</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="your@email.com" className={inputClass} />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Subject</label>
                    <select name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
                      <option value="">Select a subject...</option>
                      <option value="General Support">General Support</option>
                      <option value="Dealer Inquiry">Dealer Inquiry</option>
                      <option value="Advertising">Advertising</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Message</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={5}
                      placeholder="Describe your query in detail..." className={`${inputClass} resize-none`} />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3">
                      <p className="text-red-400 text-[13px]">{error}</p>
                    </div>
                  )}

                  <button type="submit" disabled={submitting}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="w-full bg-[#C9922A] text-black font-black text-[14px] uppercase tracking-widest py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                    {submitting ? 'Sending...' : 'Send Message →'}
                  </button>

                  <p className="text-[11px] text-[#8A8E99] text-center">
                    By submitting you agree to our{' '}
                    <Link href="/privacy" className="text-[#C9922A] hover:brightness-125">Privacy Policy</Link>.
                    We never share your details.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <div className="border-t border-white/5 px-4 py-6">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#8A8E99]">© 2026 GX SA (Pty) Ltd — All rights reserved</p>
          <div className="flex gap-4 text-[12px] text-[#8A8E99]">
            <Link href="/terms"   className="hover:text-[#C9922A] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#C9922A] transition-colors">Privacy</Link>
            <Link href="/faqs"    className="hover:text-[#C9922A] transition-colors">FAQs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
