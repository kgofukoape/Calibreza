'use client';
// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION TAB — drop this JSX into the club-dashboard/page.tsx
// inside the {activeTab === 'subscription' && (...)} block
// ─────────────────────────────────────────────────────────────────────────────
// Also add this function inside the component above the return statement:
//
// const handleSubscribe = async () => {
//   setSubLoading(true);
//   try {
//     const res = await fetch('/api/clubs/subscribe', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         clubId: club.id,
//         clubName: club.name,
//         contactEmail: club.email,
//         contactName: user?.user_metadata?.full_name || club.name,
//       }),
//     });
//     const { payfast_url, params, error } = await res.json();
//     if (error) { alert(error); return; }
//     // Build form and submit to PayFast
//     const form = document.createElement('form');
//     form.method = 'POST';
//     form.action = payfast_url;
//     Object.entries(params).forEach(([key, value]) => {
//       const input = document.createElement('input');
//       input.type = 'hidden';
//       input.name = key;
//       input.value = value as string;
//       form.appendChild(input);
//     });
//     document.body.appendChild(form);
//     form.submit();
//   } catch (err) {
//     alert('Something went wrong. Please try again.');
//   } finally {
//     setSubLoading(false);
//   }
// };
//
// And add to state: const [subLoading, setSubLoading] = useState(false);
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import Link from 'next/link';

interface SubscriptionTabProps {
  club: any;
  subLoading: boolean;
  handleSubscribe: () => void;
}

export function SubscriptionTab({ club, subLoading, handleSubscribe }: SubscriptionTabProps) {
  const trialEnd = club.trial_end_date ? new Date(club.trial_end_date) : null;
  const now = new Date();
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const trialEndStr = trialEnd ? trialEnd.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const isActive = club.subscription_tier === 'active';
  const isTrial = club.subscription_status === 'trial';
  const isCancelled = club.subscription_status === 'cancelled';
  const isFree = !isActive || club.subscription_status === 'free';

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

      {/* CURRENT PLAN STATUS */}
      <div className={`rounded-sm p-6 border ${
        isTrial ? 'bg-[#2A9C6E]/5 border-[#2A9C6E]/30' :
        isActive ? 'bg-[#C9922A]/5 border-[#C9922A]/30' :
        isCancelled ? 'bg-red-500/5 border-red-500/20' :
        'bg-[#13151A] border-white/5'
      }`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Current Plan</p>
            <div className="flex items-center gap-3 mb-2">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-3xl font-black uppercase">
                {isActive ? 'Active' : 'Listed'}
              </p>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm ${
                isTrial ? 'bg-[#2A9C6E]/15 text-[#2A9C6E] border border-[#2A9C6E]/30' :
                isActive ? 'bg-[#C9922A]/15 text-[#C9922A] border border-[#C9922A]/30' :
                isCancelled ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-white/5 text-[#8A8E99] border border-white/10'
              }`}>
                {isTrial ? '🗓️ Free Trial' : isActive ? '✓ Active' : isCancelled ? 'Cancelled' : 'Free'}
              </span>
            </div>

            {isTrial && trialEnd && (
              <div>
                <p className="text-[#2A9C6E] font-bold text-[13px]">
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in free trial
                </p>
                <p className="text-[#8A8E99] text-[12px]">First payment of R399 on {trialEndStr}</p>
              </div>
            )}

            {isActive && !isTrial && (
              <p className="text-[#C9922A] font-bold text-[13px]">R399/month · Next charge coming up</p>
            )}

            {isFree && !isTrial && !isCancelled && (
              <p className="text-[#8A8E99] text-[13px]">Basic directory listing only</p>
            )}

            {isCancelled && (
              <p className="text-red-400 text-[13px]">Your subscription has been cancelled</p>
            )}
          </div>

          {/* Trial progress bar */}
          {isTrial && trialEnd && (
            <div className="w-full md:w-48">
              <div className="flex justify-between text-[10px] text-[#8A8E99] mb-1.5">
                <span>Trial started</span>
                <span>{daysLeft}d left</span>
              </div>
              <div className="w-full h-2 bg-[#0D0F13] rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-[#2A9C6E] rounded-full transition-all"
                  style={{ width: `${Math.max(5, 100 - (daysLeft / 60) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[#8A8E99] mt-1">Billing starts {trialEndStr}</p>
            </div>
          )}
        </div>
      </div>

      {/* UPGRADE PROMPT (for free/listed ranges) */}
      {(isFree || isCancelled) && (
        <div className="bg-[#13151A] border border-[#C9922A]/30 rounded-sm p-6">
          <div className="flex items-start gap-4 mb-5">
            <div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl font-black uppercase mb-1">
                Upgrade to <span className="text-[#C9922A]">Active</span>
              </h3>
              <div className="flex items-center gap-3">
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A]">R399<span className="text-[16px] text-[#8A8E99] font-bold">/month</span></p>
                <span className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 text-[#2A9C6E] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">2 months free</span>
              </div>
              <p className="text-[#8A8E99] text-[12px] mt-1">Less than a box of ammo. Cancel anytime.</p>
            </div>
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

      {/* ACTIVE SUBSCRIPTION MANAGEMENT */}
      {isActive && (
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-xl font-black uppercase mb-4">Manage Subscription</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-[13px] text-[#8A8E99]">Plan</span>
              <span className="font-black text-[13px]">Active — R399/month</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-[13px] text-[#8A8E99]">Status</span>
              <span className={`font-black text-[13px] ${isTrial ? 'text-[#2A9C6E]' : 'text-[#C9922A]'}`}>
                {isTrial ? `Free trial — ${daysLeft} days left` : 'Active & Billing'}
              </span>
            </div>
            {trialEnd && (
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[13px] text-[#8A8E99]">{isTrial ? 'First charge' : 'Next charge'}</span>
                <span className="font-black text-[13px]">{trialEndStr}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3">
              <span className="text-[13px] text-[#8A8E99]">Cancel</span>
              <a
                href="mailto:support@gunx.co.za?subject=Cancel Range Subscription"
                className="text-red-400 font-black text-[12px] uppercase tracking-widest hover:brightness-125 transition-all">
                Cancel Subscription →
              </a>
            </div>
          </div>
          <p className="text-[#5A5E69] text-[11px] mt-4 leading-relaxed">
            To cancel, email support@gunx.co.za with your range name. Cancellations take effect at end of current billing cycle.
            {isTrial && ' Cancel before ' + trialEndStr + ' and you pay nothing.'}
          </p>
        </div>
      )}

      {/* WHAT'S INCLUDED */}
      <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="text-xl font-black uppercase mb-4">Active Plan Includes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <div key={i} className={`flex items-center gap-3 py-2 border-b border-white/5 last:border-0 ${isActive ? '' : 'opacity-50'}`}>
              <span className="text-[16px]">{f.icon}</span>
              <span className="text-[13px] text-[#8A8E99]">{f.text}</span>
              {isActive && <span className="ml-auto text-[#2A9C6E] text-[11px] font-bold">✓</span>}
            </div>
          ))}
        </div>
        <Link href="/clubs/pricing"
          className="block text-center text-[#C9922A] font-bold text-[12px] uppercase tracking-widest mt-4 hover:brightness-125">
          View full pricing page →
        </Link>
      </div>
    </div>
  );
}
