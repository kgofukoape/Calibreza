'use client';

import LegalDoc, { LegalSection } from '@/components/LegalDoc';

// ─── TERMS OF USE ────────────────────────────────────────────────────────────
// Version 3.0, effective 1 September 2026.
//
// Filled from the approved draft:
//   Directors ............ Kgofu Koape
//   Telephone ............ 061 432 5574
//   ISPA membership ...... None
//   legal@gunx.co.za ..... replaced throughout with pewpew@gunx.co.za
//
// The ISPA paragraph in clause 1.5 is omitted rather than softened. GX SA is
// not a member of a recognised industry representative body, and section 72 of
// ECTA limits the Chapter XI liability protections — including section 75 — to
// businesses that are. Claiming reliance on protections we do not have would be
// a misstatement in the very document meant to establish our position.
//
// The section 43 ECTA disclosure table states "None" for self-regulatory body
// membership. That is an honest answer to a mandatory disclosure question.

const NOTICE = `**These Terms contain provisions that limit our liability to you, that require you to accept certain risks, and that require you to indemnify us. They appear in the Safety, Limitation of Liability, Assumption of Risk and Indemnity sections, and are highlighted where they appear.**

**This Platform relates to firearms, ammunition and other regulated items. Firearms are inherently dangerous and can cause serious injury or death. You accept that responsibility for the safe handling, storage, transport and lawful use of any item is yours and not ours, and that we do not inspect, verify or handle any item listed here.**

**Please read these Terms carefully and take the time you need to consider them before you register or transact. If anything is unclear, ask us at support@gunx.co.za before you accept.**`;

const SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of These Terms',
    content: `These Terms of Use govern your access to and use of the Gun X platform at gunx.co.za and related subdomains (the "**Platform**"), operated by GX SA (Pty) Ltd, registration number 2025/830094/07 ("**Gun X**", "**we**", "**us**").

By accessing, browsing, registering for, or placing a listing on the Platform, you agree to be bound by these Terms. If you do not accept them, do not use the Platform.

These Terms work alongside our Privacy Policy, POPI Act Notice, Legal Disclaimer, Takedown Notification Procedure and, where applicable, the Dealer Agreement and Advertising Policy. Where a specialised document covers a topic in more detail, that document applies to that topic.

We may amend these Terms. The version in force when you use the Platform governs that use. Material changes will be notified to registered users by email or dashboard notice not less than 14 days before they take effect, and will carry an updated version number and date.`,
  },
  {
    id: 'who-may-use',
    title: 'Who May Use Gun X',
    content: `You must be at least 18 years of age, or a duly authorised representative of a juristic person, to register an account or place a listing.

Gun X serves the lawful, licensed South African firearms community. By using the Platform you confirm that your use is lawful and that any firearm, ammunition or regulated item you list, buy, or enquire about will be dealt with strictly in accordance with the Firearms Control Act 60 of 2000 ("**FCA**") and its regulations.

You are responsible for keeping your account credentials secure and for all activity that occurs under your account. Tell us immediately at support@gunx.co.za if you believe your account has been compromised.`,
  },
  {
    id: 'what-gunx-is',
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

You may not:

- list stolen, unlicensed, illegally modified or prohibited items;
- use the Platform to arrange a transfer that circumvents lawful dealer or SAPS processes;
- post misleading, fraudulent or duplicate listings;
- scrape, harvest or bulk-extract data from the Platform; or
- use the Platform to solicit users to transact off-platform in order to avoid lawful checks.

We may edit, decline, suspend or remove any listing at our reasonable discretion, including after publication, where we believe it breaches these Terms or the law.`,
  },
  {
    id: 'intermediary',
    title: 'Our Role as an Intermediary',
    content: `We host content created by users. We do not initiate the transmission of user content, we do not select the recipient of it, and we do not select or, except as described below, modify the content itself.

Reviewing or moderating listings is a quality and legality measure. It does not make us the author, publisher or endorser of user content, and it does not transfer responsibility for that content to us. We are under no general obligation to monitor the content stored on the Platform or to seek out facts indicating unlawful activity.

Where we are notified of unlawful content in accordance with our Takedown Notification Procedure, or where we otherwise acquire actual knowledge that content is unlawful, we will act expeditiously to remove it or disable access to it.`,
  },
  {
    id: 'dealings',
    title: 'Dealings Between Users, and Unlawful Activity',
    content: `Any transaction, negotiation, inspection, payment or transfer between users is strictly between those users. Gun X is not a party to it, does not verify the accuracy of any listing, and gives no warranty as to the condition, legality, provenance or fitness of any item.

We strongly encourage you to inspect items in person, transact through a licensed dealer, verify licences and documentation, and avoid any arrangement that asks you to bypass lawful process.

Report suspicious activity to support@gunx.co.za or through the report function on a listing.

**Cooperation with authorities.** We will cooperate fully with the South African Police Service, the Central Firearms Registry and any other competent authority, including by providing user data, listing records and transaction records, where we are lawfully required to do so or where we reasonably suspect a contravention of the FCA or other law. We may suspend an account pending verification of licensing status or the outcome of an enquiry by a competent authority.`,
  },
  {
    id: 'safety',
    title: 'Safety and Assumption of Risk',
    content: `> **Firearms, ammunition and related items are inherently dangerous and can cause serious injury or death.**
>
> **You accept that safe handling, secure storage in accordance with applicable SANS requirements, and lawful transport under the FCA are your responsibility and not ours. We do not inspect, test, service or certify any item listed on the Platform, and we make no representation that any item is safe, functional or lawfully held.**
>
> **By using the Platform you accept these risks.**

Nothing on this Platform should be read as encouraging any unlawful act, any transaction outside proper regulatory process, or any unsafe practice.`,
  },
  {
    id: 'paid-services',
    title: 'Paid Services',
    content: `**What is paid.** Some features are paid, including dealer subscriptions, listing boosts and promotions, club and range subscriptions, job postings, service-provider listings and advertising.

**Pricing.** Prices are those displayed at the time of purchase and are quoted in South African Rand, inclusive of VAT where applicable. Recurring subscriptions continue until cancelled in accordance with the applicable plan terms.

**Cooling-off and immediate commencement.** Where you are a consumer and the Consumer Protection Act 68 of 2008 or section 44 of the Electronic Communications and Transactions Act 25 of 2002 gives you a right to cancel an electronic transaction within seven days, that right applies except where the service has already begun with your consent within that period.

> **When you purchase a featured listing, a boost, a promotion or a subscription, you are asked to confirm that you want the service to start immediately. If you give that confirmation and the service starts, your seven-day cooling-off right in respect of that service falls away. If you do not want the service to start immediately, do not give that confirmation — contact us at support@gunx.co.za instead.**

**Payments.** Payments are processed by our third-party payment provider. Your relationship with that provider is governed by its own terms. We remain responsible to you for our own acts and omissions in taking, applying and refunding payment, and we do not exclude liability for those.

**Refunds of incorrect charges.** If we charge you an amount incorrectly, tell us at support@gunx.co.za. Where we confirm the error, we will refund the amount incorrectly taken, by the same method by which it was paid, within 14 business days of verification.

**Refunds generally.** Apart from incorrect charges and any cooling-off right described above, paid services are not refundable once the period or placement you paid for has commenced. Where we fail to deliver a paid service, or deliver it materially late or materially differently from what was advertised, tell us at support@gunx.co.za. Where we accept that we did not deliver, we will at your election re-run the service or refund the amount paid for the undelivered part, within 14 business days of our acceptance. Nothing in this clause limits any right you have under the Consumer Protection Act 68 of 2008.

**Other documents.** Advertising is governed by our Advertising Policy. Dealer subscriptions are additionally governed by the Dealer Agreement. Where you are a consumer for the purposes of the Consumer Protection Act 68 of 2008, nothing in these Terms limits rights that cannot lawfully be limited.`,
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    content: `The Gun X name, logo, design, code, database structure and original content are owned by GX SA (Pty) Ltd and protected by South African and international intellectual property law.

You retain ownership of the content you upload. By uploading it, you grant us a non-exclusive, royalty-free, South Africa-wide licence to host, display, reproduce and distribute that content on the Platform and in reasonable promotion of the Platform, for as long as your content remains published.

Where, before your content was unpublished, we had already incorporated it into promotional or advertising material that had been produced or distributed, the licence continues for that material only, for so long as it remains in circulation, and for archival copies. It does not permit us to produce new material using your content after it is unpublished.

You may not copy, reproduce, republish or exploit any part of the Platform for commercial purposes without our written permission.`,
  },
  {
    id: 'availability',
    title: 'Availability, Changes, Suspension and Termination',
    content: `We aim to keep the Platform available and accurate, but we do not warrant uninterrupted or error-free operation. The Platform may be unavailable for maintenance, technical issues, or reasons beyond our control.

We may add, change, suspend or discontinue features at any time. Where a change materially affects a paid service you have already purchased, we will act fairly and consistently with section 47 of the Consumer Protection Act.

We may suspend or terminate your account, remove your content, or restrict your access where you breach these Terms or applicable law, where we reasonably suspect fraudulent or unlawful activity, or where required by law or a competent authority.

**Where we suspend or terminate your account, we will notify you of the reason for that action, in writing, via your registered email address or your dashboard, within 2 business days.** We may withhold reasons only where we are prohibited by law from giving them, where a competent authority has directed us not to, or where giving them would compromise the security of the Platform or an ongoing investigation — and in that case we will tell you that reasons are being withheld and why, to the extent we lawfully may.

You may close your account at any time by contacting support@gunx.co.za. Closing your account does not automatically refund fees already paid for a period that has commenced, except where the law requires it.`,
  },
  {
    id: 'liability',
    title: 'Limitation of Liability',
    content: `> **This clause limits our liability to you. Please read it carefully.**

To the maximum extent permitted by law, and subject to the paragraphs below, Gun X is not liable for any loss or damage arising from: your use of or inability to use the Platform; any dealing, transaction or dispute between users; the accuracy, legality, condition or safety of any listed item; or any unlawful act by a user or other third party.

Where liability cannot lawfully be excluded, our total liability in respect of any claim or series of related claims is limited to the amount you paid to us for the specific service giving rise to the claim.

**Nothing in these Terms excludes or limits, and nothing in these Terms is to be read as excluding or limiting:**

- **our liability for our own gross negligence or wilful misconduct;**
- **our liability for death or personal injury caused by our negligence;**
- **our liability for fraud or fraudulent misrepresentation; or**
- **any other liability that cannot lawfully be excluded or limited under South African law, including under the Consumer Protection Act 68 of 2008 where it applies to you.**`,
  },
  {
    id: 'assumption-of-risk',
    title: 'Assumption of Risk',
    content: `> **This clause records risks you accept. Please read it carefully.**

Subject always to the Limitation of Liability section, you accept the risks inherent in dealing with other users on a classifieds platform, including the risk that a listing is inaccurate, that an item is not as described, that a counterparty does not perform, and that an item is not lawfully held. You accept the risks described in the Safety section in relation to firearms and regulated items.

**You do not assume, and nothing in this clause or in the Safety section is to be read as your assuming, any risk of loss attributable to our own gross negligence or wilful misconduct, or any risk of death or personal injury caused by our negligence.**`,
  },
  {
    id: 'indemnity',
    title: 'Indemnity',
    content: `> **This clause requires you to indemnify us in certain circumstances. Please read it carefully.**

**Except to the extent that the claim, loss, liability or expense arises from our own gross negligence or wilful misconduct**, you indemnify GX SA (Pty) Ltd, its directors, employees and agents against any claim, loss, liability or expense arising from your use of the Platform, your listings or content, your dealings with other users, or your breach of these Terms or of any law.

We will notify you promptly of any claim to which this indemnity may apply, will not settle it without consulting you, and will allow you a reasonable opportunity to participate in its defence.`,
  },
  {
    id: 'personal-information',
    title: 'Your Personal Information',
    content: `We process personal information in accordance with our Privacy Policy and POPI Act Notice. Those documents describe what we collect, why, who we share it with, where it is processed, how long we keep it, and how you exercise your rights.`,
  },
  {
    id: 'communications',
    title: 'Electronic Communications and Marketing',
    content: `We will send you communications necessary to operate your account and the services you have asked for — including enquiry notifications, listing status messages, billing notices and security alerts. These are not marketing and you cannot opt out of them while your account is open, although you may choose the channel.

We will send you marketing communications only where you have consented to receive them. You may withdraw that consent at any time from your dashboard or by using the unsubscribe link in any marketing email, without affecting the lawfulness of anything sent before withdrawal.

Separately, and whether or not you have consented, you may at any time require us to stop directing any marketing to you, as section 11 of the Consumer Protection Act 68 of 2008 entitles you to do. Clause 2.9 of our Privacy Policy sets out how we handle consent, withdrawal and our records of both.`,
  },
  {
    id: 'information-required',
    title: 'Information Required by Law',
    content: `The following information is provided in accordance with section 43 of the Electronic Communications and Transactions Act 25 of 2002:

| | |
|---|---|
| **Full legal name** | GX SA (Pty) Ltd |
| **Legal status** | Private company incorporated in the Republic of South Africa |
| **Registration number** | 2025/830094/07 |
| **Place of registration** | Republic of South Africa |
| **Directors** | Kgofu Koape |
| **Registered office and physical address** | 11 Howe Street, Observatory, Western Cape, 7925 |
| **Address for service of legal documents** | 11 Howe Street, Observatory, Western Cape, 7925 |
| **Telephone** | 061 432 5574 |
| **Website** | gunx.co.za |
| **General support** | support@gunx.co.za |
| **Legal notices and takedown notifications** | pewpew@gunx.co.za |
| **Sales and advertising** | pewpew@gunx.co.za |
| **Self-regulatory body membership** | None |
| **Main characteristics of services** | Online classifieds, directory and advertising services for the licensed South African firearms community. We do not supply firearms, ammunition or any regulated item. |
| **Prices** | As displayed on the relevant pricing page at the time of purchase, in South African Rand, inclusive of VAT where applicable |
| **Manner of payment** | Electronic payment through our payment provider, as presented at checkout |
| **Terms of agreement** | These Terms of Use, together with the Privacy Policy, POPI Act Notice, Legal Disclaimer, Takedown Notification Procedure and, where applicable, the Dealer Agreement and Advertising Policy |
| **Record of the transaction** | Available in your dashboard for the life of your account, and on request at support@gunx.co.za |
| **Refund policy** | As set out in the Paid Services section |
| **Cooling-off rights** | As set out in the Paid Services section |
| **Security and privacy** | As set out in our Privacy Policy |
| **Dispute resolution** | As set out in the Governing Law section |`,
  },
  {
    id: 'governing-law',
    title: 'Governing Law, Jurisdiction, Notices and Complaints',
    content: `These Terms are governed by the laws of the Republic of South Africa.

**Notices.** Notices to you are validly given if sent to your registered email address or posted to your dashboard, and it is your responsibility to keep that address current. Notices to us must be sent to pewpew@gunx.co.za and, where the notice concerns legal proceedings, delivered to 11 Howe Street, Observatory, Western Cape, 7925.

If you have a complaint, please raise it with us first at support@gunx.co.za. We will acknowledge it within 2 business days and respond substantively within 15 business days.

Disputes are subject to the jurisdiction of the South African courts. You consent, in terms of section 45 of the Magistrates' Courts Act 32 of 1944, to the jurisdiction of the Magistrates' Court having jurisdiction over you in respect of any claim, notwithstanding that the amount may exceed that court's ordinary jurisdiction. Nothing in this clause limits your right to bring proceedings in any other court of competent jurisdiction, or to refer a matter to the National Consumer Commission or any tribunal or ombud with jurisdiction.

If any provision is found unenforceable, the remaining provisions continue in force. Our failure to enforce a right is not a waiver of it.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `**GX SA (Pty) Ltd**

Registration number 2025/830094/07

11 Howe Street, Observatory, Western Cape, 7925

Telephone: 061 432 5574

General support: support@gunx.co.za

Legal notices and takedowns: pewpew@gunx.co.za`,
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      titleLead="Terms of"
      titleAccent="Use"
      version="3.0"
      updatedLabel="Effective"
      updated="1 September 2026"
      intro="The rules that govern your use of the Gun X platform, your listings, and your dealings with other users."
      notice={NOTICE}
      sections={SECTIONS}
      draftNotice
    />
  );
}
