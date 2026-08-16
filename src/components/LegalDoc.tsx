'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── SHARED LEGAL DOCUMENT LAYOUT ────────────────────────────────────────────
// Used by /terms, /privacy, /popi, /dealer-terms, /legal, /takedown and /paia
// so every legal page looks and behaves the same. Each page supplies its own
// title and sections.
//
// Section content is a plain string. It supports a small, deliberate subset of
// markdown so the legal documents can be pasted in close to their source form:
//
//   **bold**                  → emphasised term
//   > quoted line             → callout box (warnings, important notices)
//   - bullet                  → unordered list
//   1. numbered               → ordered list
//   | col | col |             → table (a |---|---| separator row is optional)
//   name@domain.co.za         → automatically becomes a mailto link
//
// Blocks are separated by a blank line. Anything not matching the above is
// rendered as a paragraph, with single newlines preserved.

export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

interface LegalDocProps {
  eyebrow?: string;
  titleLead: string;
  titleAccent: string;
  intro: string;
  updated: string;
  /** Optional label before the date. Defaults to "Last updated". */
  updatedLabel?: string;
  /** Optional document version, e.g. "3.0". */
  version?: string;
  /** Optional prominent notice shown above the contents list. */
  notice?: string;
  sections: LegalSection[];
  draftNotice?: boolean;
}

const EMAIL_PATTERN = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
const EMAIL_SPLIT = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

/** Renders **bold** and turns email addresses into mailto links. */
function renderInline(text: string, keyPrefix: string): React.ReactNode {
  const nodes: React.ReactNode[] = [];

  text.split(/(\*\*[^*]+\*\*)/g).forEach((chunk, i) => {
    if (!chunk) return;

    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="text-[#F0EDE8] font-semibold">
          {chunk.slice(2, -2)}
        </strong>
      );
      return;
    }

    chunk.split(EMAIL_SPLIT).forEach((piece, j) => {
      if (!piece) return;
      if (EMAIL_PATTERN.test(piece) && piece.indexOf('@') > -1 && !piece.includes(' ')) {
        nodes.push(
          <a
            key={`${keyPrefix}-m${i}-${j}`}
            href={`mailto:${piece}`}
            className="text-[#C9922A] underline underline-offset-2 hover:brightness-125"
          >
            {piece}
          </a>
        );
      } else {
        nodes.push(<React.Fragment key={`${keyPrefix}-t${i}-${j}`}>{piece}</React.Fragment>);
      }
    });
  });

  return nodes;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cell => cell.trim());
}

