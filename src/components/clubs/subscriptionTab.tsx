'use client';

import React, { useState, useEffect } from 'react';

// --- CLUB / RANGE SUBSCRIPTION TAB -------------------------------------------
// One panel per situation, so a club never sees a button that does not apply:
//   free trial, no card  -> days left, and Subscribe (R0 today, first R499 on
//                           the 1st after the trial ends)
//   trial, card on file  -> first charge date, Cancel
//   paying               -> next charge, Cancel
//   cancelling           -> access left, Keep my subscription
//   free Listed plan     -> Subscribe (pro rata this month, then R499 on the 1st)
// Cancelling never cuts access on the day: features run to the end of the
// trial or paid period, and the range stays listed for free afterwards.

const PRICE = 499;

interface SubscriptionTabProps {
  club: any;
  subLoading: boolean;
  handleSubscribe: () => void;
  /** Re-fetch the club record after a change so the UI reflects it */
  onChanged?: () => void;
}

const FEATURES = [
  'Booking and RSVP system with calendar',
  'Email confirm or decline with one click',
  'Live status: open or closed, lanes, ammo',
  'Time slot management',
  'Shoot results board',
  'SAPS compliance display',
  'Live weather widget',
  'Gallery of up to 10 photos',
  'Booking analytics',
  'Cancel any time, no contracts',
];

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
      /* non-blocking: the panel still renders from the club record */
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

  // --- Which situation is this club in ----------------------------------------
  const status: string = club.subscription_status || 'free';
  const hasCard = !!club.payfast_token;
  const trialEnd = club.trial_end_date ? new Date(club.trial_end_date) : null;
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000))
    : 0;
  const fmt = (d: Date | null) => d
    ? d.toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg',
      })
    : '';
  const periodEnd = club.current_period_end ? new Date(club.current_period_end) : null;

  const freeTrial = status === 'trial' && !hasCard;
  const cardTrial = status === 'trial' && hasCard;
  const paying = status === 'active';
  const cancelling = status === 'cancelling';
  const listed = !freeTrial && !cardTrial && !paying && !cancelling;

  const onCancel = () => {
    const warning = cardTrial
      ? `Cancel your subscription?\n\nNothing has been charged.\nYou keep every feature for the ${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your trial.\nAfter that your range stays listed for free.`
      : 'Cancel your subscription?\n\nYou keep full access to the end of the period you have paid for.\nAfter that your range stays listed for free.';
    if (!confirm(warning)) return;
    run('cancel');
  };

  const title = (a: string, b: string, gold = true) => (
    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-1">
      {a} <span className={gold ? 'text-[#C9922A]' : 'text-[#8A8E99]'}>{b}</span>
    </h3>
  );

  const subscribeButton = (label: string) => (
    <button
      onClick={handleSubscribe}
      disabled={subLoading}
      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
    >
      {subLoading ? 'Opening PayFast...' : label}
    </button>
  );

  const featureList = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
      {FEATURES.map((f) => (
        <div key={f} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9922A] flex-shrink-0" />
          <span className="text-[12px] text-[#8A8E99]">{f}</span>
        </div>
      ))}
    </div>
  );

  const support = (
    <p className="text-[11px] text-[#8A8E99] leading-relaxed">
      Questions about billing? Email{' '}
      <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-125">support@gunx.co.za</a>.
    </p>
  );

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

      {/* FREE TRIAL, NO CARD */}
      {freeTrial && (
        <div className="rounded-sm p-6 border bg-[#2A9C6E]/5 border-[#2A9C6E]/30">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Current plan</p>
          {title('Active', 'free trial')}
          <p className="text-[13px] text-[#2A9C6E] leading-relaxed mb-5">
            <strong>{daysLeft} day{daysLeft === 1 ? '' : 's'} left</strong>, until {fmt(trialEnd)}.
            No card on file. If you do nothing, your range goes back to the free Listed plan on that day.
          </p>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Keep Active after your trial</p>
          {featureList}
          {subscribeButton(`Subscribe: R0 today`)}
          <p className="text-[#8A8E99] text-[11px] text-center mt-2">
            Your first R{PRICE} is charged on the 1st after your trial ends, so you keep every free day.
          </p>
        </div>
      )}

      {/* FREE LISTED PLAN */}
      {listed && (
        <div className="bg-[#13151A] border border-[#C9922A]/30 rounded-sm p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Current plan</p>
          {title('Free', 'Listing', false)}
          <p className="text-[13px] text-[#8A8E99] leading-relaxed mb-5">
            Your range is listed in the public directory. Booking, live status and the results board
            need the Active plan.
          </p>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A] mb-4">
            R{PRICE}<span className="text-[16px] text-[#8A8E99] font-bold">/month</span>
          </p>
          {featureList}
          {subscribeButton('Subscribe to Active')}
          <p className="text-[#8A8E99] text-[11px] text-center mt-2">
            {club.trial_used
              ? `You pay for the days left in this month, then R${PRICE} on the 1st of each month.`
              : 'Starts with a free trial: R0 today.'}
          </p>
        </div>
      )}

      {/* CARD ON FILE: TRIAL, PAYING OR CANCELLING */}
      {(cardTrial || paying || cancelling) && (
        <div className={`rounded-sm p-6 border ${
          cancelling ? 'bg-[#F59E0B]/5 border-[#F59E0B]/30'
          : cardTrial ? 'bg-[#2A9C6E]/5 border-[#2A9C6E]/30'
          : 'bg-[#C9922A]/5 border-[#C9922A]/30'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Current plan</p>
          {title('Active', 'Range')}

          <div className="flex flex-col mb-5 mt-3">
            <Row label="Plan" value={`Active, R${PRICE}/month`} />
            <Row
              label="Status"
              value={cancelling ? 'Cancelling'
                : cardTrial ? `Free trial, ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
                : 'Active and billing'}
              tone={cancelling ? 'warn' : cardTrial ? 'good' : 'gold'}
            />
            {cardTrial && trialEnd && <Row label="First charge" value={fmt(trialEnd)} />}
            {paying && periodEnd && <Row label="Next charge" value={fmt(periodEnd)} />}
            {cancelling && (periodEnd || trialEnd) && (
              <Row label="Access until" value={fmt(periodEnd || trialEnd)} tone="warn" />
            )}
          </div>

          {cancelling ? (
            <>
              <p className="text-[12px] text-[#8A8E99] mb-3 leading-relaxed">
                Changed your mind? Keeping your subscription changes nothing else.
              </p>
              <button onClick={() => run('reactivate')} disabled={busy}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="bg-[#2A9C6E] text-white font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                {busy ? 'Working...' : 'Keep my subscription'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onCancel} disabled={busy}
                className="border border-[#E63946]/40 text-[#E63946] font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-50">
                {busy ? 'Working...' : 'Cancel subscription'}
              </button>
              <p className="text-[11px] text-[#8A8E99] mt-3 leading-relaxed">
                {cardTrial
                  ? `Nothing has been charged yet. If you cancel, you keep every feature for the ${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your trial, then your range stays listed for free.`
                  : 'You keep full access to the end of the period you have paid for, then your range stays listed for free.'}
              </p>
            </>
          )}
          <div className="border-t border-white/5 pt-4 mt-4">{support}</div>
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
