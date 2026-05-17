'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const FAQS = [
  {
    section: 'Buying on Gun X',
    icon: '🛒',
    questions: [
      {
        q: 'How do I contact a seller?',
        a: 'Click on any listing and use the "Contact Seller" button. You can send a message through the platform, call directly, or WhatsApp the seller if they have a number listed. All contact details are shown once you click the button.',
      },
      {
        q: 'Can I buy a firearm directly through Gun X?',
        a: 'No. Gun X is a classifieds platform — we connect buyers and sellers but do not facilitate the actual transaction. You negotiate and agree on price directly with the seller. The physical transfer must happen through a licensed firearm dealer in accordance with the Firearms Control Act (Act 60 of 2000).',
      },
      {
        q: 'What is a licensed dealer transfer and why is it required?',
        a: 'Under South African law, all private firearm transfers must go through a SAPS-licensed dealer. The dealer verifies both parties\' licences, completes the Section 24 transfer paperwork, and submits it to SAPS. This protects both the buyer and seller legally. Gun X provides a dealer directory to help you find a licensed dealer near you.',
      },
      {
        q: 'How do I know if a listing is legitimate?',
        a: 'Verified dealers display a "Verified Dealer" badge and have their SAPS dealer licence number on their storefront. Private sellers are registered members. Always meet at a licensed dealer for the transfer — never pay upfront or meet in an uncontrolled environment. If something feels off, report the listing immediately.',
      },
      {
        q: 'Do I need a firearm licence to buy?',
        a: 'Yes. You must hold a valid South African firearm licence for the appropriate category (handgun, semi-automatic rifle, shotgun etc.) before you can legally acquire any firearm. It is illegal to purchase a firearm without the correct licence. Competency certificates alone are not sufficient — you need a full licence.',
      },
      {
        q: 'Can I save listings to view later?',
        a: 'Yes. Create a free Gun X account and click the "Save" button on any listing. Saved listings appear in your Wishlist under your dashboard.',
      },
    ],
  },
  {
    section: 'Selling on Gun X',
    icon: '📋',
    questions: [
      {
        q: 'How do I post a listing?',
        a: 'Click "+ Post Ad" in the navigation bar. You\'ll need to create a free account first. Fill in the listing details — title, category, make, calibre, condition, price, province, and photos. Your first 5 listings per year are free. Additional listings are R29 each.',
      },
      {
        q: 'How long does a listing stay active?',
        a: 'Listings remain active for 90 days. After 90 days you\'ll receive a notification and can renew for free if the item hasn\'t sold. You can also manually mark a listing as "Sold" or "Under Offer" at any time from your dashboard.',
      },
      {
        q: 'What can I list on Gun X?',
        a: 'You can list legally owned firearms (with valid licence), ammunition, optics, holsters, magazines, reloading equipment, knives, airsoft, air guns, and accessories. All firearms listed must be legal under South African law and the seller must hold the appropriate licence.',
      },
      {
        q: 'What cannot be listed on Gun X?',
        a: 'The following are strictly prohibited: unlicensed or stolen firearms, prohibited weapons (fully automatic, explosive devices), converted weapons, unregistered suppressors, ammunition for prohibited firearms, and any item banned under the Firearms Control Act. Violations are reported to SAPS immediately.',
      },
      {
        q: 'Can I boost my listing to get more visibility?',
        a: 'Yes. Gun X offers several boost options: Weekend Provincial (R10, Friday–Sunday), Provincial (R29, 5 days), National (R49, 5 days), and Reel (R89, 5 days — featured in the scrolling reel on the homepage). Boosted listings appear above standard listings in search results.',
      },
      {
        q: 'Do I need to verify my identity to sell?',
        a: 'Private sellers must create a verified account with a valid email. Dealers go through a full verification process including SAPS dealer licence, business registration, and identity documents. Verified dealers receive a badge on their storefront and listings.',
      },
    ],
  },
  {
    section: 'Dealer Accounts',
    icon: '🏪',
    questions: [
      {
        q: 'How do I become a verified dealer on Gun X?',
        a: 'Go to /dealer/apply and complete the application form. You\'ll need your SAPS dealer licence number, SAPS certificate, business registration documents, and ID. Our team reviews applications within 48 hours. Once approved, you get access to the dealer dashboard, storefront, and can start listing.',
      },
      {
        q: 'What are the dealer subscription plans?',
        a: 'Free plan: up to 10 listings per year at no cost. Pro plan: R499/month for up to 50 active listings, verified badge, featured listings, and priority support. Premium plan: R799/month for unlimited listings and all Pro features. You can also pay R29 per listing beyond your plan limit.',
      },
      {
        q: 'What does the dealer storefront include?',
        a: 'Every approved dealer gets a dedicated public storefront at gunx.co.za/dealers/[your-slug]. It includes your logo, cover photo, inventory grid with filters, about section, business hours, contact details, ratings, and a Request Quote button. Pro and Premium dealers also get a Verified badge.',
      },
      {
        q: 'Can dealers post job listings?',
        a: 'Yes. Approved dealers can post industry job listings from their dashboard under "Recruitment". Single post costs R29, or a bundle of 5 for R99. Jobs are reviewed by our team before going live.',
      },
      {
        q: 'How do I feature my listings on the dealer storefront?',
        a: 'From your dealer dashboard, go to Promote Listings. Select the listings you want to feature and choose a boost package. Featured listings appear at the top of your storefront inventory and are highlighted in search results.',
      },
    ],
  },
  {
    section: 'Verification & Trust',
    icon: '🛡️',
    questions: [
      {
        q: 'What does the "Verified" badge mean?',
        a: 'The Verified badge means Gun X has confirmed the dealer\'s SAPS licence, business registration, and identity documents. Verified dealers have been vetted and approved by our compliance team. This is separate from subscription tier — a dealer can be Verified on any plan.',
      },
      {
        q: 'How long does dealer verification take?',
        a: 'Applications are reviewed within 48 business hours. You\'ll receive an email at your registered address once approved or if we need additional documents.',
      },
      {
        q: 'What documents are required for dealer verification?',
        a: 'You need: (1) Valid SAPS Dealer Licence (Section 20 dealer licence), (2) SAPS Certificate of Approval, (3) Business registration documents (COR14.3 or equivalent), (4) Director/owner ID document. All documents must be current and valid.',
      },
      {
        q: 'Are private sellers verified?',
        a: 'Private sellers register with a verified email address. We do not verify individual firearms licences for private sellers — it is the buyer\'s responsibility to confirm the seller\'s licence during the dealer transfer process. If you suspect an unlicensed seller, report the listing immediately.',
      },
    ],
  },
  {
    section: 'Pricing & Payments',
    icon: '💳',
    questions: [
      {
        q: 'Is Gun X free to use?',
        a: 'Browsing and searching are completely free with no account required. Creating an account and posting up to 5 listings per year is also free. Dealer subscriptions, listing boosts, and additional listings beyond the free tier are paid.',
      },
      {
        q: 'How are payments processed?',
        a: 'All payments on Gun X are processed securely through PayFast, South Africa\'s leading payment gateway. We accept credit/debit cards, EFT, and instant EFT. Your payment details are never stored on Gun X servers.',
      },
      {
        q: 'Can I get a refund on a boost or subscription?',
        a: 'Listing boosts are non-refundable once activated as the promotional period has already begun. Dealer subscriptions can be cancelled at any time and will not auto-renew. No refunds are issued for partial subscription months. Contact support@gunx.co.za for billing queries.',
      },
      {
        q: 'What does a Services directory listing cost?',
        a: 'Service providers (gunsmiths, training instructors, storage facilities etc.) pay R299/month for a listing in the Services directory. This includes a public profile page, portfolio photos, and package listings.',
      },
    ],
  },
  {
    section: 'Legal & Compliance',
    icon: '📜',
    questions: [
      {
        q: 'Is Gun X legal and compliant with South African law?',
        a: 'Yes. Gun X operates fully within the Firearms Control Act (Act 60 of 2000) and all related SAPS regulations. We are also POPI Act compliant for data protection. All listings are subject to our Terms of Use which prohibit illegal firearms and transactions.',
      },
      {
        q: 'What is the Firearms Control Act?',
        a: 'The Firearms Control Act 60 of 2000 is the primary South African legislation governing firearm ownership, licensing, transfer, and storage. It requires all firearm owners to hold a valid licence, all dealers to be SAPS-licensed, and all private transfers to go through a licensed dealer. Visit our FA Ownership guide for a plain-language overview.',
      },
      {
        q: 'What happens if I list an illegal firearm?',
        a: 'Listings that appear to involve illegal firearms are removed immediately and reported to the South African Police Service. We cooperate fully with SAPS investigations. Accounts involved in illegal listings are permanently banned. If you see a suspicious listing, report it immediately.',
      },
      {
        q: 'Does Gun X store my personal information?',
        a: 'Yes, but only what is necessary to operate your account, as required by the POPI Act. We do not sell your data to third parties. Your contact details are only shared with other users when you choose to contact a seller or when a buyer contacts you. See our Privacy Policy for full details.',
      },
    ],
  },
  {
    section: 'Account & Technical',
    icon: '⚙️',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click "Register" in the navigation bar. You can sign up as a Member (private buyer/seller), Dealer, Club, Range, or Service Provider. Each account type has a tailored registration flow. Email verification is required before your account is active.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Click "Sign In" then "Forgot Password". Enter your registered email address and we\'ll send you a reset link. If you don\'t receive it within a few minutes, check your spam folder or contact support@gunx.co.za.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Contact support@gunx.co.za with your registered email address and a request to delete your account. We\'ll confirm your identity and process the deletion within 5 business days. Note that active listings will be removed and this action cannot be undone.',
      },
      {
        q: 'Why is my listing not showing in search results?',
        a: 'Listings may not appear if they are pending review, have expired (90 days), or were flagged by our moderation team. Log into your dashboard and check the status of your listing. If the status shows "Active" but it\'s not appearing, contact support@gunx.co.za.',
      },
      {
        q: 'How do I contact Gun X support?',
        a: 'Email us at support@gunx.co.za for general queries. For urgent compliance issues or to report a listing, use the Report button on the listing page. We aim to respond to all queries within 1 business day.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggle = (key: string) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-10 md:py-16">
        <div className="max-w-[800px] mx-auto text-center">
          <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em] mb-3">Help Centre</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Frequently Asked <span className="text-[#C9922A]">Questions</span>
          </h1>
          <p className="text-[#8A8E99] text-sm md:text-base leading-relaxed mb-6">
            Everything you need to know about buying, selling, and listing on Gun X. Can't find your answer?
          </p>
          <a href="mailto:support@gunx.co.za"
            className="inline-flex items-center gap-2 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
            ✉ Contact Support
          </a>
        </div>
      </div>

      {/* SECTION QUICK NAV */}
      <div className="border-b border-white/5 bg-[#0D0F13] overflow-x-auto">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex gap-2 whitespace-nowrap">
          {FAQS.map(section => (
            <button key={section.section}
              onClick={() => {
                setActiveSection(activeSection === section.section ? null : section.section);
                document.getElementById(section.section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-[12px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${
                activeSection === section.section
                  ? 'bg-[#C9922A] text-black'
                  : 'bg-[#13151A] border border-white/10 text-[#8A8E99] hover:text-[#F0EDE8] hover:border-white/20'
              }`}>
              <span>{section.icon}</span>
              <span>{section.section}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ CONTENT */}
      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 md:px-6 py-10 md:py-16 space-y-12">
        {FAQS.map(section => (
          <div key={section.section} id={section.section}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{section.icon}</span>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl md:text-3xl font-black uppercase text-[#C9922A]">
                {section.section}
              </h2>
            </div>

            {/* Questions */}
            <div className="space-y-2">
              {section.questions.map((item, idx) => {
                const key = `${section.section}-${idx}`;
                const isOpen = openItems[key];
                return (
                  <div key={key} className={`border rounded-sm transition-all ${isOpen ? 'border-[#C9922A]/30 bg-[#C9922A]/5' : 'border-white/5 bg-[#13151A] hover:border-white/10'}`}>
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                      <span className="font-bold text-[14px] md:text-[15px] text-[#F0EDE8] leading-snug">{item.q}</span>
                      <span className={`text-[#C9922A] text-xl flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5">
                        <div className="h-px bg-white/5 mb-4" />
                        <p className="text-[#8A8E99] text-[14px] leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* STILL NEED HELP */}
        <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-8 text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-2xl font-black uppercase mb-2">Still have questions?</h3>
          <p className="text-[#8A8E99] text-sm mb-6 max-w-md mx-auto">
            Our support team is available Monday to Friday, 8am–5pm SAST. We aim to respond within 1 business day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:support@gunx.co.za"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
              ✉ Email Support
            </a>
            <Link href="/firearm-ownership"
              className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:bg-white/5 transition-all">
              📋 FA Ownership Guide
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <div className="border-t border-white/5 px-4 py-6">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#8A8E99]">© 2026 GX SA (Pty) Ltd — All rights reserved</p>
          <div className="flex gap-4 text-[12px] text-[#8A8E99]">
            <Link href="/terms"   className="hover:text-[#C9922A] transition-colors">Terms of Use</Link>
            <Link href="/privacy" className="hover:text-[#C9922A] transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-[#C9922A] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
