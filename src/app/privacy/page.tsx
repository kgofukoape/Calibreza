'use client';

import LegalDoc, { LegalSection } from '@/components/LegalDoc';

// ─── PRIVACY POLICY ──────────────────────────────────────────────────────────
// Version 2.0, effective 1 September 2026.
//
// THREE FACTUAL CORRECTIONS against the draft. Each was a statement about how
// the Platform behaves, and each was untrue as drafted:
//
//   COOKIES. The draft described a cookie banner and a footer settings link.
//   Neither exists. They are also not needed: Vercel Analytics is cookieless
//   and Supabase session storage is strictly necessary. The clause now
//   describes what actually happens.
//
//   WHATSAPP. The draft described a messaging operator processing mobile
//   numbers, and marketing sent by WhatsApp. Every WhatsApp reference in the
//   codebase is a wa.me deep link that opens the user's own app — no message is
//   sent by us and no number is processed by any messaging provider. All such
//   claims and the Annexure A row are removed.
//
//   ADVISOR. Verified against /api/advisor before publication: the request
//   carries budget, discipline, frame preference and experience level only. No
//   name, email, phone number or account identifier is transmitted. The
//   representation in the Advisor clause is therefore accurate as written.
//
// ANNEXURE A is completed from the deployed stack: Vercel (functions in
// Washington DC, iad1), Supabase (eu-west-1, Ireland), Resend, Anthropic,
// Sentry, PayFast (South Africa — no cross-border transfer), Vercel Analytics.
//
// OUTSTANDING: each operator's data processing agreement must actually be
// accepted or executed. Most are incorporated in the provider's terms of
// service; that should be confirmed provider by provider and the record kept.

