// ─── DEALER SUBSCRIPTION PLANS AND FREE ALLOWANCES ───────────────────────────
// One definition of what each plan includes.
//
// The listing limit was previously written as literal text in six files. They
// had already drifted: the FAQ advertised "up to 10 listings per year" on the
// free plan while the code enforced 5 active listings. Anything user-facing
// about a plan reads from here.
//
// TWO DIFFERENT KINDS OF LIMIT, and it matters that they are not confused:
//
//   ALLOWANCE  How many listings you may CREATE in a period. Counted at
//              creation and never refunded — if deleting a listing returned
//              the credit, the limit would be defeated by delete-and-relist.
//              Applies to free accounts.
//
//   CAPACITY   How many listings may be ACTIVE at once. A paid-plan concept:
//              Pro may hold 25 live at a time, however many it posts over the
//              year.
//
// Free private sellers get 5 per calendar year. Free dealers get 5 per month,
// because a dealer with stock turning over is a customer in the making and 60
// listings a year is a real trial rather than a tease.

export type PlanId = 'free' | 'pro' | 'premium';

export interface DealerPlan {
  id: PlanId;
  label: string;
  price: number;
  priceLabel: string;
  /** Active listings allowed at once. null means unlimited. */
  listingLimit: number | null;
  listingLimitLabel: string;
  /** Free listing promotions included each calendar month. */
  monthlyPromotionCredits: number;
  /**
   * Whether this plan's listings rank above lower plans in search and category
   * results. Deliberately NOT applied to the homepage: a front page made
   * entirely of paid placement is what buyers notice and stop trusting.
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
    // Capacity is not what constrains a free dealer — the monthly allowance is.
    listingLimit: null,
    listingLimitLabel: '5 listings per month',
    monthlyPromotionCredits: 0,
    priorityPlacement: false,
    rank: 0,
    features: [
      '5 listings per month',
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
    // Premium — the tier above was selling something they did not need.
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

export function planFor(tier: string | null | undefined): DealerPlan {
  return DEALER_PLANS[(tier as PlanId)] ?? DEALER_PLANS.free;
}

export function atListingLimit(tier: string | null | undefined, activeCount: number): boolean {
  const limit = planFor(tier).listingLimit;
  return limit !== null && activeCount >= limit;
}

// ─── FREE LISTING ALLOWANCES ─────────────────────────────────────────────────
// Enforced by a database trigger, not here — a limit the browser applies is a
// limit the browser can skip. These values exist so the interface can tell
// someone what they have left before they fill in a form and get refused.

export const FREE_ALLOWANCE = {
  /** Private sellers: 5 per calendar year, resetting 1 January. */
  personal: { count: 5, period: 'year' as const, label: '5 free listings per year' },
  /** Free-tier dealers: 5 per calendar month, resetting on the 1st. */
  dealer:   { count: 5, period: 'month' as const, label: '5 free listings per month' },
};

/** What a listing costs once the free allowance for the period is used up. */
export const PAID_LISTING_PRICE = 29;

export const PROMOTION_PRICES = {
  provincial: { label: 'Provincial', price: 19, days: 5 },
  national:   { label: 'National',   price: 29, days: 5 },
} as const;