'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    price: 0,
    priceLabel: 'R0',
    billingLabel: 'forever',
    listingLimit: 5,
    listingLimitLabel: '5 listings',
    icon: '🔓',
    features: [
      { label: 'Storefront page', included: true },
      { label: 'Featured listings', included: false },
      { label: 'Priority support', included: false },
      { label: 'Verified badge', included: false },
      { label: 'No monthly commitment', included: true },
    ],
    color: 'border-white/10',
    selectedColor: 'border-[#C9922A] bg-[#C9922A]/5',
    highlight: false,
  },
  {
    id: 'pay_per_ad',
    label: 'Pay Per Ad',
    price: 29,
    priceLabel: 'R29',
    billingLabel: 'per listing',
    listingLimit: null,
    listingLimitLabel: '1 per payment',
    icon: '🎯',
    features: [
      { label: 'Storefront page', included: true },
      { label: 'Featured listings', included: true },
      { label: 'Priority support', included: false },
      { label: 'Verified badge', included: false },
      { label: 'No monthly commitment', included: true },
    ],
    color: 'border-white/10',
    selectedColor: 'border-[#C9922A] bg-[#C9922A]/5',
    highlight: false,
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 499,
    priceLabel: 'R499',
    billingLabel: 'per month',
    listingLimit: 50,
    listingLimitLabel: '50 listings',
    icon: '⚡',
    features: [
      { label: 'Storefront page', included: true },
      { label: 'Featured listings', included: true },
      { label: 'Priority support', included: true },
      { label: 'Verified badge', included: true },
      { label: 'No monthly commitment', included: false },
    ],
    color: 'border-white/10',
    selectedColor: 'border-[#C9922A] bg-[#C9922A]/5',
    highlight: true,
  },
  {
    id: 'premium',
    label: 'Premium',
    price: 799,
    priceLabel: 'R799',
    billingLabel: 'per month',
    listingLimit: null,
    listingLimitLabel: 'Unlimited',
    icon: '👑',
    features: [
      { label: 'Storefront page', included: true },
      { label: 'Featured listings', included: true },
      { label: 'Priority support', included: true },
      { label: 'Verified badge', included: true },
      { label: 'No monthly commitment', included: false },
    ],
    color: 'border-white/10',
    selectedColor: 'border-[#C9922A] bg-[#C9922A]/5',
    highlight: false,
  },
];

