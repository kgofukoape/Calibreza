'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function RsvpResultContent() {
  const params = useSearchParams();
  const status = params.get('status');
  const name = params.get('name') || 'the shooter';
  const email = params.get('email') || '';
  const range = params.get('range') || '';
  const date = params.get('date') || '';
  const msg = params.get('msg') || '';

  const states: Record<string, { icon: string; color: string; title: string; body: string; sub: string }> = {
    confirmed: {
      icon: '✅',
      color: 'text-green-400',
      title: 'Booking Confirmed!',
      body: `${name}'s visit has been confirmed${date ? ` for ${date}` : ''}. A confirmation email has been sent to ${email}.`,
      sub: 'They\'ve been notified and are good to come.',
    },
    declined: {
      icon: '❌',
      color: 'text-red-400',
      title: 'Booking Declined',
      body: `${name}'s booking has been declined. We've sent them an email letting them know.`,
      sub: 'They\'ve been encouraged to contact you directly to find an alternative date.',
    },
    already: {
      icon: '✓',
      color: 'text-[#C9922A]',
      title: 'Already Confirmed',
      body: `${name}'s booking at ${range} was already confirmed. No action needed.`,
      sub: '',
    },
    already_declined: {
      icon: '–',
      color: 'text-[#8A8E99]',
      title: 'Already Declined',
      body: `${name}'s booking was already declined.`,
      sub: '',
    },
    error: {
      icon: '⚠️',
      color: 'text-[#C9922A]',
      title: 'Something Went Wrong',
      body: msg || 'Could not process this booking action.',
      sub: 'Please check your dashboard or contact Gun X support.',
    },
  };

  const state = states[status || 'error'] || states.error;

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black tracking-tighter uppercase">
              GUN <span className="text-[#C9922A]">X</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-8 text-center">
          <div className={`text-6xl mb-5`}>{state.icon}</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={`text-3xl font-black uppercase mb-3 ${state.color}`}>
            {state.title}
          </h1>
          <p className="text-[#8A8E99] text-[14px] leading-relaxed mb-3">{state.body}</p>
          {state.sub && <p className="text-[#5A5E69] text-[12px]">{state.sub}</p>}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-5">
          <Link href="/club-dashboard"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:brightness-110 transition-all text-center">
            Go to Range Dashboard
          </Link>
          <Link href="/"
            className="w-full border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[13px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">
            Back to Gun X
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RsvpResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RsvpResultContent />
    </Suspense>
  );
}
