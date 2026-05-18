'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('gunx_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('gunx_sid', sid);
  }
  return sid;
};

export default function PageTracker() {
  const pathname     = usePathname();
  const sessionRef   = useRef<string>('');
  const heartbeatRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    sessionRef.current = getSessionId();
  }, []);

  // Track page view on every route change
  useEffect(() => {
    if (!pathname || !sessionRef.current) return;
    if (pathname.startsWith('/admin')) return;

    const track = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Record page view — column is "path" not "page"
        await supabase.from('page_views').insert({
          path:       pathname,
          referrer:   typeof document !== 'undefined' ? (document.referrer || null) : null,
          session_id: sessionRef.current,
          user_id:    user?.id || null,
        });

        // Upsert active visitor — table is "active_visitors" not "active_sessions"
        await supabase.from('active_visitors').upsert({
          session_id: sessionRef.current,
          path:       pathname,
          last_seen:  new Date().toISOString(),
          user_id:    user?.id || null,
        }, { onConflict: 'session_id' });

      } catch {
        // Silent fail — tracking never breaks the site
      }
    };

    track();
  }, [pathname]);

  // Heartbeat every 30s to keep active_visitors fresh
  useEffect(() => {
    if (!sessionRef.current || !pathname) return;
    if (pathname.startsWith('/admin')) return;

    const heartbeat = async () => {
      try {
        await supabase.from('active_visitors').upsert({
          session_id: sessionRef.current,
          path:       pathname,
          last_seen:  new Date().toISOString(),
        }, { onConflict: 'session_id' });
      } catch {}
    };

    heartbeatRef.current = setInterval(heartbeat, 30000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [pathname]);

  // Remove visitor on tab close
  useEffect(() => {
    const cleanup = () => {
      if (!sessionRef.current) return;
      supabase.from('active_visitors')
        .delete()
        .eq('session_id', sessionRef.current)
        .then(() => {});
    };
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  return null;
}
