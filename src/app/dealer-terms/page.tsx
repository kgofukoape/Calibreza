'use client';

import LegalDoc, { LegalSection } from '@/components/LegalDoc';

// ─── DEALER AGREEMENT ────────────────────────────────────────────────────────
// Version 3.0, effective 1 September 2026.
//
// REACTIVATION FEE. The draft carried R250 in two places and offered counsel a
// choice between capping the fee at actual cost (Alternative A) and a flat
// figure (Alternative B). The client elected a flat R350, so Alternative B is
// used at R350 and both references are aligned — the notice at the head of the
// document and the reactivation clause previously disagreed with each other.
//
// The sentence explaining that the fee recovers administrative cost and is not
// a penalty is retained. Under sections 48 and 51 of the Consumer Protection
// Act the onus is on us to show the charge is not unfair or unreasonable, and
// stating what it is for is the first part of that. Keep a record of what
// reactivation actually costs in admin time.
//
// legal@gunx.co.za replaced throughout with pewpew@gunx.co.za.
// The [For counsel] notes are not published.

const NOTICE = `**This Agreement contains provisions that limit our liability to you, that require you to accept certain risks, and that require you to indemnify us. They appear in the Liability and Indemnity section.**

**The Licence Validity section provides that if your firearms dealer licence lapses, your listings will be suspended, that your subscription continues to run during that suspension, and that a reactivation fee of R350 (including VAT) is payable when your account is restored. Please read that section in full before you subscribe.**

**Take the time you need to consider these terms. If anything is unclear, ask us at support@gunx.co.za before you subscribe.**`;

