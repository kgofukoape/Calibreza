'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ClubPortalContext } from '@/components/club-portal/ClubPortalContext';

// --- CLUB PORTAL FRAME -------------------------------------------------------
// Shooting clubs only (their own table). Approved clubs use the portal;
// suspended clubs see it read-only with the reason; anyone else goes to the
// pending page. Ranges never come here: they have /club-dashboard.

const MENU: Array<[string, string]> = [
  ['/club-portal', 'Overview'],
  ['/club-portal/profile', 'Club profile'],
  ['/club-portal/calendar', 'Calendar'],
  ['/club-portal/membership', 'Membership'],
  ['/club-portal/gallery', 'Gallery'],
  ['/club-portal/analytics', 'Analytics'],
  ['/club-portal/documents', 'Documents'],
  ['/club-portal/settings', 'Settings'],
];

export default function ClubPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [state, setState] = useState<{ club: any; userId: string; email: string } | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/business/login');
      return;
    }
    const { data: club } = await supabase
      .from('shooting_clubs').select('*').eq('user_id', user.id).maybeSingle();
    if (!club || !['approved', 'suspended'].includes(club.status)) {
      router.replace('/business/pending');
      return;
    }
    setState({ club, userId: user.id, email: user.email || '' });
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (!state) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <p className="text-[#8A8E99] text-sm">Loading your club...</p>
      </div>
    );
  }

  const { club } = state;
  const readOnly = club.status === 'suspended';
  const active = (href: string) => (href === '/club-portal' ? pathname === href : pathname.startsWith(href));

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/business/login');
  };

  return (
    <ClubPortalContext.Provider value={{ ...state, readOnly, reload: load }}>
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] md:flex">
        <aside className="md:w-[250px] md:min-h-screen bg-[#13151A] border-b md:border-b-0 md:border-r border-white/5 flex-shrink-0">
          <div className="px-4 md:px-6 pt-5 pb-3 md:pb-5 md:border-b border-white/5 flex items-center justify-between md:block">
            <Link href="/" className="block">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black leading-none">
                GUN <span className="text-[#C9922A]">X</span>
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#8A8E99] mt-1">Club portal</p>
            </Link>
            <button onClick={signOut} className="md:hidden text-[11px] font-black uppercase tracking-widest text-[#E63946]">
              Sign out
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-white/5">
            {club.logo_url
              ? <img src={club.logo_url} alt="" className="w-11 h-11 rounded-sm object-cover flex-shrink-0" />
              : <div className="w-11 h-11 rounded-sm bg-[#C9922A] text-black font-black flex items-center justify-center flex-shrink-0">
                  {(club.name || 'C').charAt(0)}
                </div>}
            <div className="min-w-0">
              <p className="font-black text-[13px] leading-tight truncate">{club.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#8A8E99] truncate">{club.city}</p>
              {club.is_verified && <p className="text-[9px] font-black uppercase tracking-widest text-[#2A9C6E] mt-0.5">Verified</p>}
            </div>
          </div>

          <nav className="flex md:flex-col overflow-x-auto gap-1 px-2 md:px-3 pb-2 md:py-4">
            {MENU.map(([href, label]) => (
              <Link key={href} href={href}
                className={`whitespace-nowrap px-3 py-2.5 rounded-sm text-[11px] md:text-[12px] font-black uppercase tracking-widest transition-all ${
                  active(href) ? 'bg-[#C9922A]/15 text-[#C9922A]' : 'text-[#8A8E99] hover:text-[#F0EDE8] hover:bg-white/5'}`}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex flex-col gap-2 px-3 pb-6">
            {club.status === 'approved' && (
              <Link href={`/clubs/${club.slug}`} target="_blank"
                className="px-3 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest text-[#F0EDE8] border border-white/10 hover:bg-white/5 text-center">
                View public page
              </Link>
            )}
            <button onClick={signOut}
              className="px-3 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest text-[#E63946] border border-[#E63946]/30 hover:bg-[#E63946]/10">
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8 max-w-[1000px]">
          {readOnly && (
            <div className="mb-6 p-4 rounded-sm border bg-[#E63946]/10 border-[#E63946]/30 text-[13px] leading-relaxed">
              <p className="font-black text-[#E63946] uppercase tracking-widest text-[11px] mb-1">Club suspended</p>
              <p className="text-[#F0EDE8]">
                Your page is hidden from the public and this portal is read-only.
                {club.suspended_reason ? ` Reason: ${club.suspended_reason}` : ''} Questions:{' '}
                <a href="mailto:support@gunx.co.za" className="text-[#C9922A]">support@gunx.co.za</a>
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </ClubPortalContext.Provider>
  );
}
