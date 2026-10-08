'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// --- DEALER DASHBOARD GATE ---------------------------------------------------
// Every dealer dashboard page passes through here. An approved dealer who has
// never put a card on file (no trial yet, not comped, not paying) is sent to
// the start-trial page first: agreed Oct 2026, everyone starts on a free
// Premium trial with R0 charged today. Each page still does its own sign-in
// and approval checks; this only adds the card step in front of them.

export default function DealerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      if (pathname?.startsWith('/dealer-dashboard/start-trial')) {
        setReady(true);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReady(true); // the page itself sends them to sign in
        return;
      }
      const { data: d } = await supabase
        .from('dealers')
        .select('status, trial_used, payfast_token, subscription_status, is_comped')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!alive) return;
      const needsCard = !!d
        && d.status === 'approved'
        && !d.trial_used
        && !d.payfast_token
        && !d.is_comped
        && (d.subscription_status || 'free') === 'free';
      if (needsCard) {
        router.replace('/dealer-dashboard/start-trial');
        return;
      }
      setReady(true);
    };
    setReady(false);
    check();
    return () => { alive = false; };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
