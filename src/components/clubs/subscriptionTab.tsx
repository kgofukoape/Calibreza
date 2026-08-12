'use client';

import React, { useState, useEffect } from 'react';

// ─── CLUB / RANGE SUBSCRIPTION TAB ───────────────────────────────────────────
// Replaces the earlier draft, which was never wired into the dashboard and
// whose "Cancel Subscription" was only a mailto link — while the feature list
// advertised "Cancel anytime — no contracts".
//
// Cancelling never cuts access on the day it is requested:
//   • During the free trial — nothing has been charged, so the trial runs to
//     its end date and then the listing drops to the free tier.
//   • On a paid plan — features continue to the end of the paid period.
// Either way the range stays listed in the public directory afterwards.

interface SubscriptionTabProps {
  club: any;
  subLoading: boolean;
  handleSubscribe: () => void;
  /** Re-fetch the club record after a change so the UI reflects it */
  onChanged?: () => void;
}

export function SubscriptionTab({ club, subLoading, handleSubscribe, onChanged }: SubscriptionTabProps) {
  const [subInfo, setSubInfo] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (club?.id) loadInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club?.id]);

  const loadInfo = async () => {
    try {
      const res = await fetch('/api/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'club', entityId: club.id, action: 'check' }),
      });
      if (res.ok) setSubInfo(await res.json());
    } catch {
      /* non-blocking — the panel still renders from the club record */
    }
  };

  const run = async (action: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'club', entityId: club.id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ kind: 'ok', text: data.message || 'Done.' });
        await loadInfo();
        onChanged?.();
      } else {
        setMsg({ kind: 'err', text: data.error || 'Something went wrong.' });
      }
    } catch {
      setMsg({ kind: 'err', text: 'Could not reach the server. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    const trialing = subInfo?.isTrialling;
    const days = subInfo?.trialDaysLeft ?? 0;
    const warning = trialing
      ? `Cancel your subscription?\n\nNothing has been charged - your trial is free.\nYou keep every feature for the ${days} day${days === 1 ? '' : 's'} still left on your trial.\nAfter that your range stays listed on the free tier.`
      : 'Cancel your subscription?\n\nYou keep full access until the end of your current paid period.\nAfter that your range stays listed on the free tier.';
    if (!confirm(warning)) return;
    run('cancel');
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const trialEnd = club.trial_end_date ? new Date(club.trial_end_date) : null;
  const daysLeft = subInfo?.trialDaysLeft ?? (trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
    : 0);
  const trialEndStr = trialEnd
    ? trialEnd.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const status = subInfo?.status ?? club.subscription_status ?? 'free';
  const isActive = (subInfo?.currentTier ?? club.subscription_tier) === 'active';
  const isTrial = status === 'trial';
  const isCancelling = status === 'cancelling';
  const isFree = !isActive || status === 'free';

  const FEATURES = [
    { icon: '📅', text: 'Booking & RSVP system with calendar' },
    { icon: '✅', text: 'Email confirm/decline with one click' },
    { icon: '🟢', text: 'Live status — open/closed, lanes, ammo' },
    { icon: '⏰', text: 'Time slot management' },
    { icon: '🏆', text: 'Shoot results board' },
    { icon: '🛡️', text: 'SAPS compliance display' },
    { icon: '🌤️', text: 'Live weather widget' },
    { icon: '📷', text: 'Gallery up to 10 photos' },
    { icon: '📊', text: 'Booking analytics' },
    { icon: '❌', text: 'Cancel anytime — no contracts' },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-[700px]">

      {msg && (
        <div className={`p-4 rounded-sm text-[13px] font-bold border leading-relaxed ${
          msg.kind === 'ok'
            ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]'
            : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
        }`}>
          {msg.text}
        </div>
      )}

      {/* ── CURRENT STATUS ─────────────────────────────────────────────────── */}
      <div className={`rounded-sm p-6 border ${
        isCancelling ? 'bg-[#F59E0B]/5 border-[#F59E0B]/30'
        : isTrial    ? 'bg-[#2A9C6E]/5 border-[#2A9C6E]/30'
        : isActive   ? 'bg-[#C9922A]/5 border-[#C9922A]/30'
                     : 'bg-[#13151A] border-white/5'
      }`}>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Current Plan</p>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-1">
          {isActive ? <>Active <span className="text-[#C9922A]">Range</span></> : <>Free <span className="text-[#8A8E99]">Listing</span></>}
        </h3>

        {isCancelling ? (
          <p className="text-[13px] text-[#F59E0B] leading-relaxed">
            {daysLeft > 0
              ? <>Cancellation scheduled. You still have <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'}</strong> of full access{trialEndStr ? ` until ${trialEndStr}` : ''}, then your range moves to the free listing tier.</>
              : <>Cancellation scheduled. Your range moves to the free listing tier at the end of your paid period.</>}
          </p>
        ) : isTrial ? (
          <p className="text-[13px] text-[#2A9C6E] leading-relaxed">
            Free trial — <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'} left</strong>
            {trialEndStr ? <>. First charge on {trialEndStr}.</> : '.'}
          </p>
        ) : isActive ? (
          <p className="text-[13px] text-[#C9922A]">Active &amp; billing — R399/month</p>
        ) : (
          <p className="text-[13px] text-[#8A8E99] leading-relaxed">
            Your range is listed in the public directory. Booking, live status and the results board need the Active plan.
          </p>
        )}
      </div>

      {/* ── UPGRADE PROMPT (free tier) ─────────────────────────────────────── */}
      {isFree && !isCancelling && (
        <div className="bg-[#13151A] border border-[#C9922A]/30 rounded-sm p-6">
          <div className="mb-5">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-1">
              Upgrade to <span className="text-[#C9922A]">Active</span>
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A]">
                R399<span className="text-[16px] text-[#8A8E99] font-bold">/month</span>
              </p>
              <span className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 text-[#2A9C6E] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                2 months free
              </span>
            </div>
            <p className="text-[#8A8E99] text-[12px] mt-1">Less than a box of ammo. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[14px]">{f.icon}</span>
                <span className="text-[12px] text-[#8A8E99]">{f.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubscribe}
            disabled={subLoading}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
            {subLoading ? 'Redirecting to payment...' : 'Start 2 Months Free →'}
          </button>
          <p className="text-[#5A5E69] text-[10px] uppercase tracking-widest text-center mt-2">
            Cancel anytime · No contracts · First charge in 60 days
          </p>
        </div>
      )}

      {/* ── MANAGE (active or trialling) ───────────────────────────────────── */}
      {(isActive || isTrial || isCancelling) && (
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">
            Manage Subscription
          </h3>

          <div className="flex flex-col gap-0 mb-5">
            <Row label="Plan" value="Active — R399/month" />
            <Row
              label="Status"
              value={isCancelling ? `Cancelling — ${daysLeft} day${daysLeft === 1 ? '' : 's'} of access left`
                   : isTrial     ? `Free trial — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
                                 : 'Active & billing'}
              tone={isCancelling ? 'warn' : isTrial ? 'good' : 'gold'}
            />
            {trialEndStr && (
              <Row label={isTrial ? 'First charge' : 'Next charge'} value={isCancelling ? '—' : trialEndStr} />
            )}
          </div>

          {isCancelling ? (
            <>
              <p className="text-[12px] text-[#8A8E99] mb-3 leading-relaxed">
                Changed your mind? Reactivating keeps everything exactly as it is — nothing was lost.
              </p>
              <button onClick={() => run('reactivate')} disabled={busy}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="bg-[#2A9C6E] text-white font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                {busy ? 'Working...' : 'Keep My Subscription'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onCancel} disabled={busy}
                className="border border-[#E63946]/40 text-[#E63946] font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-50">
                {busy ? 'Working...' : 'Cancel Subscription'}
              </button>
              <p className="text-[11px] text-[#8A8E99] mt-3 leading-relaxed">
                {isTrial
                  ? `Nothing has been charged yet. If you cancel, you keep every feature for the ${daysLeft} day${daysLeft === 1 ? '' : 's'} still left on your trial, then your range stays listed on the free tier.`
                  : 'You keep full access to the end of the period you have paid for, then your range stays listed on the free tier.'}
              </p>
            </>
          )}

          <p className="text-[11px] text-[#8A8E99] mt-4 leading-relaxed border-t border-white/5 pt-4">
            Questions about billing? Email{' '}
            <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-125">support@gunx.co.za</a>.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' | 'gold' }) {
  const colour =
    tone === 'good' ? 'text-[#2A9C6E]' :
    tone === 'warn' ? 'text-[#F59E0B]' :
    tone === 'gold' ? 'text-[#C9922A]' : 'text-[#F0EDE8]';
  return (
    <div className="flex justify-between items-center gap-4 py-3 border-b border-white/5">
      <span className="text-[13px] text-[#8A8E99]">{label}</span>
      <span className={`font-black text-[13px] text-right ${colour}`}>{value}</span>
    </div>
  );
}

export default SubscriptionTab;
