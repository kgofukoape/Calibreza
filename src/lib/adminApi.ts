import { NextResponse } from 'next/server';
import { DEALER_PLANS, type PlanId } from './plans';

// ─── ADMIN API TOOLKIT ───────────────────────────────────────────────────────
// Shared by every /api/admin/* route so they behave identically.
//
// The console can grant revenue away, refund money, reset credentials and export
// personal information, and there is no second pair of eyes on any of it. These
// helpers exist so that safety is the default rather than something each route
// has to remember.

// ─── RESPONSE ENVELOPE ───────────────────────────────────────────────────────
// One shape for every response. The admin UI can then handle success and failure
// the same way everywhere instead of each page inventing its own convention.

export function ok(message: string, data?: unknown) {
  return NextResponse.json({ ok: true, message, ...(data !== undefined ? { data } : {}) });
}

export function fail(error: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error, ...(code ? { code } : {}) }, { status });
}

// ─── INPUT VALIDATION ────────────────────────────────────────────────────────

/** Returns the name of the first missing field, or null when all are present. */
export function missingField(body: Record<string, any>, fields: string[]): string | null {
  for (const f of fields) {
    const v = body[f];
    if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) return f;
  }
  return null;
}

/**
 * Destructive and financial actions must carry a written reason.
 *
 * An audit trail whose "why" column is empty is a list of timestamps. Six months
 * from now, looking at a comped Premium account or a refund, the only useful
 * question is why it happened — and nobody remembers.
 */
export function requireReason(body: Record<string, any>): string | null {
  const reason = (body.reason || '').trim();
  if (reason.length < 5) return null;
  return reason;
}

/**
 * Validates a tier against the plan registry.
 *
 * Without this, `tier` is whatever the caller sends. Writing "banana" succeeds,
 * and every price and quota lookup downstream silently falls back to free —
 * a paid customer quietly becomes a free one and nothing reports it.
 */
export function assertTier(tier: unknown): PlanId | null {
  if (typeof tier !== 'string') return null;
  return (tier in DEALER_PLANS) ? (tier as PlanId) : null;
}

/** Business tables an admin route may touch, by name. Never a caller-supplied string. */
export const ADMIN_TABLES = {
  dealer:  'dealers',
  club:    'clubs',
  service: 'services',
  listing: 'listings',
  job:     'job_listings',
  ad:      'ads',
  user:    'users',
} as const;

export type AdminEntity = keyof typeof ADMIN_TABLES;

export function assertEntity(kind: unknown): AdminEntity | null {
  if (typeof kind !== 'string') return null;
  return (kind in ADMIN_TABLES) ? (kind as AdminEntity) : null;
}

// ─── IDEMPOTENCY ─────────────────────────────────────────────────────────────
// Money operations must not repeat.
//
// A double-click on "Refund" fires two requests. Without a guard, that is two
// refund records and — once you act on them — two EFTs. The caller sends a key
// generated once per user intent; a repeat within 24 hours returns the original
// result instead of acting again.

export interface IdempotentOutcome {
  replayed: boolean;
  result: any;
}

export async function withIdempotency(
  supabase: any,
  key: string | undefined,
  scope: string,
  fn: () => Promise<any>,
): Promise<IdempotentOutcome> {
  // No key supplied: run it. Callers doing money operations should always send
  // one, and those routes enforce it before reaching here.
  if (!key) return { replayed: false, result: await fn() };

  const { data: existing } = await supabase
    .from('admin_idempotency')
    .select('result, created_at')
    .eq('key', key)
    .maybeSingle();

  if (existing) {
    const age = Date.now() - new Date(existing.created_at).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      return { replayed: true, result: existing.result };
    }
  }

  const result = await fn();

  // Best effort: a failure to record the key must not undo work already done.
  // Worst case is that a retry acts twice, which is what would happen anyway
  // without the table.
  try {
    await supabase.from('admin_idempotency').upsert({
      key, scope, result, created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[adminApi] idempotency record failed', e);
  }

  return { replayed: false, result };
}

// ─── AUDIT ───────────────────────────────────────────────────────────────────

export interface AuditEntry {
  action: string;
  entity?: string;
  entityId?: string;
  entityName?: string;
  reason?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
}

/**
 * Records what was done, to what, and why.
 *
 * Best effort by design: a failed audit write must never block the action. An
 * administrator locked out of approving a dealer because a logging table is
 * unavailable is a worse outcome than a gap in the log.
 */
export async function audit(supabase: any, entry: AuditEntry) {
  try {
    await supabase.from('audit_log').insert({
      action: entry.action,
      actor: 'admin',
      detail: {
        entity: entry.entity,
        entity_id: entry.entityId,
        entity_name: entry.entityName,
        reason: entry.reason,
        before: entry.before,
        after: entry.after,
      },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[adminApi] audit failed', entry.action, e);
  }
}

/** Reduces a record to the fields an action changed, so the log stays readable. */
export function diffOf(before: Record<string, any>, patch: Record<string, any>) {
  const was: Record<string, any> = {};
  for (const k of Object.keys(patch)) was[k] = before?.[k] ?? null;
  return { before: was, after: patch };
}