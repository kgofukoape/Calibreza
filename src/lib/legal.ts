// ─── LEGAL DOCUMENT REGISTRY ─────────────────────────────────────────────────
// The single place document versions are defined.
//
// Two things read from this file and they must never disagree:
//   1. The legal pages themselves (/terms, /privacy, /popi, ...) display the
//      version and effective date from here.
//   2. The consent record written at signup stores these exact versions.
//
// If the version shown on the page could drift from the version stored against
// a user's consent, the consent record proves nothing — you would be unable to
// say which text a person actually agreed to. Defining both from one constant
// removes that failure mode entirely.
//
// WHEN YOU PUBLISH A NEW VERSION OF A DOCUMENT:
//   • bump `version` and `effective` on that entry
//   • bump CONSENT_BUNDLE_VERSION if the document is part of a consent bundle
//   • existing users are then out of date and can be re-prompted; their old
//     consent rows stay untouched as the record of what they agreed to before.

export type LegalSlug =
  | 'terms'
  | 'privacy'
  | 'popi'
  | 'dealer-terms'
  | 'legal'
  | 'advertising-policy'
  | 'takedown'
  | 'paia';

/**
 * How a document relates to the user.
 *
 * 'agree'       — a contract term the user is bound by. Requires affirmative
 *                 acceptance and is recorded.
 * 'acknowledge' — a notice we are obliged to give. The user is told about it
 *                 and we record that they were, but it is not a contract they
 *                 "agree" to, and processing under it does not rest on consent.
 * 'reference'   — published for anyone who needs it. Not part of signup.
 */
export type LegalRelation = 'agree' | 'acknowledge' | 'reference';

export interface LegalDocument {
  slug: LegalSlug;
  /** Short name used in checkbox copy and consent records. */
  title: string;
  href: string;
  version: string;
  /** Effective date, as displayed on the page. */
  effective: string;
  relation: LegalRelation;
  /** True while the document has not yet been settled by an attorney. */
  draft: boolean;
}

export const LEGAL_DOCUMENTS: Record<LegalSlug, LegalDocument> = {
  terms: {
    slug: 'terms',
    title: 'Terms of Use',
    href: '/terms',
    version: '3.0',
    effective: '1 September 2026',
    relation: 'agree',
    draft: true,
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    href: '/privacy',
    version: '2.0',
    effective: '1 September 2026',
    relation: 'acknowledge',
    draft: true,
  },
  popi: {
    slug: 'popi',
    title: 'POPI Act Notice',
    href: '/popi',
    version: '3.0',
    effective: '1 September 2026',
    relation: 'acknowledge',
    draft: true,
  },
  'dealer-terms': {
    slug: 'dealer-terms',
    title: 'Dealer Agreement',
    href: '/dealer-terms',
    version: '3.0',
    effective: '1 September 2026',
    relation: 'agree',
    draft: true,
  },
  legal: {
    slug: 'legal',
    title: 'Legal Disclaimer',
    href: '/legal',
    version: '3.0',
    effective: '1 September 2026',
    relation: 'agree',
    draft: true,
  },
  'advertising-policy': {
    slug: 'advertising-policy',
    title: 'Advertising Policy',
    href: '/advertising-policy',
    version: '1.1',
    effective: '29 July 2026',
    relation: 'agree',
    draft: false,
  },
  takedown: {
    slug: 'takedown',
    title: 'Takedown Notification Procedure',
    href: '/takedown',
    version: '2.0',
    effective: '1 September 2026',
    relation: 'reference',
    draft: true,
  },
  paia: {
    slug: 'paia',
    title: 'PAIA Manual',
    href: '/paia',
    version: '2.0',
    effective: '1 September 2026',
    relation: 'reference',
    draft: true,
  },
};

// ─── CONSENT BUNDLES ─────────────────────────────────────────────────────────
// A bundle is the set of documents presented together at one moment in the
// product. Each place we capture acceptance names a bundle, so the stored
// record says not just what was accepted but at what point in the journey.

export type ConsentContext =
  | 'signup'
  | 'dealer_application'
  | 'club_application'
  | 'service_application'
  | 'advocacy_application'
  | 'advertising_booking';

export const CONSENT_BUNDLES: Record<ConsentContext, LegalSlug[]> = {
  signup: ['terms', 'privacy', 'popi', 'legal'],
  dealer_application: ['dealer-terms', 'terms', 'privacy'],
  club_application: ['terms', 'privacy'],
  service_application: ['terms', 'privacy'],
  advocacy_application: ['terms', 'privacy'],
  advertising_booking: ['advertising-policy', 'terms', 'privacy'],
};

/**
 * Bump this whenever any document inside any bundle changes version. It gives
 * you a single value to query on when you need to find every user whose
 * acceptance predates a change — far cheaper than comparing JSONB per row.
 */
export const CONSENT_BUNDLE_VERSION = '2026-09-01';

export interface AcceptedDocument {
  slug: LegalSlug;
  title: string;
  version: string;
  relation: LegalRelation;
}

/** The exact document/version pairs to write into a consent record. */
export function documentsForContext(context: ConsentContext): AcceptedDocument[] {
  return CONSENT_BUNDLES[context].map(slug => {
    const doc = LEGAL_DOCUMENTS[slug];
    return {
      slug: doc.slug,
      title: doc.title,
      version: doc.version,
      relation: doc.relation,
    };
  });
}

/** Documents in a bundle the user is contractually agreeing to. */
export function agreementsForContext(context: ConsentContext): LegalDocument[] {
  return CONSENT_BUNDLES[context]
    .map(slug => LEGAL_DOCUMENTS[slug])
    .filter(doc => doc.relation === 'agree');
}

/** Documents in a bundle the user is being given notice of. */
export function noticesForContext(context: ConsentContext): LegalDocument[] {
  return CONSENT_BUNDLES[context]
    .map(slug => LEGAL_DOCUMENTS[slug])
    .filter(doc => doc.relation === 'acknowledge');
}

// ─── MARKETING CONSENT ───────────────────────────────────────────────────────
// Kept deliberately separate from the bundles above.
//
// Under POPIA, consent must be a voluntary, specific and informed expression of
// will. Bundling marketing into the same checkbox as the Terms fails both
// "specific" (one tick covering two unrelated things) and "voluntary" (the user
// cannot register without it). It must be its own control, unticked, and
// registration must succeed whether or not it is ticked.

export const MARKETING_CONSENT_VERSION = '1.0';

export const MARKETING_CONSENT_COPY =
  'Send me occasional emails about new features, dealer promotions and firearms industry news. You can unsubscribe at any time.';