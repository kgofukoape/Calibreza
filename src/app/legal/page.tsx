'use client';

import LegalDoc, { LegalSection } from '@/components/LegalDoc';

// ─── LEGAL DISCLAIMER ────────────────────────────────────────────────────────
// Version 3.0, effective 1 September 2026.
//
// Every legal@gunx.co.za reference is replaced with pewpew@gunx.co.za — the
// first address does not exist, and a disclaimer that routes formal complaints
// to a dead mailbox is worse than one that does not mention an address at all.
//
// The IMPORTANT NOTICE at the head of the document is passed as the `notice`
// prop rather than as a section: it must be visible before anything else, not
// hidden behind an accordion. Under the Consumer Protection Act, a term that
// limits liability or assumes risk must be brought to the consumer's attention
// in a way that an ordinary alert consumer would notice — a clause folded
// inside a collapsed panel does not obviously meet that standard.

const NOTICE = `**This document limits our liability to you and records risks that you accept. Those provisions appear in the Limitation of Liability and Safety and Lawful Use sections. The Listings and Verification Badges sections record acknowledgements of fact about what we do and do not verify.**

**This Platform relates to firearms, ammunition and other regulated items, which are inherently dangerous and can cause serious injury or death. We do not inspect, test, service, certify or handle any item listed here.**

**Please read this document carefully.**`;

const SECTIONS: LegalSection[] = [
  {
    id: 'our-role',
    title: 'Our Role',
    content: `Gun X is an online classifieds and directory platform operated by GX SA (Pty) Ltd. We provide the space where buyers, sellers, dealers, clubs, ranges and service providers find one another.

We are not a firearms dealer. We do not own, hold, store, inspect, transport or sell any item listed on the Platform. We are not a party to any transaction between users, and we do not act as agent for either side.

Any transfer of a firearm, ammunition or other regulated item must be completed lawfully through a licensed dealer and the applicable SAPS and Central Firearms Registry processes.

We host content created by users. We do not initiate the transmission of that content, select who receives it, or select the content itself. Our role as an intermediary, and the basis on which we act on notifications of unlawful content, are set out in our Terms of Use and in our Takedown Notification Procedure.`,
  },
  {
    id: 'not-legal-advice',
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

Do not make a purchase, licensing or legal decision on the basis of the Advisor alone. Confirm any suggestion with a licensed dealer, a qualified professional, and the current requirements of the FCA.

The Advisor does not make any decision about you and has no legal consequence for you. How your input to the Advisor is processed, and where, is set out in clause 2.5 of our Privacy Policy.`,
  },
  {
    id: 'listings',
    title: 'Listings and Third-Party Content',
    content: `Listings, dealer profiles, club and range entries, service-provider pages, job posts and reviews are created by users, not by Gun X.

We do not verify the accuracy, legality, condition, provenance or availability of any listed item, and we give no warranty about them. Prices, specifications and photographs are supplied by the person posting.

Reviewing or moderating content is a quality and legality measure. It does not make us the author or publisher of user content, and it does not transfer responsibility for that content to us. We are under no general obligation to monitor user content or to seek out facts indicating unlawful activity.

Inspect items in person, verify licences and documentation, and transact through lawful channels.`,
  },
  {
    id: 'verification',
    title: 'Verification Badges and Directory Information',
    content: `Where a dealer, club, range or service provider carries a verification badge, that badge records only that we completed our own reasonable checks at a point in time, on the documents that party gave us. It is not a warranty of licensing, solvency, conduct, safety or quality, and it does not transfer responsibility for that business to us.

Directory information — including dealer, club, range and service-provider details, and licence status — may change without us being told. Verify current status directly with the business and, where it matters, with SAPS or the Central Firearms Registry.`,
  },
  {
    id: 'external-links',
    title: 'External Links and Third Parties',
    content: `The Platform links to third-party websites and services, including dealers, clubs, ranges, service providers, payment providers and mapping services.

We do not control those sites and are not responsible for their content, availability, accuracy, security or practices. A link is not an endorsement.

Your dealings with any third party — including any payment you make to them — are between you and that party. This does not affect our own responsibility to you for our own acts and omissions in taking, applying and refunding payment.`,
  },
  {
    id: 'availability',
    title: 'Availability and Accuracy',
    content: `We work to keep the Platform available, current and accurate, but we do not warrant that it will be uninterrupted, error-free or complete.

Content may be out of date. Features may change. The Platform may be unavailable for maintenance or for reasons beyond our control.`,
  },
  {
    id: 'safety',
    title: 'Safety and Lawful Use',
    content: `> **Firearms are dangerous and can cause serious injury or death.**
>
> **Safe handling, secure storage in accordance with applicable SANS requirements, and lawful transport under the FCA are your responsibility and not ours. We do not inspect, test, service or certify any item listed on the Platform and we make no representation that any item is safe, functional or lawfully held. By using the Platform you accept those risks.**

Nothing on this Platform should be read as encouraging any unlawful act, any transaction outside proper regulatory process, or any unsafe practice.

If you encounter a listing or user that appears unlawful, report it through the report function or email support@gunx.co.za. If you wish to send a formal notification of unlawful content, follow our Takedown Notification Procedure and send it to pewpew@gunx.co.za.

We will cooperate fully with SAPS, the Central Firearms Registry and any other competent authority where we are lawfully required to do so or where we reasonably suspect a contravention of the FCA or other law.`,
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: `> **This clause limits our liability to you. Please read it carefully.**

To the maximum extent permitted by law, and subject to the paragraphs below, GX SA (Pty) Ltd, its directors, employees and agents are not liable for any loss, damage, injury or expense arising from your use of the Platform, your reliance on any information on it, any dealing between users, or any act or omission of a third party.

Where liability cannot lawfully be excluded, it is limited to the amount you paid us for the specific service giving rise to the claim.

**Nothing in this disclaimer excludes or limits:**

- **our liability for our own gross negligence or wilful misconduct;**
- **our liability for death or personal injury caused by our negligence;**
- **our liability for fraud or fraudulent misrepresentation; or**
- **any other liability that cannot lawfully be excluded or limited under South African law, including under the Consumer Protection Act 68 of 2008 where it applies to you.**`,
  },
  {
    id: 'other-documents',
    title: 'Relationship to Our Other Documents',
    content: `This disclaimer is read with our Terms of Use, Privacy Policy, POPI Act Notice, Takedown Notification Procedure and, where applicable, the Dealer Agreement and Advertising Policy. Where those documents deal with a topic in more detail, they apply to that topic.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `**GX SA (Pty) Ltd**

Registration number 2025/830094/07

Registered office: 11 Howe Street, Observatory, Western Cape, 7925

support@gunx.co.za

pewpew@gunx.co.za`,
  },
];

export default function LegalPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      titleLead="Legal"
      titleAccent="Disclaimer"
      version="3.0"
      updatedLabel="Effective"
      updated="1 September 2026"
      intro="What Gun X is responsible for, what it is not, and the limits of the information provided on this platform."
      notice={NOTICE}
      sections={SECTIONS}
      draftNotice
    />
  );
}