const SECTIONS: LegalSection[] = [
  {
    id: 'scope',
    title: 'Scope of This Agreement',
    content: `This Dealer Agreement governs the relationship between GX SA (Pty) Ltd, registration number 2025/830094/07 ("**Gun X**", "**we**", "**us**") and any business that applies for or holds a dealer account on the Gun X platform ("**Dealer**", "**you**").

It applies in addition to our Terms of Use, Privacy Policy, POPI Act Notice and Legal Disclaimer. Where this Agreement and any of those documents conflict on a dealer-specific matter, **this Agreement prevails**, save that nothing in this Agreement limits any right you have under the Consumer Protection Act 68 of 2008 that cannot lawfully be limited.

By submitting a dealer application you confirm that you have read and accept this Agreement.

We may update this Agreement. The version in force when you subscribe or renew governs that period. Material changes will be notified to you by email and dashboard notice not less than 30 days before they take effect, and you may cancel before they apply to you if you do not accept them.`,
  },
  {
    id: 'eligibility',
    title: 'Eligibility and Verification',
    content: `Dealer accounts are available to businesses lawfully entitled to trade in firearms, ammunition, accessories or related goods and services in South Africa.

As part of your application you will be asked to provide your company registration details, your SAPS dealer licence number, a copy of the licence certificate, **the expiry date of that licence**, proof of business registration, and identification for the responsible person. We use these to verify that your business is what it claims to be.

You warrant that all documents and information you provide are true, current and lawfully held by you.

**You must tell us within 5 business days if your licensing status changes, lapses, is suspended, is withdrawn, or becomes the subject of an enquiry or proceeding by SAPS or the Central Firearms Registry.** You must tell us within the same period if the responsible person changes or if your business ceases to trade.

We may approve, decline or revoke a dealer account at our reasonable discretion, including where verification cannot be completed or where licensing status is in doubt.`,
  },
  {
    id: 'not-endorsement',
    title: 'Approval Is Not Endorsement',
    content: `Approval of a dealer account means we have completed our own reasonable checks and granted access to dealer features. It is not a warranty by Gun X as to your licensing, solvency, conduct or the quality of your goods.

Any verification badge or similar indicator reflects the checks we performed at the time and the licence expiry date you gave us. It does not transfer legal responsibility for your business to us, and buyers remain responsible for their own due diligence.`,
  },
  {
    id: 'licence-validity',
    title: 'Licence Validity, Expiry and Reactivation',
    content: `> **Please read this section carefully before you subscribe. It provides for the suspension of your listings and for a reactivation fee.**

**Why this exists.** A dealer whose firearms dealer licence has lapsed may not lawfully trade in firearms. We cannot carry dealer listings for a business that is not lawfully entitled to trade, and we will not do so.

**Recording the expiry date.** You must give us the expiry date of your dealer licence when you apply, and an updated date and certificate each time it is renewed. Keeping that date current in your dashboard is your responsibility.

**Reminders.** As a courtesy, we will send reminders to your registered email address and dashboard at approximately 60, 30 and 7 days before the recorded expiry date. These reminders are a convenience only. **We are not responsible for your licence renewal, and a failure by us to send a reminder does not excuse trading without a valid licence, extend any deadline, or give rise to any claim against us.**

**Pending renewal.** If you have lodged a renewal application with the Central Firearms Registry before your licence expires, upload proof of lodgement to your dashboard. On receipt of that proof we will place your account in **Pending Renewal** status, and your listings will remain published while the application is pending, unless we are told by a competent authority that they must not be. You must give us the outcome within 5 business days of receiving it.

**Lapse suspension.** If your recorded licence expiry date passes and we have neither an updated certificate nor proof of lodgement, we will place your account in **Lapse Suspension**. On suspension:

- your dealer listings are unpublished — **they are not deleted**, and are retained for restoration for 90 days;
- your dealer profile is hidden from the directory and any verification badge is removed;
- you keep access to your dashboard, your data and your enquiry history;
- you cannot publish new listings or receive new enquiries.

We will tell you in writing, at the time, that your account has been suspended and why.

**Lapse Suspension is applied automatically** when the recorded expiry date passes without an updated certificate or proof of lodgement on file. No person at Gun X reviews it before it takes effect. You may at any time upload the missing document, which lifts the suspension, and you may require a person at Gun X to review the suspension by writing to support@gunx.co.za; we will complete that review within 2 business days and tell you the outcome.

**Your subscription continues.** Lapse Suspension ordinarily arises from a matter within your control. **Your subscription continues to run and continues to be charged during Lapse Suspension**, unless you cancel it.

**This does not apply where the lapse falls within the exceptions below** — where it arose from our error or a systems failure on our side, where you lodged a renewal with the Central Firearms Registry before expiry and the delay is the Registry's, or where your licence was reinstated on review or appeal. In those cases no reactivation fee is charged and we will also credit the subscription for the period of the suspension.

**Reactivation and the reactivation fee.** To restore a suspended account, upload a valid current licence certificate. We will re-verify it and restore your listings within 5 business days of receiving a complete submission.

A **reactivation fee of R350 (including VAT)** is payable on restoration. **This fee is a recovery of our administrative cost of manually re-verifying your licence and restoring your listings and directory entry. It is not a penalty, and it is not a charge for the period of suspension.** We will review the fee from time to time against our actual cost and any change will be made on the notice described in the Subscription Plans section.

**When the fee is not charged.** The reactivation fee is **not** payable where:

- the lapse or suspension arose from our error, or from a failure in our reminder or verification systems;
- you lodged a renewal application with the Central Firearms Registry before expiry and can evidence it, and the delay in issue is attributable to the Registry, whether or not you uploaded proof of lodgement before the expiry date;
- your licence was suspended or withdrawn and subsequently reinstated on review or appeal, and you can evidence that; or
- we waive it in our discretion.

**Prolonged lapse.** If an account remains in Lapse Suspension for more than 90 days, we may terminate it and delete the suspended listings. We will give you 14 days' written notice before doing so, and will provide an export of your listing data on request.

**Your independent obligation.** Nothing in this section reduces your own obligation to hold a valid licence at all times, to cease trading if it lapses, and to comply with the Firearms Control Act 60 of 2000.`,
  },
  {
    id: 'obligations',
    title: 'Your Obligations',
    content: `As a Dealer you must at all times:

- Hold and maintain every licence, permit and registration required to conduct your business under the Firearms Control Act 60 of 2000 and any other applicable law.
- Ensure every listing is accurate, lawful, and reflects stock you are genuinely able to supply.
- Complete every transfer of a regulated item strictly through lawful dealer and SAPS processes. The Platform is for advertising and connection only — it is not a mechanism for transferring regulated items.
- Deal fairly and honestly with buyers, including honouring advertised prices and described conditions, and responding to enquiries within a reasonable time.
- Comply with the Consumer Protection Act 68 of 2008 in your dealings with consumers.
- Keep your account details and staff access secure, and remove access for staff who leave.

You must not use the Platform to advertise items you cannot lawfully supply, to circumvent regulatory process, or to route buyers to off-platform arrangements designed to avoid lawful checks.

**Cooperation with authorities.** We will cooperate fully with the South African Police Service, the Central Firearms Registry and any other competent authority, including by providing your account data, listing records and transaction records, where we are lawfully required to do so or where we reasonably suspect a contravention of the FCA or other law. We may suspend a dealer account pending verification of licensing status or the outcome of an enquiry by a competent authority.`,
  },
  {
    id: 'subscriptions',
    title: 'Subscription Plans and Fees',
    content: `Dealer plans, their inclusions and their prices are those published on the dealer pricing page at the time you subscribe. Prices are in South African Rand and include VAT where applicable.

Paid plans are recurring monthly subscriptions. Payment is collected through our payment provider. Your plan renews automatically each month until cancelled.

We may change plan pricing, inclusions or the reactivation fee. Where a change affects an active subscription, we will give you not less than 30 days' written notice before it applies to you, and you may cancel before the change takes effect if you do not accept it.

> **Immediate commencement.** When you subscribe, you are asked to confirm that you want your dealer features to start immediately. If you give that confirmation and the features are made available, any right you may have to cancel the transaction within seven days under section 44 of the Electronic Communications and Transactions Act 25 of 2002 falls away in respect of that period. If you do not want your features to start immediately, do not give that confirmation — contact us at support@gunx.co.za instead.`,
  },
  {
    id: 'changes',
    title: 'Upgrades, Downgrades and Cancellation',
    content: `You may request an upgrade, downgrade or cancellation at any time from your dealer dashboard or by emailing support@gunx.co.za. We will action a cancellation request within 2 business days of receiving it.

Upgrades take effect once the new plan is active. Downgrades and cancellations take effect at the end of the current paid billing period — you keep the features you have paid for until that period ends.

We will not knowingly run two overlapping paid subscriptions on the same dealer account. If a duplicate or overlapping charge occurs through error, tell us at support@gunx.co.za. Where we confirm the error, **we will correct it and refund the amount incorrectly taken, by the same method by which it was paid, within 14 business days of verification**, and we will tell you in writing when the refund has been processed.

On cancellation your dealer features end at the end of the paid period and your account reverts to the free tier. Listings in excess of the free tier allowance may be unpublished; they are retained for 90 days and are restored if you resubscribe within that period.`,
  },
  {
    id: 'content',
    title: 'Your Listings and Content',
    content: `You retain ownership of your logos, images, descriptions and other content. You grant us a non-exclusive, royalty-free, South Africa-wide licence to display and reasonably promote that content on the Platform while it remains published.

Where, before your content was unpublished, we had already incorporated it into promotional or advertising material that had been produced or distributed, the licence continues for that material only, for so long as it remains in circulation, and for archival copies.

You confirm you hold the rights to everything you upload, including photographs and manufacturer imagery.

We may edit, decline, suspend or remove any listing that we reasonably believe breaches this Agreement, our Terms of Use, or the law. Moderating listings does not make us the author or publisher of them.`,
  },
  {
    id: 'data-protection',
    title: 'Data Protection',
    content: `Where you receive personal information about buyers through the Platform — names, contact details, enquiry content — **you are a responsible party in your own right** in respect of that information, and you are responsible for handling it lawfully under the Protection of Personal Information Act 4 of 2013.

You must use enquiry data only to respond to that enquiry and to conduct the resulting transaction. You may not add Platform users to marketing lists without their consent, sell or share their information, or retain it longer than you lawfully need it.

You must notify us within 24 hours if you become aware of a security compromise affecting personal information you obtained through the Platform. **The duty to notify the Information Regulator and the affected data subjects under section 22 of POPIA is your own, because you hold that information as a responsible party in your own right.** We require notice to us so that we can assess whether the compromise also affects information we hold, warn other users if necessary, and respond to any enquiry from the Regulator.

You indemnify us against any claim, fine or penalty arising from your own unlawful processing of personal information obtained through the Platform, save to the extent it arises from our gross negligence or wilful misconduct.`,
  },
  {
    id: 'reviews',
    title: 'Reviews and Ratings',
    content: `Where the Platform carries buyer reviews of dealers, we publish them as submitted. We do not remove a review merely because it is unfavourable. We will remove a review that is unlawful, that is not based on a genuine dealing, or that breaches our content rules, and you may report a review to us at support@gunx.co.za. We will respond to a report within 5 business days.`,
  },
  {
    id: 'fair-use',
    title: 'Fair Use and Platform Integrity',
    content: `You may not scrape, harvest or bulk-extract Platform data, manipulate search rankings, create multiple accounts to circumvent listing limits, or post duplicate listings across accounts.`,
  },
  {
    id: 'suspension',
    title: 'Suspension and Termination',
    content: `We may suspend or terminate a dealer account where you breach this Agreement or the law, where your licensing status lapses or is withdrawn, where we reasonably suspect fraudulent or unlawful activity, or where required by a competent authority.

**Where we suspend or terminate your account, we will notify you of the reason for that action, in writing, via your registered email address or your dashboard, within 2 business days.** We may withhold reasons only where we are prohibited by law from giving them, where a competent authority has directed us not to, or where giving them would compromise the security of the Platform or an ongoing investigation — and in that case we will tell you that reasons are being withheld and why, to the extent we lawfully may.

Where we suspend an account for a reason that is not your fault, we will not charge you for the period of suspension and will credit any amount already charged for it.

A Lapse Suspension ordinarily falls outside that rule, because it arises from a matter within your control. **It does not fall outside that rule, and we will credit the subscription for the period of suspension, where the lapse or suspension arose from our error or a failure in our systems, where you lodged a renewal with the Central Firearms Registry before expiry and the delay in issue is the Registry's, or where your licence was suspended or withdrawn and later reinstated on review or appeal.**

You may terminate by cancelling your subscription and closing your account. Fees already paid for a commenced period are not automatically refundable except where the law requires it.`,
  },
  {
    id: 'liability',
    title: 'Liability and Indemnity',
    content: `> **This clause limits our liability to you, records risks you accept, and requires you to indemnify us. Please read it carefully.**

Gun X provides an advertising and directory platform. We are not a party to any sale between you and a buyer and give no warranty as to leads, sales volumes or business outcomes.

To the maximum extent permitted by law, our total liability to you in respect of any claim or series of related claims is limited to the subscription fees you paid us in the three months preceding the claim.

**Except to the extent that the claim, loss or expense arises from our own gross negligence or wilful misconduct**, you indemnify GX SA (Pty) Ltd, its directors, employees and agents against any claim, loss or expense arising from your listings, your dealings with buyers, your breach of this Agreement, or your contravention of any law.

We will notify you promptly of any claim to which this indemnity may apply, will not settle it without consulting you, and will allow you a reasonable opportunity to participate in its defence.

**Nothing in this Agreement excludes or limits:**

- **our liability for our own gross negligence or wilful misconduct;**
- **our liability for death or personal injury caused by our negligence;**
- **our liability for fraud or fraudulent misrepresentation; or**
- **any other liability that cannot lawfully be excluded or limited under South African law, including under the Consumer Protection Act 68 of 2008 where it applies to you.**`,
  },
  {
    id: 'notices',
    title: 'Notices',
    content: `Notices to you are validly given if sent to your registered email address or posted to your dealer dashboard. Notices to us must be sent to pewpew@gunx.co.za and, where the notice concerns legal proceedings, delivered to 11 Howe Street, Observatory, Western Cape, 7925.`,
  },
  {
    id: 'governing-law',
    title: 'Governing Law, Jurisdiction and Disputes',
    content: `This Agreement is governed by the laws of the Republic of South Africa.

If a dispute arises, the parties will first attempt in good faith to resolve it by discussion between senior representatives within 15 business days of written notice of the dispute. This does not prevent either party from seeking urgent interim relief.

Disputes are subject to the jurisdiction of the South African courts. You consent, in terms of section 45 of the Magistrates' Courts Act 32 of 1944, to the jurisdiction of the Magistrates' Court having jurisdiction over you in respect of any claim arising from this Agreement, notwithstanding that the amount may exceed that court's ordinary jurisdiction. Nothing in this clause limits any right you have to refer a matter to the National Consumer Commission or to a tribunal or ombud with jurisdiction.

If any provision is found unenforceable the rest remains in force.`,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: `**GX SA (Pty) Ltd**

Registration number 2025/830094/07

Registered office: 11 Howe Street, Observatory, Western Cape, 7925

Dealer support: support@gunx.co.za

Legal notices: pewpew@gunx.co.za`,
  },
];

export default function DealerTermsPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      titleLead="Dealer"
      titleAccent="Agreement"
      version="3.0"
      updatedLabel="Effective"
      updated="1 September 2026"
      intro="The terms that apply to businesses holding a dealer account on Gun X, including verification, licence validity, subscriptions and obligations."
      notice={NOTICE}
      sections={SECTIONS}
      draftNotice
    />
  );
}
