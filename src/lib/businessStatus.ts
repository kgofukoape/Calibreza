import { supabase } from './supabase';
import { BUSINESS_TYPES, type BusinessType } from './business';

// --- BUSINESS APPROVAL STATE -------------------------------------------------
// Where a business account stands, read from its own row. Used to keep an
// unapproved business on /business/pending: until an admin approves it, it
// can see its application and wait, nothing else. The database enforces the
// same rule on listings separately, so this is the friendly half of it.
//
// Advocacy organisations are not gated here: login already treats them as
// approved unless suspended.

export interface BusinessStatus {
  type: BusinessType;
  name: string;
  status: string;
  /** True only for the type's approved status. */
  approved: boolean;
  /** Still waiting on us: not approved and not suspended. */
  needsApproval: boolean;
  createdAt: string | null;
  /** The full row, for the review note and document fields. */
  row: any;
}

export async function isBusinessAccount(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', userId)
    .maybeSingle();
  return data?.account_type === 'business';
}

function build(type: BusinessType, row: any, name: string): BusinessStatus {
  const status: string = row?.status || 'pending';
  const approved = status === type.approvedStatus;
  return {
    type,
    name,
    status,
    approved,
    // A suspended account belongs on its dashboard, which explains the
    // suspension; it is not waiting for a first approval.
    needsApproval: !approved && status !== 'suspended',
    createdAt: row?.created_at || null,
    row,
  };
}

/** The user's dealer / club / range / service record, or null if none. */
export async function getBusinessStatus(userId: string): Promise<BusinessStatus | null> {
  const { data: dealer } = await supabase
    .from('dealers').select('*').eq('user_id', userId).maybeSingle();
  if (dealer) {
    return build(BUSINESS_TYPES.dealer, dealer, dealer.business_name || 'Your business');
  }

  // Shooting clubs have their own table (Oct 2026); the clubs table is ranges.
  const { data: shootingClub } = await supabase
    .from('shooting_clubs').select('*').eq('user_id', userId).maybeSingle();
  if (shootingClub) {
    return build(BUSINESS_TYPES.club, shootingClub, shootingClub.name || 'Your club');
  }

  const { data: club } = await supabase
    .from('clubs').select('*').eq('user_id', userId).maybeSingle();
  if (club) {
    const type = club.facility_type && club.facility_type !== 'club'
      ? BUSINESS_TYPES.range
      : BUSINESS_TYPES.club;
    return build(type, club, club.name || 'Your club');
  }

  const { data: service } = await supabase
    .from('services').select('*').eq('user_id', userId).maybeSingle();
  if (service) {
    return build(BUSINESS_TYPES.service, service, service.name || 'Your business');
  }

  return null;
}

/**
 * For pages a waiting business must not use (Post Ad, the personal
 * dashboard): returns '/business/pending' when this user is a business
 * account that is not yet approved, or has no application at all.
 * Returns null for personal accounts and approved businesses.
 */
export async function pendingRedirect(userId: string): Promise<string | null> {
  if (!(await isBusinessAccount(userId))) return null;

  const { data: advocacy } = await supabase
    .from('advocacy_groups').select('status')
    .eq('owner_user_id', userId).maybeSingle();
  if (advocacy) return null;

  const s = await getBusinessStatus(userId);
  if (!s) return '/business/pending';
  return s.needsApproval ? '/business/pending' : null;
}
