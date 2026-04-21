import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const data = Object.fromEntries(new URLSearchParams(body));

    const paymentStatus = data['payment_status'];
    const promoId = data['m_payment_id'];
    const listingId = data['custom_str1'];
    const pfAmount = parseFloat(data['amount_gross'] || '0');

    if (!promoId || !listingId) {
      console.error('PayFast ITN: missing required fields', data);
      return new NextResponse('OK', { status: 200 });
    }

    if (paymentStatus === 'COMPLETE') {
      const { data: promo } = await supabase
        .from('promoted_listings')
        .select('id, amount, scope')
        .eq('id', promoId)
        .single();

      if (!promo) {
        console.error('PayFast ITN: promo not found', promoId);
        return new NextResponse('OK', { status: 200 });
      }

      const expectedRands = promo.amount / 100;
      if (Math.abs(pfAmount - expectedRands) > 0.01) {
        console.error(`PayFast ITN: amount mismatch. Expected R${expectedRands}, got R${pfAmount}`);
        await supabase
          .from('promoted_listings')
          .update({ status: 'amount_mismatch' })
          .eq('id', promoId);
        return new NextResponse('OK', { status: 200 });
      }

      const now = new Date();
      const expires = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      await supabase
        .from('promoted_listings')
        .update({
          status: 'active',
          payfast_payment_id: data['pf_payment_id'] || null,
          starts_at: now.toISOString(),
          expires_at: expires.toISOString(),
        })
        .eq('id', promoId);

      await supabase
        .from('listings')
        .update({
          is_featured: true,
          featured_until: expires.toISOString(),
        })
        .eq('id', listingId);

      console.log(`PayFast ITN: listing ${listingId} featured until ${expires.toISOString()}`);

    } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      await supabase
        .from('promoted_listings')
        .update({ status: 'failed' })
        .eq('id', promoId);
    }

    return new NextResponse('OK', { status: 200 });

  } catch (err) {
    console.error('PayFast ITN unhandled error:', err);
    return new NextResponse('OK', { status: 200 });
  }
}