import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, logAdminAction } from '@/lib/adminGuard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── ADMIN SUBSCRIPTION CONTROL ──────────────────────────────────────────────
// POST /api/admin/subscription
//
// One endpoint for every subscription change an administrator can make, so the
// side effects stay consistent instead of being reimplemented per page.
//
//   grant        give a paid tier at no charge, for any period
//   change_tier  upgrade or downgrade immediately
//   extend       push the current period end out by N days
//   cancel       end the subscription, optionally at period end
//   refund       record a refund and cancel
//
// ON REFUNDS, HONESTLY
// This records a refund; it does not send money. PayFast has no general refund
// API on a standard merchant account — refunds are made by EFT from your bank.
// Recording it here keeps your books straight and gives the customer something
// to point at, but the transfer is a manual step. Pretending otherwise would be
// worse than saying so.

type Kind = 'dealer' | 'club' | 'service';

const TABLE: Record<Kind, string> = {
  dealer: 'dealers',
  club: 'clubs',
  service: 'services',
};

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  try {
    const body = await req.json();
    const { action, kind, id } = body as {
      action: string; kind: Kind; id: string;
    };

    const table = TABLE[kind];
    if (!table || !id) {
      return NextResponse.json({ error: 'kind and id are required' }, { status: 400 });
    }

    const { data: record } = await supabase
      .from(table).select('*').eq('id', id).maybeSingle();

    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const now = new Date();
    let patch: Record<string, any> = {};
    let message = '';

    switch (action) {

      // ── GRANT A PAID TIER FREE OF CHARGE ─────────────────────────────────
      // For launch partners, goodwill after an outage, or a dealer you want on
      // Premium while you prove the platform. is_comped marks it so it does not
      // later look like a payment that went missing.
      case 'grant': {
        const { tier, months = 1, reason } = body;
        if (!tier) return NextResponse.json({ error: 'tier is required' }, { status: 400 });

        const end = new Date(now);
        end.setMonth(end.getMonth() + Number(months));

        patch = {
          subscription_tier: tier,
          subscription_status: 'active',
          current_period_end: end.toISOString(),
          billing_start_date: now.toISOString(),
          is_comped: true,
          comped_reason: reason || 'Granted by administrator',
        };
        message = `${tier} granted free for ${months} month(s), until ${end.toLocaleDateString('en-ZA')}.`;
        break;
      }

      // ── UPGRADE OR DOWNGRADE ─────────────────────────────────────────────
      case 'change_tier': {
        const { tier } = body;
        if (!tier) return NextResponse.json({ error: 'tier is required' }, { status: 400 });

        patch = { subscription_tier: tier, subscription_status: 'active' };
        message = `Moved from ${record.subscription_tier || 'free'} to ${tier}.`;
        break;
      }

      // ── EXTEND THE CURRENT PERIOD ────────────────────────────────────────
      // Extends from the existing end date where there is one, so a goodwill
      // extension adds to what they have rather than quietly shortening it.
      case 'extend': {
        const { days = 30 } = body;
        const base = record.current_period_end && new Date(record.current_period_end) > now
          ? new Date(record.current_period_end)
          : new Date(now);

        base.setDate(base.getDate() + Number(days));
        patch = {
          current_period_end: base.toISOString(),
          subscription_status: 'active',
        };
        message = `Extended by ${days} days, now ending ${base.toLocaleDateString('en-ZA')}.`;
        break;
      }

      // ── CANCEL ───────────────────────────────────────────────────────────
      case 'cancel': {
        const { immediate = false } = body;

        if (immediate) {
          patch = {
            subscription_tier: 'free',
            subscription_status: 'cancelled',
            current_period_end: now.toISOString(),
            cancellation_requested_at: now.toISOString(),
          };
          message = 'Cancelled immediately and moved to the free tier.';
        } else {
          // They keep what they paid for until the period ends. Cutting access
          // the moment someone cancels is the sort of thing that generates
          // chargebacks and, under the CPA, complaints.
          patch = {
            subscription_status: 'cancelling',
            cancellation_requested_at: now.toISOString(),
          };
          message = `Will end on ${record.current_period_end
            ? new Date(record.current_period_end).toLocaleDateString('en-ZA')
            : 'the current period end'}. Access continues until then.`;
        }
        break;
      }

      // ── REFUND ───────────────────────────────────────────────────────────
      case 'refund': {
        const { amount, reason } = body;
        if (!amount) return NextResponse.json({ error: 'amount is required' }, { status: 400 });

        await supabase.from('invoices').insert({
          entity_type: kind,
          entity_id: id,
          amount: -Math.abs(Number(amount)),
          status: 'refunded',
          notes: reason || 'Refund issued by administrator',
          created_at: now.toISOString(),
        });

        patch = {
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          current_period_end: now.toISOString(),
        };
        message = `Refund of R${amount} recorded and subscription cancelled. Transfer the money by EFT — this does not move funds.`;
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from(table).update(patch).eq('id', id);

    if (updateError) throw updateError;

    await logAdminAction(supabase, `subscription.${action}`, {
      kind, id, name: record.business_name || record.name, patch, body,
    });

    return NextResponse.json({ ok: true, message, patch });

  } catch (error: any) {
    console.error('[admin/subscription]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}