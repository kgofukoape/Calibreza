import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminGuard';
import {
  ok, fail, missingField, requireReason, assertTier,
  withIdempotency, audit, diffOf,
} from '@/lib/adminApi';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { DEALER_PLANS } from '@/lib/plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── ADMIN SUBSCRIPTION CONTROL ──────────────────────────────────────────────
// POST /api/admin/subscription
//
//   grant        give a paid tier at no charge for a period
//   change_tier  upgrade or downgrade immediately
//   extend       push the current period end out by N days
//   cancel       end it, at period end by default
//   refund       record a refund and cancel
//
// Rebuilt against src/lib/adminApi.ts. The first version of this route had four
// faults worth naming, because they are the sort that only surface once money
// is moving:
//
//   * no idempotency — a double-click issued two refunds
//   * no tier validation — `tier: "banana"` was written straight to the row,
//     and every price and quota lookup then fell back to free
//   * optional reasons — an audit trail with a blank "why" is a list of dates
//   * no rate limiting on the most privileged surface on the platform
//
// SCOPE. Dealers and clubs only. Service providers have no paid tier in the
// product, so granting them one would write a subscription nothing reads.

const TABLE = { dealer: 'dealers', club: 'clubs' } as const;
type Kind = keyof typeof TABLE;

// Club tiers are not dealer tiers, so each kind validates against its own set.
const CLUB_TIERS = ['free', 'listed', 'active'];

