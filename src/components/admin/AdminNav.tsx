'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── ADMIN NAVIGATION ────────────────────────────────────────────────────────
// One nav for the whole console.
//
// There were two of them, and they disagreed. The Overview listed eleven
// destinations, Tokoloshe listed eight, and neither included Ad Manager or
// Verification — so a 1,097-line Ad Manager and the SAPS/PSIRA document queue
// were reachable only by typing the URL.
//
// A single component means the next page added is visible from everywhere, and
// the active state is derived from the path rather than hand-set per page and
// forgotten.

export interface AdminNavCounts {
  pendingDealers?: number;
  pendingClubs?: number;
  pendingServices?: number;
  pendingJobs?: number;
  pendingListings?: number;
  pendingVerification?: number;
  pendingAds?: number;
}

interface NavItem {
  href: string;
  icon: string;
  label: string;
  countKey?: keyof AdminNavCounts;
  group: 'review' | 'manage' | 'insight';
}

// Grouped by what you are doing, not alphabetically: things awaiting a decision
// first, because that is why you opened the console.
const NAV: NavItem[] = [
  { href: '/admin',              icon: '⚡',  label: 'Overview',      group: 'review' },
  { href: '/admin/dealers',      icon: '🏪', label: 'Dealers',       countKey: 'pendingDealers',      group: 'review' },
  { href: '/admin/clubs',        icon: '⊕',  label: 'Clubs & Ranges',countKey: 'pendingClubs',        group: 'review' },
  { href: '/admin/services',     icon: '🔧', label: 'Services',      countKey: 'pendingServices',     group: 'review' },
  // Verification retired: documents are collected at application and reviewed
  // on the Dealers, Clubs and Services pages. A second system collecting the
  // same certificates was a maintenance cost with no extra safety, and nothing
  // ever linked to its upload form.
  { href: '/admin/jobs',         icon: '💼', label: 'Jobs',          countKey: 'pendingJobs',         group: 'review' },
  { href: '/admin/listings',     icon: '📋', label: 'Listings',      countKey: 'pendingListings',     group: 'review' },

  { href: '/admin/users',         icon: '👥', label: 'Users',         group: 'manage' },
  { href: '/admin/subscriptions', icon: '🔄', label: 'Subscriptions', group: 'manage' },
  { href: '/admin/crm',           icon: '💰', label: 'CRM & Invoices',group: 'manage' },
  { href: '/admin/ads',           icon: '📢', label: 'Ad Manager',    countKey: 'pendingAds',          group: 'manage' },
  { href: '/admin/broadcast',     icon: '✉️',  label: 'Broadcast',     group: 'manage' },

  { href: '/admin/analytics',    icon: '📈', label: 'Analytics',     group: 'insight' },
  { href: '/admin/sentinel',     icon: '👁️', label: 'Tokoloshe',     group: 'insight' },
  { href: '/admin/diagnostics',  icon: '🩺', label: 'Diagnostics',   group: 'insight' },
];

const GROUP_LABEL: Record<NavItem['group'], string> = {
  review:  'Needs Review',
  manage:  'Manage',
  insight: 'Insight',
};

export default function AdminNav({ counts = {} }: { counts?: AdminNavCounts }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const groups: NavItem['group'][] = ['review', 'manage', 'insight'];

  return (
    <nav className="space-y-6">
      {groups.map(group => (
        <div key={group}>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 px-3 mb-2">
            {GROUP_LABEL[group]}
          </p>

          <div className="space-y-1">
            {NAV.filter(i => i.group === group).map(item => {
              const active = isActive(item.href);
              const count = item.countKey ? counts[item.countKey] : undefined;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-black text-[11px] uppercase tracking-widest transition-all ${
                    active
                      ? 'bg-[#C9922A]/10 text-[#C9922A] border-l-2 border-[#C9922A]'
                      : 'text-white/50 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                  }`}
                >
                  <span className="text-[13px]">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>

                  {/* Only shown when there is something waiting. A row of zeroes
                      trains you to stop reading the numbers. */}
                  {typeof count === 'number' && count > 0 && (
                    <span className="bg-[#E63946] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-white/5 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-[#C9922A] hover:bg-[#C9922A]/10 font-black text-[11px] uppercase tracking-widest transition-all"
        >
          <span className="text-[13px]">↩</span>
          <span>Back to Site</span>
        </Link>

        <button
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/admin/login';
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-white/40 hover:bg-white/5 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all"
        >
          <span className="text-[13px]">⏻</span>
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}