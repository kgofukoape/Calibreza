'use client';

import React, { useState } from 'react';
import AdminNav from '@/components/admin/AdminNav';

// ─── BROADCAST ───────────────────────────────────────────────────────────────
// /admin/broadcast
//
// Marketing email to people who consented to it. Two deliberate frictions:
//
//   YOU CANNOT SEND WITHOUT PREVIEWING. The Send button stays disabled until a
//   preview has run and shown the real recipient count. A broadcast cannot be
//   recalled, and the difference between 12 recipients and 1,200 is worth
//   discovering before rather than after.
//
//   THE PREVIEW EXPIRES WHEN YOU EDIT. Change the audience or the content and
//   the count clears. Otherwise you preview one thing and send another, which
//   is precisely how a message meant for dealers ends up going to everybody.
//
// The audience is computed server-side from live consent at the moment of
// sending — never from this page, and never from a saved list.

type Filter = 'all' | 'personal' | 'business';

interface Preview {
  recipients: number;
  totalUsers: number;
  optedOut: number;
  sample: string[];
  filter: string;
}

export default function AdminBroadcastPage() {
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Any change invalidates the preview. See the note above.
  const edit = (fn: () => void) => { fn(); setPreview(null); setMsg(null); };

  const call = async (action: 'preview' | 'send') => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subject, html: bodyHtml, filter }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');

      if (action === 'preview') {
        setPreview(json.data);
      } else {
        setMsg({ kind: 'ok', text: json.message });
        setPreview(null);
        setSubject('');
        setBodyHtml('');
      }
    } catch (err: any) {
      setMsg({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    if (!preview) return;
    if (!confirm(
      `Send "${subject}" to ${preview.recipients} ${preview.recipients === 1 ? 'person' : 'people'}?\n\n` +
      `This cannot be undone.`
    )) return;
    call('send');
  };

  const input = "w-full bg-[#080B12] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-[#C9922A]/50";
  const label = "text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block";

  return (
    <div className="min-h-screen bg-[#080B12] text-white flex">

      <aside className="w-[260px] bg-[#0D1420] border-r border-white/5 flex flex-col fixed h-full z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E63946] rounded-sm flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">GX</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase tracking-widest text-white leading-none">Command Center</p>
            <p className="text-[9px] font-bold text-[#E63946] uppercase tracking-[0.3em]">Admin Access</p>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto"><AdminNav /></nav>
      </aside>

      <div className="flex-1 ml-[260px]">
        <header className="bg-[#0D1420] border-b border-white/5 px-8 py-5">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight">
            Broadcast <span className="text-[#E63946]">Email</span>
          </h1>
          <p className="text-white/40 text-xs mt-0.5 uppercase tracking-widest font-bold">
            Marketing · Consented recipients only
          </p>
        </header>

        <div className="p-8 max-w-[900px] space-y-6">

          {/* The rule this page exists to enforce, said plainly. */}
          <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm p-4">
            <p className="text-[12px] text-[#C9922A] leading-relaxed">
              <strong className="uppercase tracking-widest font-black">Consented recipients only</strong><br />
              This sends only to people who ticked the marketing box and have not
              since unsubscribed. Consent is checked at the moment of sending, so
              someone who opted out an hour ago will not receive it. Service
              messages — enquiries, billing, security — are separate and are not
              affected by anyone's marketing preference.
            </p>
          </div>

          {msg && (
            <div className={`p-4 rounded-sm text-[13px] font-bold border ${
              msg.kind === 'ok'
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
            }`}>
              {msg.text}
            </div>
          )}

          <div className="bg-[#0D1420] border border-white/5 rounded-sm p-6 space-y-5">

            <div>
              <label className={label}>Audience</label>
              <div className="flex gap-2 flex-wrap">
                {([
                  ['all', 'Everyone who consented'],
                  ['personal', 'Private sellers & buyers'],
                  ['business', 'Dealers, clubs & services'],
                ] as [Filter, string][]).map(([value, text]) => (
                  <button key={value} onClick={() => edit(() => setFilter(value))}
                    className={`font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-sm transition-all ${
                      filter === value ? 'bg-[#C9922A] text-black' : 'border border-white/10 text-white/50 hover:text-white'
                    }`}>
                    {text}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={label}>Subject</label>
              <input value={subject} onChange={e => edit(() => setSubject(e.target.value))}
                placeholder="New this week on Gun X" className={input} />
            </div>

            <div>
              <label className={label}>Message</label>
              <textarea value={bodyHtml} onChange={e => edit(() => setBodyHtml(e.target.value))}
                rows={12}
                placeholder={'<h2 style="color:#C9922A;">Heading</h2>\n<p style="color:#8A8E99;line-height:1.6;">Your message…</p>'}
                className={`${input} font-mono text-[13px] leading-relaxed`} />
              <p className="text-[11px] text-white/30 mt-2">
                HTML. The greeting, unsubscribe link and company footer are added
                automatically — do not include your own.
              </p>
            </div>
          </div>

          {/* ── PREVIEW ────────────────────────────────────────────────── */}
          {preview && (
            <div className="bg-[#0D1420] border border-[#C9922A]/30 rounded-sm p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] mb-4">
                Audience check
              </p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-[#C9922A] leading-none">
                    {preview.recipients}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Will receive it</p>
                </div>
                <div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-white/30 leading-none">
                    {preview.optedOut}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Not consented</p>
                </div>
                <div>
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black text-white/30 leading-none">
                    {preview.totalUsers}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Registered users</p>
                </div>
              </div>

              {preview.sample.length > 0 && (
                <p className="text-[11px] text-white/30 border-t border-white/5 pt-3">
                  For example: {preview.sample.join(', ')}
                  {preview.recipients > preview.sample.length && ` and ${preview.recipients - preview.sample.length} more`}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => call('preview')}
              disabled={busy || !subject.trim() || !bodyHtml.trim()}
              className="border border-white/10 text-white font-black uppercase tracking-widest text-[11px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              {busy ? 'Checking…' : 'Check audience'}
            </button>

            <button onClick={send}
              disabled={busy || !preview || preview.recipients === 0}
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[11px] px-8 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              {busy ? 'Sending…' : preview ? `Send to ${preview.recipients}` : 'Send'}
            </button>

            {!preview && (
              <span className="text-[11px] text-white/30">
                Check the audience before sending.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}