function validTier(kind: Kind, tier: unknown): string | null {
  if (kind === 'dealer') return assertTier(tier);
  return typeof tier === 'string' && CLUB_TIERS.includes(tier) ? tier : null;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const ip = getClientIp(req);
  const limit = rateLimit(`admin-subscription:${ip}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) return fail('Too many requests. Try again shortly.', 429);

  try {
    const body = await req.json();
    const { action, kind, id, idempotency_key } = body as {
      action: string; kind: Kind; id: string; idempotency_key?: string;
    };

    const missing = missingField(body, ['action', 'kind', 'id']);
    if (missing) return fail(`${missing} is required`);
    if (!(kind in TABLE)) return fail('kind must be dealer or club');

    const table = TABLE[kind];

    const { data: record } = await supabase
      .from(table).select('*').eq('id', id).maybeSingle();
    if (!record) return fail('Not found', 404);

    const label = record.business_name || record.name || id;
    const now = new Date();

    // ── Actions that move money or give it away require a written reason ──
    const needsReason = ['grant', 'refund', 'cancel'].includes(action);
    const reason = requireReason(body);
    if (needsReason && !reason) {
      return fail('A reason of at least 5 characters is required for this action', 400, 'reason_required');
    }

    // ── Money operations must not repeat ─────────────────────────────────
    const isMoney = ['grant', 'refund'].includes(action);
    if (isMoney && !idempotency_key) {
      return fail('idempotency_key is required for this action', 400, 'idempotency_required');
    }

    const run = async () => {
      let patch: Record<string, any> = {};
      let message = '';

      switch (action) {

        // ── GRANT A PAID TIER FREE OF CHARGE ─────────────────────────────
        case 'grant': {
          const tier = validTier(kind, body.tier);
          if (!tier) {
            return { error: `Invalid tier for ${kind}. Allowed: ${
              kind === 'dealer' ? Object.keys(DEALER_PLANS).join(', ') : CLUB_TIERS.join(', ')
            }` };
          }

          const months = Number(body.months ?? 1);
          if (!Number.isFinite(months) || months < 1 || months > 24) {
            return { error: 'months must be between 1 and 24' };
          }

          const end = new Date(now);
          end.setMonth(end.getMonth() + months);

          patch = {
            subscription_tier:   tier,
            subscription_status: 'active',
            current_period_end:  end.toISOString(),
            billing_start_date:  now.toISOString(),
            // Without this a granted tier is indistinguishable from a payment
            // that went missing, and the revenue figures become fiction.
            is_comped:     true,
            comped_reason: reason,
          };
          message = `${tier} granted to ${label} free for ${months} month${months > 1 ? 's' : ''}, until ${end.toLocaleDateString('en-ZA')}.`;
          break;
        }

        // ── UPGRADE OR DOWNGRADE ─────────────────────────────────────────
        case 'change_tier': {
          const tier = validTier(kind, body.tier);
          if (!tier) return { error: `Invalid tier for ${kind}` };

          patch = { subscription_tier: tier, subscription_status: 'active' };
          message = `${label} moved from ${record.subscription_tier || 'free'} to ${tier}.`;
          break;
        }

        // ── EXTEND ───────────────────────────────────────────────────────
        // Extends from the existing end date where one is still in the future,
        // so a goodwill extension adds to what they have rather than quietly
        // shortening it.
        case 'extend': {
          const days = Number(body.days ?? 30);
          if (!Number.isFinite(days) || days < 1 || days > 365) {
            return { error: 'days must be between 1 and 365' };
          }

          const base = record.current_period_end && new Date(record.current_period_end) > now
            ? new Date(record.current_period_end)
            : new Date(now);
          base.setDate(base.getDate() + days);

          patch = { current_period_end: base.toISOString(), subscription_status: 'active' };
          message = `${label} extended by ${days} days, now ending ${base.toLocaleDateString('en-ZA')}.`;
          break;
        }

        // ── CANCEL ───────────────────────────────────────────────────────
        case 'cancel': {
          if (body.immediate === true) {
            patch = {
              subscription_tier:   'free',
              subscription_status: 'cancelled',
              current_period_end:  now.toISOString(),
              cancellation_requested_at: now.toISOString(),
            };
            message = `${label} cancelled immediately and moved to the free tier.`;
          } else {
            // They keep what they paid for. Cutting access the day someone
            // cancels produces chargebacks and CPA complaints.
            patch = {
              subscription_status: 'cancelling',
              cancellation_requested_at: now.toISOString(),
            };
            message = `${label} will end on ${
              record.current_period_end
                ? new Date(record.current_period_end).toLocaleDateString('en-ZA')
                : 'the current period end'
            }. Access continues until then.`;
          }
          break;
        }

        // ── REFUND ───────────────────────────────────────────────────────
        // Records a refund. Does NOT move money: PayFast has no general refund
        // API on a standard merchant account, so the transfer is an EFT you
        // make. Saying so plainly beats implying the money has already gone.
        case 'refund': {
          const amount = Number(body.amount);
          if (!Number.isFinite(amount) || amount <= 0) {
            return { error: 'A positive amount is required' };
          }

          await supabase.from('invoices').insert({
            entity_type: kind,
            entity_id:   id,
            amount:      -Math.abs(amount),
            status:      'refunded',
            notes:       reason,
            created_at:  now.toISOString(),
          });

          patch = {
            subscription_tier:   'free',
            subscription_status: 'cancelled',
            current_period_end:  now.toISOString(),
          };
          message = `Refund of R${amount.toLocaleString('en-ZA')} recorded against ${label} and the subscription cancelled. Transfer the money by EFT — this does not move funds.`;
          break;
        }

        default:
          return { error: `Unknown action: ${action}` };
      }

      const { error: updateError } = await supabase
        .from(table).update(patch).eq('id', id);
      if (updateError) return { error: updateError.message };

      await audit(supabase, {
        action: `subscription.${action}`,
        entity: kind,
        entityId: id,
        entityName: label,
        reason: reason || undefined,
        ...diffOf(record, patch),
      });

      return { message, patch };
    };

    const { replayed, result } = await withIdempotency(
      supabase, idempotency_key, `subscription.${action}`, run,
    );

    if (result?.error) return fail(result.error);

    return ok(
      replayed ? `${result.message} (already applied — no change made)` : result.message,
      { patch: result.patch, replayed },
    );

  } catch (error: any) {
    console.error('[admin/subscription]', error);
    return fail(error.message, 500);
  }
}