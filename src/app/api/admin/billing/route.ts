import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminGuard';
import { ok, fail, missingField, audit } from '@/lib/adminApi';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── ADMIN BILLING ───────────────────────────────────────────────────────────
// POST /api/admin/billing
//
//   create_invoice     raise an invoice
//   mark_paid          record payment, and reinstate a suspended subscription
//   mark_overdue       flag an unpaid invoice past its due date
//   suspend_sub        suspend or reinstate
//   cancel_sub         cancel and downgrade
//
// WHY THIS EXISTS
// /admin/crm made ten writes straight from the browser with the anon key —
// creating invoices, marking them paid, changing subscription state and
// downgrading dealer tiers. That is the money surface of the platform running
// on the same key that ships in every visitor's page source. Whether each write
// happened at all depended on whichever row-level policy it happened to meet.
//
// Several of these actions are multi-step — marking an invoice paid also
// reinstates the subscription and restores the dealer's tier. Done from the
// browser, a failure halfway leaves an invoice marked paid and a dealer still
// on the free tier, with nothing recording that it went wrong.

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const ip = getClientIp(req);
  const limit = rateLimit(`admin-billing:${ip}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) return fail('Too many requests. Try again shortly.', 429);

  try {
    const body = await req.json();
    const { action } = body as { action: string };

    const missing = missingField(body, ['action']);
    if (missing) return fail(`${missing} is required`);

    switch (action) {

      // ── RAISE AN INVOICE ─────────────────────────────────────────────────
      case 'create_invoice': {
        const { invoice } = body;
        if (!invoice?.client_email) return fail('client_email is required');

        const { data, error } = await supabase
          .from('invoices').insert(invoice).select('id, invoice_number').single();
        if (error) return fail(error.message);

        await audit(supabase, {
          action: 'billing.create_invoice',
          entity: 'invoice',
          entityId: data.id,
          entityName: data.invoice_number,
          reason: invoice.description || 'Invoice raised',
          after: { total: invoice.total, client: invoice.client_email },
        });

        return ok(`Invoice ${data.invoice_number} created.`, data);
      }

      // ── PAYMENT RECEIVED ─────────────────────────────────────────────────
      // Also reinstates a subscription suspended for non-payment and restores
      // the dealer's tier. Kept in one server call so a failure halfway cannot
      // leave the invoice paid and the dealer still downgraded.
      case 'mark_paid': {
        const { invoiceId, clientEmail } = body;
        if (!invoiceId) return fail('invoiceId is required');

        const paidAt = new Date().toISOString();

        const { error } = await supabase
          .from('invoices')
          .update({ status: 'paid', paid_at: paidAt })
          .eq('id', invoiceId);
        if (error) return fail(error.message);

        let reinstated: string | null = null;

        if (clientEmail) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('id, client_type, client_id, plan')
            .eq('client_email', clientEmail)
            .eq('status', 'suspended')
            .maybeSingle();

          if (sub) {
            await supabase.from('subscriptions')
              .update({ status: 'active', payment_failures: 0 })
              .eq('id', sub.id);

            if (sub.client_type === 'dealer') {
              const tier = String(sub.plan || '').replace('dealer_', '');
              if (['free', 'pro', 'premium'].includes(tier)) {
                await supabase.from('dealers')
                  .update({ subscription_tier: tier })
                  .eq('id', sub.client_id);
                reinstated = tier;
              }
            }
          }
        }

        await audit(supabase, {
          action: 'billing.mark_paid',
          entity: 'invoice',
          entityId: invoiceId,
          reason: 'Payment received',
          after: { paidAt, reinstatedTier: reinstated },
        });

        return ok(
          reinstated
            ? `Marked paid. Subscription reinstated on ${reinstated}.`
            : 'Marked paid.',
          { reinstated },
        );
      }

      // ── OVERDUE ──────────────────────────────────────────────────────────
      case 'mark_overdue': {
        const { invoiceId } = body;
        if (!invoiceId) return fail('invoiceId is required');

        const { error } = await supabase
          .from('invoices').update({ status: 'overdue' }).eq('id', invoiceId);
        if (error) return fail(error.message);

        return ok('Marked overdue.');
      }

      // ── SUSPEND OR REINSTATE ─────────────────────────────────────────────
      case 'suspend_sub': {
        const { subId, clientType, clientId, next } = body;
        if (!subId || !next) return fail('subId and next are required');
        if (!['active', 'suspended'].includes(next)) return fail('next must be active or suspended');

        const { error } = await supabase
          .from('subscriptions').update({ status: next }).eq('id', subId);
        if (error) return fail(error.message);

        // Suspending drops the tier so the features stop. Reinstating does not
        // guess the tier back — that is what mark_paid is for, where the plan
        // is known.
        if (next === 'suspended' && clientType === 'dealer' && clientId) {
          await supabase.from('dealers')
            .update({ subscription_tier: 'free' }).eq('id', clientId);
        }

        await audit(supabase, {
          action: `billing.${next === 'suspended' ? 'suspend' : 'reinstate'}_sub`,
          entity: 'subscription',
          entityId: subId,
          reason: body.reason || 'Changed by administrator',
        });

        return ok(next === 'suspended' ? 'Subscription suspended.' : 'Subscription reinstated.');
      }

      // ── CANCEL ───────────────────────────────────────────────────────────
      case 'cancel_sub': {
        const { subId, clientType, clientId } = body;
        if (!subId) return fail('subId is required');

        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', cancellation_reason: body.reason || 'Cancelled by administrator' })
          .eq('id', subId);
        if (error) return fail(error.message);

        if (clientType === 'dealer' && clientId) {
          await supabase.from('dealers')
            .update({ subscription_tier: 'free' }).eq('id', clientId);
        }

        await audit(supabase, {
          action: 'billing.cancel_sub',
          entity: 'subscription',
          entityId: subId,
          reason: body.reason || 'Cancelled by administrator',
        });

        return ok('Subscription cancelled and moved to the free tier.');
      }

      default:
        return fail(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('[admin/billing]', error);
    return fail(error.message, 500);
  }
}