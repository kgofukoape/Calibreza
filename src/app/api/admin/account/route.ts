import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminGuard';
import { ok, fail, missingField, requireReason, audit } from '@/lib/adminApi';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── ADMIN ACCOUNT CONTROL ───────────────────────────────────────────────────
// POST /api/admin/account
//
//   send_reset_link   email the account holder a password recovery link
//   confirm_email     mark an address confirmed, for a stuck signup
//   delete            remove the account and everything cascading from it
//   lookup            find an account by email
//
// ON PASSWORDS: A LINK, NEVER A NEW PASSWORD
// Supabase would let an administrator set a password outright. This route
// refuses to, and that is deliberate.
//
// An administrator who can set a password can sign in as anyone, do something,
// and the account holder has no way to prove it was not them. That is bad for
// them and worse for you: the moment you can enter any account, you lose the
// ability to say with confidence that the account holder must have done a
// thing themselves. A recovery link keeps that line intact — only the person
// holding the mailbox can complete it.

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response!;

  const ip = getClientIp(req);
  const limit = rateLimit(`admin-account:${ip}`, 40, 60 * 60 * 1000);
  if (!limit.allowed) return fail('Too many requests. Try again shortly.', 429);

  try {
    const body = await req.json();
    const { action } = body as { action: string };

    const missing = missingField(body, ['action']);
    if (missing) return fail(`${missing} is required`);

    switch (action) {

      // ── FIND AN ACCOUNT ──────────────────────────────────────────────────
      case 'lookup': {
        const email = String(body.email || '').trim().toLowerCase();
        if (!email) return fail('email is required');

        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, account_type, phone, province, created_at, status')
          .ilike('email', email)
          .maybeSingle();

        if (!profile) return fail('No account with that address', 404);

        // What businesses does this account hold? Useful before deleting.
        const [dealers, clubs, services, listings] = await Promise.all([
          supabase.from('dealers').select('id, business_name, status').eq('user_id', profile.id),
          supabase.from('clubs').select('id, name, status').eq('user_id', profile.id),
          supabase.from('services').select('id, business_name, status').eq('user_id', profile.id),
          supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', profile.id),
        ]);

        return ok('Account found', {
          profile,
          dealers:  dealers.data  || [],
          clubs:    clubs.data    || [],
          services: services.data || [],
          listingCount: listings.count || 0,
        });
      }

      // ── PASSWORD RECOVERY LINK ───────────────────────────────────────────
      case 'send_reset_link': {
        const email = String(body.email || '').trim().toLowerCase();
        if (!email) return fail('email is required');

        const { data, error } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
          },
        });

        if (error) return fail(error.message);

        await audit(supabase, {
          action: 'account.send_reset_link',
          entity: 'user',
          entityName: email,
          reason: body.reason || 'Password reset requested',
        });

        // Supabase sends the email itself when SMTP is configured. The link is
        // returned so you can read it to someone over the phone if their mail
        // is the thing that is broken — which is often exactly the situation.
        return ok(
          `Recovery link sent to ${email}. It expires in 1 hour.`,
          { link: data?.properties?.action_link },
        );
      }

      // ── CONFIRM AN EMAIL BY HAND ─────────────────────────────────────────
      // For a signup stuck because the confirmation mail bounced or was eaten
      // by a spam filter. Confirming the address is not the same as setting a
      // password: they still have to know their own.
      case 'confirm_email': {
        const userId = String(body.userId || '');
        if (!userId) return fail('userId is required');

        const { error } = await supabase.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
        if (error) return fail(error.message);

        await audit(supabase, {
          action: 'account.confirm_email',
          entity: 'user',
          entityId: userId,
          reason: body.reason || 'Confirmed manually by administrator',
        });

        return ok('Email address confirmed. They can now sign in.');
      }

      // ── DELETE ───────────────────────────────────────────────────────────
      // Deletes the auth user, which cascades to the profile and everything
      // keyed to it. Irreversible, so it needs a written reason.
      //
      // Note that legal_consents deliberately survives: its foreign key is
      // ON DELETE SET NULL and the row is append-only, so the record of what
      // was agreed to remains even when the account is gone. That is the point
      // of the consent table — evidence should outlive the account.
      case 'delete': {
        const userId = String(body.userId || '');
        if (!userId) return fail('userId is required');

        const reason = requireReason(body);
        if (!reason) return fail('A reason of at least 5 characters is required to delete an account', 400, 'reason_required');

        const { data: profile } = await supabase
          .from('users').select('email, full_name').eq('id', userId).maybeSingle();

        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) {
          return fail(
            `${error.message}. A record still referencing this account is usually the cause — check dealers, clubs and services first.`,
          );
        }

        await audit(supabase, {
          action: 'account.delete',
          entity: 'user',
          entityId: userId,
          entityName: profile?.email,
          reason,
        });

        return ok(`${profile?.email || 'Account'} deleted.`);
      }

      default:
        return fail(`Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('[admin/account]', error);
    return fail(error.message, 500);
  }
}