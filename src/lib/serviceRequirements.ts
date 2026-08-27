// ─── SERVICE CATEGORY DOCUMENT REQUIREMENTS ──────────────────────────────────
// What a service provider must produce depends entirely on what they do. A
// gunsmith and a security company are regulated under different Acts by
// different bodies, and asking both for the same paperwork is simultaneously
// annoying for them and useless to you.
//
// One list per category, so the application form asks for what is actually
// relevant and you can tell at a glance whether an applicant has produced it.
//
// A NOTE ON THE LEGAL BASIS
// The requirements below reflect the ordinary position under South African law
// as at 2026. They are the documents a legitimate provider in each category
// will already hold — not an interpretation you should rely on without your
// attorney confirming it, particularly for training accreditation, where the
// SAPS, PFTC and SASSETA requirements overlap and change.
//
// The distinction that matters most is between MUST and SHOULD:
//
//   required: true   The provider cannot lawfully trade without it. Approving
//                    them without sight of it puts your buyers in front of
//                    someone operating illegally, and puts you in front of the
//                    question of what checks you did.
//
//   required: false  Useful evidence of competence, not a licence to operate.

export interface RequiredDocument {
    key: string;
    label: string;
    /** What it is and why you are asking. Shown to the applicant. */
    help: string;
    required: boolean;
    /** The body that issues it, so an applicant knows where to look. */
    issuer?: string;
  }
  
  export interface CategoryRequirements {
    id: string;
    label: string;
    /** One line explaining the regulatory position for this category. */
    basis: string;
    documents: RequiredDocument[];
  }
  
  /** Every applicant provides these, whatever they do. */
  export const UNIVERSAL_DOCUMENTS: RequiredDocument[] = [
    {
      key: 'business_registration',
      label: 'Business Registration',
      help: 'CIPC registration certificate, CK document, or proof of sole proprietorship.',
      required: true,
      issuer: 'CIPC',
    },
    {
      key: 'id_document',
      label: 'ID of Responsible Person',
      help: 'South African ID or passport of the person accountable for this account.',
      required: true,
    },
  ];
  
  export const CATEGORY_REQUIREMENTS: Record<string, CategoryRequirements> = {
  
    gunsmith: {
      id: 'gunsmith',
      label: 'Gunsmithing & Customisation',
      basis:
        'Working on a firearm belonging to someone else generally requires a gunsmith licence under the Firearms Control Act. A gunsmith without one cannot lawfully take possession of a client\'s firearm.',
      documents: [
        {
          key: 'gunsmith_licence',
          label: 'Gunsmith Licence',
          help: 'Your SAPS gunsmith licence. Required to take possession of a client\'s firearm for repair or modification.',
          required: true,
          issuer: 'SAPS / Central Firearms Registry',
        },
        {
          key: 'premises_certificate',
          label: 'Premises Compliance Certificate',
          help: 'Certificate for the premises where firearms are worked on and stored.',
          required: false,
          issuer: 'SAPS',
        },
      ],
    },
  
    training: {
      id: 'training',
      label: 'Training & Instruction',
      basis:
        'Competency training that counts towards a firearm licence must be delivered by an accredited provider. Training that does not count towards a licence — private coaching, competition work — does not require accreditation, but the distinction should be clear to the buyer.',
      documents: [
        {
          key: 'saps_accreditation',
          label: 'SAPS Training Accreditation',
          help: 'Required if you deliver competency training that counts towards a firearm licence. Not required for private coaching or competition instruction.',
          required: false,
          issuer: 'SAPS',
        },
        {
          key: 'sasseta_accreditation',
          label: 'SASSETA Accreditation',
          help: 'Accreditation to deliver the registered unit standards behind competency certificates.',
          required: false,
          issuer: 'SASSETA',
        },
        {
          key: 'instructor_credentials',
          label: 'Instructor Credentials',
          help: 'Your own instructor qualification or PFTC registration.',
          required: false,
          issuer: 'PFTC or equivalent',
        },
      ],
    },
  
    security: {
      id: 'security',
      label: 'Security Services',
      basis:
        'Rendering a security service for reward without PSIRA registration is a criminal offence under the Private Security Industry Regulation Act. This is the one category where the document is not optional.',
      documents: [
        {
          key: 'psira_certificate',
          label: 'PSIRA Registration Certificate',
          help: 'Your current PSIRA registration. Rendering a security service without it is an offence — we cannot list a security provider who does not hold one.',
          required: true,
          issuer: 'PSIRA',
        },
        {
          key: 'firearm_licences',
          label: 'Business Firearm Licences',
          help: 'Licences for any firearms held by the business, where applicable.',
          required: false,
          issuer: 'SAPS',
        },
      ],
    },
  
    legal: {
      id: 'legal',
      label: 'Legal & Licensing',
      basis:
        'Giving legal advice for reward generally requires admission as a legal practitioner. Motivation writing and administrative assistance do not, but the difference matters to a buyer choosing between them.',
      documents: [
        {
          key: 'lpc_certificate',
          label: 'Legal Practice Council Certificate',
          help: 'Required if you practise as an attorney or advocate. Not required for motivation writing or administrative assistance.',
          required: false,
          issuer: 'Legal Practice Council',
        },
        {
          key: 'professional_indemnity',
          label: 'Professional Indemnity Cover',
          help: 'Evidence of indemnity insurance, where you carry it.',
          required: false,
        },
      ],
    },
  
    logistics: {
      id: 'logistics',
      label: 'Transport & Logistics',
      basis:
        'Transporting firearms for others is a regulated activity. A carrier moving firearms commercially will normally hold both a transport permit and, where firearms are held overnight, safekeeping arrangements.',
      documents: [
        {
          key: 'transport_permit',
          label: 'Firearm Transport Permit',
          help: 'Permit or authorisation for the commercial conveyance of firearms.',
          required: true,
          issuer: 'SAPS',
        },
        {
          key: 'insurance',
          label: 'Goods in Transit Insurance',
          help: 'Cover for firearms while in your custody.',
          required: false,
        },
      ],
    },
  
    range: {
      id: 'range',
      label: 'Storage & Safekeeping',
      basis:
        'Holding someone else\'s firearm in safe custody is regulated. A storage provider is normally a licensed dealer or an approved safekeeping facility.',
      documents: [
        {
          key: 'storage_licence',
          label: 'Dealer or Safekeeping Licence',
          help: 'Authorisation to hold firearms belonging to other people.',
          required: true,
          issuer: 'SAPS',
        },
        {
          key: 'premises_certificate',
          label: 'Premises Compliance Certificate',
          help: 'Certificate for the strongroom or storage facility.',
          required: false,
          issuer: 'SAPS',
        },
      ],
    },
  
    hunting: {
      id: 'hunting',
      label: 'Hunting & Outfitting',
      basis:
        'Professional hunters and outfitters are registered provincially rather than nationally, so the issuing body depends on where you operate.',
      documents: [
        {
          key: 'ph_registration',
          label: 'Professional Hunter Registration',
          help: 'Your provincial professional hunter or outfitter registration.',
          required: false,
          issuer: 'Provincial conservation authority',
        },
      ],
    },
  
    other: {
      id: 'other',
      label: 'Other Services',
      basis:
        'No category-specific licence is assumed. If your service is regulated, upload whatever authorises you to provide it.',
      documents: [
        {
          key: 'relevant_licence',
          label: 'Any Relevant Licence or Accreditation',
          help: 'If your service requires authorisation, upload it here so we can verify it.',
          required: false,
        },
      ],
    },
  };
  
  /** Everything a given category must produce, universal documents included. */
  export function documentsFor(categoryId: string): RequiredDocument[] {
    const cat = CATEGORY_REQUIREMENTS[categoryId] || CATEGORY_REQUIREMENTS.other;
    return [...UNIVERSAL_DOCUMENTS, ...cat.documents];
  }
  
  /** Only those without which the provider cannot lawfully trade. */
  export function mandatoryDocumentsFor(categoryId: string): RequiredDocument[] {
    return documentsFor(categoryId).filter(d => d.required);
  }
  
  export function basisFor(categoryId: string): string {
    return (CATEGORY_REQUIREMENTS[categoryId] || CATEGORY_REQUIREMENTS.other).basis;
  }