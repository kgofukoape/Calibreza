'use client';

import LegalDoc, { LegalSection } from '@/components/LegalDoc';

// ─── TAKEDOWN NOTIFICATION PROCEDURE ─────────────────────────────────────────
// Version 2.0, effective 1 September 2026.
//
// Two editorial decisions carried over from the source document:
//
// ISPA. The draft carried an optional paragraph claiming membership of the
// Internet Service Providers' Association. GX SA is not a member, so it is
// omitted rather than softened. Section 72 of ECTA limits the Chapter XI
// liability protections to members of a recognised industry representative
// body — claiming an association we do not have would be worse than useless.
//
// Designated agent. None appointed, so notifications go to the Information
// Officer. The placeholder is removed rather than published empty.
//
// Contact addresses: legal@gunx.co.za does not exist; every reference points to
// pewpew@gunx.co.za, which does.

const SECTIONS: LegalSection[] = [
  {
    id: 'purpose',
    title: 'Purpose',
    content: `Gun X hosts content created by its users. We do not create that content and we do not monitor it generally. Where content on the Platform is unlawful, this procedure is how you tell us, and it sets out what we will do.

This procedure is written to align with the requirements of section 77 of the Electronic Communications and Transactions Act 25 of 2002 ("**ECTA**").`,
  },
  {
    id: 'report',
    title: 'If You Only Want to Report Something',
    content: `You do not have to use this formal procedure to bring a problem to our attention. Every listing carries a **Report** function, and you can email pewpew@gunx.co.za at any time. We look at every report.

Use the formal procedure below where you are asserting that content is unlawful and you want us to act on that basis.`,
  },
  {
    id: 'where',
    title: 'Where to Send a Notification',
    content: `**Email:** pewpew@gunx.co.za

**Post or delivery:** The Information Officer, GX SA (Pty) Ltd, 11 Howe Street, Observatory, Western Cape, 7925`,
  },
  {
    id: 'contents',
    title: 'What a Notification Must Contain',
    content: `A notification must be in writing, must be addressed to us, and must include all of the following:

1. Your **full names and address**.
2. Your **written or electronic signature**.
3. **Identification of the right** that you say has been infringed.
4. **Identification of the material or activity** you say is unlawful — for Gun X, please give the listing URL or listing reference number, and the username where you know it.
5. The **remedial action** you require us to take.
6. Your **telephonic and electronic contact details**.
7. A statement that you are **acting in good faith**.
8. A statement that the information in the notification is, **to your knowledge, true and correct**.

An incomplete notification is not a valid notification. If yours is incomplete we will tell you which items are missing so that you can resubmit.

> **Warning.** Under section 77(2) of ECTA, a person who lodges a notification of unlawful activity knowing that it materially misrepresents the facts is liable for damages for wrongful takedown. Do not use this procedure to remove a competitor's listing, to settle a dispute about an item's condition, or to suppress a lawful but unfavourable review.`,
  },
  {
    id: 'process',
    title: 'What We Do When We Receive One',
    content: `| Step | Timing |
|---|---|
| We acknowledge receipt | Within 2 business days |
| We check the notification is complete, and tell you if it is not | Within 2 business days |
| We assess the content complained of, and act on it — removing or disabling access to the content, or declining and telling you why | Expeditiously, and in any event within 5 business days of receiving a complete notification |
| We notify the user whose content is affected | At the time we act, unless prohibited by law or directed otherwise by a competent authority |

Where content appears to involve an immediate risk to safety, a stolen firearm, or a serious offence, we act immediately and report the matter to SAPS without waiting for the periods above.

The periods above are outer limits, not targets. Where the unlawfulness is apparent on the face of the notification we act at once. We record the date and time of receipt of every notification, because the obligation to act expeditiously runs from the moment we acquire actual knowledge, not from the expiry of any period stated here.`,
  },
  {
    id: 'limits',
    title: 'What We Do Not Do',
    content: `We do not adjudicate disputes between users. We are not a court and we do not decide who is right about ownership, defamation, or the condition of an item. Where a matter is genuinely contested and not obviously unlawful, we may decline to act and refer both parties to the appropriate forum.

We do not remove content merely because it is unfavourable, embarrassing or commercially inconvenient to the complainant.

We are under no general obligation to monitor the content we host or to actively seek facts indicating unlawful activity. Acting on a notification does not create such an obligation and does not make us the author or publisher of user content.`,
  },
  {
    id: 'removed',
    title: 'If Your Content Is Removed',
    content: `If we remove or disable access to your content following a notification, we will tell you, and we will give you the substance of the complaint, unless we are prohibited by law from doing so or a competent authority directs otherwise.

You may respond at pewpew@gunx.co.za. If you satisfy us that the content is lawful, we will restore it. If the matter remains contested, we may leave the content disabled pending resolution between you and the complainant, and either of you may take the matter to a court of competent jurisdiction.`,
  },
  {
    id: 'firearms',
    title: 'Firearms-Specific Reports',
    content: `If you believe a listing offers a **stolen, unlicensed, illegally modified or prohibited item**, or that a user is attempting to arrange a transfer outside lawful process:

1. Report it immediately using the Report function or to pewpew@gunx.co.za, marking it **URGENT — FCA**.
2. Report it to SAPS. We will do the same.
3. Do not attempt to arrange an inspection or a meeting in order to gather evidence yourself.

We will preserve the listing record and associated account data for the purposes of any investigation, and will provide it to SAPS or the Central Firearms Registry on lawful request.`,
  },
  {
    id: 'records',
    title: 'Records',
    content: `We keep a record of every notification received, the assessment made, the action taken and the date, for 5 years.`,
  },
];

export default function TakedownPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      titleLead="Takedown"
      titleAccent="Procedure"
      version="2.0"
      updatedLabel="Effective"
      updated="1 September 2026"
      intro="How to notify us of unlawful content on the Platform, and what we do when you do."
      sections={SECTIONS}
      draftNotice
    />
  );
}
