'use client';

import React from 'react';
import LegalDoc, { LegalSection } from '@/components/LegalDoc';

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: 'POPI Act Overview',
    content: `The Protection of Personal Information Act 4 of 2013 ("POPI Act" or "POPIA") governs how organisations in South Africa collect, use, store and share personal information.

GX SA (Pty) Ltd is the responsible party for personal information processed through the Gun X platform. This page summarises your rights under POPIA and how to exercise them.

For the full detail of what we collect and why, see our Privacy Policy. This page focuses on your rights and the practical steps to act on them.`,
  },
  {
    id: 'principles',
    title: 'How We Apply POPIA',
    content: `We process personal information on the lawful bases set out in section 11 of POPIA — principally your consent, the performance of a contract with you, and our legitimate interests in operating the Platform.

We aim to collect only what we need for a stated purpose, keep it accurate, hold it no longer than necessary, and protect it with reasonable technical and organisational measures.

Where you give consent — for example when booking advertising — we record the date, time and version of the policy you accepted, so that both you and we have a clear record of what was agreed.`,
  },
  {
    id: 'rights',
    title: 'Your Rights as a Data Subject',
    content: `Under POPIA you have the right to:

• Be notified that your personal information is being collected, and when it has been accessed without authorisation.
• Request confirmation of whether we hold personal information about you, and to request a record of it.
• Request correction, destruction or deletion of personal information that is inaccurate, irrelevant, excessive, out of date, incomplete, misleading or unlawfully obtained.
• Object, on reasonable grounds, to the processing of your personal information.
• Withdraw consent where processing is based on consent, without affecting the lawfulness of processing carried out before withdrawal.
• Not be subject to a decision based solely on automated processing that has legal or similarly significant consequences for you.
• Complain to the Information Regulator.`,
  },
  {
    id: 'requests',
    title: 'Making a Request',
    content: `To exercise any of the rights above, email support@gunx.co.za with the subject line "POPIA Request".

Please include your full name, the email address associated with your Gun X account, a clear description of what you are asking for, and enough information for us to verify your identity. We ask for verification to protect you — we will not release personal information to someone who cannot show they are entitled to it.

We will acknowledge your request and respond within a reasonable period. Where a request is complex or we need more information, we will tell you.

POPIA allows a responsible party to refuse certain requests in defined circumstances — for example where the information is subject to legal privilege or where releasing it would breach another person's rights. If we refuse, we will explain why.`,
  },
  {
    id: 'officer',
    title: 'Information Officer',
    content: `Our Information Officer is the head of operations of GX SA (Pty) Ltd.

Contact: support@gunx.co.za
Postal: 11 Howe Street, Observatory, Western Cape, 7925

Under POPIA the head of a private body is the Information Officer by default, and the role carries responsibility for encouraging compliance, dealing with requests, and working with the Information Regulator.`,
  },
  {
    id: 'sharing',
    title: 'Sharing and Cross-Border Transfers',
    content: `We use trusted service providers to run the Platform — including hosting, database, email delivery and messaging providers. Some of these process data outside South Africa.

Where personal information is transferred outside the Republic, we take reasonable steps to ensure it remains subject to appropriate protection, consistent with section 72 of POPIA.

We do not sell your personal information. We share it only where necessary to operate the Platform, to comply with the law, or where you have asked us to.`,
  },
  {
    id: 'security',
    title: 'Security and Breach Notification',
    content: `We apply reasonable technical and organisational measures to protect personal information, including access controls, encrypted connections, and restricting who inside the business can see what.

No system is completely secure. If a security compromise occurs where there are reasonable grounds to believe personal information has been accessed or acquired by an unauthorised person, we will notify the Information Regulator and affected data subjects as required by section 22 of POPIA.

If you believe your account or information has been compromised, contact support@gunx.co.za immediately.`,
  },
  {
    id: 'regulator',
    title: 'Complaints to the Information Regulator',
    content: `If you are not satisfied with how we have handled your personal information or your request, you may lodge a complaint with the Information Regulator of South Africa.

The Information Regulator is the independent body established under POPIA to oversee compliance. Current contact details, complaint forms and guidance are published on the Regulator's official website.

We would appreciate the chance to resolve your concern first — please contact support@gunx.co.za.`,
  },
];

export default function PopiPage() {
  return (
    <LegalDoc
      titleLead="POPI Act"
      titleAccent="Notice"
      updated="7 August 2026"
      intro="Your rights over your personal information under the Protection of Personal Information Act 4 of 2013, and how to exercise them."
      sections={SECTIONS}
      draftNotice
    />
  );
}
