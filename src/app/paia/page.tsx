'use client';

import LegalDoc, { LegalSection } from '@/components/LegalDoc';

// ─── PAIA MANUAL ─────────────────────────────────────────────────────────────
// Version 2.0, effective 1 September 2026.
//
// Required by section 51 of the Promotion of Access to Information Act 2 of
// 2000, and also carries the information required by section 17 of POPIA.
//
// Filled from the approved draft: Information Officer Kgofu Koape, no deputy
// designated, telephone 061 432 5574.
//
// The [For counsel] notes in the source document are drafting instructions to
// the attorney and are not published here. They remain in the markdown copy.
//
// NOTE: PAIA section 51 requires the manual to state a physical and postal
// address, so 11 Howe Street appears here even though it has been removed from
// the rest of the site. If a commercial address is obtained, it changes here,
// in the POPI Notice, the Terms, the Disclaimer and the Dealer Agreement.

const SECTIONS: LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: `The Promotion of Access to Information Act 2 of 2000 ("**PAIA**") gives effect to the constitutional right of access to information held by the State and to information held by another person that is required for the exercise or protection of any rights.

This manual is compiled in terms of section 51 of PAIA. It explains what records GX SA (Pty) Ltd holds and how to request access to them. It also records the information required by section 17 of the Protection of Personal Information Act 4 of 2013 ("**POPIA**").

This manual is available:

- on our website at gunx.co.za/paia;
- at our registered office during normal business hours; and
- on request, at the prescribed fee for reproduction where applicable.`,
  },
  {
    id: 'particulars',
    title: 'Particulars of the Private Body',
    content: `| | |
|---|---|
| **Name** | GX SA (Pty) Ltd |
| **Trading as** | Gun X / Calibreza |
| **Registration number** | 2025/830094/07 |
| **Registered and physical address** | 11 Howe Street, Observatory, Western Cape, 7925 |
| **Postal address** | 11 Howe Street, Observatory, Western Cape, 7925 |
| **Telephone** | 061 432 5574 |
| **Website** | gunx.co.za |
| **Email** | support@gunx.co.za |

**Information Officer:** Kgofu Koape, in that person's capacity as head of the private body

**Deputy Information Officer:** None designated

**Email for PAIA requests:** support@gunx.co.za, subject line "**PAIA Request**"`,
  },
  {
    id: 'guide',
    title: 'Guide of the Information Regulator',
    content: `The Information Regulator has compiled a guide, in terms of section 10 of PAIA, containing information to assist a person wishing to exercise a right under the Act. The guide is available in each official language from the Information Regulator:

Information Regulator (South Africa)
JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001
PO Box 31533, Braamfontein, Johannesburg, 2017
Website: inforegulator.org.za`,
  },
  {
    id: 'no-request',
    title: 'Records Available Without a Request',
    content: `The following are freely available on gunx.co.za and do not require a formal request:

- Terms of Use, Privacy Policy, POPI Act Notice, Legal Disclaimer, Advertising Policy, Dealer Agreement and Takedown Notification Procedure
- Pricing pages for dealer, club, range, service-provider and advertising products
- Public listings, dealer profiles and directory entries
- This manual

A registered user may also access, without a formal request, their own account information, listing history, enquiry history and invoices, through their dashboard.`,
  },
  {
    id: 'other-legislation',
    title: 'Records Accessible Under Other Legislation',
    content: `Section 51(1)(c) of PAIA requires this manual to describe the records held that are accessible without a PAIA request because other legislation provides for access to them. The following categories are, or may be, accessible in that way to the persons entitled to them:

| Legislation | Records, and who may access them |
|---|---|
| Companies Act 71 of 2008 | Memorandum of incorporation, securities register, register of directors, annual financial statements, minutes of shareholder meetings — accessible to shareholders, directors and, in defined respects, members of the public |
| Basic Conditions of Employment Act 75 of 1997; Labour Relations Act 66 of 1995; Employment Equity Act 55 of 1998 | Employment contracts, payroll and attendance records, disciplinary records, employment equity records — accessible to the employee concerned, to a trade union representative in defined circumstances, and to the Department of Employment and Labour |
| Income Tax Act 58 of 1962; Tax Administration Act 28 of 2011; Value-Added Tax Act 89 of 1991 | Tax, VAT and PAYE records — accessible to the South African Revenue Service |
| Protection of Personal Information Act 4 of 2013 | A data subject's own personal information — dealt with under our POPI Act Notice |
| Firearms Control Act 60 of 2000 | Dealer, club, range and service-provider licence records held by us — accessible to the South African Police Service and the Central Firearms Registry on lawful request |
| Consumer Protection Act 68 of 2008 | Transaction records, sales records and marketing records — accessible to the National Consumer Commission on lawful request |

**Notice under section 52(2).** GX SA (Pty) Ltd has not published a notice under section 52(2) of PAIA listing categories of records automatically available without a request. The records listed above are made available voluntarily and their availability does not constitute such a notice.`,
  },
  {
    id: 'records-held',
    title: 'Records Held, by Category',
    content: `This is a description of categories of records held. It is not an undertaking that access will be granted; access is determined in accordance with Chapter 4 of Part 3 of PAIA.

| Subject | Categories of records |
|---|---|
| **Company and statutory** | Memorandum of incorporation, CIPC records, share register, director and officer records, minutes and resolutions |
| **Financial** | Annual financial statements, management accounts, bank records, invoices, tax records, VAT and PAYE records |
| **Personnel** | Employment contracts, personnel records, payroll, leave and disciplinary records, employment equity records where applicable |
| **User and account** | Registration records, profile data, listing records, enquiry and message records, moderation and suspension records |
| **Dealer, club, range and service provider** | Applications, company registration documents, SAPS licence certificates and expiry dates, verification records, subscription and billing records |
| **Commercial and contractual** | Supplier and service-provider agreements, operator agreements, data processing agreements, advertising bookings and insertion orders |
| **Technical and operational** | System architecture documentation, source code, access logs, security logs, incident records, backup records |
| **Compliance** | POPIA compliance records, records of data subject requests, breach records, takedown notifications and outcomes, correspondence with SAPS, the Central Firearms Registry and the Information Regulator |
| **Marketing** | Marketing consent records, campaign material, analytics reports |`,
  },
  {
    id: 'popia-17',
    title: 'Information Required by Section 17 of POPIA',
    content: `| | |
|---|---|
| **Purpose of processing** | Operating an online classifieds and directory platform for the licensed South African firearms community; verifying business users; taking payment; complying with legal obligations; securing the platform |
| **Categories of data subject** | Registered users, dealers and their responsible persons, clubs and ranges, service providers, advertisers, job applicants, employees, suppliers |
| **Categories of personal information** | As set out in clause 2.2 of our Privacy Policy |
| **Recipients** | As set out in clause 2.6 of our Privacy Policy |
| **Cross-border transfers** | As set out in clause 2.8 of our Privacy Policy |
| **Retention** | As set out in clause 2.7 of our Privacy Policy |
| **Security measures** | As set out in clause 2.11 of our Privacy Policy |`,
  },
  {
    id: 'how-to-request',
    title: 'How to Request Access to a Record',
    content: `1. Complete **Form 2** of the PAIA Regulations (request for access to record of private body). The form is available from inforegulator.org.za and from us on request.
2. Send it to support@gunx.co.za with the subject line "PAIA Request", or deliver it to the registered office.
3. Provide sufficient particulars for us to identify the record and to identify you, the form of access required, and your contact details.
4. **If you are requesting the record for the exercise or protection of a right, identify that right and explain why the record is required to exercise or protect it.** This is a requirement of section 53(2)(d) of PAIA. A request that does not do so may be refused, and we will tell you what is missing before we decide.
5. If you are making the request on behalf of someone else, submit proof of your authority.`,
  },
  {
    id: 'fees',
    title: 'Fees',
    content: `Two fees may apply, as prescribed by regulation under PAIA:

- a **request fee**, payable before a request is processed; and
- an **access fee**, calculated on the reproduction, search and preparation time involved, payable before access is given.

We will notify you of the amount payable, and you may lodge an internal appeal or a complaint against the amount. No request fee is payable by a personal requester seeking a record containing their own personal information.`,
  },
  {
    id: 'decision',
    title: 'Our Decision',
    content: `We will decide on a request within **30 days** of receiving it, and will notify you of the decision in writing. Where the request is for a large number of records or requires a search through records at another location, we may extend that period once, by not more than a further 30 days, and will tell you before the first period expires.

If we grant the request, we will tell you the access fee, the form of access and your right to lodge a complaint with the Information Regulator or an application with a court against the fee or the form of access.

If we refuse the request, we will tell you the reasons and the provisions of PAIA relied on, and inform you of your right to lodge a complaint with the Information Regulator or to apply to a court.`,
  },
  {
    id: 'refusal',
    title: 'Grounds on Which Access May Be Refused',
    content: `Access may or must be refused on the grounds set out in Chapter 4 of Part 3 of PAIA, including:

- mandatory protection of the privacy of a third party who is a natural person (section 63);
- mandatory protection of the commercial information of a third party (section 64);
- mandatory protection of confidential information of a third party (section 65);
- mandatory protection of the safety of individuals and of property (section 66);
- protection of records privileged from production in legal proceedings (section 67);
- protection of the commercial activities of the private body, including trade secrets and information that would put it at a disadvantage in negotiations or prejudice it in commercial competition (section 68);
- protection of research information (section 69); and
- manifestly frivolous or vexatious requests, or those involving a substantial and unreasonable diversion of resources (section 45).

Access must nonetheless be granted where section 70 applies (public interest override).

> **Section 66 is of particular relevance to this private body.** We will refuse access to any record that could reasonably be expected to endanger the life or physical safety of an individual, or to prejudice or impair the security of property — including records that would reveal where a firearm is kept, the identity or address of a licence holder, or the security arrangements of a dealer, club or range.`,
  },
  {
    id: 'remedies',
    title: 'Remedies',
    content: `There is no internal appeal against a decision of a private body.

If you are dissatisfied with a decision we take on your request — including a refusal, the amount of a fee, the form of access given, or a failure by us to decide within the period allowed — you may lodge a complaint with the Information Regulator in the prescribed form. A complaint must be lodged within 180 days of the decision or of the event complained of.

You may also apply to a court, as provided for in Chapter 2 of Part 4 of PAIA, within 180 days.`,
  },
  {
    id: 'availability',
    title: 'Availability and Updates',
    content: `This manual is updated as necessary and at least annually. The current version and date appear at the top.

The manual is made available on our website, at our registered office during normal business hours, and to the Information Regulator. Where a person requires it in a form other than the published one, or requires assistance in making a request, they may ask us at support@gunx.co.za.`,
  },
];

export default function PaiaPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      titleLead="PAIA"
      titleAccent="Manual"
      version="2.0"
      updatedLabel="Effective"
      updated="1 September 2026"
      intro="Manual in terms of section 51 of the Promotion of Access to Information Act 2 of 2000."
      sections={SECTIONS}
      draftNotice
    />
  );
}
