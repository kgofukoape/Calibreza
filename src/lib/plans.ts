// ─── DEALER SUBSCRIPTION PLANS ───────────────────────────────────────────────
// One definition of what each plan includes.
//
// The listing limit was previously written as literal text in six files — the
// homepage, the FAQ, the pricing page, the dealer application, the dashboard
// subscription page and the cron job. They had already drifted: the FAQ
// advertised "up to 10 listings per year" on the free plan while the code
// enforced 5 active listings. A dealer reading the FAQ and a dealer hitting the
// limit were being told different things.
//
// Anything user-facing about a plan reads from here. If a number changes, it
// changes once.

export type PlanId = 'free' | 'pro' | 'premium';

export interface DealerPlan {
  id: PlanId;
  label: string;
  /** Monthly price in Rand. 0 for free. */
  price: number;
  priceLabel: string;
  /** Maximum active listings. null means unlimited. */
  listingLimit: number | null;
  listingLimitLabel: string;
  /** Free listing promotions included each calendar month. */
  monthlyPromotionCredits: number;
  /**
   * Whether this plan's listings rank above lower plans in search and category
   * results. Deliberately NOT applied to the homepage: a front page made
   * entirely of paid placement is the thing buyers notice and stop trusting.
   */
  priorityPlacement: boolean;
  /** Sort weight used by search and category ordering. Higher ranks first. */
  rank: number;
  features: string[];
}

export const DEALER_PLANS: Record<PlanId, DealerPlan> = {
  free: {
    id: 'free',
    label: 'Free',
    price: 0,
    priceLabel: 'R0',
    listingLimit: 5,
    listingLimitLabel: '5 active listings',
    monthlyPromotionCredits: 0,
    priorityPlacement: false,
    rank: 0,
    features: [
      '5 active listings',
      'Basic dealer profile',
      'Buyer enquiries',
    ],
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 499,
    priceLabel: 'R499',
    // Reduced from 50. At 50, a mid-sized dealer never had a reason to reach
    // Premium — the tier above was buying something they did not need.
    listingLimit: 25,
    listingLimitLabel: '25 active listings',
    monthlyPromotionCredits: 0,
    priorityPlacement: false,
    rank: 1,
    features: [
      '25 active listings',
      'Verified dealer badge',
      'Branded storefront',
      'Lead analytics',
      'Bulk upload',
    ],
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    price: 799,
    priceLabel: 'R799',
    listingLimit: null,
    listingLimitLabel: 'Unlimited listings',
    monthlyPromotionCredits: 5,
    priorityPlacement: true,
    rank: 2,
    features: [
      'Unlimited listings',
      'Priority placement in search and category results',
      '5 free listing promotions every month',
      'Verified dealer badge',
      'Branded storefront',
      'Lead analytics',
      'Bulk upload',
    ],
  },
};

export const PLAN_LIST: DealerPlan[] = [
  DEALER_PLANS.free,
  DEALER_PLANS.pro,
  DEALER_PLANS.premium,
];

/** Falls back to free for an unknown or missing tier. */
export function planFor(tier: string | null | undefined): DealerPlan {
  return DEALER_PLANS[(tier as PlanId)] ?? DEALER_PLANS.free;
}

/** True when the dealer is at or over their active listing allowance. */
export function atListingLimit(tier: string | null | undefined, activeCount: number): boolean {
  const limit = planFor(tier).listingLimit;
  return limit !== null && activeCount >= limit;
}

/** Cost of promoting one listing beyond any included credits. */
export const PROMOTION_PRICES = {
  provincial: { label: 'Provincial', price: 19, days: 5 },
  national:   { label: 'National',   price: 29, days: 5 },
} as const;