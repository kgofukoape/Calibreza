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

    console.log('PayFast ITN received:', JSON.stringify(data));

    if (data['payment_status'] === 'COMPLETE') {
      const customStr1 = data['custom_str1'] || '';
      const customStr2 = data['custom_str2'] || '';
      const customStr3 = data['custom_str3'] || '';
      const pfToken = data['token'] || null;
      const promoId = data['m_payment_id'] || '';

      // CASE A: DEALER SUBSCRIPTION
      if (customStr1 === 'dealer_subscription') {
        const plan = customStr2; // 'pro' or 'premium'
        const dealerId = customStr3;

        await supabase
          .from('dealers')
          .update({
            subscription_tier: plan,
            payfast_token: pfToken,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dealerId);

        console.log(`Dealer subscription activated: ${dealerId} -> ${plan}`);
      }

      // CASE B: LISTING BOOST
      else {
        const listingId = customStr2;

        const { data: promo } = await supabase
          .from('promoted_listings')
          .select('id, amount, scope')
          .eq('id', promoId)
          .single();

        if (promo) {
          const pfAmount = parseFloat(data['amount_gross'] || '0');
          const expectedRands = promo.amount / 100;

          if (Math.abs(pfAmount - expectedRands) > 0.01) {
            console.error(`Amount mismatch: expected R${expectedRands}, got R${pfAmount}`);
            await supabase.from('promoted_listings')
              .update({ status: 'amount_mismatch' })
              .eq('id', promoId);
            return new NextResponse('OK', { status: 200 });
          }

          const now = new Date();
          const expires = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

          await supabase.from('promoted_listings').update({
            status: 'active',
            payfast_payment_id: data['pf_payment_id'] || null,
            starts_at: now.toISOString(),
            expires_at: expires.toISOString(),
          }).eq('id', promoId);

          await supabase.from('listings').update({
            is_featured: true,
            featured_until: expires.toISOString(),
          }).eq('id', listingId);

          console.log(`Listing boost activated: ${listingId} until ${expires.toISOString()}`);
        }
      }

    } else if (data['payment_status'] === 'FAILED' || data['payment_status'] === 'CANCELLED') {
      const customStr1 = data['custom_str1'] || '';
      if (customStr1 !== 'dealer_subscription') {
        await supabase.from('promoted_listings')
          .update({ status: 'failed' })
          .eq('id', data['m_payment_id']);
      }
    }

    return new NextResponse('OK', { status: 200 });

  } catch (err: any) {
    console.error('PayFast ITN unhandled error:', err);
    return new NextResponse('OK', { status: 200 }); // Always 200 to PayFast
  }
}