type Dealer = {
  id: string;
  business_name: string;
  email: string;
  first_name: string;
  last_name: string;
  slug: string;
  subscription_tier: string;
  status: string;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeListings, setActiveListings] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [subInfo, setSubInfo] = useState<any>(null);
  const [upgradeQuote, setUpgradeQuote] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    checkAuth();
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setStatusMessage('success');
    } else if (params.get('cancel') === 'true') {
      setStatusMessage('cancel');
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }

    const { data: dealerData } = await supabase
      .from('dealers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!dealerData || dealerData.status !== 'approved') {
      router.push('/dealer/login');
      return;
    }

    setDealer(dealerData);

    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('dealer_id', dealerData.id)
      .eq('status', 'active');

    setActiveListings(count || 0);
    setLoading(false);

    // Load subscription state so the UI can prevent double-billing
    fetchSubInfo(dealerData.id);
  };

  // Ask the server about the current subscription state. Used to block starting
  // a second paid subscription while one is still running (double-billing).
  const fetchSubInfo = async (dealerId: string) => {
    try {
      const res = await fetch('/api/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'dealer', entityId: dealerId, action: 'check' }),
      });
      if (res.ok) setSubInfo(await res.json());
    } catch {
      /* non-blocking */
    }
  };

  const runSubAction = async (action: string, targetTier?: string) => {
    if (!dealer?.id) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'dealer', entityId: dealer.id, action, targetTier }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ kind: 'ok', text: data.message || 'Done.' });
        await fetchSubInfo(dealer.id);
        checkAuth();
      } else {
        setActionMessage({ kind: 'err', text: data.error || 'Something went wrong.' });
      }
    } catch {
      setActionMessage({ kind: 'err', text: 'Could not reach the server. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    if (!confirm('Cancel your subscription?\n\nYou keep full access until the end of your current paid period. Nothing is refunded for the period already paid.')) return;
    runSubAction('cancel');
  };

  const handleDowngrade = (tier: string) => {
    if (!confirm(`Downgrade to ${tier}?\n\nThe change takes effect at the end of your current paid period — you keep your current features until then.`)) return;
    runSubAction('downgrade', tier);
  };

  const handleReactivate = () => runSubAction('reactivate');

  const handleSelectPlan = (planId: string) => {
    if (planId === dealer?.subscription_tier) return;
    if (planId === 'free' || planId === 'pay_per_ad') return;

    // If a paid subscription is already running we do NOT simply start a second
    // one (that would double-bill). Instead we fetch a prorated upgrade quote:
    // the unused portion of the current plan is credited against the new one.
    if (subInfo && subInfo.hasActivePaid) {
      requestUpgradeQuote(planId);
      return;
    }

    setSelectedPlan(planId);
    setConfirming(true);
  };

  const requestUpgradeQuote = async (targetTier: string) => {
    if (!dealer?.id) return;
    setActionLoading(true);
    setActionMessage(null);
    setUpgradeQuote(null);
    try {
      const res = await fetch('/api/subscriptions/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'dealer',
          entityId: dealer.id,
          action: 'upgrade_quote',
          targetTier,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpgradeQuote(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Not an upgrade (i.e. a downgrade) — route to the scheduled path
        setActionMessage({ kind: 'err', text: data.error || 'Could not calculate an upgrade.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setActionMessage({ kind: 'err', text: 'Could not reach the server. Please try again.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayFastSubscription = () => {
    if (!selectedPlan || !dealer) return;
    const plan = PLANS.find((p) => p.id === selectedPlan);
    if (!plan || plan.price === 0) return;
    setRedirecting(true);

    const isSandbox = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true';
    const pfHost = isSandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';
    const today = new Date().toISOString().split('T')[0];

    const pfData: Record<string, string> = {
      merchant_id: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '',
      merchant_key: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || '',
      return_url: `${window.location.origin}/dealer-dashboard/subscription?success=true`,
      cancel_url: `${window.location.origin}/dealer-dashboard/subscription?cancel=true`,
      notify_url: `${window.location.origin}/api/payfast/notify`,
      name_first: dealer.first_name || dealer.business_name,
      name_last: dealer.last_name || '',
      email_address: dealer.email || '',
      m_payment_id: dealer.id,
      amount: plan.price.toFixed(2),
      item_name: `GunX ${plan.label} Dealer Subscription`,
      item_description: `Monthly recurring subscription for ${dealer.business_name}`,
      custom_str1: 'dealer_subscription',
      custom_str2: selectedPlan,
      custom_str3: dealer.id,
      subscription_type: '1',
      billing_date: today,
      recurring_amount: plan.price.toFixed(2),
      frequency: '3',
      cycles: '0',
    };

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `https://${pfHost}/eng/process`;

    Object.entries(pfData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  const currentPlan = PLANS.find((p) => p.id === dealer?.subscription_tier) || PLANS[0];
  const currentLimit = currentPlan.listingLimit;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#13151A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex flex-col items-start group">
            <span
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase group-hover:text-[#C9922A] transition-colors"
            >
              GUN <span className="text-[#C9922A] group-hover:text-[#F0EDE8]">X</span>
            </span>
            <span className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">Dealer Dashboard</span>
          </Link>
        </div>

        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C9922A] flex items-center justify-center text-black text-xl font-black rounded-sm">
              {dealer?.business_name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{dealer?.business_name}</h3>
              <p className="text-xs text-[#8A8E99] uppercase tracking-wider">{dealer?.subscription_tier || 'Free'} Plan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/dealer-dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📊</span><span>Overview</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📦</span><span>Inventory</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/add-listing" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>➕</span><span>Add Listing</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/bulk-upload" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📁</span><span>Bulk Upload</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/analytics" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>📈</span><span>Analytics</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/subscription" className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm">
                <span>💳</span><span>Subscription</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>⚙️</span><span>Profile</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/promote" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>⭐</span><span>Promote Listings</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            href={`/dealers/${dealer?.slug}`}
            target="_blank"
            className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors"
          >
            View Storefront
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">

        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6">
          <h1
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl font-black uppercase tracking-tight"
          >
            Subscription & <span className="text-[#C9922A]">Billing</span>
          </h1>
          <p className="text-[#8A8E99] text-sm mt-1">Manage your plan and listing allowance.</p>
        </header>

        <div className="p-8 space-y-8">

          {statusMessage === 'success' && (
            <div className="p-4 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm text-[#2A9C6E] font-bold text-sm">
              ✅ Payment successful! Your subscription is being activated — this may take a minute to reflect.
            </div>
          )}
          {statusMessage === 'cancel' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 font-bold text-sm">
              ❌ Payment cancelled. Your current plan remains unchanged.
            </div>
          )}

          {/* Current Plan Summary */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
            <h2
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black uppercase mb-6"
            >
              Current <span className="text-[#C9922A]">Plan</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Active Plan</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentPlan.icon}</span>
                  <span
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-2xl font-black uppercase text-[#C9922A]"
                  >
                    {currentPlan.label}
                  </span>
                </div>
                <span className="text-sm text-[#8A8E99]">{currentPlan.priceLabel} {currentPlan.billingLabel}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Listings Used</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black">
                  {activeListings}
                  <span className="text-[#8A8E99] text-lg"> / {currentLimit === null ? '∞' : currentLimit}</span>
                </span>
                {currentLimit !== null && (
                  <div className="w-full h-1.5 bg-[#0D0F13] rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${activeListings >= currentLimit ? 'bg-red-500' : 'bg-[#C9922A]'}`}
                      style={{ width: `${Math.min((activeListings / currentLimit) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Features</span>
                <div className="flex flex-col gap-1">
                  {currentPlan.features.filter((f) => f.included).map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-[#2A9C6E] text-xs">✓</span>
                      <span className="text-xs text-[#F0EDE8]">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── PRORATED UPGRADE QUOTE ──────────────────────────────────── */}
          {upgradeQuote && (
            <div className="bg-[#13151A] border border-[#C9922A]/30 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl font-black uppercase mb-2">
                Upgrade to <span className="text-[#C9922A]">{upgradeQuote.targetTier}</span>
              </h2>
              <p className="text-[13px] text-[#8A8E99] mb-5 leading-relaxed">
                {upgradeQuote.explanation}
              </p>

              <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-4 mb-5 space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#8A8E99]">{upgradeQuote.targetTier} plan</span>
                  <span className="text-[#F0EDE8] font-bold">R{Number(upgradeQuote.newPlanPrice).toFixed(2)}</span>
                </div>
                {upgradeQuote.canProrate && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#8A8E99]">
                      Credit — {upgradeQuote.unusedDays} unused day{upgradeQuote.unusedDays === 1 ? '' : 's'} of {upgradeQuote.currentTier}
                    </span>
                    <span className="text-[#2A9C6E] font-bold">− R{Number(upgradeQuote.creditAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] self-center">Pay today</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A]">
                    R{Number(upgradeQuote.amountDueToday).toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-[#8A8E99] pt-1">
                  Then R{Number(upgradeQuote.recurringAmount).toFixed(2)} per month from next month.
                </p>
              </div>

              {upgradeQuote.requiresOldSubscriptionCancellation && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-4 mb-5">
                  <p className="text-[12px] text-[#F59E0B] leading-relaxed">
                    <strong className="uppercase tracking-widest font-black">One step on our side</strong><br />
                    Your existing {upgradeQuote.currentTier} debit order must be stopped before the new one starts,
                    so you are never charged twice. Payments are not live on Gun X yet — request the upgrade below
                    and our team will action it and confirm by email before anything is charged.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <a
                  href={`mailto:support@gunx.co.za?subject=Upgrade%20to%20${encodeURIComponent(upgradeQuote.targetTier)}&body=${encodeURIComponent(
                    `Please upgrade my account to ${upgradeQuote.targetTier}.\n\n` +
                    `Business: ${dealer?.business_name || ''}\n` +
                    `Current plan: ${upgradeQuote.currentTier}\n` +
                    `Quoted today: R${Number(upgradeQuote.amountDueToday).toFixed(2)}\n` +
                    `Then: R${Number(upgradeQuote.recurringAmount).toFixed(2)}/month`
                  )}`}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm hover:brightness-110 transition-all">
                  Request This Upgrade
                </a>
                <button onClick={() => setUpgradeQuote(null)}
                  className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm hover:bg-white/5 transition-all">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ── MANAGE SUBSCRIPTION ─────────────────────────────────────── */}
          {subInfo && (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl font-black uppercase mb-4">
                Manage <span className="text-[#C9922A]">Subscription</span>
              </h2>

              {actionMessage && (
                <div className={`mb-4 p-3 rounded-sm text-[13px] font-bold border ${
                  actionMessage.kind === 'ok'
                    ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]'
                    : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
                }`}>
                  {actionMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Status</p>
                  <p className="text-sm font-bold uppercase text-[#F0EDE8]">
                    {(subInfo.status || 'free').replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Current Plan</p>
                  <p className="text-sm font-bold uppercase text-[#C9922A]">{subInfo.currentTier || 'free'}</p>
                </div>
                <div className="bg-[#0D0F13] border border-white/5 rounded-sm p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Paid Until</p>
                  <p className="text-sm font-bold text-[#F0EDE8]">
                    {subInfo.periodEnd
                      ? new Date(subInfo.periodEnd).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>

              {subInfo.pendingTier && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-3 mb-5">
                  <p className="text-[12px] text-[#F59E0B] leading-relaxed">
                    <strong className="uppercase tracking-widest font-black">Change scheduled</strong><br />
                    Your plan changes to <strong>{subInfo.pendingTier}</strong> at the end of your current paid period.
                    You keep your current features until then.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {subInfo.status === 'cancelling' ? (
                  <button onClick={handleReactivate} disabled={actionLoading}
                    className="bg-[#2A9C6E] text-white font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                    {actionLoading ? 'Working...' : 'Keep My Subscription'}
                  </button>
                ) : subInfo.hasActivePaid ? (
                  <>
                    {subInfo.currentTier === 'premium' && (
                      <button onClick={() => handleDowngrade('pro')} disabled={actionLoading}
                        className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm hover:bg-white/5 transition-all disabled:opacity-50">
                        Downgrade to Pro
                      </button>
                    )}
                    <button onClick={handleCancel} disabled={actionLoading}
                      className="border border-[#E63946]/40 text-[#E63946] font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm hover:bg-[#E63946]/10 transition-all disabled:opacity-50">
                      {actionLoading ? 'Working...' : 'Cancel Subscription'}
                    </button>
                  </>
                ) : (
                  <p className="text-[13px] text-[#8A8E99]">
                    You are on the free tier. Choose a plan below to subscribe.
                  </p>
                )}
              </div>

              <p className="text-[11px] text-[#8A8E99] mt-4 leading-relaxed">
                Cancellations and downgrades take effect at the end of your current paid period — you keep what you have
                paid for. Need something else? Email{' '}
                <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-125">support@gunx.co.za</a>.
              </p>
            </div>
          )}

          {/* Plan Cards */}
          <div>
            <h2
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black uppercase mb-6"
            >
              Change <span className="text-[#C9922A]">Plan</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === dealer?.subscription_tier;
                const isSelected = selectedPlan === plan.id;
                const isSelectable = plan.price > 0 && plan.id !== 'pay_per_ad';
                return (
                  <div
                    key={plan.id}
                    className={`relative border-2 rounded-sm p-6 flex flex-col transition-all ${
                      isCurrent
                        ? 'border-[#C9922A] bg-[#C9922A]/5'
                        : isSelected
                        ? 'border-[#C9922A]/60 bg-[#C9922A]/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-3 right-3 bg-[#C9922A] text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                        Current
                      </div>
                    )}
                    {plan.highlight && !isCurrent && (
                      <div className="absolute top-3 right-3 bg-white/10 text-[#F0EDE8] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                        Popular
                      </div>
                    )}

                    <div className="text-3xl mb-3">{plan.icon}</div>
                    <h3
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-xl font-black uppercase mb-1"
                    >
                      {plan.label}
                    </h3>
                    <div className="flex items-end gap-1 mb-1">
                      <span
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-3xl font-black text-[#C9922A]"
                      >
                        {plan.priceLabel}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8A8E99] mb-4">{plan.billingLabel}</span>
                    <div className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">
                      {plan.listingLimitLabel}
                    </div>
                    <div className="flex flex-col gap-2 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <div key={f.label} className="flex items-center gap-2">
                          <span className={`text-xs flex-shrink-0 ${f.included ? 'text-[#2A9C6E]' : 'text-[#8A8E99]/40'}`}>
                            {f.included ? '✓' : '✗'}
                          </span>
                          <span className={`text-[12px] ${f.included ? 'text-[#F0EDE8]' : 'text-[#8A8E99]/40'}`}>
                            {f.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent || !isSelectable}
                      className={`w-full py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                        isCurrent
                          ? 'bg-[#C9922A]/20 text-[#C9922A] cursor-not-allowed'
                          : !isSelectable
                          ? 'bg-white/5 text-[#8A8E99] cursor-not-allowed'
                          : 'bg-white/5 border border-white/10 text-[#F0EDE8] hover:bg-[#C9922A] hover:text-black hover:border-[#C9922A]'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : isSelectable ? 'Subscribe' : 'Contact Us'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm + Pay */}
          {confirming && selectedPlan && (
            <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-6">
              <h2
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl font-black uppercase mb-6"
              >
                Confirm <span className="text-[#C9922A]">Subscription</span>
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Current Plan</span>
                  <span className="text-sm font-bold text-[#F0EDE8] uppercase">{currentPlan.label}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">New Plan</span>
                  <span className="text-sm font-bold text-[#C9922A] uppercase">
                    {PLANS.find((p) => p.id === selectedPlan)?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Monthly Amount</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#C9922A]">
                    {PLANS.find((p) => p.id === selectedPlan)?.priceLabel}
                    <span className="text-sm text-[#8A8E99]"> /mo</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Billing</span>
                  <span className="text-sm font-bold text-[#F0EDE8]">Auto-renews monthly via PayFast</span>
                </div>
              </div>

              <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-4 mb-6">
                <p className="text-[12px] text-[#8A8E99] leading-relaxed">
                  🔒 You will be redirected to PayFast to complete your subscription securely. Your card will be charged{' '}
                  <strong className="text-[#F0EDE8]">{PLANS.find((p) => p.id === selectedPlan)?.priceLabel}</strong>{' '}
                  today and automatically every month. Cancel anytime by contacting us.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setConfirming(false); setSelectedPlan(null); }}
                  className="px-6 py-3 border border-white/10 rounded-sm text-sm font-black uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayFastSubscription}
                  disabled={redirecting}
                  className="flex-1 bg-[#C9922A] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {redirecting ? 'Redirecting to PayFast...' : '💳 Pay & Subscribe'}
                </button>
              </div>
            </div>
          )}

          {/* Feature Comparison Table */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl font-black uppercase"
              >
                Plan <span className="text-[#C9922A]">Comparison</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Feature</th>
                    {PLANS.map((plan) => (
                      <th key={plan.id} className="p-4 text-center">
                        <div className={`text-[11px] font-black uppercase tracking-widest ${
                          plan.id === dealer?.subscription_tier ? 'text-[#C9922A]' : 'text-[#F0EDE8]'
                        }`}>
                          {plan.label}
                        </div>
                        {plan.id === dealer?.subscription_tier && (
                          <div className="text-[9px] text-[#C9922A] font-bold mt-0.5">Current</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-sm text-[#8A8E99]">Monthly Price</td>
                    {PLANS.map((plan) => (
                      <td key={plan.id} className="p-4 text-center text-sm font-black text-[#C9922A]">
                        {plan.priceLabel}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-sm text-[#8A8E99]">Listing Allowance</td>
                    {PLANS.map((plan) => (
                      <td key={plan.id} className="p-4 text-center text-sm font-bold text-[#F0EDE8]">
                        {plan.listingLimitLabel}
                      </td>
                    ))}
                  </tr>
                  {['Storefront page', 'Featured listings', 'Priority support', 'Verified badge', 'No monthly commitment'].map((feature) => (
                    <tr key={feature} className="border-b border-white/5 last:border-0">
                      <td className="p-4 text-sm text-[#8A8E99]">{feature}</td>
                      {PLANS.map((plan) => {
                        const f = plan.features.find((feat) => feat.label === feature);
                        return (
                          <td key={plan.id} className="p-4 text-center">
                            <span className={`text-base ${f?.included ? 'text-[#2A9C6E]' : 'text-[#8A8E99]/30'}`}>
                              {f?.included ? '✓' : '✗'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
