'use client';

import React from 'react';
import LegalDoc, { LegalSection } from '@/components/LegalDoc';

const SECTIONS: LegalSection[] = [
  {
    id: 'scope',
    title: 'Scope of This Agreement',
    content: `This Dealer Agreement governs the relationship between GX SA (Pty) Ltd, registration number 2025/830094/07 ("Gun X", "we", "us") and any business that applies for or holds a dealer account on the Gun X platform ("Dealer", "you").

It applies in addition to our Terms of Use and Privacy Policy. Where this Agreement and the Terms of Use conflict on a dealer-specific matter, this Agreement prevails.

By submitting a dealer application you confirm that you have read and accept this Agreement.`,
  },
  {
    id: 'eligibility',
    title: 'Eligibility and Verification',
    content: `Dealer accounts are available to businesses lawfully entitled to trade in firearms, ammunition, accessories or related goods and services in South Africa.

As part of your application you may be asked to provide your company registration details, SAPS dealer licence number and certificate, proof of business registration, and identification for the responsible person. We use these to verify that your business is what it claims to be.

You warrant that all documents and information you provide are true, current and lawfully held by you, and that you will inform us promptly if your licensing status changes, lapses, is suspended or is withdrawn.

We may approve, decline or revoke a dealer account at our reasonable discretion, including where verification cannot be completed or where licensing status is in doubt.`,
  },
  {
    id: 'verification-badge',
    title: 'Approval Is Not Endorsement',
    content: `Approval of a dealer account means we have completed our own reasonable checks and granted access to dealer features. It is not a warranty by Gun X as to your licensing, solvency, conduct or the quality of your goods.

Any verification badge or similar indicator reflects the checks we performed at the time. It does not transfer legal responsibility for your business to us, and buyers remain responsible for their own due diligence.`,
  },
  {
    id: 'obligations',
    title: 'Your Obligations',
    content: `As a Dealer you must at all times:

• Hold and maintain every licence, permit and registration required to conduct your business under the Firearms Control Act 60 of 2000 and any other applicable law.
• Ensure every listing is accurate, lawful, and reflects stock you are genuinely able to supply.
• Complete every transfer of a regulated item strictly through lawful dealer and SAPS processes. The Platform is for advertising and connection only — it is not a mechanism for transferring regulated items.
• Deal fairly and honestly with buyers, including honouring advertised prices and described conditions, and responding to enquiries in reasonable time.
• Comply with the Consumer Protection Act 68 of 2008 in your dealings with consumers.
• Keep your account details and staff access secure.

You must not use the Platform to advertise items you cannot lawfully supply, to circumvent regulatory process, or to route buyers to off-platform arrangements designed to avoid lawful checks.`,
  },
  {
    id: 'plans',
    title: 'Subscription Plans and Fees',
    content: `Dealer plans, their inclusions and their prices are those published on the dealer pricing page at the time you subscribe. Prices are in South African Rand and include VAT where applicable.

Paid plans are recurring monthly subscriptions. Payment is collected through our payment provider. Your plan renews automatically each month until cancelled.

We may change plan pricing or inclusions. Where a change affects an active subscription, we will give reasonable notice before it applies to you, and you may cancel before the change takes effect if you do not accept it.`,
  },
  {
    id: 'changes',
    title: 'Upgrades, Downgrades and Cancellation',
    content: `You may request an upgrade, downgrade or cancellation at any time from your dealer dashboard or by emailing support@gunx.co.za.

Upgrades take effect once the new plan is active. Downgrades and cancellations take effect at the end of the current paid billing period — you keep the features you have paid for until that period ends.

We will not knowingly run two overlapping paid subscriptions on the same dealer account. If a duplicate or overlapping charge occurs through error, tell us at support@gunx.co.za and we will correct it and refund the amount incorrectly taken.

On cancellation your dealer features end at the end of the paid period and your account reverts to the free tier. Listings in excess of the free tier allowance may be unpublished.`,
  },
  {
    id: 'content',
    title: 'Your Listings and Content',
    content: `You retain ownership of your logos, images, descriptions and other content. You grant us a non-exclusive, royalty-free licence to display and reasonably promote that content on the Platform while it remains published.

You confirm you hold the rights to everything you upload, including photographs and manufacturer imagery.

We may edit, decline, suspend or remove any listing that we reasonably believe breaches this Agreement, our Terms of Use, or the law.`,
  },
  {
    id: 'data',
    title: 'Data Protection',
    content: `Where you receive personal information about buyers through the Platform — names, contact details, enquiry content — you are responsible for handling it lawfully under the Protection of Personal Information Act 4 of 2013.

You must use enquiry data only to respond to that enquiry and to conduct the resulting transaction. You may not add Platform users to marketing lists without their consent, sell or share their information, or retain it longer than you lawfully need it.`,
  },
  {
    id: 'suspension',
    title: 'Suspension and Termination',
    content: `We may suspend or terminate a dealer account where you breach this Agreement or the law, where your licensing status lapses or is withdrawn, where we reasonably suspect fraudulent or unlawful activity, or where required by a competent authority.

Where we suspend an account for a reason that is not your fault, we will not charge you for the period of suspension.

You may terminate by cancelling your subscription and closing your account. Fees already paid for a commenced period are not automatically refundable except where the law requires it.`,
  },
  {
    id: 'liability',
    title: 'Liability and Indemnity',
    content: `Gun X provides an advertising and directory platform. We are not a party to any sale between you and a buyer and give no warranty as to leads, sales volumes or business outcomes.

To the maximum extent permitted by law, our total liability to you in respect of any claim is limited to the subscription fees you paid us in the three months preceding the claim.

You indemnify GX SA (Pty) Ltd, its directors, employees and agents against any claim, loss or expense arising from your listings, your dealings with buyers, your breach of this Agreement, or your contravention of any law.

Nothing here excludes liability that cannot lawfully be excluded under South African law.`,
  },
  {
    id: 'law',
    title: 'Governing Law',
    content: `This Agreement is governed by the laws of the Republic of South Africa, and disputes are subject to the jurisdiction of the South African courts.

If any provision is found unenforceable the rest remains in force. We may update this Agreement; the version in force when you subscribe or renew governs that period, and material changes will carry an updated date.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `GX SA (Pty) Ltd
Registration number: 2025/830094/07
Registered office: 11 Howe Street, Observatory, Western Cape, 7925

Dealer support: support@gunx.co.za
Sales and advertising: pewpew@gunx.co.za`,
  },
];

export default function DealerTermsPage() {
  return (
    <LegalDoc
      eyebrow="Legal · Dealers"
      titleLead="Dealer"
      titleAccent="Agreement"
      updated="7 August 2026"
      intro="The terms that apply to businesses holding a dealer account on Gun X, including verification, subscriptions and obligations."
      sections={SECTIONS}
      draftNotice
    />
  );
}
