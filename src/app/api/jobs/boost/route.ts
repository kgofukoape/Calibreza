import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const { jobId } = await req.json();

    const { data: job } = await supabase.from('job_listings').select('id, title').eq('id', jobId).eq('employer_id', user.id).single();
    if (!job) return NextResponse.json({ error: 'Job not found or unauthorized' }, { status: 404 });

    const payfastData: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealer-dashboard/jobs?boost=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dealer-dashboard/jobs?boost=cancelled`,
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payfast/notify`,
      m_payment_id: `JOB_BOOST_${job.id}`,
      amount: '150.00',
      item_name: `Urgent Boost: ${job.title}`,
    };

    let signatureString = Object.entries(payfastData).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
    if (process.env.PAYFAST_PASSPHRASE) signatureString += `&passphrase=${encodeURIComponent(process.env.PAYFAST_PASSPHRASE)}`;
    payfastData.signature = crypto.createHash('md5').update(signatureString).digest('hex');
    const payfastParams = new URLSearchParams(payfastData);
    
    return NextResponse.json({ success: true, redirectUrl: `https://www.payfast.co.za/eng/process?${payfastParams.toString()}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}