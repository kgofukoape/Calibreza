'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DEALER_PLANS } from '@/lib/plans';

// --- START YOUR FREE PREMIUM TRIAL ---------------------------------------------
// The one step between approval and the dealer dashboard. The dealer adds a
// card through PayFast and pays R0 today; the trial starts the moment PayFast
// confirms. Length and first charge date come from checkout itself (preview
// mode), so this page can never promise something checkout will not do.

type Summary = {
  pay_today: string;
  recurring: string;
  first_charge_on: string;
  trial: boolean;
  founding: boolean;
  trial_months: number;
};

const SUPPORT = 'support@gunx.co.za';

const longDate = (ymd: string): string => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
};

const hasCard = (d: any): boolean =>
  !!d && (!!d.payfast_token || !!d.trial_used || !!d.is_comped
    || (!!d.subscription_status && d.subscription_status !== 'free'));

export default function StartTrialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dealer, setDealer] = useState<any>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [mode, setMode] = useState<'offer' | 'waiting' | 'started' | 'slow'>('offer');
  const [cancelled, setCancelled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const polls = useRef(0);

  const getToken = async (): Promise<string> =>
    (await supabase.auth.getSession()).data.session?.access_token || '';

  const loadDealer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/business/login');
      return null;
    }
    const { data: d } = await supabase
      .from('dealers')
      .select('id, business_name, status, trial_used, payfast_token, subscription_status, is_comped')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!d || d.status !== 'approved') {
      router.replace(d?.status === 'suspended' ? '/dealer-dashboard' : '/business/pending');
      return null;
    }
    setDealer(d);
    return d;
  };

  useEffect(() => {
    (async () => {
      const qs = typeof window !== 'undefined' ? window.location.search : '';
      if (qs.includes('cancel=1')) setCancelled(true);
      const d = await loadDealer();
      if (!d) return;

      if (qs.includes('done=1')) {
        setMode(hasCard(d) ? 'started' : 'waiting');
        setLoading(false);
        return;
      }
      if (hasCard(d)) {
        router.replace('/dealer-dashboard');
        return;
      }
      try {
        const res = await fetch('/api/payfast/dealer-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
          body: JSON.stringify({ plan: 'premium', preview: true }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.summary) setSummary(json.summary);
        else setErr(json.error || 'Could not load your trial details.');
      } catch {
        setErr('Could not reach the server. Please try again.');
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back from PayFast: wait for its confirmation (up to about a minute)
  useEffect(() => {
    if (mode !== 'waiting') return;
    const t = setInterval(async () => {
      polls.current += 1;
      const d = await loadDealer();
      if (d && hasCard(d)) {
        setMode('started');
        clearInterval(t);
        return;
      }
      if (polls.current >= 20) {
        setMode('slow');
        clearInterval(t);
      }
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const start = async () => {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/payfast/dealer-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify({ plan: 'premium' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.payfast_url || !Array.isArray(json?.fields)) {
        setErr(json?.error || 'Could not start checkout. Please try again.');
        setBusy(false);
        return;
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = json.payfast_url;
      (json.fields as Array<[string, string]>).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch {
      setErr('Could not reach the server. Please try again.');
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const btn = 'w-full sm:w-auto bg-[#C9922A] text-black font-black uppercase tracking-widest ' +
    'text-[13px] px-8 py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50';

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <header className="border-b border-white/5">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-2xl font-black uppercase tracking-tighter">
            GUN <span className="text-[#C9922A]">X</span>
          </Link>
          <button onClick={signOut} className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8]">
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-[640px] mx-auto px-4 sm:px-6 py-10 sm:py-16">{children}</main>
    </div>
  );

  const title = (a: string, b: string) => (
    <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      className="text-4xl sm:text-5xl font-black uppercase leading-none mb-4">
      {a} <span className="text-[#C9922A]">{b}</span>
    </h1>
  );

  if (loading) {
    return shell(
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>,
    );
  }

  if (mode === 'waiting') {
    return shell(
      <div className="text-center py-10">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        {title('Confirming with', 'PayFast')}
        <p className="text-[#8A8E99] text-sm">This usually takes a few seconds. Please keep this page open.</p>
      </div>,
    );
  }

  if (mode === 'started') {
    return shell(
      <div className="text-center py-6">
        {title('Your Premium trial', 'has started')}
        <p className="text-[#C9CCD3] text-sm leading-relaxed mb-8">
          Your card is on file with PayFast and nothing has been charged. Every Premium feature is
          now open. We will email you 5 days before your first charge.
        </p>
        <Link href="/dealer-dashboard" className={btn + ' inline-block'}>Go to my dashboard</Link>
      </div>,
    );
  }

  if (mode === 'slow') {
    return shell(
      <div className="text-center py-6">
        {title('Almost', 'there')}
        <p className="text-[#C9CCD3] text-sm leading-relaxed mb-8">
          PayFast has not confirmed your card yet. This sometimes takes a minute or two. If you
          completed the PayFast page, press Check again shortly. If it still does not update,
          email <a href={`mailto:${SUPPORT}`} className="text-[#C9922A]">{SUPPORT}</a>.
        </p>
        <button onClick={() => { polls.current = 0; setMode('waiting'); }} className={btn}>
          Check again
        </button>
      </div>,
    );
  }

  const months = summary?.trial_months || 0;
  const features = DEALER_PLANS.premium.features;

  return shell(
    <>
      {cancelled && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-4 mb-8 text-[13px] text-[#F59E0B]">
          You left PayFast before finishing. Nothing was charged. You can start again below.
        </div>
      )}

      <p className="text-[11px] font-black uppercase tracking-[3px] text-[#8A8E99] mb-4">
        Welcome to Gun X{dealer?.business_name ? `, ${dealer.business_name}` : ''}
      </p>

      {title('Pay R0', 'today')}

      <div className="bg-[#13151A] border border-[#C9922A]/30 rounded-sm p-6 sm:p-8 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] mb-2">
          Your free Premium trial
        </p>
        {months > 0 ? (
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl sm:text-4xl font-black uppercase mb-2">
            {months} month{months === 1 ? '' : 's'} free
          </p>
        ) : (
          <p className="text-sm text-[#E63946] mb-2">{err || 'Trial details are not available.'}</p>
        )}
        {summary?.founding && (
          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-[#C9922A] text-black px-2 py-1 rounded-sm mb-3">
            Founding dealer offer: first 50 dealers
          </span>
        )}
        {summary && (
          <p className="text-sm text-[#C9CCD3] leading-relaxed">
            Then R{Number(summary.recurring).toFixed(0)} per month from{' '}
            <strong className="text-[#F0EDE8]">{longDate(summary.first_charge_on)}</strong>.
            Billing is always on the 1st, so any extra days until then are free too.
          </p>
        )}
      </div>

      <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 sm:p-8 mb-6">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-4">
          Everything in Premium
        </p>
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm text-[#C9CCD3]">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C9922A] flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-l-2 border-[#2A9C6E] pl-4 mb-8 text-sm text-[#C9CCD3] leading-relaxed">
        We email you 5 days before your first charge. Cancel or change plan before then and you
        pay nothing. Your card is held securely by PayFast; Gun X never sees it.
      </div>

      {err && months > 0 && <p className="text-sm text-[#E63946] mb-4">{err}</p>}

      <button onClick={start} disabled={busy || !summary} className={btn}>
        {busy ? 'Opening PayFast...' : 'Start my free trial: R0 today'}
      </button>
      <p className="text-[12px] text-[#8A8E99] mt-3">
        You will go to PayFast to add your card. Nothing is charged today.
      </p>
    </>,
  );
}
