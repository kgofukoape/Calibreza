'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';

export default function ServiceDashboardPage() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/dealer/login');
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center flex-col gap-6 px-4">
        <div className="text-center">
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl font-black uppercase tracking-tight mb-2">
            Service <span className="text-[#C9922A]">Dashboard</span>
          </div>
          <p className="text-[#8A8E99] text-[13px] mb-6">Coming soon. Service provider features are in development.</p>
          <Link href="/"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="inline-block border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
