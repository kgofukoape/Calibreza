'use client';

import React from 'react';

// --- CLUB PORTAL UI ----------------------------------------------------------
// Small shared pieces so every portal page looks the same.

export const inputCls =
  'w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[14px] text-[#F0EDE8] ' +
  'focus:outline-none focus:border-[#C9922A]/60 disabled:opacity-50';
export const labelCls = 'block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5';
export const goldBtn =
  'bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm ' +
  'hover:brightness-110 transition-all disabled:opacity-50';
export const ghostBtn =
  'border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-5 py-3 rounded-sm ' +
  'hover:bg-white/5 transition-all disabled:opacity-50';

export function PortalTitle({ a, b, sub }: { a: string; b: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl md:text-4xl font-black uppercase">
        {a} <span className="text-[#C9922A]">{b}</span>
      </h1>
      {sub && <p className="text-[#8A8E99] text-[13px] mt-1 leading-relaxed">{sub}</p>}
    </div>
  );
}

export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6">
      {title && (
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export function Notice({ kind, children }: { kind: 'ok' | 'err' | 'warn'; children: React.ReactNode }) {
  const cls = kind === 'ok'
    ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]'
    : kind === 'warn'
      ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
      : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]';
  return <div className={`p-4 rounded-sm text-[13px] font-bold border leading-relaxed ${cls}`}>{children}</div>;
}

/** First day of the current month in South African time, as YYYY-MM-01. */
export function sastMonth(offsetMonths = 0): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offsetMonths, 1));
  return m.toISOString().slice(0, 10);
}

export function fmtDate(d?: string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Johannesburg',
  });
}

/** 'expired' | 'soon' (within 30 days) | 'ok' | null when no date is on file. */
export function validity(until?: string | null): 'expired' | 'soon' | 'ok' | null {
  if (!until) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (until < today) return 'expired';
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  return until <= soon ? 'soon' : 'ok';
}
