import { supabase } from '@/lib/supabase';

// --- PUBLIC CLUB PAGE HELPERS ------------------------------------------------
// Public pages read shooting_clubs_public (approved clubs, public columns
// only). All dates and times are shown in South African time.

export const TYPE_LABEL: Record<string, string> = {
  shoot: 'Club shoot',
  match: 'Match',
  competition: 'Competition',
  training: 'Training',
  social: 'Social',
};

export const PERIOD_LABEL: Record<string, string> = {
  year: 'per year',
  month: 'per month',
  once: 'once-off',
};

/** YYYY-MM-DD of a moment, in South African time. */
export function sastDate(iso: string): string {
  return new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-ZA', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg',
  });
}

export function fmtWhen(start: string, end?: string | null, long = false): string {
  const day = new Date(start).toLocaleDateString('en-ZA', {
    weekday: long ? 'long' : 'short', day: 'numeric', month: long ? 'long' : 'short',
    year: 'numeric', timeZone: 'Africa/Johannesburg',
  });
  return `${day}, ${fmtTime(start)}${end ? ` to ${fmtTime(end)}` : ''}`;
}

/** WhatsApp link: a number (SA 0 prefix becomes 27) and/or a message. */
export function waLink(number?: string | null, text?: string): string {
  const msg = text ? `text=${encodeURIComponent(text)}` : '';
  if (!number) return `https://wa.me/?${msg}`;
  let d = number.replace(/\D/g, '');
  if (d.startsWith('0')) d = '27' + d.slice(1);
  return `https://wa.me/${d}${msg ? `?${msg}` : ''}`;
}

/** Only http(s) links are shown. */
export function safeUrl(u?: string | null): string | null {
  if (!u) return null;
  return /^https?:\/\//i.test(u.trim()) ? u.trim() : null;
}

export function mapsLink(club: { lat?: number | null; lng?: number | null; address?: string | null }): string | null {
  if (club.lat != null && club.lng != null) return `https://www.google.com/maps/search/?api=1&query=${club.lat},${club.lng}`;
  if (club.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(club.address)}`;
  return null;
}

/** Count a page view: once per club per browser per day, never the owner. */
export async function recordClubView(clubId: string): Promise<void> {
  const key = `gx_cv_${clubId}_${sastDate(new Date().toISOString())}`;
  try {
    if (localStorage.getItem(key)) return;
  } catch {
    return;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: own } = await supabase.from('shooting_clubs').select('id')
      .eq('id', clubId).eq('user_id', user.id).maybeSingle();
    if (own) return;
  }
  await supabase.rpc('record_club_view', { p_club_id: clubId });
  try { localStorage.setItem(key, '1'); } catch { /* private browsing */ }
}
