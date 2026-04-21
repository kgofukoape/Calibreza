'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const getDevice = () => {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
  return 'desktop';
};

const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('gunx_session_id');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('gunx_session_id', sid);
  }
  return sid;
};

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin')) return;

    const sessionId = getSessionId();
    const device = getDevice();

    // Log page view
    supabase.from('page_views').insert({
      page: pathname, session_id: sessionId, device,
    }).then(() => {});

    // Upsert active session
    supabase.from('active_sessions').upsert({
      session_id: sessionId,
      page: pathname,
      device,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'session_id' }).then(() => {});

    // Log dealer storefront view as lead event
    const dealerMatch = pathname.match(/^\/dealers\/(.+)$/);
    if (dealerMatch) {
      supabase.from('dealers').select('id').eq('slug', dealerMatch[1]).single()
        .then(({ data }) => {
          if (data) {
            supabase.from('lead_events').insert({
              event_type: 'storefront_view',
              dealer_id: data.id,
              session_id: sessionId,
            }).then(() => {});
          }
        });
    }

    // Heartbeat every 2 minutes
    const heartbeat = setInterval(() => {
      supabase.from('active_sessions')
        .update({ last_seen: new Date().toISOString(), page: pathname })
        .eq('session_id', sessionId).then(() => {});
    }, 120000);

    return () => clearInterval(heartbeat);
  }, [pathname]);

  return null;
}

// Exportable helper — call this anywhere a lead event occurs
export const trackLead = async (
  eventType: string,
  dealerId?: string,
  listingId?: string
) => {
  const sessionId = getSessionId();
  await supabase.from('lead_events').insert({
    event_type: eventType,
    dealer_id: dealerId || null,
    listing_id: listingId || null,
    session_id: sessionId,
  });
};

// Exportable helper — track ad impression or click with dedup
export const trackAdEvent = async (
  adId: string,
  eventType: 'impression' | 'click',
  page: string
) => {
  const sessionId = getSessionId();

  if (eventType === 'click') {
    // Dedup: only 1 click per ad per session per hour
    const now = new Date();
    const hourBucket = `${adId}:${sessionId}:${now.toISOString().slice(0, 13)}`;
    const { error } = await supabase.from('ad_click_log').insert({
      ad_id: adId, session_id: sessionId, hour_bucket: hourBucket,
    });
    if (error) return; // duplicate — don't count
    // Increment click count
    await supabase.rpc('increment_ad_clicks', { ad_id_input: adId });
  } else {
    // Log impression
    await supabase.from('ad_events').insert({
      ad_id: adId, event_type: 'impression', session_id: sessionId, page,
    });
    await supabase.rpc('increment_ad_impressions', { ad_id_input: adId });
  }
};