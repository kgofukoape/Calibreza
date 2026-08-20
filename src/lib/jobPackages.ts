// ─── JOB POSTING PACKAGES ────────────────────────────────────────────────────
// Quotas and prices for industry job listings, in one place.
//
// Previously these lived as a TIER_LOGIC object inside the create route, while
// the boost price sat hardcoded in the boost route. Two files, no shared
// definition, and nothing user-facing read from either — the same drift that
// had the FAQ advertising a listing limit the code never enforced.
//
// WHO MAY POST. Only verified businesses: approved dealers, active clubs and
// ranges, and active service providers. Private accounts cannot post jobs at
// all — this is an industry board, not a general classifieds section.

export type EmployerTier =
  | 'dealer_free' | 'dealer_pro' | 'dealer_premium'
  | 'club_free'   | 'club_active'
  | 'service';

export interface JobPackage {
  tier: EmployerTier;
  label: string;
  /** Free posts included. null means unlimited. */
  quota: number | null;
  /** Whether the quota resets monthly or annually. */
  period: 'month' | 'year';
  /** Cost per post once the quota is used. */
  priceBeyondQuota: number;
  quotaLabel: string;
}

export const JOB_PACKAGES: Record<EmployerTier, JobPackage> = {
  dealer_free: {
    tier: 'dealer_free',
    label: 'Free Dealer',
    quota: 1,
    period: 'year',
    priceBeyondQuota: 69,
    quotaLabel: '1 free job post per year',
  },
  dealer_pro: {
    tier: 'dealer_pro',
    label: 'Pro Dealer',
    quota: 3,
    period: 'month',
    priceBeyondQuota: 29,
    quotaLabel: '3 free job posts per month',
  },
  dealer_premium: {
    tier: 'dealer_premium',
    label: 'Premium Dealer',
    quota: null,
    period: 'month',
    priceBeyondQuota: 0,
    quotaLabel: 'Unlimited job posts',
  },
  club_free: {
    tier: 'club_free',
    label: 'Listed Club',
    quota: 1,
    period: 'year',
    priceBeyondQuota: 69,
    quotaLabel: '1 free job post per year',
  },
  club_active: {
    tier: 'club_active',
    label: 'Active Club',
    quota: 3,
    period: 'month',
    priceBeyondQuota: 29,
    quotaLabel: '3 free job posts per month',
  },
  service: {
    tier: 'service',
    label: 'Service Provider',
    quota: 3,
    period: 'year',
    priceBeyondQuota: 69,
    // Deliberately annual and reasonably generous: service providers hire
    // often and a populated jobs board is worth more to us early than the
    // handful of R69 posts it gives up.
    quotaLabel: '3 free job posts per year',
  },
};

// ─── URGENT BOOST ────────────────────────────────────────────────────────────
// Adds an "Urgent Hire" badge and sorts the post to the top of /jobs.
//
// Reduced from R150. It is the same kind of product as a R29 listing promotion
// — a badge and a sort position — and R150 for a colour change is the sort of
// price that gets resented rather than bought. Better sold often at R49 than
// admired rarely at R150.

export const JOB_BOOST = {
  price: 49,
  days: 14,
  label: 'Urgent Hire',
  description: 'Red "Urgent" badge and top placement on the jobs board for 14 days.',
};

/** Maps a business record to its job package. */
export function jobPackageFor(
  kind: 'dealer' | 'club' | 'service',
  subscriptionTier: string | null | undefined,
): JobPackage {
  const tier = (subscriptionTier || '').toLowerCase();

  if (kind === 'dealer') {
    if (tier === 'premium') return JOB_PACKAGES.dealer_premium;
    if (tier === 'pro')     return JOB_PACKAGES.dealer_pro;
    return JOB_PACKAGES.dealer_free;
  }

  if (kind === 'club') {
    // Clubs are Listed (free) or Active (R399). Anything paid counts as active.
    if (tier && tier !== 'free' && tier !== 'listed') return JOB_PACKAGES.club_active;
    return JOB_PACKAGES.club_free;
  }

  return JOB_PACKAGES.service;
}

export const JOB_PACKAGE_LIST: JobPackage[] = [
  JOB_PACKAGES.dealer_free,
  JOB_PACKAGES.dealer_pro,
  JOB_PACKAGES.dealer_premium,
  JOB_PACKAGES.club_free,
  JOB_PACKAGES.club_active,
  JOB_PACKAGES.service,
];