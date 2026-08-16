'use client';

import LegalDoc, { LegalSection } from '@/components/LegalDoc';

// ─── POPI ACT NOTICE ─────────────────────────────────────────────────────────
// Version 3.0, effective 1 September 2026.
//
// Filled from the approved draft: Information Officer Kgofu Koape, no deputy
// designated.
//
// The registration sentence at clause 3.6 is deliberately absent. Section 55
// registration with the Information Regulator has not been completed, and
// stating otherwise on a published notice would be a misrepresentation to the
// Regulator itself. Once registered, add:
//
//   "Our Information Officer is registered with the Information Regulator of
//    South Africa in terms of section 55 of POPIA and the Regulations."
//
// The client-facing drafting notes in the source document are not published.

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: 'POPI Act Overview',
    content: `> This Notice sets out **your rights**. Our separate Privacy Policy sets out **what we collect, why, who we share it with, where it goes and how long we keep it**. Read them together.

The Protection of Personal Information Act 4 of 2013 ("**POPI Act**" or "**POPIA**") governs how organisations in South Africa collect, use, store and share personal information.

GX SA (Pty) Ltd is the responsible party for personal information processed through the Gun X platform.`,
  },
  {
    id: 'how-we-apply',
    title: 'How We Apply POPIA',
    content: `We process personal information on the lawful bases set out in section 11 of POPIA — principally the performance of our contract with you, our legitimate interests in operating the Platform, compliance with obligations imposed by law, and, for marketing and optional cookies, your consent. The Privacy Policy sets out which basis applies to which purpose.

We aim to collect only what we need for a stated purpose, keep it accurate, hold it no longer than necessary, and protect it with reasonable technical and organisational measures.

Where you give consent — for example when opting in to marketing, or when booking advertising — we record the date, time and version of the notice or policy you accepted, so that both you and we have a clear record of what was agreed.`,
  },
  {
    id: 'your-rights',
    title: 'Your Rights as a Data Subject',
    content: `Under POPIA you have the right to:

- Be notified that your personal information is being collected, and be notified where it has been accessed or acquired by an unauthorised person.
- Request confirmation, free of charge, of whether we hold personal information about you, and to request a record or description of it.
- Request correction, destruction or deletion of personal information that is inaccurate, irrelevant, excessive, out of date, incomplete, misleading or unlawfully obtained.
- Request that we destroy or delete a record of personal information that we are no longer authorised to retain.
- Object, on reasonable grounds, to the processing of your personal information where we rely on legitimate interests.
- Object at any time, and without giving reasons, to the processing of your personal information for the purposes of direct marketing.
- Withdraw consent where processing is based on consent, without affecting the lawfulness of processing carried out before withdrawal.
- Not be subject to a decision based solely on automated processing that has legal consequences for you or affects you to a substantial degree. The only decision we take by purely automated means is the placement of a dealer account in Lapse Suspension when a recorded licence expiry date passes; clause 2.5 of our Privacy Policy explains it, and you may require a person to review it.
- Complain to the Information Regulator, and to institute civil proceedings for a breach of your rights under POPIA.`,
  },
  {
    id: 'making-a-request',
    title: 'Making a Request',
    content: `To exercise any of the rights above, email support@gunx.co.za with the subject line "**POPIA Request**", or complete the prescribed form (Form 2 under the POPIA Regulations) available from the Information Regulator's website and send it to the same address.

Please include your full name, the email address associated with your Gun X account, a clear description of what you are asking for, and enough information for us to verify your identity. We ask for verification to protect you — we will not release personal information to someone who cannot show they are entitled to it.

**Our timelines.** We will acknowledge your request within **2 business days**. We will respond substantively within **30 days** of receiving a request that is complete and where your identity is verified. Where the request is complex or voluminous, we may extend that period once, by not more than a further 30 days, and we will tell you before the first period expires that we are doing so and why.

Access to a record of your personal information is provided free of charge. Where PAIA permits us to charge a prescribed fee for the reproduction of records, we will tell you the amount before we do the work.

POPIA and PAIA allow a responsible party to refuse certain requests in defined circumstances — for example where the information is subject to legal privilege, where releasing it would breach another person's rights, or where it would prejudice an investigation. If we refuse, we will tell you in writing which ground we rely on and how you may take the matter further.`,
  },
  {
    id: 'records-generally',
    title: 'Access to Records Generally',
    content: `Requests for access to records held by GX SA (Pty) Ltd that are not requests for your own personal information are dealt with under the Promotion of Access to Information Act 2 of 2000, in accordance with our PAIA Manual, published at gunx.co.za/paia and available at our registered office.`,
  },
  {
    id: 'information-officer',
    title: 'Information Officer',
    content: `Under POPIA, read with PAIA, the Information Officer of a private body is the head of that body — in the case of a company, its chief executive officer or the person acting as such.

**Information Officer:** Kgofu Koape, director of GX SA (Pty) Ltd

**Deputy Information Officer:** None designated

**Contact:** support@gunx.co.za, subject line "POPIA"

**Postal and physical address:** 11 Howe Street, Observatory, Western Cape, 7925

The Information Officer is responsible for encouraging compliance with POPIA, dealing with requests, working with the Information Regulator, and ensuring that a compliance framework is developed and maintained.`,
  },
  {
    id: 'sharing',
    title: 'Sharing and Cross-Border Transfers',
    content: `We use service providers to run the Platform — including hosting, database and file storage, transactional email, messaging, artificial intelligence, error monitoring, payment processing and analytics. These providers are operators. Each is bound by a written agreement obliging it to process personal information only on our instruction and to establish and maintain the security measures required by section 21 of POPIA.

Some of these providers process personal information outside the Republic of South Africa. Where personal information is transferred outside the Republic, the transfer is made in reliance on section 72(1)(a) of POPIA: the recipient is subject to a binding written agreement — a data processing agreement incorporating standard contractual clauses, or binding corporate rules — which upholds principles for the lawful processing of personal information that are substantially similar to the conditions in POPIA, and which includes provisions substantially similar to section 72 governing onward transfer. Where the transfer is necessary for the performance of our contract with you, we also rely on section 72(1)(c).

The categories of provider and their processing locations are listed in Annexure A to our Privacy Policy. You may ask us at support@gunx.co.za for the current list.

We do not sell your personal information. We share it only where necessary to operate the Platform, to comply with the law, or where you have asked us to.`,
  },
  {
    id: 'security',
    title: 'Security and Breach Notification',
    content: `We apply reasonable technical and organisational measures to protect personal information, including access controls, encrypted connections, hashed password storage and restrictions on who inside the business can see what.

No system is completely secure. If a security compromise occurs where there are reasonable grounds to believe that personal information has been accessed or acquired by an unauthorised person, we will notify the Information Regulator and the affected data subjects as required by section 22 of POPIA, as soon as reasonably possible after becoming aware of it, unless a public body responsible for the detection of offences or the Regulator tells us that notification will impede a criminal investigation.

Our notification to you will describe, as far as we are able, the possible consequences, the measures we intend to take or have taken, what we recommend you do, and the identity of the unauthorised person if known.

If you believe your account or information has been compromised, contact support@gunx.co.za immediately.`,
  },
  {
    id: 'retention',
    title: 'Retention',
    content: `We keep personal information no longer than necessary. Our retention periods are set out in clause 2.7 of the Privacy Policy.`,
  },
  {
    id: 'complaints',
    title: 'Complaints to the Information Regulator',
    content: `If you are not satisfied with how we have handled your personal information or your request, you may lodge a complaint with the Information Regulator of South Africa, using the prescribed form.

The Information Regulator is the independent body established under POPIA to oversee compliance with POPIA and PAIA. Current contact details, complaint forms and guidance are published on the Regulator's official website at inforegulator.org.za.

We would appreciate the chance to resolve your concern first — please contact support@gunx.co.za. Approaching us first does not affect your right to complain.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `**GX SA (Pty) Ltd**

Registration number 2025/830094/07

11 Howe Street, Observatory, Western Cape, 7925

support@gunx.co.za`,
  },
];

export default function PopiPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      titleLead="POPI Act"
      titleAccent="Notice"
      version="3.0"
      updatedLabel="Effective"
      updated="1 September 2026"
      intro="Your rights over your personal information under the Protection of Personal Information Act 4 of 2013, and how to exercise them."
      sections={SECTIONS}
      draftNotice
    />
  );
}
