'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const ACTIVE_FEATURES = [
  { icon: '📍', text: 'Full profile page on Gun X directory' },
  { icon: '📅', text: 'Booking & RSVP system with calendar' },
  { icon: '✅', text: 'Email confirm/decline flow with one click' },
  { icon: '🟢', text: 'Live status bar — open/closed, lanes, ammo' },
  { icon: '⏰', text: 'Time slot management for range sessions' },
  { icon: '🏆', text: 'Shoot results board — post scores publicly' },
  { icon: '🛡️', text: 'SAPS compliance & certificate display' },
  { icon: '🌤️', text: 'Live weather widget on your profile' },
  { icon: '📷', text: 'Gallery — up to 10 photos' },
  { icon: '🔫', text: 'Guns for hire toggle with live availability' },
  { icon: '📊', text: 'Booking analytics & visitor stats' },
  { icon: '❌', text: 'Cancel anytime — no lock-in contracts' },
];

const FAQS = [
  {
    q: 'When do I get charged?',
    a: 'Your first 2 months are completely free. We collect your card details upfront but your first payment of R399 only processes on day 61.',
  },
  {
    q: 'Can I cancel before the trial ends?',
    a: 'Yes — cancel anytime from your dashboard before the trial ends and you will never be charged. No questions asked.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'Your subscription automatically continues at R399/month. You will receive an email reminder 7 days before your trial ends.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major South African credit and debit cards, as well as EFT via PayFast — South Africa\'s leading payment gateway.',
  },
  {
    q: 'Can I stay on the free Listed tier?',
    a: 'Yes. Your range will always appear in our directory for free. The Active subscription unlocks the booking system and all MOAT features.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No setup fee. No hidden costs. Just R399/month after your 2-month free trial.',
  },
];

