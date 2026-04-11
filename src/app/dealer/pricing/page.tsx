'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const PRICING_TIERS = [
  {
    name: 'FREE',
    price: 'R0',
    period: 'forever',
    description: 'Get started with basic listings',
    features: [
      '5 active listings',
      'Basic dealer profile',
      'Standard listing placement',
      'Email support',
      'FCA compliance tools',
    ],
    limitations: [
      'No featured badge',
      'No analytics',
      'No bulk upload',
    ],
    cta: 'Start Free',
    ctaLink: '/dealer/apply',
    highlighted: false,
  },
  {
    name: 'PRO',
    price: 'R499',
    period: 'per month',
    description: 'Perfect for established dealers',
    features: [
      '50 active listings',
      'Verified Dealer badge (✓)',
      'Priority search placement',
      'Bulk CSV upload',
      'Basic analytics dashboard',
      'Promote listings (R19/R29)',
      'Email & chat support',
      'Custom business hours',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    ctaLink: '/dealer/apply?tier=pro',
    highlighted: true,
    badge: 'MOST POPULAR',
  },
  {
    name: 'PREMIUM',
    price: 'R799',
    period: 'per month',
    description: 'Maximum visibility and features',
    features: [
      'Unlimited listings',
      'Premium Partner badge (⭐)',
      'Top priority placement',
      'Bulk CSV upload',
      'Advanced analytics & insights',
      'Promote listings (R19/R29)',
      'Featured in dealer directory',
      'Custom banner & logo',
      'Priority support (24/7)',
      'Lead tracking & CRM',
    ],
    limitations: [],
    cta: 'Start Premium Trial',
    ctaLink: '/dealer/apply?tier=premium',
    highlighted: false,
  },
];

export default function DealerPricingPage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-6">
            Dealer <span className="text-[#C9922A]">Pricing</span>
          </h1>
          <p className="text-[#8A8E99] text-[14px] md:text-[16px] uppercase tracking-widest font-bold mb-8">
            Choose the plan that fits your dealership
          </p>
          <p className="text-[#F0EDE8] text-sm max-w-2xl mx-auto">
            All plans include FCA compliance tools, secure messaging, and listing management. 
            <br />Start with our free tier and upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-[#13151A] border rounded-sm p-8 flex flex-col ${
                tier.highlighted
                  ? 'border-[#C9922A] shadow-[0_0_30px_rgba(201,146,42,0.2)]'
                  : 'border-white/5'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#C9922A] text-black text-[10px] font-black px-4 py-1 uppercase tracking-wider">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-black uppercase mb-2">
                  {tier.name}
                </h3>
                <p className="text-[#8A8E99] text-sm mb-6">{tier.description}</p>
                <div className="mb-2">
                  <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl font-black text-[#C9922A]">
                    {tier.price}
                  </span>
                </div>
                <p className="text-[#8A8E99] text-xs uppercase tracking-widest font-bold">
                  {tier.period}
                </p>
              </div>

              <div className="flex-1 mb-8">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <span className="text-[#C9922A] mt-0.5">✓</span>
                      <span className="text-[#F0EDE8]">{feature}</span>
                    </li>
                  ))}
                  {tier.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-3 text-sm opacity-40">
                      <span className="text-[#8A8E99] mt-0.5">✗</span>
                      <span className="text-[#8A8E99]">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={tier.ctaLink}
                className={`block text-center font-black uppercase tracking-widest text-[14px] px-6 py-4 rounded-sm transition-all ${
                  tier.highlighted
                    ? 'bg-[#C9922A] text-black hover:brightness-110'
                    : 'bg-white/5 text-[#F0EDE8] border border-white/10 hover:bg-white/10'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-[#13151A] border border-white/5 rounded-sm p-10 mb-20">
          <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-black uppercase text-center mb-8">
            Featured Listing <span className="text-[#C9922A]">Add-Ons</span>
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-[#0D0F13] border border-white/5 p-8 rounded-sm">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold uppercase mb-2">Featured Listings</h3>
                <p className="text-[#8A8E99] text-sm mb-2">Promote individual listings to the top of search results</p>
                <p className="text-[#8A8E99] text-xs uppercase tracking-widest">Duration: 5 days</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-[#C9922A] text-3xl font-black mb-1">R19</div>
                  <div className="text-[#8A8E99] text-xs uppercase tracking-widest">Provincial</div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div className="text-center">
                  <div className="text-[#C9922A] text-3xl font-black mb-1">R29</div>
                  <div className="text-[#8A8E99] text-xs uppercase tracking-widest">National</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-black uppercase text-center mb-12">
            Frequently Asked <span className="text-[#C9922A]">Questions</span>
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes! You can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing cycle.',
              },
              {
                q: 'What happens if I exceed my listing limit?',
                a: 'On the Free plan, you\'ll need to upgrade to add more listings. Pro and Premium tiers have generous limits designed to accommodate most dealers.',
              },
              {
                q: 'How does the free trial work?',
                a: 'Pro and Premium plans include a 30-day free trial. No credit card required. Cancel anytime during the trial with no charge.',
              },
              {
                q: 'Can I promote multiple listings?',
                a: 'Yes! All paid tiers can promote individual listings for R19 (provincial) or R29 (national). Promotions last 5 days and can be renewed.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h3 className="font-bold text-[#F0EDE8] mb-3">{faq.q}</h3>
                <p className="text-[#8A8E99] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-20">
          <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-black uppercase mb-6">
            Ready to <span className="text-[#C9922A]">Get Started?</span>
          </h2>
          <p className="text-[#8A8E99] mb-8 max-w-2xl mx-auto">
            Join hundreds of licensed dealers across South Africa using Gun X to grow their business.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/dealer/apply"
              className="bg-[#C9922A] text-black px-10 py-4 font-black uppercase tracking-widest text-[14px] hover:brightness-110 transition-all"
            >
              Apply for Dealer Account
            </Link>
            <Link
              href="/contact"
              className="border border-white/10 text-[#F0EDE8] px-10 py-4 font-black uppercase tracking-widest text-[14px] hover:bg-white/5 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}