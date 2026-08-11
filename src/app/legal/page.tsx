'use client';

import React from 'react';
import LegalDoc, { LegalSection } from '@/components/LegalDoc';

const SECTIONS: LegalSection[] = [
  {
    id: 'role',
    title: 'Our Role',
    content: `Gun X is an online classifieds and directory platform operated by GX SA (Pty) Ltd. We provide the space where buyers, sellers, dealers, clubs, ranges and service providers find one another.

We are not a firearms dealer. We do not own, hold, store, inspect, transport or sell any item listed on the Platform. We are not a party to any transaction between users, and we do not act as agent for either side.

Any transfer of a firearm, ammunition or other regulated item must be completed lawfully through a licensed dealer and the applicable SAPS and Central Firearms Registry processes.`,
  },
  {
    id: 'no-legal-advice',
    title: 'Not Legal Advice',
    content: `Information on the Platform about firearm ownership, licensing, the Firearms Control Act 60 of 2000, competency requirements, storage, transport or any related topic is provided for general guidance only.

It is not legal advice, and it is not a substitute for advice from a qualified attorney or for guidance from SAPS and the Central Firearms Registry.

Firearms law is detailed and changes over time. Before you rely on anything you read here, verify it against the current Act, its regulations, and official SAPS guidance. Where your circumstances matter, get professional advice.`,
  },
  {
    id: 'advisor',
    title: 'AI Firearm Match Advisor',
    content: `The Gun X Firearm Match Advisor is an automated tool that suggests general directions based on the answers you give it. It is a starting point for your own research, not a professional recommendation.

Its output may be incomplete, out of date or wrong. It does not assess your individual circumstances, it cannot determine your eligibility for any licence, and it does not replace the competency and licensing process.

Do not make a purchase, licensing or legal decision on the basis of the Advisor alone. Confirm any suggestion with a licensed dealer, a qualified professional, and the current requirements of the FCA.`,
  },
  {
    id: 'listings',
    title: 'Listings and Third-Party Content',
    content: `Listings, dealer profiles, club and range entries, service-provider pages, job posts and reviews are created by users, not by Gun X.

We do not verify the accuracy, legality, condition, provenance or availability of any listed item, and we give no warranty about them. Prices, specifications and photographs are supplied by the person posting.

Reviewing or moderating content is a quality measure. It does not make us the author of user content, and it does not transfer responsibility for that content to us.

Inspect items in person, verify licences and documentation, and transact through lawful channels.`,
  },
  {
    id: 'external',
    title: 'External Links and Third Parties',
    content: `The Platform links to third-party websites and services, including dealers, clubs, ranges, service providers, payment providers and mapping services.

We do not control those sites and are not responsible for their content, availability, accuracy, security or practices. A link is not an endorsement.

Your dealings with any third party — including any payment you make to them — are between you and that party.`,
  },
  {
    id: 'availability',
    title: 'Availability and Accuracy',
    content: `We work to keep the Platform available, current and accurate, but we do not warrant that it will be uninterrupted, error-free or complete.

Content may be out of date. Features may change. The Platform may be unavailable for maintenance or for reasons beyond our control.

Directory information — including dealer, club, range and service-provider details — may change without us being told.`,
  },
  {
    id: 'safety',
    title: 'Safety and Lawful Use',
    content: `Firearms are dangerous. Safe handling, secure storage in accordance with SANS 1522 requirements, and lawful transport under the FCA are your responsibility.

Nothing on this Platform should be read as encouraging any unlawful act, any transaction outside proper regulatory process, or any unsafe practice.

If you encounter a listing or user that appears unlawful, report it through the report function or email support@gunx.co.za.`,
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, GX SA (Pty) Ltd, its directors, employees and agents are not liable for any loss, damage, injury or expense arising from your use of the Platform, your reliance on any information on it, any dealing between users, or any act or omission of a third party.

Where liability cannot lawfully be excluded, it is limited to the amount you paid us for the specific service giving rise to the claim.

Nothing in this disclaimer excludes or limits liability that cannot be excluded or limited under South African law, including under the Consumer Protection Act 68 of 2008 where it applies to you.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `GX SA (Pty) Ltd
Registration number: 2025/830094/07
Registered office: 11 Howe Street, Observatory, Western Cape, 7925

support@gunx.co.za`,
  },
];

export default function LegalPage() {
  return (
    <LegalDoc
      titleLead="Legal"
      titleAccent="Disclaimer"
      updated="7 August 2026"
      intro="What Gun X is responsible for, what it is not, and the limits of the information provided on this platform."
      sections={SECTIONS}
      draftNotice
    />
  );
}
