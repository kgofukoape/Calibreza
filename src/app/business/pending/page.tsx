'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { BUSINESS_TYPE_LIST } from '@/lib/business';
import { getBusinessStatus, type BusinessStatus } from '@/lib/businessStatus';

// --- APPROVAL PENDING --------------------------------------------------------
// Where an unapproved business account lives. It can see where its
// application stands and contact support. It cannot list, buy or sell until
// an admin approves it; the database enforces that separately.

const SUPPORT = 'support@gunx.co.za';

export default function BusinessPendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<BusinessStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const load = async (quiet = false) => {
    if (quiet) setChecking(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/business/login');
      return;
    }
    const s = await getBusinessStatus(user.id);
    if (s && !s.needsApproval) {
      router.replace(s.type.dashboardPath);
      return;
    }
    setState(s);
    setLoading(false);
    setChecking(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const heading = (a: string, b: string) => (
    <h1
      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      className="text-3xl sm:text-4xl font-black uppercase leading-none mb-3"
    >
      {a} <span className="text-[#C9922A]">{b}</span>
    </h1>
  );

  const footer = (
    <div className="flex flex-col sm:flex-row gap-3 mt-8">
      <button
        onClick={() => load(true)}
        disabled={checking}
        className="w-full sm:w-auto bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
      >
        {checking ? 'Checking...' : 'Check again'}
      </button>
      <button
        onClick={signOut}
        className="w-full sm:w-auto border border-white/15 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all"
      >
        Sign out
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[560px] mx-auto px-4 sm:px-6 py-24 text-center">
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading...</p>
        </main>
      </div>
    );
  }

  // Business account with no application yet
  if (!state) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[560px] mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 sm:p-10">
            {heading('Finish your', 'application')}
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-6">
              This business account has no application yet. Choose what you are
              applying as. Your account opens once the Gun X team has checked
              your documents and approved it.
            </p>
            <div className="space-y-3">
              {BUSINESS_TYPE_LIST.map((t) => (
                <Link
                  key={t.id}
                  href={t.applyPath}
                  className="flex items-center gap-3 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-4 hover:border-[#C9922A]/50 transition-all"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="flex-1">
                    <span className="block font-black uppercase tracking-widest text-[12px]">{t.label}</span>
                    <span className="block text-[12px] text-[#8A8E99] mt-1">{t.requirements}</span>
                  </span>
                </Link>
              ))}
            </div>
            {footer}
          </div>
        </main>
      </div>
    );
  }

  const rejected = state.status === 'rejected';
  const submitted = state.createdAt
    ? new Date(state.createdAt).toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const steps = [
    { label: 'Business account created', done: true },
    { label: 'Application and documents submitted', done: true },
    { label: 'Checked by the Gun X team', done: false },
    { label: 'Approved: your dashboard opens', done: false },
  ];

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-[560px] mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8A8E99] mb-3">
            {state.type.label} application
          </p>

          {rejected
            ? heading('Application', 'not approved')
            : heading('Approval', 'pending')}

          <p className="text-[#F0EDE8] font-bold mb-1">{state.name}</p>
          {submitted && (
            <p className="text-[12px] text-[#8A8E99] mb-6">Submitted {submitted}</p>
          )}

          {rejected ? (
            <p className="text-[#8A8E99] text-sm leading-relaxed">
              Your application was not approved. We will have emailed you the
              reason. If you think this is a mistake, or you can provide what
              was missing, email{' '}
              <a href={`mailto:${SUPPORT}`} className="text-[#C9922A]">{SUPPORT}</a>.
            </p>
          ) : (
            <>
              <ol className="space-y-4 mb-6">
                {steps.map((s, i) => {
                  const current = !s.done && (i === 0 || steps[i - 1].done);
                  return (
                    <li key={s.label} className="flex items-start gap-3">
                      <span
                        className={
                          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black ' +
                          (s.done
                            ? 'bg-[#2A9C6E] text-black'
                            : current
                              ? 'bg-[#C9922A] text-black'
                              : 'bg-white/10 text-[#8A8E99]')
                        }
                      >
                        {s.done ? 'OK' : i + 1}
                      </span>
                      <span className="pt-1">
                        <span className={'block text-sm font-bold ' + (s.done || current ? 'text-[#F0EDE8]' : 'text-[#8A8E99]')}>
                          {s.label}
                        </span>
                        {current && (
                          <span className="block text-[12px] text-[#C9922A] mt-1">In progress</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-4 text-sm text-[#8A8E99] leading-relaxed">
                <p className="mb-2">
                  <strong className="text-[#F0EDE8]">What happens next.</strong>{' '}
                  We check your details and documents, usually within 2 to 3
                  business days. You will get an email when your account is
                  approved, or if we need anything else from you.
                </p>
                <p>
                  Until then you cannot list, buy or sell on Gun X. Questions:{' '}
                  <a href={`mailto:${SUPPORT}`} className="text-[#C9922A]">{SUPPORT}</a>
                </p>
              </div>
            </>
          )}

          {footer}
        </div>
      </main>
    </div>
  );
}
