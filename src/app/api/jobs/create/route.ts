import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIER_LOGIC = {
  free: { quota: 2, period: 'year', price: 69.00 },
  pro: { quota: 5, period: 'month', price: 29.00 },
  premium: { quota: 10, period: 'month', price: 29.00 },
  club: { quota: 2, period: 'month', price: 69.00 },
  service: { quota: 0, period: 'month', price: 69.00 }
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const jobData = await req.json();

    // STRICT GATEKEEPER: Check if they are an APPROVED business
    let userTier = null;
    let isEmployer = false;
    
    const { data: dealer } = await supabase.from('dealers').select('subscription_tier, status').eq('user_id', user.id).maybeSingle();
    if (dealer && dealer.status === 'approved') {
      userTier = dealer.subscription_tier.toLowerCase();
      isEmployer = true;
    } else {
      const { data: club } = await supabase.from('clubs').select('id, status').eq('user_id', user.id).maybeSingle();
      if (club && club.status === 'approved') {
        userTier = 'club';
        isEmployer = true;
      }
    }
    
    // THE KILL SWITCH
    if (!isEmployer) {
      return NextResponse.json({ 
        error: 'Access Denied: Only verified Dealers, Clubs, and Services can post industry jobs.' 
      }, { status: 403 });
    }

    if (!userTier || !TIER_LOGIC[userTier as keyof typeof TIER_LOGIC]) userTier = 'free';
    const logic = TIER_LOGIC[userTier as keyof typeof TIER_LOGIC];

    const timeLimit = new Date();
    if (logic.period === 'year') timeLimit.setFullYear(timeLimit.getFullYear() - 1);
    else timeLimit.setMonth(timeLimit.getMonth() - 1);

    const { count } = await supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('employer_id', user.id).gte('created_at', timeLimit.toISOString());

    const jobsUsed = count || 0;
    const hasQuota = jobsUsed < logic.quota;

    const { data: newJob, error: insertError } = await supabase.from('job_listings')
      .insert({
        employer_id: user.id,
        title: jobData.title,
        company: jobData.company,
        employer_email: jobData.employer_email,
        category: jobData.category,
        location: jobData.location,
        salary_range: jobData.salary_range,
        job_type: jobData.job_type,
        description: jobData.description,
        fca_competencies_required: jobData.fca_competencies_required,
        requirements: jobData.requirements.split(',').map((r: string) => r.trim()),
        status: hasQuota ? 'active' : 'pending_payment'
      }).select('id').single();

    if (insertError) throw insertError;

    if (hasQuota) {
      return NextResponse.json({ success: true, action: 'published', message: 'Job published successfully using your tier quota!' });
    } else {
      const payfastData: Record<string, string> = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID!,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/jobs?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/post?payment=cancelled`,
        notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payfast/notify`,
        m_payment_id: `JOB_${newJob.id}`,
        amount: logic.price.toFixed(2),
        item_name: `Gun X Job: ${jobData.title}`,
      };

      let signatureString = Object.entries(payfastData).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
      if (process.env.PAYFAST_PASSPHRASE) signatureString += `&passphrase=${encodeURIComponent(process.env.PAYFAST_PASSPHRASE)}`;
      payfastData.signature = crypto.createHash('md5').update(signatureString).digest('hex');
      const payfastParams = new URLSearchParams(payfastData);
      
      return NextResponse.json({ success: true, action: 'payfast', redirectUrl: `https://www.payfast.co.za/eng/process?${payfastParams.toString()}` });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}