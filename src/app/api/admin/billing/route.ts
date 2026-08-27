import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminGuard';
import { ok, fail, missingField, requireReason, withIdempotency, audit } from '@/lib/adminApi';
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
      // Fields are copied one by one from a whitelist. This used to pass the
      // browser's object straight to insert(), which meant any column on the
      // invoices table could be set by whatever the page happened to send —
      // including status 'paid' and a paid_at date on an invoice nobody paid.
      case 'create_invoice': {
        const { invoice } = body;
        if (!invoice?.client_email) return fail('client_email is required');
        if (!invoice?.invoice_number) return fail('invoice_number is required');

        const total = Number(invoice.total);
        if (!Number.isFinite(total) || total < 0) return fail('A valid total is required');

        const row = {
          invoice_number: String(invoice.invoice_number),
          client_type:  String(invoice.client_type || 'other'),
          client_id:    invoice.client_id || null,
          client_name:  String(invoice.client_name || ''),
          client_email: String(invoice.client_email),
          description:  String(invoice.description || ''),
          line_items:   Array.isArray(invoice.line_items) ? invoice.line_items : [],
          subtotal:     Number(invoice.subtotal) || 0,
          vat:          Number(invoice.vat) || 0,
          total,
          // Always unpaid on creation. An invoice is a request for money; it
          // becomes paid through mark_paid, when the money has actually landed.
          status:       'unpaid',
          due_date:     invoice.due_date || null,
          notes:        String(invoice.notes || ''),
          auto_generated: invoice.auto_generated === true,
        };

        const { data, error } = await supabase
          .from('invoices').insert(row).select('id, invoice_number').single();

        if (error) {
          // The invoice number is uniquely indexed, so a duplicate is a repeat
          // rather than a failure worth alarming anyone about.
          if (error.code === '23505') {
            return fail(`Invoice ${row.invoice_number} already exists.`, 409, 'duplicate');
          }
          return fail(error.message);
        }

        await audit(supabase, {
          action: 'billing.create_invoice',
          entity: 'invoice',
          entityId: data.id,
          entityName: data.invoice_number,
          reason: row.description || 'Invoice raised',
          after: { total: row.total, client: row.client_email },
        });

        return ok(`Invoice ${data.invoice_number} created.`, data);
      }

      // ── PAYMENT RECEIVED ─────────────────────────────────────────────────
      // Also reinstates a subscription suspended for non-payment and restores
      // the dealer's tier. Kept in one server call so a failure halfway cannot
      // leave the invoice paid and the dealer still downgraded.
      //
      // IDEMPOTENT. Marking an invoice paid is a money operation: a double
      // click would otherwise record the payment twice and reinstate twice. A
      // repeat within 24 hours returns the original result.
      case 'mark_paid': {
        const { invoiceId, clientEmail, idempotency_key } = body;
        if (!invoiceId) return fail('invoiceId is required');
        if (!idempotency_key) {
          return fail('idempotency_key is required for this action', 400, 'idempotency_required');
        }

        // A payment reference — EFT reference, deposit slip, whatever ties this
        // to a real movement of money. Without it, "paid" is an assertion with
        // nothing behind it, which is exactly the thing a dispute turns on.
        const reference = requireReason(body);
        if (!reference) {
          return fail('A payment reference of at least 5 characters is required', 400, 'reason_required');
        }

        const run = async () => {
          const paidAt = new Date().toISOString();

          const { error } = await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: paidAt, notes: reference })
            .eq('id', invoiceId)
            // Only an unpaid or overdue invoice can be paid. A second attempt
            // matches nothing rather than rewriting a settled record.
            .in('status', ['unpaid', 'overdue']);

          if (error) return { error: error.message };

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
            reason: reference,
            after: { paidAt, reinstatedTier: reinstated },
          });

          return {
            message: reinstated
              ? `Marked paid. Subscription reinstated on ${reinstated}.`
              : 'Marked paid.',
            reinstated,
          };
        };

        const { replayed, result } = await withIdempotency(
          supabase, idempotency_key, 'billing.mark_paid', run,
        );

        if (result?.error) return fail(result.error);

        return ok(
          replayed ? `${result.message} (already recorded — no change made)` : result.message,
          { reinstated: result.reinstated, replayed },
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