const SECTIONS: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who We Are',
    content: `GX SA (Pty) Ltd, registration number 2025/830094/07, of 11 Howe Street, Observatory, Western Cape, 7925, is the responsible party for the personal information processed through the Gun X platform at gunx.co.za.

Contact: support@gunx.co.za`,
  },
  {
    id: 'what-we-collect',
    title: 'What We Collect',
    content: `**Information you give us**

| Category | Examples |
|---|---|
| Account information | Name, email address, mobile number, password (stored in hashed form), province |
| Profile information | Display name, profile photograph, description, preferred contact method |
| Listing information | Item descriptions, photographs, asking price, location to the level of detail you choose to publish |
| Enquiry and messaging content | Messages you send to or receive from other users through the Platform |
| Dealer, club, range and service-provider application information | Company registration details, trading name, SAPS licence number and expiry date, licence certificate, PSIRA registration where applicable, proof of business registration, identification of the responsible person, business address and contact details |
| Advertising and job-posting information | Booking details, creative material, billing contact |
| Support correspondence | What you send us, and our replies |
| Firearm Match Advisor input | The preferences and answers you give the Advisor |

**Information we collect automatically**

| Category | Examples |
|---|---|
| Technical information | IP address, device and browser type, operating system, referring page |
| Usage information | Pages viewed, listings viewed, searches run, features used, timestamps |
| Cookies and similar technologies | Session and authentication cookies only — see the Cookies section |
| Error and diagnostic data | Error reports generated when something fails, which may include technical identifiers |

**Information we receive from others**

| Category | Examples |
|---|---|
| Payment provider | Confirmation that a payment succeeded or failed, the amount, and a transaction reference. **We do not receive or store your full card number.** |
| Verification sources | Where we verify a company registration or licence against a public or official source, the result of that check |

**We do not collect or ask for the serial number, licence number or registration particulars of any privately held firearm through public listing fields.** Do not publish those details in a listing.`,
  },
  {
    id: 'why-we-process',
    title: 'Why We Process It, and on What Lawful Basis',
    content: `We process personal information on the bases set out in section 11 of the Protection of Personal Information Act 4 of 2013.

| Purpose | Lawful basis |
|---|---|
| Creating and administering your account | Performance of our contract with you |
| Publishing your listings and profile as you have chosen | Performance of our contract with you |
| Passing your enquiry to the seller, dealer, club or provider you contacted | Performance of our contract with you |
| Taking payment and issuing invoices | Performance of our contract with you |
| Verifying dealer, club, range and service-provider applications, and monitoring licence validity | Our legitimate interests in operating a lawful platform, and compliance with an obligation imposed by law |
| Moderating listings, detecting fraud and preventing unlawful use | Our legitimate interests in operating a lawful and safe platform |
| Responding to lawful requests from SAPS, the Central Firearms Registry, the Information Regulator, a court or other competent authority | Compliance with an obligation imposed by law |
| Securing the Platform and investigating incidents | Our legitimate interests, and compliance with our obligations under POPIA |
| Sending you service and transactional messages | Performance of our contract with you |
| Sending you marketing communications | Your consent |
| Analytics and improving the Platform | Our legitimate interests, using aggregated data that does not identify you |
| Operating the Firearm Match Advisor | Performance of our contract with you, at your request |

Where we rely on legitimate interests, we have considered your interests and rights and are satisfied that our processing is proportionate. You may object at any time on reasonable grounds — see the POPI Act Notice.`,
  },
  {
    id: 'what-others-see',
    title: 'What Other Users Can See',
    content: `Anything you publish in a listing or public profile is visible to the public, including people who are not registered. This includes the photographs, description, asking price and the contact details you choose to publish.

When you send an enquiry, the recipient sees your name, the contact details you have chosen to share, and your message. Dealers and other business users receive that information as responsible parties in their own right and are separately obliged to handle it lawfully.

> **Think carefully before publishing a home address, a photograph that identifies your home or safe, or any detail that reveals where a firearm is kept.**`,
  },
  {
    id: 'advisor',
    title: 'The Firearm Match Advisor and Automated Processing',
    content: `The Firearm Match Advisor is an automated tool. When you use it, the preferences and answers you give it are transmitted to a third-party artificial-intelligence service provider, which processes them outside the Republic of South Africa in order to generate a suggestion, and returns the result to us.

We do not transmit your name, email address, telephone number or account identifier to that provider as part of an Advisor request. Advisor requests are not used by us to build a profile of you.

The Advisor does not make any decision about you. It produces a suggestion for your own consideration. It has no legal consequence for you and does not affect your eligibility for anything. See the AI Firearm Match Advisor section of our Legal Disclaimer.

We also use automated tools to screen listings and account activity for indicators of fraud or unlawful use. Where such a screen flags something, a person reviews it before we suspend an account or remove a listing on the strength of that flag.

**One process is automated.** Where a dealer account is placed in Lapse Suspension because the recorded firearms dealer licence expiry date has passed and we hold neither an updated certificate nor proof that a renewal was lodged, that step is taken automatically, without a person reviewing it first. It is taken because we may not lawfully carry listings for a dealer that is not entitled to trade. A dealer placed in Lapse Suspension is told at the time, may upload the missing document at any time, and may ask a person at Gun X to review the decision by writing to support@gunx.co.za; we will do so within 2 business days. The Dealer Agreement sets the process out in full.`,
  },
  {
    id: 'who-we-share-with',
    title: 'Who We Share It With',
    content: `We share personal information with:

- **Operators** who process it on our behalf and on our instruction, listed in Annexure A below. Each is bound by a written agreement obliging it to process only on our instruction and to maintain appropriate security safeguards, as required by section 21 of POPIA.
- **Other users**, to the extent described in the What Other Users Can See section.
- **The South African Police Service, the Central Firearms Registry, the Information Regulator, a court, or another competent authority**, where we are lawfully required to disclose or where disclosure is necessary to report or prevent a suspected offence.
- **Our professional advisers**, under obligations of confidence.
- **A purchaser of our business**, if we sell or transfer it, on notice to you.

**We do not sell your personal information, and we do not share it with third parties for their own marketing.**`,
  },
  {
    id: 'retention',
    title: 'How Long We Keep It',
    content: `We keep personal information no longer than is necessary for the purpose it was collected for, unless the law requires or authorises us to keep it longer.

| Record | Retention |
|---|---|
| Account and profile data | For as long as the account is open, and 12 months after closure |
| Published listing content | For as long as it is published, and 12 months after removal. Dealer listings unpublished on suspension or downgrade are retained for restoration for 90 days under the Dealer Agreement, and thereafter for the balance of the 12 months in archive only |
| Enquiry and message content | 24 months from the date of the message |
| Dealer, club, range and service-provider verification records, including licence certificates | For the duration of the relationship, and 5 years after it ends |
| Transaction, invoice and payment records | 5 years from the end of the tax year to which they relate, as required by tax legislation |
| Records of reports of suspected unlawful activity, and correspondence with authorities | 5 years from the date of the report |
| Takedown notifications, our assessment and the action taken | 5 years from the date of the notification |
| Records of acceptance of our legal terms | For the duration of the relationship, and 3 years after it ends, to evidence what was agreed |
| Security logs, access logs and error diagnostics | 12 months |
| Marketing consent and withdrawal records | 3 years after withdrawal, to evidence that we complied |
| Records of your POPIA requests and our responses | 3 years |

After a retention period ends we delete the information or de-identify it so that it can no longer be linked to you. Aggregated statistics that cannot identify anyone may be kept indefinitely.`,
  },
  {
    id: 'cross-border',
    title: 'Where It Is Processed, and Cross-Border Transfers',
    content: `Some of our operators process personal information outside the Republic of South Africa. The categories and locations are set out in Annexure A below.

Where we transfer personal information outside the Republic, we do so in reliance on section 72(1)(a) of POPIA: the recipient is subject to a binding written agreement — a data processing agreement incorporating standard contractual clauses, or binding corporate rules — which upholds principles for the lawful processing of personal information that are substantially similar to those in POPIA, and which includes provisions substantially similar to section 72 relating to onward transfer.

Where a transfer is necessary for the performance of our contract with you, we also rely on section 72(1)(c).

We review these agreements when we change providers. You may ask us at support@gunx.co.za which providers are currently in use and where they process data.`,
  },
  {
    id: 'marketing',
    title: 'Marketing and Electronic Communications',
    content: `**Service messages.** We send messages you need in order to use your account — enquiry notifications, listing status, billing notices, security alerts. These are part of the service and, while your account is open, you cannot opt out of them.

**Marketing.** We send marketing by email only where you have consented. We ask for that consent separately from your acceptance of the Terms of Use, and we record the date, time and version of what you agreed to. We do not treat your acceptance of the Terms of Use, or the fact that you have bought something from us, as consent to marketing.

**Withdrawing consent.** Turn marketing off in your dashboard or click unsubscribe in any marketing email. We action withdrawals within 2 business days. Withdrawal does not affect the lawfulness of what we sent before.

**Your separate right to refuse.** Independently of consent, section 11 of the Consumer Protection Act 68 of 2008 entitles you to demand that we stop directing marketing at you. You may exercise that right at any time by writing to support@gunx.co.za, and we will action it on the same timeline.`,
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: `We use cookies that are strictly necessary to run the Platform — keeping you signed in, remembering your session, and protecting against fraud. These do not require your consent under POPIA.

**We do not use advertising or tracking cookies.** Our analytics provider measures page views without setting cookies and without collecting information that identifies you, so there is nothing for you to accept or refuse and no cookie banner to click through.

You can clear or block cookies in your browser at any time. Blocking strictly necessary cookies will prevent you from signing in.`,
  },
  {
    id: 'security',
    title: 'Security',
    content: `We apply reasonable technical and organisational measures to protect personal information, including:

- encryption of data in transit;
- access controls that limit what staff can see to what their role requires;
- hashed password storage;
- row-level access rules in our database;
- private storage for licence certificates and identity documents, which are never published and are accessible only to the business that uploaded them and to our verification team;
- logging of administrative access; and
- vetting of the operators we appoint.

No system is completely secure. If a security compromise occurs where there are reasonable grounds to believe that personal information has been accessed or acquired by an unauthorised person, we will notify the Information Regulator and the affected data subjects as required by section 22 of POPIA, as soon as reasonably possible after becoming aware of it.

If you believe your account or information has been compromised, contact support@gunx.co.za immediately.`,
  },
  {
    id: 'children',
    title: 'Children',
    content: `The Platform is not for anyone under 18. We do not knowingly collect personal information from children. If you believe a child has registered, tell us at support@gunx.co.za and we will delete the account and the associated information.`,
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: `You have rights of access, correction, deletion, objection, and withdrawal of consent, and the right to complain to the Information Regulator. Our POPI Act Notice explains each right and how to exercise it.`,
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: `We may update this Policy. The current version and date appear at the top. Where a change materially affects how we process your personal information, we will notify registered users by email or dashboard notice not less than 14 days before it takes effect.`,
  },
  {
    id: 'annexure-a',
    title: 'Annexure A — Operators and Processing Locations',
    content: `These are the operators that process personal information on our behalf, and where they do it.

| Operator | Purpose | Personal information involved | Processing location |
|---|---|---|---|
| **Vercel** | Application hosting, content delivery and server functions | Technical data, IP address, request logs | United States (Washington DC), with content served from a global edge network |
| **Supabase** | Database, authentication and file storage | All categories | Ireland (European Union) |
| **Resend** | Transactional email delivery | Name, email address, message content | United States |
| **Anthropic** | Firearm Match Advisor | Advisor input only — no name, email, telephone number or account identifier | United States |
| **Sentry** | Error monitoring and diagnostics | Technical identifiers, error context | United States |
| **PayFast** | Payment processing | Billing contact, transaction data | **South Africa — no cross-border transfer** |
| **Vercel Analytics** | Aggregate usage measurement | Pseudonymous, cookieless page-view data | United States |

Every transfer outside the Republic in the table above is made under that provider's data processing agreement incorporating standard contractual clauses, in reliance on section 72(1)(a) of POPIA, and — where the transfer is necessary to provide the service you asked for — on section 72(1)(c).

Payment processing takes place in South Africa and is not a cross-border transfer.

We update this Annexure when we change providers. You may ask us at support@gunx.co.za for the current list at any time.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `**Information Officer**

GX SA (Pty) Ltd

11 Howe Street, Observatory, Western Cape, 7925

support@gunx.co.za — subject line "POPIA"`,
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      titleLead="Privacy"
      titleAccent="Policy"
      version="2.0"
      updatedLabel="Effective"
      updated="1 September 2026"
      intro="What we collect, why, who we share it with, where it goes and how long we keep it."
      sections={SECTIONS}
      draftNotice
    />
  );
}