/** Renders one block: callout, table, list, or paragraph. */
function renderBlock(block: string, key: string): React.ReactNode {
  const lines = block.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return null;

  // ── Callout: every line begins with ">" ──────────────────────────────────
  if (lines.every(line => line.trimStart().startsWith('>'))) {
    const body = lines
      .map(line => line.replace(/^\s*>\s?/, '').replace(/^#+\s*/, ''))
      .filter(line => line.trim() !== '');

    return (
      <div
        key={key}
        className="border-l-2 border-[#C9922A] bg-[#C9922A]/[0.07] pl-4 pr-4 py-3.5 mb-4 rounded-r-sm"
      >
        {body.map((line, i) => (
          <p
            key={`${key}-c${i}`}
            className="text-[13.5px] text-[#C4C0B8] leading-relaxed mb-2 last:mb-0"
          >
            {renderInline(line, `${key}-c${i}`)}
          </p>
        ))}
      </div>
    );
  }

  // ── Table: first line starts with "|" ────────────────────────────────────
  if (lines[0].trim().startsWith('|') && lines.length >= 2) {
    const rows = lines
      .filter(line => !/^\s*\|[\s:|-]+\|\s*$/.test(line))
      .map(splitRow);

    if (rows.length > 0) {
      const [headRow, ...bodyRows] = rows;
      const hasHeader = headRow.some(cell => cell !== '');

      return (
        <div key={key} className="mb-4 -mx-1 overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[420px]">
            {hasHeader && (
              <thead>
                <tr>
                  {headRow.map((cell, i) => (
                    <th
                      key={`${key}-h${i}`}
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="text-left align-top font-black uppercase tracking-widest text-[11px] text-[#C9922A] border-b border-[#C9922A]/25 px-3 py-2"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(hasHeader ? bodyRows : rows).map((row, r) => (
                <tr key={`${key}-r${r}`} className="border-b border-white/5 last:border-0">
                  {row.map((cell, c) => (
                    <td
                      key={`${key}-r${r}c${c}`}
                      className="align-top text-[#8A8E99] leading-relaxed px-3 py-2.5"
                    >
                      {renderInline(cell, `${key}-r${r}c${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  // ── Ordered list ─────────────────────────────────────────────────────────
  if (lines.every(line => /^\s*\d+\.\s+/.test(line))) {
    return (
      <ol key={key} className="mb-4 space-y-2">
        {lines.map((line, i) => (
          <li key={`${key}-o${i}`} className="flex gap-3 text-[14px] text-[#8A8E99] leading-relaxed">
            <span className="text-[#C9922A] font-black text-[12px] pt-[3px] flex-shrink-0 tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span>{renderInline(line.replace(/^\s*\d+\.\s+/, ''), `${key}-o${i}`)}</span>
          </li>
        ))}
      </ol>
    );
  }

  // ── Unordered list ───────────────────────────────────────────────────────
  if (lines.every(line => /^\s*[-•]\s+/.test(line))) {
    return (
      <ul key={key} className="mb-4 space-y-2">
        {lines.map((line, i) => (
          <li key={`${key}-u${i}`} className="flex gap-3 text-[14px] text-[#8A8E99] leading-relaxed">
            <span className="text-[#C9922A] flex-shrink-0 pt-[1px]">—</span>
            <span>{renderInline(line.replace(/^\s*[-•]\s+/, ''), `${key}-u${i}`)}</span>
          </li>
        ))}
      </ul>
    );
  }

  // ── Paragraph ────────────────────────────────────────────────────────────
  return (
    <p key={key} className="text-[14px] text-[#8A8E99] leading-relaxed mb-3 whitespace-pre-line">
      {renderInline(block, key)}
    </p>
  );
}

function renderContent(content: string, sectionId: string): React.ReactNode {
  return content
    .split(/\n\s*\n/)
    .map((block, i) => renderBlock(block, `${sectionId}-${i}`))
    .filter(Boolean);
}

export default function LegalDoc({
  eyebrow = 'Legal',
  titleLead,
  titleAccent,
  intro,
  updated,
  updatedLabel = 'Last updated',
  version,
  notice,
  sections,
  draftNotice = false,
}: LegalDocProps) {
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.id ?? null);

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-[800px] mx-auto">
          <p className="text-[#C9922A] text-[11px] font-black uppercase tracking-[0.4em] mb-3">{eyebrow}</p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
            {titleLead} <span className="text-[#C9922A]">{titleAccent}</span>
          </h1>
          <p className="text-[#8A8E99] text-sm leading-relaxed mb-2">
            GX SA (Pty) Ltd · Registration 2025/830094/07
            {version ? ` · Version ${version}` : ''} · {updatedLabel}: {updated}
          </p>
          <p className="text-[#8A8E99] text-sm leading-relaxed">{intro}</p>
        </div>
      </div>

      <div className="flex-1 max-w-[800px] mx-auto w-full px-4 md:px-6 py-10 md:py-16">

        {draftNotice && (
          <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-sm p-4 mb-8">
            <p className="text-[12px] text-[#F59E0B] leading-relaxed">
              <strong className="font-black uppercase tracking-widest">Under legal review</strong><br />
              This document is a working version pending final sign-off by our attorneys. It reflects
              how we operate, but should not be relied on as final legal advice. Questions:{' '}
              <a href="mailto:support@gunx.co.za" className="underline hover:brightness-125">support@gunx.co.za</a>
            </p>
          </div>
        )}

        {/* DOCUMENT-LEVEL NOTICE */}
        {notice && (
          <div className="border border-[#C9922A]/30 bg-[#C9922A]/[0.07] rounded-sm p-5 mb-8">
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] mb-3">
              Important notice
            </p>
            {notice.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="text-[13.5px] text-[#C4C0B8] leading-relaxed mb-2 last:mb-0">
                {renderInline(para, `notice-${i}`)}
              </p>
            ))}
          </div>
        )}

        {/* QUICK NAV */}
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-5 mb-8">
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">
            Contents
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map(s => (
              <button key={s.id}
                onClick={() => { setOpenSection(s.id); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}
                className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:border-[#C9922A]/40 hover:text-[#C9922A] transition-all">
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* SECTIONS */}
        <div className="space-y-3">
          {sections.map((section, idx) => (
            <div key={section.id} id={section.id}
              className={`border rounded-sm transition-all ${openSection === section.id ? 'border-[#C9922A]/30 bg-[#C9922A]/5' : 'border-white/5 bg-[#13151A] hover:border-white/10'}`}>
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                aria-expanded={openSection === section.id}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4">
                <span className="flex items-baseline gap-3">
                  <span className="text-[#C9922A] font-black text-[13px]">{String(idx + 1).padStart(2, '0')}</span>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="font-black uppercase tracking-tight text-[17px] md:text-[19px]">
                    {section.title}
                  </span>
                </span>
                <span className={`text-[#C9922A] text-lg flex-shrink-0 transition-transform ${openSection === section.id ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openSection === section.id && (
                <div className="px-5 pb-5 md:pl-[3.1rem]">
                  {renderContent(section.content, section.id)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER LINKS */}
        <div className="mt-10 pt-6 border-t border-white/5">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Related</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['Terms of Use', '/terms'],
              ['Privacy Policy', '/privacy'],
              ['POPI Act', '/popi'],
              ['Dealer Agreement', '/dealer-terms'],
              ['Legal Disclaimer', '/legal'],
              ['Advertising Policy', '/advertising-policy'],
              ['Takedown Procedure', '/takedown'],
              ['PAIA Manual', '/paia'],
            ].map(([label, href]) => (
              <Link key={href} href={href}
                className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:border-[#C9922A]/40 hover:text-[#C9922A] transition-all">
                {label}
              </Link>
            ))}
          </div>
          <p className="text-[12px] text-[#8A8E99] mt-5 leading-relaxed">
            GX SA (Pty) Ltd · Registration 2025/830094/07<br />
            <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-125">support@gunx.co.za</a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
