import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { jobPackageFor, type JobPackage } from '@/lib/jobPackages';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CREATE A JOB LISTING ────────────────────────────────────────────────────
// POST /api/jobs/create
//
// TWO ACCESS BUGS FIXED HERE, both of which blocked people entirely:
//
//   CLUBS. The check was `club.status === 'approved'`. Clubs and ranges use
//   'active' — 'approved' is the dealer vocabulary, and the admin API will not
//   even accept 'approved' for a club. So every club posting a job was told
//   "Access Denied" and no setting could have fixed it.
//
//   SERVICE PROVIDERS. The old tier table had an entry for them, and the error
//   message told them services were welcome, but the gatekeeper only ever
//   looked at dealers and clubs. A service provider could never get past it.
//
// Quotas and prices now come from src/lib/jobPackages.ts rather than a table
// declared in this file, so the pricing page and this route cannot disagree.

export async function POST(req: Request) {
  // Rate limited: this route costs money or writes records, so it should not
  // accept unlimited calls from one source.
  const _ip = getClientIp(req as any);
  const _limit = rateLimit(`jobs-create:${_ip}`, 20, 60 * 60 * 1000);
  if (!_limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429 },
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const jobData = await req.json();

    // ── Who is this, and are they entitled to post? ──────────────────────
    let pkg: JobPackage | null = null;

    const { data: dealer } = await supabase
      .from('dealers').select('subscription_tier, status')
      .eq('user_id', user.id).maybeSingle();

    if (dealer && dealer.status === 'approved') {
      pkg = jobPackageFor('dealer', dealer.subscription_tier);
    }

    if (!pkg) {
      const { data: club } = await supabase
        .from('clubs').select('subscription_tier, status')
        .eq('user_id', user.id).maybeSingle();

      // 'active' is the club vocabulary. See the note at the top of this file.
      if (club && club.status === 'active') {
        pkg = jobPackageFor('club', club.subscription_tier);
      }
    }

    if (!pkg) {
      const { data: service } = await supabase
        .from('services').select('status')
        .eq('user_id', user.id).maybeSingle();

      if (service && service.status === 'active') {
        pkg = jobPackageFor('service', null);
      }
    }

    if (!pkg) {
      return NextResponse.json({
        error: 'Only approved dealers, clubs, ranges and service providers can post industry jobs.',
      }, { status: 403 });
    }

    // ── How many have they posted this period? ───────────────────────────
    let hasQuota = pkg.quota === null;

    if (!hasQuota) {
      const timeLimit = new Date();
      if (pkg.period === 'year') timeLimit.setFullYear(timeLimit.getFullYear() - 1);
      else timeLimit.setMonth(timeLimit.getMonth() - 1);

      const { count } = await supabase
        .from('job_listings').select('id', { count: 'exact', head: true })
        .eq('employer_id', user.id)
        .gte('created_at', timeLimit.toISOString());

      hasQuota = (count || 0) < (pkg.quota as number);
    }

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
        status: hasQuota ? 'active' : 'pending_payment',
      }).select('id').single();

    if (insertError) throw insertError;

    if (hasQuota) {
      return NextResponse.json({
        success: true,
        action: 'published',
        message: `Job published — included in your ${pkg.label} package.`,
      });
    }

    const payfastData: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/jobs?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/jobs/post?payment=cancelled`,
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payfast/notify`,
      m_payment_id: `JOB_${newJob.id}`,
      amount: pkg.priceBeyondQuota.toFixed(2),
      item_name: `Gun X Job: ${jobData.title}`,
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
      action: 'payfast',
      amount: pkg.priceBeyondQuota,
      redirectUrl: `https://www.payfast.co.za/eng/process?${payfastParams.toString()}`,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}