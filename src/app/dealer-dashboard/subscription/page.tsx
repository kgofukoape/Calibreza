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
      { label: 'Featured listings', included: true },
      { label: 'Priority support', included: false },
      { label: 'Verified badge', included: false },
      { label: 'No monthly commitment', included: true },
    ],
    color: 'border-white/10',
    selectedColor: 'border-[#C9922A] bg-[#C9922A]/5',
  },
  {
    id: 'pay_per_ad',
    label: 'Pay Per Ad',
    price: 10,
    priceLabel: 'R10',
    billingLabel: 'per listing',
    listingLimit: null,
    listingLimitLabel: '1 per payment',
    icon: '🎯',
    features: [
      { label: 'Storefront page', included: true },
      { label: 'Featured listings', included: true },
      { label: 'Priority support', included: true },
      { label: 'Verified badge', included: true },
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
  },
];

type Dealer = {
  id: string;
  business_name: string;
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
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    checkAuth();
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
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === dealer?.subscription_tier) return;
    setSelectedPlan(planId);
    setConfirming(true);
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleConfirmPlan = async () => {
    if (!selectedPlan || !dealer) return;
    setSaving(true);
    setSaveError('');

    const { error } = await supabase
      .from('dealers')
      .update({ subscription_tier: selectedPlan })
      .eq('id', dealer.id);

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    setDealer((prev) => prev ? { ...prev, subscription_tier: selectedPlan } : prev);
    setConfirming(false);
    setSelectedPlan(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
    setSaving(false);
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
        <div className="text-[#C9922A] text-xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[280px] bg-[#13151A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex flex-col items-start group">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase group-hover:text-[#C9922A] transition-colors">
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
          <Link href={`/dealers/${dealer?.slug}`} target="_blank" className="block text-center px-4 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-sm font-bold transition-colors">
            View Storefront
          </Link>
          <button onClick={handleLogout} className="w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-sm font-bold transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight">
            Subscription & <span className="text-[#C9922A]">Billing</span>
          </h1>
          <p className="text-[#8A8E99] text-sm mt-1">Manage your plan and listing allowance.</p>
        </header>

        <div className="p-8 space-y-8">

          {/* Success / Error */}
          {saveSuccess && (
            <div className="p-4 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm text-[#2A9C6E] font-bold text-sm">
              ✅ Plan updated successfully!
            </div>
          )}
          {saveError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 font-bold text-sm">
              ❌ {saveError}
            </div>
          )}

          {/* Current Plan Summary */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
              Current <span className="text-[#C9922A]">Plan</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Active Plan</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentPlan.icon}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-[#C9922A]">
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
                      className={`h-full rounded-full transition-all ${
                        activeListings >= currentLimit ? 'bg-red-500' : 'bg-[#C9922A]'
                      }`}
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

          {/* Plan Cards */}
          <div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
              Change <span className="text-[#C9922A]">Plan</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === dealer?.subscription_tier;
                const isSelected = selectedPlan === plan.id;
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
                    {/* Current badge */}
                    {isCurrent && (
                      <div className="absolute top-3 right-3 bg-[#C9922A] text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                        Current
                      </div>
                    )}

                    {/* Pro recommended badge */}
                    {plan.highlight && !isCurrent && (
                      <div className="absolute top-3 right-3 bg-white/10 text-[#F0EDE8] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">
                        Popular
                      </div>
                    )}

                    <div className="text-3xl mb-3">{plan.icon}</div>
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-1">
                      {plan.label}
                    </h3>
                    <div className="flex items-end gap-1 mb-1">
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A]">
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
                      disabled={isCurrent}
                      className={`w-full py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                        isCurrent
                          ? 'bg-[#C9922A]/20 text-[#C9922A] cursor-not-allowed'
                          : 'bg-white/5 border border-white/10 text-[#F0EDE8] hover:bg-[#C9922A] hover:text-black hover:border-[#C9922A]'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Confirm Plan Change */}
          {confirming && selectedPlan && (
            <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                Confirm <span className="text-[#C9922A]">Plan Change</span>
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Switching From</span>
                  <span className="text-sm font-bold text-[#F0EDE8] uppercase">{currentPlan.label}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Switching To</span>
                  <span className="text-sm font-bold text-[#C9922A] uppercase">
                    {PLANS.find((p) => p.id === selectedPlan)?.label}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">New Price</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#C9922A]">
                    {PLANS.find((p) => p.id === selectedPlan)?.priceLabel}{' '}
                    <span className="text-sm text-[#8A8E99]">{PLANS.find((p) => p.id === selectedPlan)?.billingLabel}</span>
                  </span>
                </div>
              </div>

              {/* Payment Notice */}
              <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5 mb-6">
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-2 text-[#C9922A]">
                  💳 Payment Coming Soon
                </h3>
                <p className="text-sm text-[#8A8E99] leading-relaxed">
                  Online payment processing is being set up. Your plan will be updated immediately and our team will be in touch regarding billing. Thank you for your patience.
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
                  onClick={handleConfirmPlan}
                  disabled={saving}
                  className="flex-1 bg-[#C9922A] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Confirm Plan Change'}
                </button>
              </div>
            </div>
          )}

          {/* Feature Comparison Table */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase">
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
                        const f = plan.features.find((f) => f.label === feature);
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