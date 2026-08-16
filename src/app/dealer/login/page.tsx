'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── LEGACY REDIRECT ─────────────────────────────────────────────────────────
// /dealer/login was never dealer-only — it handled clubs, ranges and service
// providers too, which is part of why the flow was confusing. The real page is
// now /business/login.
//
// This stub exists so existing bookmarks, emails and any links already out in
// the world keep working. replace() rather than push() so the old URL does not
// sit in the back-button history.

export default function DealerLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/business/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
      <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">
        Redirecting to business login…
      </p>
    </div>
  );
}
