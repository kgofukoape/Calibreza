'use client';

import React from 'react';
import LegalDoc, { LegalSection } from '@/components/LegalDoc';

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of These Terms',
    content: `These Terms of Use govern your access to and use of the Gun X platform at gunx.co.za, calibreza.vercel.app and related subdomains (the "Platform"), operated by GX SA (Pty) Ltd, registration number 2025/830094/07 ("Gun X", "we", "us").

By accessing, browsing, registering for, or placing a listing on the Platform, you agree to be bound by these Terms. If you do not accept them, do not use the Platform.

These Terms work alongside our Privacy Policy, POPI Act notice, Legal Disclaimer and, where applicable, the Dealer Agreement and Advertising Policy. Where a specialised document covers a topic in more detail, that document applies to that topic.`,
  },
  {
    id: 'eligibility',
    title: 'Who May Use Gun X',
    content: `You must be at least 18 years of age, or a duly authorised representative of a juristic person, to register an account or place a listing.

Gun X serves the lawful, licensed South African firearms community. By using the Platform you confirm that your use is lawful and that any firearm, ammunition or regulated item you list, buy, or enquire about will be dealt with strictly in accordance with the Firearms Control Act 60 of 2000 ("FCA") and its regulations.

You are responsible for keeping your account credentials secure and for all activity that occurs under your account. Tell us immediately at support@gunx.co.za if you believe your account has been compromised.`,
  },
  {
    id: 'nature',
    title: 'What Gun X Is — and Is Not',
    content: `Gun X is a classifieds and directory platform. We provide the space where buyers, sellers, dealers, clubs, ranges and service providers find one another.

We are not a party to any transaction between users. We do not own, hold, inspect, store, transport or sell the items listed. We are not a firearms dealer and we do not facilitate the physical transfer of any regulated item.

Every transfer of a firearm or other regulated item must be completed lawfully through a licensed dealer and the applicable SAPS and Central Firearms Registry processes. Nothing on the Platform substitutes for those requirements.`,
  },
  {
    id: 'listings',
    title: 'Listings and User Content',
    content: `You are solely responsible for the content you upload, including listing text, photographs, pricing, and contact details.

By posting content you confirm that: the item is genuinely available and lawfully able to be supplied in South Africa; you own or have permission to use every image and description; all statements are accurate and not misleading; and your listing complies with the FCA and all other applicable law.

You may not list stolen, unlicensed, illegally modified or prohibited items; use the Platform to arrange a transfer that circumvents lawful dealer or SAPS processes; post misleading, fraudulent or duplicate listings; or scrape, harvest or bulk-extract data from the Platform.

We may edit, decline, suspend or remove any listing at our reasonable discretion, including after publication, where we believe it breaches these Terms or the law. Reviewing listings is a quality measure and does not make us the author of, or responsible for, user content.`,
  },
  {
    id: 'conduct',
    title: 'Dealings Between Users',
    content: `Any transaction, negotiation, inspection, payment or transfer between users is strictly between those users. Gun X is not a party to it, does not verify the accuracy of any listing, and gives no warranty as to the condition, legality, provenance or fitness of any item.

We strongly encourage you to inspect items in person, transact through a licensed dealer, verify licences and documentation, and avoid any arrangement that asks you to bypass lawful process.

Report suspicious activity to support@gunx.co.za or through the report function on a listing.`,
  },
  {
    id: 'paid',
    title: 'Paid Services',
    content: `Some features are paid, including dealer subscriptions, listing boosts and promotions, club and range subscriptions, job postings, service-provider listings and advertising.

Prices are those displayed at the time of purchase and are quoted in South African Rand, inclusive of VAT where applicable. Recurring subscriptions continue until cancelled in accordance with the applicable plan terms.

Advertising is governed by our Advertising Policy. Dealer subscriptions are additionally governed by the Dealer Agreement. Where you are a consumer for purposes of the Consumer Protection Act 68 of 2008, nothing in these Terms limits rights that cannot lawfully be limited.`,
  },
  {
    id: 'ip',
    title: 'Intellectual Property',
    content: `The Gun X name, logo, design, code, database structure and original content are owned by GX SA (Pty) Ltd and protected by South African and international intellectual property law.

You retain ownership of the content you upload. By uploading it, you grant us a non-exclusive, royalty-free licence to host, display, reproduce and distribute that content on the Platform and in reasonable promotion of the Platform, for as long as your content remains published.

You may not copy, reproduce, republish or exploit any part of the Platform for commercial purposes without our written permission.`,
  },
  {
    id: 'availability',
    title: 'Availability and Changes',
    content: `We aim to keep the Platform available and accurate, but we do not warrant uninterrupted or error-free operation. The Platform may be unavailable for maintenance, technical issues, or reasons beyond our control.

We may add, change, suspend or discontinue features at any time. Where a change materially affects a paid service you have already purchased, we will act fairly and consistently with section 47 of the Consumer Protection Act.`,
  },
  {
    id: 'suspension',
    title: 'Suspension and Termination',
    content: `We may suspend or terminate your account, remove your content, or restrict your access where you breach these Terms or applicable law, where we reasonably suspect fraudulent or unlawful activity, or where required by law or a competent authority.

You may close your account at any time by contacting support@gunx.co.za. Closing your account does not automatically refund fees already paid for a period that has commenced, except where the law requires it.`,
  },
  {
    id: 'liability',
    title: 'Liability',
    content: `To the maximum extent permitted by law, Gun X is not liable for any loss or damage arising from: your use of or inability to use the Platform; any dealing, transaction or dispute between users; the accuracy, legality or condition of any listed item; or any unlawful act by a user.

Where liability cannot lawfully be excluded, our total liability in respect of any claim is limited to the amount you paid to us for the specific service giving rise to the claim.

Nothing in these Terms excludes or limits liability that cannot be excluded or limited under South African law, including under the Consumer Protection Act where it applies to you.`,
  },
  {
    id: 'indemnity',
    title: 'Indemnity',
    content: `You indemnify GX SA (Pty) Ltd, its directors, employees and agents against any claim, loss, liability or expense arising from your use of the Platform, your listings or content, your dealings with other users, or your breach of these Terms or of any law.`,
  },
  {
    id: 'law',
    title: 'Governing Law and Disputes',
    content: `These Terms are governed by the laws of the Republic of South Africa. Disputes are subject to the jurisdiction of the South African courts.

If any provision is found unenforceable, the remaining provisions continue in force. Our failure to enforce a right is not a waiver of it.

We may amend these Terms from time to time. The version in force when you use the Platform governs that use, and material changes will carry an updated date.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `GX SA (Pty) Ltd
Registration number: 2025/830094/07
Registered office: 11 Howe Street, Observatory, Western Cape, 7925

General support: support@gunx.co.za
Advertising and sales: pewpew@gunx.co.za`,
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      titleLead="Terms of"
      titleAccent="Use"
      updated="7 August 2026"
      intro="The rules that govern your use of the Gun X platform, your listings, and your dealings with other users."
      sections={SECTIONS}
      draftNotice
    />
  );
}
