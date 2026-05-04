'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ServiceDashboardPage() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/dealer/login');
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex items-center justify-center">
      <div className="text-center">
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          className="text-4xl font-black uppercase tracking-tight mb-2">
          Service <span className="text-[#C9922A]">Dashboard</span>
        </div>
        <p className="text-[#8A8E99] text-[13px]">Coming soon.</p>
      </div>
    </div>
  );
}