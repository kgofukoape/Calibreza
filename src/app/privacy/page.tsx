'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const SECTIONS = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: `GX SA (Pty) Ltd ("Gun X", "we", "us", or "our") operates the Gun X classifieds platform at calibreza.vercel.app and gunx.co.za (the "Platform"). This Privacy Policy explains how we collect, use, store, and protect your personal information in compliance with the Protection of Personal Information Act 4 of 2013 ("POPI Act") and all applicable South African data protection legislation.

By accessing or using the Platform, you acknowledge that you have read and understood this Privacy Policy and consent to the processing of your personal information as described herein. If you do not agree with this Policy, please do not use the Platform.`,
  },
  {
    id: 'information-collected',
    title: 'Information We Collect',
    content: `We collect the following categories of personal information:

Account Information: When you register, we collect your full name, email address, password (encrypted), and account type (member, dealer, club, range, or service provider).

Listing Information: When you post a listing, we collect the details you provide including firearm descriptions, pricing, location (province and city), and photographs.

Dealer Verification Information: For dealer accounts, we collect business registration documents, SAPS dealer licence numbers, SAPS certificates, and identity documents as required by law.

Communication Data: Messages sent through the platform's messaging system between buyers and sellers.

Usage Data: We automatically collect information about how you use the Platform, including pages visited, search queries, listings viewed, and time spent on the Platform.

Device Information: IP address, browser type, operating system, and device identifiers for security and analytics purposes.

Transaction Data: Records of subscription payments, listing boosts, and other platform transactions processed through PayFast.`,
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    content: `We process your personal information for the following lawful purposes:

Platform Operation: To create and manage your account, display your listings, facilitate communication between buyers and sellers, and provide all Platform features.

Verification and Compliance: To verify dealer credentials, SAPS licences, and ensure compliance with the Firearms Control Act (Act 60 of 2000). This is a legal obligation.

Safety and Security: To detect fraud, prevent illegal listings, investigate reports, and cooperate with SAPS and law enforcement where required by law.

Communications: To send transactional emails (account confirmations, listing notifications, booking confirmations) and platform alerts. We do not send marketing emails without your explicit consent.

Analytics and Improvement: To understand how the Platform is used and improve our services. Analytics data is aggregated and anonymised where possible.

Payment Processing: To process subscription payments and listing fees through our payment provider PayFast.

Legal Compliance: To comply with applicable South African laws, including the Firearms Control Act, POPI Act, and any lawful requests from regulatory authorities.`,
  },
  {
    id: 'sharing',
    title: 'Sharing Your Information',
    content: `We do not sell your personal information to third parties. We share information only in the following circumstances:

Between Users: When you post a listing, your city/province and contact details (if provided) are visible to other users. When you contact a seller, your message is delivered to them through the Platform.

Service Providers: We share data with trusted service providers who help us operate the Platform, including Supabase (database hosting), Vercel (platform hosting), Resend (email delivery), and PayFast (payment processing). All service providers are bound by data processing agreements.

Law Enforcement: We will disclose personal information to SAPS or other authorities when required by law, court order, or when we reasonably believe disclosure is necessary to prevent illegal activity, fraud, or threats to safety.

Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity, subject to the same privacy protections.

We will never share your identity documents, SAPS certificates, or verification documents with any party other than regulatory authorities where legally required.`,
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    content: `We retain your personal information for the following periods:

Active Accounts: For as long as your account remains active on the Platform.

Listings: Active listings are retained for 90 days. Expired, sold, or deleted listings are removed from public view but retained in our records for 12 months for compliance and dispute resolution purposes.

Dealer Verification Documents: Retained for 5 years after account closure as required by South African financial and business regulations.

Message History: Platform messages are retained for 24 months.

Transaction Records: Payment and subscription records are retained for 7 years as required by South African tax law.

Upon account deletion, we will anonymise or delete your personal information within 30 days, except where retention is required by law.`,
  },
  {
    id: 'security',
    title: 'Data Security',
    content: `We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, loss, destruction, or alteration:

Encryption: All data is transmitted over HTTPS/TLS encryption. Passwords are hashed using industry-standard algorithms and never stored in plain text.

Access Controls: Access to personal data is restricted to authorised personnel on a need-to-know basis.

Infrastructure Security: The Platform is hosted on Vercel and Supabase, which maintain SOC 2 compliance and industry-leading security standards.

Verification Documents: Identity and compliance documents are stored in secure, access-controlled storage buckets and are not publicly accessible.

While we take all reasonable precautions, no system is completely secure. You are responsible for maintaining the confidentiality of your account credentials.`,
  },
  {
    id: 'your-rights',
    title: 'Your Rights Under POPI',
    content: `As a data subject under the POPI Act, you have the following rights:

Right to Access: You may request a copy of the personal information we hold about you at any time.

Right to Correction: You may request correction of inaccurate or incomplete personal information.

Right to Deletion: You may request deletion of your personal information, subject to our legal retention obligations.

