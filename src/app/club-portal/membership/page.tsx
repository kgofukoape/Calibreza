'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useClubPortal } from '@/components/club-portal/ClubPortalContext';
import { PortalTitle, Panel, Notice, inputCls, labelCls, goldBtn, ghostBtn } from '@/components/club-portal/ui';

const MAX = 8;
const PERIODS: Array<[string, string]> = [
  ['year', 'per year'],
  ['month', 'per month'],
  ['once', 'once-off'],
];

type Option = { name: string; price: string; period: string; notes: string };

export default function ClubPortalMembership() {
  const { club, readOnly, reload } = useClubPortal();
  const [rows, setRows] = useState<Option[]>(() =>
    (club.membership_options || []).map((o: any) => ({
      name: o.name || '',
      price: o.price != null ? String(o.price) : '',
      period: o.period || 'year',
      notes: o.notes || '',
    })));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const update = (i: number, k: keyof Option, v: string) =>
    setRows((p) => p.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => setRows((p) => {
    const n = [...p];
    const j = i + d;
    if (j < 0 || j >= n.length) return p;
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  const save = async () => {
    setMsg(null);
    const bad = rows.findIndex((r) => !r.name.trim() || r.price === '' || Number(r.price) < 0);
    if (bad > -1) {
      setMsg({ kind: 'err', text: `Option ${bad + 1} needs a name and a price (0 for free).` });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('shooting_clubs').update({
      membership_options: rows.map((r) => ({
        name: r.name.trim(),
        price: Math.round(Number(r.price) * 100) / 100,
        period: r.period,
        notes: r.notes.trim() || null,
      })),
    }).eq('id', club.id);
    setBusy(false);
    if (error) return setMsg({ kind: 'err', text: error.message });
    await reload();
    setMsg({ kind: 'ok', text: 'Membership options saved.' });
  };

  return (
    <div className="flex flex-col gap-5">
      <PortalTitle a="Membership" b="options" sub="Show visitors what it costs to join. For example Annual, Junior, Family, Day visitor." />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Panel title={`Options (${rows.length} of ${MAX})`}>
        <div className="flex flex-col gap-3">
          {rows.length === 0 && <p className="text-[13px] text-[#8A8E99]">No options yet.</p>}
          {rows.map((r, i) => (
            <div key={i} className="bg-[#0D0F13] border border-white/5 rounded-sm p-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Name *</label>
                  <input className={inputCls} disabled={readOnly} value={r.name} placeholder="e.g. Annual membership"
                    onChange={(e) => update(i, 'name', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Price (R) *</label>
                  <input className={inputCls} disabled={readOnly} inputMode="decimal" value={r.price}
                    onChange={(e) => update(i, 'price', e.target.value.replace(/[^0-9.]/g, ''))} />
                </div>
                <div>
                  <label className={labelCls}>Period</label>
                  <select className={inputCls} disabled={readOnly} value={r.period} onChange={(e) => update(i, 'period', e.target.value)}>
                    {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <input className={inputCls} disabled={readOnly} value={r.notes}
                  placeholder="e.g. Includes SAPSA fees. Under 18 with a parent member."
                  onChange={(e) => update(i, 'notes', e.target.value)} />
              </div>
              {!readOnly && (
                <div className="flex gap-4 text-[11px] font-black uppercase tracking-widest">
                  <button onClick={() => move(i, -1)} className="text-[#8A8E99] hover:text-[#F0EDE8]">Move up</button>
                  <button onClick={() => move(i, 1)} className="text-[#8A8E99] hover:text-[#F0EDE8]">Move down</button>
                  <button onClick={() => setRows((p) => p.filter((_, j) => j !== i))} className="text-[#E63946]">Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-3 mt-4">
            {rows.length < MAX && (
              <button onClick={() => setRows((p) => [...p, { name: '', price: '', period: 'year', notes: '' }])} className={ghostBtn}>
                Add an option
              </button>
            )}
            <button onClick={save} disabled={busy} className={goldBtn}>{busy ? 'Saving...' : 'Save'}</button>
          </div>
        )}
      </Panel>
    </div>
  );
}
