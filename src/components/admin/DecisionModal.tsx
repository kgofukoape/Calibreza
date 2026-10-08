'use client';

import React, { useEffect, useState } from 'react';

// --- APPLICATION DECISION BOX ------------------------------------------------
// Used by the dealers, clubs and services admin pages for the two decisions
// that need words: Reject (the reason) and Request info (what is missing, and
// optionally which documents to send back for a new copy). The text is
// emailed to the applicant and shown on their pending page, so it is written
// TO them, not about them.

export type DecisionKind = 'rejected' | 'info_requested';
export type DecisionDoc = { key: string; label: string; present: boolean };

export default function DecisionModal({
  kind, name, docs, busy, onCancel, onSubmit,
}: {
  kind: DecisionKind;
  name: string;
  docs: DecisionDoc[];
  busy: boolean;
  onCancel: () => void;
  onSubmit: (note: string, clearDocs: string[]) => void;
}) {
  const [note, setNote] = useState('');
  const [clear, setClear] = useState<string[]>([]);

  useEffect(() => {
    setNote('');
    setClear([]);
  }, [kind, name]);

  const isInfo = kind === 'info_requested';
  const ready = note.trim().length >= 5;

  const toggle = (key: string) =>
    setClear((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-[520px] bg-[#0D1420] border border-white/10 rounded-t-md sm:rounded-sm p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
          {isInfo ? 'Request information' : 'Reject application'}
        </p>
        <h3 className="text-lg font-bold text-white mb-4">{name}</h3>

        <label className="block text-[11px] font-black uppercase tracking-widest text-white/60 mb-2">
          {isInfo ? 'What do you need from them?' : 'Reason for rejecting'}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          maxLength={500}
          placeholder={isInfo
            ? 'e.g. The SAPS certificate is not readable. Please upload a clear scan of the full page.'
            : 'e.g. The SAPS dealer number does not match the certificate provided.'}
          className="w-full bg-[#0A0F18] border border-white/10 rounded-sm p-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9922A]/50"
        />
        <p className="text-[11px] text-white/40 mt-1">
          {note.trim().length}/500. This is emailed to the applicant and shown on their application page.
        </p>

        {isInfo && docs.length > 0 && (
          <div className="mt-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-2">
              Ask for a new copy of
            </p>
            {docs.map((d) => (
              <label key={d.key} className="flex items-center gap-3 py-2 text-sm text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clear.includes(d.key)}
                  onChange={() => toggle(d.key)}
                  className="w-4 h-4 accent-[#C9922A]"
                />
                <span>
                  {d.label}
                  {!d.present && <span className="text-white/40 text-[11px] ml-2">(not uploaded)</span>}
                </span>
              </label>
            ))}
            <p className="text-[11px] text-white/40 mt-1">
              Ticked documents are removed from the application so they can upload new ones.
              The old files are kept as a record.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto border border-white/15 text-white/80 font-black uppercase tracking-widest text-[11px] px-5 py-3 rounded-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(note.trim(), clear)}
            disabled={!ready || busy}
            className={'w-full sm:w-auto font-black uppercase tracking-widest text-[11px] px-5 py-3 rounded-sm disabled:opacity-40 ' +
              (isInfo ? 'bg-[#3B82F6] text-white' : 'bg-[#E63946] text-white')}
          >
            {busy ? 'Sending...' : isInfo ? 'Send request' : 'Reject and send'}
          </button>
        </div>
      </div>
    </div>
  );
}
