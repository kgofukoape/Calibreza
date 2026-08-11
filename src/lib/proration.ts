// ─── SUBSCRIPTION PRORATION ──────────────────────────────────────────────────
// When a dealer upgrades mid-period we credit the unused portion of what they
// have already paid, and charge only the difference. This removes the "cancel,
// wait out the month, then re-subscribe" friction that loses revenue and gives
// people a natural moment to churn instead of upgrade.
//
// Worked example — Pro (R499) upgrading to Premium (R799), 10 days into a
// 30-day period:
//   unused days        = 20
//   unused credit      = R499 × (20 / 30)  = R332.67
//   new plan full cost = R799
//   due today          = R799 − R332.67    = R466.33
//   then R799 per month thereafter.
//
// The credit never exceeds what they actually paid, and the amount due is never
// negative — a "downgrade" priced this way would be handled as a scheduled
// downgrade instead, not a refund.

export const PLAN_PRICES: Record<string, number> = {
    free: 0,
    pro: 499,
    premium: 799,
  };
  
  export const PLAN_RANK: Record<string, number> = {
    free: 0,
    pro: 1,
    premium: 2,
  };
  
  export interface ProrationResult {
    /** Whole days still unused on the current period */
    unusedDays: number;
    /** Total days in the current billing period */
    periodDays: number;
    /** Rand value of the unused portion of the current plan */
    creditAmount: number;
    /** Full monthly price of the plan being moved to */
    newPlanPrice: number;
    /** Amount payable today (never below zero) */
    amountDueToday: number;
    /** Ongoing monthly amount after this payment */
    recurringAmount: number;
    /** Whether proration could actually be calculated */
    canProrate: boolean;
    /** Human-readable explanation for the UI */
    explanation: string;
  }
  
  /**
   * @param currentTier  the plan they are on now
   * @param targetTier   the plan they want
   * @param periodEnd    when the current paid period ends (ISO string or null)
   * @param periodDays   assumed billing period length, default 30
   */
  export function calculateProration(
    currentTier: string,
    targetTier: string,
    periodEnd: string | null,
    periodDays = 30,
  ): ProrationResult {
    const currentPrice = PLAN_PRICES[currentTier] ?? 0;
    const newPlanPrice = PLAN_PRICES[targetTier] ?? 0;
  
    const base: ProrationResult = {
      unusedDays: 0,
      periodDays,
      creditAmount: 0,
      newPlanPrice,
      amountDueToday: newPlanPrice,
      recurringAmount: newPlanPrice,
      canProrate: false,
      explanation: 'Full price applies — no active paid period to credit.',
    };
  
    // No period end recorded, or the current plan is free: nothing to credit.
    if (!periodEnd || currentPrice <= 0) return base;
  
    const end = new Date(periodEnd).getTime();
    const now = Date.now();
  
    if (!Number.isFinite(end) || end <= now) {
      return {
        ...base,
        explanation: 'Your current period has ended — the new plan is charged in full.',
      };
    }
  
    const msPerDay = 24 * 60 * 60 * 1000;
    // Round DOWN so we never over-credit the customer's remaining days
    const unusedDays = Math.max(0, Math.min(periodDays, Math.floor((end - now) / msPerDay)));
  
    const rawCredit = currentPrice * (unusedDays / periodDays);
    // Credit can never exceed what the current plan actually costs
    const creditAmount = Math.round(Math.min(rawCredit, currentPrice) * 100) / 100;
  
    const amountDueToday = Math.max(0, Math.round((newPlanPrice - creditAmount) * 100) / 100);
  
    return {
      unusedDays,
      periodDays,
      creditAmount,
      newPlanPrice,
      amountDueToday,
      recurringAmount: newPlanPrice,
      canProrate: true,
      explanation:
        `You have ${unusedDays} day${unusedDays === 1 ? '' : 's'} left on your current plan, ` +
        `worth R${creditAmount.toFixed(2)}. That is credited against the new plan, so you pay ` +
        `R${amountDueToday.toFixed(2)} today and R${newPlanPrice} per month from next month.`,
    };
  }
  
  /** True when moving from currentTier to targetTier is an upgrade. */
  export function isUpgrade(currentTier: string, targetTier: string): boolean {
    return (PLAN_RANK[targetTier] ?? 0) > (PLAN_RANK[currentTier] ?? 0);
  }
  