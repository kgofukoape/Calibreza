import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { JOB_BOOST } from '@/lib/jobPackages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── URGENT HIRE BOOST ───────────────────────────────────────────────────────
// POST /api/jobs/boost
//
// Price reduced from R150 to R49 and moved into src/lib/jobPackages.ts. It is
// the same kind of product as a R29 listing promotion — a badge and a sort
// position — and R150 for a colour change is a price people resent rather than
// pay.
//
// The boost is applied by /api/payfast/notify when PayFast confirms payment,
// never here. Setting is_boosted at redirect time would hand out the badge to
// anyone who reached the payment page and then abandoned it.
//
// boost_pending_until exists so the confirmation handler can tell a genuine
// payment from a stale one, and so the dashboard can show "awaiting payment"
// rather than appearing to have done nothing.

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { jobId } = await req.json();

    const { data: job } = await supabase
      .from('job_listings')
      .select('id, title, is_boosted')
      .eq('id', jobId)
      .eq('employer_id', user.id)
      .single();

    if (!job) {
      return NextResponse.json({ error: 'Job not found or unauthorized' }, { status: 404 });
    }

    if (job.is_boosted) {
      return NextResponse.json({ error: 'This job is already boosted.' }, { status: 400 });
    }

    // Marks the intent so the payment confirmation has something to match
    // against, and so the dashboard can show the state honestly.
    const pendingUntil = new Date();
    pendingUntil.setHours(pendingUntil.getHours() + 2);

    await supabase
      .from('job_listings')
      .update({ boost_pending_until: pendingUntil.toISOString() })
      .eq('id', job.id);

    const payfastData: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealer-dashboard/jobs?boost=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealer-dashboard/jobs?boost=cancelled`,
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payfast/notify`,
      m_payment_id: `JOB_BOOST_${job.id}`,
      amount: JOB_BOOST.price.toFixed(2),
      item_name: `${JOB_BOOST.label}: ${job.title}`,
    };

    let signatureString = Object.entries(payfastData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
    if (process.env.PAYFAST_PASSPHRASE) {
      signatureString += `&passphrase=${encodeURIComponent(process.env.PAYFAST_PASSPHRASE)}`;
    }
    payfastData.signature = crypto.createHash('md5').update(signatureString).digest('hex');
    const payfastParams = new URLSearchParams(payfastData);

    return NextResponse.json({
      success: true,
      amount: JOB_BOOST.price,
      redirectUrl: `https://www.payfast.co.za/eng/process?${payfastParams.toString()}`,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}