Right to Object: You may object to the processing of your personal information in certain circumstances.

Right to Withdraw Consent: Where processing is based on consent, you may withdraw consent at any time without affecting the lawfulness of prior processing.

Right to Complain: You have the right to lodge a complaint with the Information Regulator of South Africa at inforeg.org.za.

To exercise any of these rights, contact us at support@gunx.co.za. We will respond within 30 days.`,
  },
  {
    id: 'cookies',
    title: 'Cookies and Tracking',
    content: `The Platform uses essential cookies and local storage to maintain your login session and user preferences. We do not use advertising cookies or third-party tracking cookies.

Session Storage: Used to maintain your authentication state during your browsing session.

Analytics: We collect anonymised page view data to understand Platform usage. This data does not personally identify you.

You may disable cookies in your browser settings, but this may affect Platform functionality including the ability to stay logged in.`,
  },
  {
    id: 'firearms-compliance',
    title: 'Firearms Act Compliance',
    content: `Gun X operates in strict compliance with the Firearms Control Act (Act 60 of 2000). In this regard:

We may be required to retain records of certain transactions and user verifications for compliance purposes.

We cooperate fully with the South African Police Service (SAPS) in any investigation involving firearms listed or transacted on the Platform.

Reports of illegal firearms or suspected stolen firearms are referred to SAPS immediately. User information relevant to such reports may be disclosed to SAPS without prior notice to the user.

Dealer verification documents and SAPS licence information are processed as required by law and may be subject to regulatory inspection.`,
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify registered users of material changes via email to their registered email address and by posting a notice on the Platform.

Your continued use of the Platform after notification of changes constitutes acceptance of the updated Policy. If you do not agree with the changes, you should discontinue use of the Platform and may request deletion of your account.

The date of the most recent update is shown at the top of this Policy.`,
  },
  {
    id: 'contact',
    title: 'Contact and Information Officer',
    content: `GX SA (Pty) Ltd is the Responsible Party under the POPI Act.

For all privacy-related queries, access requests, or complaints:

Email: support@gunx.co.za
Platform: calibreza.vercel.app
Registered in: South Africa

Information Regulator of South Africa:
Website: inforeg.org.za
Email: inforeg@justice.gov.za
Tel: 010 023 5207

This Privacy Policy was last updated on 18 May 2026.`,
  },
];

export default function PrivacyPage() {
  const [openSection, setOpenSection] = useState<string | null>('introduction');

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-[800px] mx-auto">
          <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em] mb-3">Legal</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Privacy <span className="text-[#C9922A]">Policy</span>
          </h1>
          <p className="text-[#8A8E99] text-sm leading-relaxed mb-2">
            GX SA (Pty) Ltd · Last updated: 18 May 2026
          </p>
          <p className="text-[#8A8E99] text-sm leading-relaxed">
            This policy governs the collection, use, and protection of your personal information on the Gun X platform in accordance with the POPI Act 4 of 2013.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-[800px] mx-auto w-full px-4 md:px-6 py-10 md:py-16">

        {/* QUICK NAV */}
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 mb-8">
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">
            Contents
          </p>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <button key={s.id}
                onClick={() => { setOpenSection(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:border-[#C9922A]/40 hover:text-[#C9922A] transition-all">
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* SECTIONS */}
        <div className="space-y-3">
          {SECTIONS.map((section, idx) => (
            <div key={section.id} id={section.id}
              className={`border rounded-sm transition-all ${openSection === section.id ? 'border-[#C9922A]/30 bg-[#C9922A]/5' : 'border-white/5 bg-[#13151A] hover:border-white/10'}`}>
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-[#C9922A]/50 w-5">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="font-black text-[15px] text-[#F0EDE8]">{section.title}</span>
                </div>
                <span className={`text-[#C9922A] text-xl flex-shrink-0 transition-transform duration-200 ${openSection === section.id ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openSection === section.id && (
                <div className="px-5 pb-6">
                  <div className="h-px bg-white/5 mb-4" />
                  <div className="text-[#8A8E99] text-[14px] leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER CTA */}
        <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-8 text-center mt-10">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-2xl font-black uppercase mb-2">Questions about your data?</h3>
          <p className="text-[#8A8E99] text-sm mb-6">Contact our team at support@gunx.co.za — we respond within 1 business day.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:support@gunx.co.za"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
              ✉ Contact Support
            </a>
            <Link href="/faqs"
              className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:bg-white/5 transition-all">
              View FAQs
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <div className="border-t border-white/5 px-4 py-6">
        <div className="max-w-[800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#8A8E99]">© 2026 GX SA (Pty) Ltd — All rights reserved</p>
          <div className="flex gap-4 text-[12px] text-[#8A8E99]">
            <Link href="/terms" className="hover:text-[#C9922A] transition-colors">Terms of Use</Link>
            <Link href="/contact" className="hover:text-[#C9922A] transition-colors">Contact</Link>
            <Link href="/faqs" className="hover:text-[#C9922A] transition-colors">FAQs</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
