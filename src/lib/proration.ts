// Prorated upgrades. One calculation shared by the upgrade quote
// (/api/subscriptions/change) and the upgrade checkout
// (/api/payfast/dealer-subscribe), so the price shown is the price charged.
//
// Rule (agreed 7 Oct 2026): an upgrade costs only the DIFFERENCE between
// the two plans for the days left in the month, today included. Billing
// runs on the 1st, so "days left" is counted to the end of the calendar
// month in South African time - the same count checkout uses for a
// part-month first payment. From the 1st the new plan is charged in full.
//
// No refunds: a downgrade or a cancellation never produces a credit.

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
  /** Days left in this month, today included */
  unusedDays: number;
  /** Days in this calendar month */
  periodDays: number;
  /** Value of the current plan for the days left */
  creditAmount: number;
  /** Value of the new plan for the days left */
  newPlanPortion: number;
  /** Full monthly price of the plan being moved to */
  newPlanPrice: number;
  /** Amount payable today: newPlanPortion - creditAmount */
  amountDueToday: number;
  /** Monthly amount from the 1st */
  recurringAmount: number;
  /** False when there is no paid plan to upgrade from */
  canProrate: boolean;
  /** Plain explanation for the UI */
  explanation: string;
}

// PayFast will not take a first payment below R5.
const MIN_AMOUNT = 5.0;

const round2 = (n: number): number => Math.round(n * 100) / 100;

function sastToday(): { y: number; m: number; d: number } {
  const t = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function daysInMonth(y: number, m: number): number {
  // Day 0 of the next month is the last day of month m (m is 1-based)
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * @param currentTier  the plan they are on now
 * @param targetTier   the plan they want
 * @param _periodEnd   accepted for older callers; not used (plans renew
 *                     on the 1st, so the days left run to month end)
 */
export function calculateProration(
  currentTier: string,
  targetTier: string,
  _periodEnd?: string | null,
): ProrationResult {
  const currentPrice = PLAN_PRICES[currentTier] ?? 0;
  const newPlanPrice = PLAN_PRICES[targetTier] ?? 0;

  const { y, m, d } = sastToday();
  const dim = daysInMonth(y, m);
  const daysLeft = dim - d + 1;

  if (currentPrice <= 0 || newPlanPrice <= currentPrice) {
    return {
      unusedDays: 0,
      periodDays: dim,
      creditAmount: 0,
      newPlanPortion: newPlanPrice,
      newPlanPrice,
      amountDueToday: newPlanPrice,
      recurringAmount: newPlanPrice,
      canProrate: false,
      explanation: 'Full price applies: there is no paid plan to upgrade from.',
    };
  }

  const newPlanPortion = round2(newPlanPrice * daysLeft / dim);
  const creditAmount = round2(currentPrice * daysLeft / dim);
  let amountDueToday = round2(newPlanPortion - creditAmount);
  if (amountDueToday < MIN_AMOUNT) amountDueToday = MIN_AMOUNT;

  const dayWord = daysLeft === 1 ? 'day' : 'days';
  return {
    unusedDays: daysLeft,
    periodDays: dim,
    creditAmount,
    newPlanPortion,
    newPlanPrice,
    amountDueToday,
    recurringAmount: newPlanPrice,
    canProrate: true,
    explanation:
      `There ${daysLeft === 1 ? 'is' : 'are'} ${daysLeft} ${dayWord} left this month. ` +
      `You pay only the difference between the plans for those ${dayWord}: ` +
      `R${amountDueToday.toFixed(2)} today, then R${newPlanPrice} per month from the 1st.`,
  };
}

/** True when moving from currentTier to targetTier is an upgrade. */
export function isUpgrade(currentTier: string, targetTier: string): boolean {
  return (PLAN_RANK[targetTier] ?? 0) > (PLAN_RANK[currentTier] ?? 0);
}