export default function ClubsPricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const billingDate = new Date();
  billingDate.setDate(billingDate.getDate() + 60);
  const billingDateStr = billingDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9922A]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-[900px] mx-auto px-4 py-16 md:py-24 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm px-4 py-2 mb-6">
            <span className="text-[#C9922A] text-[11px] font-black uppercase tracking-widest">🎯 Limited Time Offer</span>
          </div>

          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4 leading-none">
            Get Your Range <span className="text-[#C9922A]">On The Map</span>
          </h1>

          <p className="text-[#8A8E99] text-[16px] md:text-[18px] leading-relaxed mb-6 max-w-[600px] mx-auto">
            South Africa's only firearms classifieds platform with a dedicated range booking system.
            Sign up now and your first <strong className="text-[#F0EDE8]">2 months are completely free.</strong>
          </p>

          {/* Trial callout */}
          <div className="inline-flex items-center gap-3 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm px-5 py-3 mb-8">
            <span className="text-2xl">🗓️</span>
            <div className="text-left">
              <p className="text-[#2A9C6E] font-black text-[12px] uppercase tracking-widest">First payment only on {billingDateStr}</p>
              <p className="text-[#8A8E99] text-[11px]">Cancel before then and you pay nothing. Ever.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/clubs/range-apply"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] px-8 py-4 rounded-sm hover:brightness-110 transition-all">
              Start 2 Months Free →
            </Link>
            <Link href="/clubs"
              className="border border-white/20 text-[#8A8E99] font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:bg-white/5 transition-all">
              Browse Ranges First
            </Link>
          </div>

          <p className="text-[#5A5E69] text-[11px] mt-4 uppercase tracking-widest">No setup fee · Cancel anytime · R399/month after trial</p>
        </div>
      </div>

      {/* TIER COMPARISON */}
      <div className="max-w-[900px] mx-auto px-4 py-16">
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="text-4xl font-black uppercase text-center mb-10">
          Choose Your <span className="text-[#C9922A]">Plan</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          {/* LISTED — FREE */}
          <div className="bg-[#13151A] border border-white/10 rounded-sm p-7 flex flex-col">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Listed</p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-5xl font-black">Free</p>
              <p className="text-[#8A8E99] text-[13px] mt-1">Always free — no credit card needed</p>
            </div>
            <div className="flex flex-col gap-3 flex-1 mb-6">
              {[
                '✓ Basic range profile',
                '✓ Listed in directory',
                '✓ Contact details visible',
                '✗ No booking system',
                '✗ No live status',
                '✗ No results board',
                '✗ No analytics',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-[13px] ${item.startsWith('✗') ? 'text-[#5A5E69]' : 'text-[#2A9C6E]'}`}>{item}</span>
                </div>
              ))}
            </div>
            <Link href="/clubs/range-apply"
              className="w-full border border-white/20 text-[#8A8E99] font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">
              Register for Free
            </Link>
          </div>

          {/* ACTIVE — R399 */}
          <div className="bg-[#13151A] border-2 border-[#C9922A] rounded-sm p-7 flex flex-col relative overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-4 right-4 bg-[#C9922A] text-black text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm">
              Most Popular
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] mb-1">Active</p>
              <div className="flex items-end gap-2">
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-5xl font-black text-[#C9922A]">R399</p>
                <p className="text-[#8A8E99] text-[13px] mb-1">/month</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 text-[#2A9C6E] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                  2 months free
                </span>
                <span className="text-[#5A5E69] text-[11px]">then R399/month</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 flex-1 mb-6">
              {ACTIVE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[15px] flex-shrink-0">{f.icon}</span>
                  <span className="text-[13px] text-[#F0EDE8]">{f.text}</span>
                </div>
              ))}
            </div>

            <Link href="/clubs/range-apply"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-3.5 rounded-sm hover:brightness-110 transition-all text-center">
              Start 2 Months Free →
            </Link>
            <p className="text-[#5A5E69] text-[10px] uppercase tracking-widest text-center mt-2">
              Cancel anytime · No lock-in · First charge {billingDateStr}
            </p>
          </div>
        </div>

        {/* Value anchor */}
        <div className="mt-6 bg-[#13151A] border border-white/5 rounded-sm px-5 py-4 flex items-center gap-4">
          <span className="text-3xl">💡</span>
          <p className="text-[#8A8E99] text-[13px] leading-relaxed">
            <strong className="text-[#F0EDE8]">Less than a box of ammo.</strong> A single 50-round box of quality 9mm runs R380–R450.
            Your Active subscription costs less — and brings you paying shooters every month.
          </p>
        </div>
      </div>

      {/* WHAT YOU GET — DETAIL */}
      <div className="border-t border-white/5 bg-[#13151A]">
        <div className="max-w-[900px] mx-auto px-4 py-16">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl font-black uppercase text-center mb-10">
            Everything in <span className="text-[#C9922A]">Active</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: '📅', title: 'Booking Calendar', desc: 'Shooters book directly on your profile. You confirm or decline with one click in your email — no app needed.' },
              { icon: '🟢', title: 'Live Status Bar', desc: 'Show real-time status: open/closed, lanes available, ammo in stock, guns for hire. Updated from your dashboard in seconds.' },
              { icon: '🏆', title: 'Results Board', desc: 'Post competition results publicly. Gold, silver, bronze medals. Builds community and keeps members coming back.' },
              { icon: '🛡️', title: 'SAPS Compliance Display', desc: 'Show your registration number and compliance certificate. Builds trust with new visitors instantly.' },
              { icon: '🌤️', title: 'Live Weather Widget', desc: 'Real-time conditions on your profile page. Wind speed, visibility, UV — helps shooters plan their visit.' },
              { icon: '📊', title: 'Booking Analytics', desc: 'See who booked, how many people, which slots are popular. Data to help you optimise your schedule.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-[#0D0F13] border border-white/5 rounded-sm p-5">
                <span className="text-3xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black uppercase text-[15px] mb-1">{item.title}</p>
                  <p className="text-[#8A8E99] text-[13px] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-[700px] mx-auto px-4 py-16">
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="text-4xl font-black uppercase text-center mb-8">
          Frequently Asked <span className="text-[#C9922A]">Questions</span>
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="font-black text-[14px] uppercase tracking-wide">{faq.q}</span>
                <span className={`text-[#C9922A] font-black text-lg transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 border-t border-white/5">
                  <p className="text-[#8A8E99] text-[13px] leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="border-t border-white/5 bg-[#13151A]">
        <div className="max-w-[700px] mx-auto px-4 py-16 text-center">
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-5xl font-black uppercase mb-4">
            Ready to fill your <span className="text-[#C9922A]">range?</span>
          </h2>
          <p className="text-[#8A8E99] text-[14px] mb-8">
            2 months free. No setup fee. Cancel anytime. First charge {billingDateStr}.
          </p>
          <Link href="/clubs/range-apply"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] px-10 py-4 rounded-sm hover:brightness-110 transition-all">
            Get Started Free →
          </Link>
          <p className="text-[#5A5E69] text-[11px] mt-4 uppercase tracking-widest">
            Cancel anytime · No lock-in · R399/month after 2 months free
          </p>
        </div>
      </div>
    </div>
  );
}
