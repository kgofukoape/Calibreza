'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useClubPortal } from '@/components/club-portal/ClubPortalContext';
import { PortalTitle, Panel, sastMonth, fmtDate, validity } from '@/components/club-portal/ui';

export default function ClubPortalOverview() {
  const { club } = useClubPortal();
  const [views, setViews] = useState(0);
  const [upcoming, setUpcoming] = useState(0);
  const [next, setNext] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const nowIso = new Date().toISOString();
      const [{ data: v }, { data: ev, count }] = await Promise.all([
        supabase.from('club_page_views').select('views')
          .eq('club_id', club.id).eq('month', sastMonth()).maybeSingle(),
        supabase.from('club_events').select('id, title, starts_at, event_type', { count: 'exact' })
          .eq('club_id', club.id).eq('is_cancelled', false).gte('starts_at', nowIso)
          .order('starts_at', { ascending: true }).limit(1),
      ]);
      setViews(v?.views || 0);
      setUpcoming(count || 0);
      setNext(ev?.[0] || null);
    })();
  }, [club.id]);

  const checklist: Array<[boolean, string, string]> = [
    [!!club.logo_url, 'Add your logo', '/club-portal/profile'],
    [!!club.cover_url, 'Add a cover photo', '/club-portal/profile'],
    [(club.description || '').length >= 20, 'Describe your club', '/club-portal/profile'],
    [upcoming > 0, 'Add an upcoming event', '/club-portal/calendar'],
    [(club.membership_options || []).length > 0, 'Add membership options', '/club-portal/membership'],
    [(club.images || []).length > 0, 'Add photos to your gallery', '/club-portal/gallery'],
  ];
  const done = checklist.filter(([ok]) => ok).length;
  const valid = validity(club.compliance_valid_until);

  const stat = (label: string, value: React.ReactNode) => (
    <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">{label}</p>
      <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black text-[#C9922A] leading-none">{value}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PortalTitle a="Welcome," b={club.name} sub="Everything about your club page in one place." />

      {valid === 'expired' && (
        <div className="p-4 rounded-sm border bg-[#E63946]/10 border-[#E63946]/30 text-[13px] leading-relaxed">
          <strong className="text-[#E63946]">Your {club.compliance_status === 'accredited' ? 'accreditation' : 'affiliation'} expired on {fmtDate(club.compliance_valid_until)}.</strong>{' '}
          Email the new letter or certificate to <a className="text-[#C9922A]" href="mailto:support@gunx.co.za">support@gunx.co.za</a>.
        </div>
      )}
      {valid === 'soon' && (
        <div className="p-4 rounded-sm border bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[13px] leading-relaxed">
          <strong className="text-[#F59E0B]">Your {club.compliance_status === 'accredited' ? 'accreditation' : 'affiliation'} expires on {fmtDate(club.compliance_valid_until)}.</strong>{' '}
          Email the new one to <a className="text-[#C9922A]" href="mailto:support@gunx.co.za">support@gunx.co.za</a> when you have it.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stat('Page views this month', views)}
        {stat('Upcoming events', upcoming)}
        {stat('Page complete', `${done} of ${checklist.length}`)}
      </div>

      <Panel title="Complete your page">
        <div className="flex flex-col gap-2">
          {checklist.map(([ok, text, href]) => (
            <Link key={text} href={href}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-sm bg-[#0D0F13] border border-white/5 hover:border-[#C9922A]/40">
              <span className={`text-[13px] ${ok ? 'text-[#8A8E99] line-through' : 'text-[#F0EDE8]'}`}>{text}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${ok ? 'text-[#2A9C6E]' : 'text-[#C9922A]'}`}>
                {ok ? 'Done' : 'Add'}
              </span>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Next event">
        {next ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-black text-[15px]">{next.title}</p>
              <p className="text-[13px] text-[#8A8E99]">
                {new Date(next.starts_at).toLocaleString('en-ZA', {
                  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                  timeZone: 'Africa/Johannesburg',
                })}
              </p>
            </div>
            <Link href="/club-portal/calendar" className="text-[11px] font-black uppercase tracking-widest text-[#C9922A]">Open calendar</Link>
          </div>
        ) : (
          <p className="text-[13px] text-[#8A8E99]">
            No upcoming events.{' '}
            <Link href="/club-portal/calendar" className="text-[#C9922A] font-bold">Add your first one</Link>.
          </p>
        )}
      </Panel>
    </div>
  );
}
