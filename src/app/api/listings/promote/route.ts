import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { rateLimit, getClientIp, isSameOrigin } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CREATE A LISTING PROMOTION ──────────────────────────────────────────────
// POST /api/listings/promote
//
// WHY THIS ROUTE EXISTS
// /dealer-dashboard/promote used to set is_featured directly and display
// "Payment coming soon — our team will contact you regarding payment". Every
// promotion since launch has therefore been free, and it also silently voided
// the Premium perk: five free promotions a month is worth nothing when they are
// free for everybody.
//
// Promotion is now the same shape as every other paid feature on the platform:
//
//   Premium credit available  -> applied immediately, no payment
//   Otherwise                 -> promoted_listings row created as 'pending',
//                                PayFast redirect returned, and the promotion
//                                only goes live when the verified ITN confirms
//
// The price is decided HERE, not sent by the browser. A client-supplied amount
// is a client-chosen amount.

const TIERS: Record<string, { label: string; price: number; days: number; scope: string }> = {
  provincial: { label: 'Provincial', price: 19, days: 5, scope: 'provincial' },
  national:   { label: 'National',   price: 29, days: 5, scope: 'national' },
};

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ip = getClientIp(req);
    const limit = rateLimit(`promote:${ip}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim() : '';
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { listingId, tierId } = await req.json();
    const tier = TIERS[tierId];
    if (!tier) return NextResponse.json({ error: 'Unknown promotion package' }, { status: 400 });

    // ── Ownership ────────────────────────────────────────────────────────
    const { data: dealer } = await supabase
      .from('dealers').select('id, subscription_tier')
      .eq('user_id', user.id).maybeSingle();

    if (!dealer) return NextResponse.json({ error: 'Dealer account required' }, { status: 403 });

    const { data: listing } = await supabase
      .from('listings').select('id, title, is_featured')
      .eq('id', listingId)
      .or(`dealer_id.eq.${dealer.id},dealer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .maybeSingle();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found or not yours' }, { status: 404 });
    }
    if (listing.is_featured) {
      return NextResponse.json({ error: 'This listing is already promoted.' }, { status: 400 });
    }

    // ── A Premium credit skips payment entirely ──────────────────────────
    const { data: claimed } = await supabase
      .rpc('consume_promo_credit', { p_dealer_id: dealer.id });

    if (claimed === true) {
      const until = new Date();
      until.setDate(until.getDate() + tier.days);

      await supabase.from('listings').update({
        is_featured: true,
        featured_until: until.toISOString(),
      }).eq('id', listing.id);

      await supabase.from('promoted_listings').insert({
        listing_id: listing.id,
        dealer_id: dealer.id,
        amount: 0,
        scope: tier.scope,
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: until.toISOString(),
      });

      return NextResponse.json({
        success: true,
        action: 'credit',
        message: `Promoted using one of your Premium credits. Live until ${until.toLocaleDateString('en-ZA')}.`,
      });
    }

    // ── Otherwise: pending until PayFast confirms ────────────────────────
    // amount is stored in cents, which is what the ITN handler compares against.
    const { data: promo, error: promoError } = await supabase
      .from('promoted_listings')
      .insert({
        listing_id: listing.id,
        dealer_id: dealer.id,
        amount: tier.price * 100,
        scope: tier.scope,
        status: 'pending',
      })
      .select('id').single();

    if (promoError) throw promoError;

    const payfastData: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealer-dashboard/promote?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealer-dashboard/promote?payment=cancelled`,
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payfast/notify`,
      m_payment_id: promo.id,
      amount: tier.price.toFixed(2),
      item_name: `${tier.label} promotion: ${listing.title}`.slice(0, 100),
      custom_str1: 'listing_boost',
      custom_str2: listing.id,
    };

    let sig = Object.entries(payfastData)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    if (process.env.PAYFAST_PASSPHRASE) {
      sig += `&passphrase=${encodeURIComponent(process.env.PAYFAST_PASSPHRASE)}`;
    }
    payfastData.signature = crypto.createHash('md5').update(sig).digest('hex');

    return NextResponse.json({
      success: true,
      action: 'payfast',
      amount: tier.price,
      redirectUrl: `https://www.payfast.co.za/eng/process?${new URLSearchParams(payfastData).toString()}`,
    });

  } catch (error: any) {
    console.error('[listings/promote]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}