import { redirect } from 'next/navigation';

// Range pricing moved to /ranges/pricing (Oct 2026). PayFast still returns
// cancelled range checkouts here, so this forwards them with the query.
export default function OldRangePricing({ searchParams }: { searchParams: Record<string, string> }) {
  const q = new URLSearchParams(searchParams || {}).toString();
  redirect('/ranges/pricing' + (q ? '?' + q : ''));
}
