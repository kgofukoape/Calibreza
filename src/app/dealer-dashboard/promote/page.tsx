'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PROMOTION_TIERS = [
  {
    id: 'provincial',
    label: 'Provincial',
    price: 19,
    duration: 5,
    description: 'Featured in your province only',
    icon: '📍',
    color: 'border-[#C9922A]/30 hover:border-[#C9922A]',
    selectedColor: 'border-[#C9922A] bg-[#C9922A]/10',
  },
  {
    id: 'national',
    label: 'National',
    price: 29,
    duration: 5,
    description: 'Featured across all provinces',
    icon: '🇿🇦',
    color: 'border-white/10 hover:border-[#C9922A]/50',
    selectedColor: 'border-[#C9922A] bg-[#C9922A]/10',
  },
];

type Listing = {
  id: string;
  title: string;
  price: number;
  category_id: string;
  images: string[];
  is_featured: boolean;
  featured_until: string | null;
  status: string;
};

type Dealer = {
  id: string;
  business_name: string;
  slug: string;
  subscription_tier: string;
  status: string;
};

function PromoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('id');

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

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

    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, title, price, category_id, images, is_featured, featured_until, status')
      .eq('dealer_id', dealerData.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const activeListings = listingsData || [];
    setListings(activeListings);

    if (preselectedId) {
      const found = activeListings.find((l) => l.id === preselectedId);
      if (found) {
        setSelectedListing(found);
        setStep(2);
      }
    }

    setLoading(false);
  };

  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    setStep(2);
  };

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!selectedListing || !selectedTier) return;
    setSubmitting(true);
    setError('');

    const tier = PROMOTION_TIERS.find((t) => t.id === selectedTier);
    if (!tier) return;

    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + tier.duration);

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
      })
      .eq('id', selectedListing.id)
      .eq('dealer_id', dealer!.id);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dealer/login');
  };

  const formatCategory = (cat: string) =>
    cat ? cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

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
              <Link href="/dealer-dashboard/subscription" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>💳</span><span>Subscription</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-sm text-[#8A8E99] hover:text-[#F0EDE8] font-bold text-sm transition-colors">
                <span>⚙️</span><span>Profile</span>
              </Link>
            </li>
            <li>
              <Link href="/dealer-dashboard/promote" className="flex items-center gap-3 px-4 py-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[#C9922A] font-bold text-sm">
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
        <header className="bg-[#13151A] border-b border-white/5 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase tracking-tight">
              Promote <span className="text-[#C9922A]">Listings</span>
            </h1>
            <p className="text-[#8A8E99] text-sm mt-1">Feature your listings to get more visibility and inquiries.</p>
          </div>
          <Link href="/dealer-dashboard/inventory" className="text-[#8A8E99] border border-white/10 px-4 py-2 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
            ← Back to Inventory
          </Link>
        </header>

        <div className="p-8">

          {/* Success State */}
          {success && (
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-[#13151A] border border-[#2A9C6E]/20 rounded-sm p-12">
                <div className="text-6xl mb-6">⭐</div>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-4">
                  Listing <span className="text-[#C9922A]">Featured!</span>
                </h2>
                <p className="text-[#8A8E99] text-sm mb-2">
                  <strong className="text-[#F0EDE8]">{selectedListing?.title}</strong> is now featured
                  as a <strong className="text-[#C9922A]">{selectedTier}</strong> listing.
                </p>
                <p className="text-[#8A8E99] text-sm mb-8">
                  Featured for <strong className="text-[#F0EDE8]">5 days</strong> — expires{' '}
                  <strong className="text-[#F0EDE8]">
                    {formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString())}
                  </strong>
                </p>

                {/* Payment Notice */}
                <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-6 mb-8 text-left">
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-3 text-[#C9922A]">
                    💳 Payment Coming Soon
                  </h3>
                  <p className="text-sm text-[#8A8E99] leading-relaxed">
                    Online payment processing is coming soon. For now your listing has been featured and our team will be in touch regarding payment of{' '}
                    <strong className="text-[#F0EDE8]">
                      R{PROMOTION_TIERS.find((t) => t.id === selectedTier)?.price}
                    </strong>.
                    Thank you for your patience.
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Link
                    href="/dealer-dashboard/inventory"
                    className="bg-[#C9922A] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all"
                  >
                    Back to Inventory
                  </Link>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setSelectedListing(null);
                      setSelectedTier(null);
                      setStep(1);
                    }}
                    className="border border-white/10 text-[#8A8E99] px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:bg-white/5 transition-all"
                  >
                    Promote Another
                  </button>
                </div>
              </div>
            </div>
          )}

          {!success && (
            <div className="max-w-3xl mx-auto">

              {/* Step Indicator */}
              <div className="flex items-center gap-0 mb-8">
                {[
                  { num: 1, label: 'Select Listing' },
                  { num: 2, label: 'Choose Package' },
                  { num: 3, label: 'Confirm' },
                ].map((s, i) => (
                  <React.Fragment key={s.num}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black transition-all ${
                        step >= s.num
                          ? 'bg-[#C9922A] text-black'
                          : 'bg-white/10 text-[#8A8E99]'
                      }`}>
                        {step > s.num ? '✓' : s.num}
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest ${
                        step >= s.num ? 'text-[#F0EDE8]' : 'text-[#8A8E99]'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div className={`flex-1 h-px mx-4 ${step > s.num ? 'bg-[#C9922A]' : 'bg-white/10'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 font-bold text-sm">
                  ❌ {error}
                </div>
              )}

              {/* STEP 1 — Select Listing */}
              {step === 1 && (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                    Select a <span className="text-[#C9922A]">Listing</span>
                  </h2>

                  {listings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📦</div>
                      <p className="text-[#8A8E99] font-bold uppercase tracking-widest text-sm mb-4">
                        No active listings to promote
                      </p>
                      <Link
                        href="/dealer-dashboard/add-listing"
                        className="inline-block bg-[#C9922A] text-black px-6 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all"
                      >
                        Add a Listing
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {listings.map((listing) => (
                        <button
                          key={listing.id}
                          onClick={() => handleSelectListing(listing)}
                          disabled={listing.is_featured}
                          className={`w-full flex items-center gap-4 p-4 rounded-sm border transition-all text-left ${
                            listing.is_featured
                              ? 'border-white/5 bg-white/[0.02] opacity-60 cursor-not-allowed'
                              : 'border-white/10 hover:border-[#C9922A]/40 hover:bg-white/[0.02]'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-14 h-14 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                            {listing.images && listing.images.length > 0 ? (
                              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">🔫</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-[#F0EDE8] truncate">{listing.title}</p>
                            <p className="text-[11px] text-[#8A8E99] uppercase tracking-wider">{formatCategory(listing.category_id)}</p>
                            <p className="text-[12px] font-black text-[#C9922A]">R {listing.price?.toLocaleString('en-ZA')}</p>
                          </div>

                          {/* Status */}
                          <div className="flex-shrink-0">
                            {listing.is_featured ? (
                              <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-2 py-1 rounded-sm">
                                  ⭐ Already Featured
                                </span>
                                {listing.featured_until && (
                                  <p className="text-[10px] text-[#8A8E99] mt-1">
                                    Until {formatDate(listing.featured_until)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:border-[#C9922A]/30 hover:text-[#C9922A] transition-all">
                                Select →
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 — Choose Package */}
              {step === 2 && selectedListing && (
                <div className="space-y-6">

                  {/* Selected listing summary */}
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0D0F13] border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                      {selectedListing.images && selectedListing.images.length > 0 ? (
                        <img src={selectedListing.images[0]} alt={selectedListing.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">🔫</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#F0EDE8]">{selectedListing.title}</p>
                      <p className="text-[11px] text-[#8A8E99]">{formatCategory(selectedListing.category_id)}</p>
                    </div>
                    <button
                      onClick={() => { setStep(1); setSelectedListing(null); }}
                      className="text-[11px] text-[#8A8E99] hover:text-[#C9922A] font-bold uppercase tracking-widest transition-colors"
                    >
                      Change
                    </button>
                  </div>

                  {/* Tier cards */}
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                      Choose <span className="text-[#C9922A]">Package</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PROMOTION_TIERS.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => handleSelectTier(tier.id)}
                          className={`border-2 rounded-sm p-6 text-left transition-all ${
                            selectedTier === tier.id ? tier.selectedColor : tier.color
                          }`}
                        >
                          <div className="text-3xl mb-3">{tier.icon}</div>
                          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-1">
                            {tier.label}
                          </h3>
                          <p className="text-[#8A8E99] text-sm mb-4">{tier.description}</p>
                          <div className="flex items-end gap-2">
                            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-[#C9922A]">
                              R{tier.price}
                            </span>
                            <span className="text-[#8A8E99] text-sm mb-1">/ {tier.duration} days</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — Confirm */}
              {step === 3 && selectedListing && selectedTier && (
                <div className="space-y-6">
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                      Confirm <span className="text-[#C9922A]">Promotion</span>
                    </h2>

                    {/* Summary */}
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Listing</span>
                        <span className="text-sm font-bold text-[#F0EDE8]">{selectedListing.title}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Package</span>
                        <span className="text-sm font-bold text-[#C9922A] uppercase">
                          {PROMOTION_TIERS.find((t) => t.id === selectedTier)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Duration</span>
                        <span className="text-sm font-bold text-[#F0EDE8]">5 days</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Expires</span>
                        <span className="text-sm font-bold text-[#F0EDE8]">
                          {formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString())}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">Total</span>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A]">
                          R{PROMOTION_TIERS.find((t) => t.id === selectedTier)?.price}
                        </span>
                      </div>
                    </div>

                    {/* Payment Notice */}
                    <div className="bg-[#C9922A]/5 border border-[#C9922A]/20 rounded-sm p-5 mb-6">
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-2 text-[#C9922A]">
                        💳 Payment Coming Soon
                      </h3>
                      <p className="text-sm text-[#8A8E99] leading-relaxed">
                        Online payment processing is being set up. By confirming, your listing will be featured immediately and our team will contact you regarding payment. Thank you for your patience.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setStep(2)}
                        className="px-6 py-3 border border-white/10 rounded-sm text-sm font-black uppercase tracking-widest text-[#8A8E99] hover:bg-white/5 transition-all"
                      >
                        ← Back
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="flex-1 bg-[#C9922A] text-black px-8 py-3 rounded-sm font-black uppercase tracking-widest text-[13px] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Processing...' : `Confirm & Feature Listing`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PromotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="text-[#C9922A] text-xl font-bold">Loading...</div>
      </div>
    }>
      <PromoteForm />
    </Suspense>
  );
}