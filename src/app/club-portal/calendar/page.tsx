'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useClubPortal } from '@/components/club-portal/ClubPortalContext';
import { PortalTitle, Panel, Notice, inputCls, labelCls, goldBtn, ghostBtn } from '@/components/club-portal/ui';

// The club's own events: shoots, matches, competitions, training, socials.
// Not a booking system: shooters read the details and register through the
// club's own link (usually PractiScore). Times are South African time.

const TYPES: Array<[string, string]> = [
  ['shoot', 'Club shoot'],
  ['match', 'Match'],
  ['competition', 'Competition'],
  ['training', 'Training'],
  ['social', 'Social'],
];
const TYPE_LABEL = Object.fromEntries(TYPES);

const blank = (club: any) => ({
  id: '' as string,
  title: '',
  event_type: 'shoot',
  date: '',
  start: '08:00',
  end: '',
  venue: club.shoots_at === 'other' ? (club.shoots_at_range || '') : (club.address || ''),
  discipline: '',
  fee_text: '',
  details: '',
  registration_url: club.practiscore_url || '',
  contact: club.phone || club.email || '',
  repeat: 'none',
  times: '4',
});

const sast = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000);
  return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 16) };
};
const toIso = (date: string, time: string) => new Date(`${date}T${time}:00+02:00`).toISOString();

const addDays = (date: string, days: number) => {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const addMonths = (date: string, months: number) => {
  const [y, m, day] = date.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + months, Math.min(day, last))).toISOString().slice(0, 10);
};

export default function ClubPortalCalendar() {
  const { club, readOnly } = useClubPortal();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ReturnType<typeof blank> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('club_events').select('*')
      .eq('club_id', club.id).order('starts_at', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  }, [club.id]);

  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: string) => setForm((p) => (p ? { ...p, [k]: v } : p));

  const openNew = () => { setMsg(null); setForm(blank(club)); };
  const openEdit = (e: any, duplicate = false) => {
    setMsg(null);
    const s = sast(e.starts_at);
    const en = e.ends_at ? sast(e.ends_at).time : '';
    setForm({
      ...blank(club),
      id: duplicate ? '' : e.id,
      title: e.title,
      event_type: e.event_type,
      date: duplicate ? addDays(s.date, 7) : s.date,
      start: s.time,
      end: en,
      venue: e.venue || '',
      discipline: e.discipline || '',
      fee_text: e.fee_text || '',
      details: e.details || '',
      registration_url: e.registration_url || '',
      contact: e.contact || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    if (!form) return;
    setMsg(null);
    const problems: string[] = [];
    if (!form.title.trim()) problems.push('a title');
    if (!form.date) problems.push('a date');
    if (!form.start) problems.push('a start time');
    if (form.end && form.end <= form.start) problems.push('an end time after the start time');
    const reg = form.registration_url.trim().replace(/\s+/g, '');
    if (reg && !/^https?:\/\/[^\s/]+\.[^\s]+/i.test(reg)) problems.push('a registration link starting with https://');
    if (!form.id && form.date && form.date < new Date().toISOString().slice(0, 10)) problems.push('a date that is not in the past');
    if (problems.length) {
      setMsg({ kind: 'err', text: 'Please add ' + problems.join(', ') + '.' });
      return;
    }

    const base = {
      club_id: club.id,
      title: form.title.trim(),
      event_type: form.event_type,
      venue: form.venue.trim() || null,
      discipline: form.discipline || null,
      fee_text: form.fee_text.trim() || null,
      details: form.details.trim() || null,
      registration_url: reg || null,
      contact: form.contact.trim() || null,
    };
    const at = (date: string) => ({
      starts_at: toIso(date, form.start),
      ends_at: form.end ? toIso(date, form.end) : null,
    });

    setBusy(true);
    try {
      if (form.id) {
        const { error } = await supabase.from('club_events')
          .update({ ...base, ...at(form.date), updated_at: new Date().toISOString() }).eq('id', form.id);
        if (error) throw new Error(error.message);
        setMsg({ kind: 'ok', text: 'Event updated.' });
      } else {
        const n = form.repeat === 'none' ? 1 : Math.min(12, Math.max(2, parseInt(form.times, 10) || 2));
        const dates = Array.from({ length: n }, (_, i) =>
          form.repeat === 'weekly' ? addDays(form.date, 7 * i)
            : form.repeat === 'fortnightly' ? addDays(form.date, 14 * i)
              : form.repeat === 'monthly' ? addMonths(form.date, i)
                : form.date);
        const { error } = await supabase.from('club_events').insert(dates.map((d) => ({ ...base, ...at(d) })));
        if (error) throw new Error(error.message);
        setMsg({ kind: 'ok', text: n === 1 ? 'Event added.' : `${n} events added.` });
      }
      setForm(null);
      await load();
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'Could not save the event.' });
    }
    setBusy(false);
  };

  const toggleCancel = async (e: any) => {
    if (!e.is_cancelled && !confirm(`Cancel "${e.title}"? It stays on your page marked as cancelled.`)) return;
    const { error } = await supabase.from('club_events')
      .update({ is_cancelled: !e.is_cancelled, updated_at: new Date().toISOString() }).eq('id', e.id);
    if (error) setMsg({ kind: 'err', text: error.message });
    else await load();
  };

  const remove = async (e: any) => {
    if (!confirm(`Delete "${e.title}" completely?`)) return;
    const { error } = await supabase.from('club_events').delete().eq('id', e.id);
    if (error) setMsg({ kind: 'err', text: error.message });
    else await load();
  };

  const nowIso = new Date().toISOString();
  const upcoming = events.filter((e) => e.starts_at >= nowIso);
  const past = events.filter((e) => e.starts_at < nowIso).reverse().slice(0, 20);

  const when = (e: any) => {
    const s = new Date(e.starts_at).toLocaleString('en-ZA', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg',
    });
    return e.ends_at ? `${s} to ${sast(e.ends_at).time}` : s;
  };

  const card = (e: any, isPast: boolean) => (
    <div key={e.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-sm bg-[#0D0F13] border border-white/5 ${isPast ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <p className="font-black text-[14px] truncate">
          {e.title}{' '}
          {e.is_cancelled && <span className="text-[10px] font-black uppercase tracking-widest text-[#E63946] ml-1">Cancelled</span>}
        </p>
        <p className="text-[12px] text-[#8A8E99]">
          {TYPE_LABEL[e.event_type] || e.event_type}{e.discipline ? ` . ${e.discipline}` : ''} . {when(e)}
        </p>
      </div>
      {!readOnly && (
        <div className="flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-widest">
          {!isPast && <button onClick={() => openEdit(e)} className="text-[#C9922A]">Edit</button>}
          <button onClick={() => openEdit(e, true)} className="text-[#C9922A]">Duplicate</button>
          {!isPast && <button onClick={() => toggleCancel(e)} className="text-[#F59E0B]">{e.is_cancelled ? 'Restore' : 'Cancel'}</button>}
          <button onClick={() => remove(e)} className="text-[#E63946]">Delete</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PortalTitle a="Club" b="calendar" sub="Your shoots, matches and events. Each one gets its own page that people can share." />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {!readOnly && !form && <div><button onClick={openNew} className={goldBtn}>Add an event</button></div>}

      {form && (
        <Panel title={form.id ? 'Edit event' : 'New event'}>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Title *</label>
                <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. Monthly IPSC club shoot" />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={form.event_type} onChange={(e) => set('event_type', e.target.value)}>
                  {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Discipline</label>
                <select className={inputCls} value={form.discipline} onChange={(e) => set('discipline', e.target.value)}>
                  <option value="">Not specific</option>
                  {(club.disciplines || []).map((d: string) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date *</label>
                <input type="date" className={inputCls} value={form.date} onChange={(e) => set('date', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Starts *</label>
                  <input type="time" className={inputCls} value={form.start} onChange={(e) => set('start', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Ends</label>
                  <input type="time" className={inputCls} value={form.end} onChange={(e) => set('end', e.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Venue</label>
                <input className={inputCls} value={form.venue} onChange={(e) => set('venue', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Fees</label>
                <input className={inputCls} value={form.fee_text} onChange={(e) => set('fee_text', e.target.value)}
                  placeholder="e.g. Members R150 . Visitors R250" />
              </div>
              <div>
                <label className={labelCls}>Contact</label>
                <input className={inputCls} value={form.contact} onChange={(e) => set('contact', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Registration link</label>
                <input className={inputCls} value={form.registration_url} onChange={(e) => set('registration_url', e.target.value)}
                  placeholder="https://practiscore.com/..." />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Full details</label>
                <textarea rows={7} className={inputCls} value={form.details} onChange={(e) => set('details', e.target.value)}
                  placeholder={'Format and stages, divisions, round count, what to bring,\nsafety briefing time, eye and ear protection, who may enter.'} />
              </div>
            </div>

            {!form.id && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Repeat</label>
                  <select className={inputCls} value={form.repeat} onChange={(e) => set('repeat', e.target.value)}>
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Every week</option>
                    <option value="fortnightly">Every 2 weeks</option>
                    <option value="monthly">Every month (same date)</option>
                  </select>
                </div>
                {form.repeat !== 'none' && (
                  <div>
                    <label className={labelCls}>How many times (2 to 12)</label>
                    <input type="number" min={2} max={12} className={inputCls} value={form.times}
                      onChange={(e) => set('times', e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button onClick={save} disabled={busy} className={goldBtn}>{busy ? 'Saving...' : form.id ? 'Save changes' : 'Add event'}</button>
              <button onClick={() => setForm(null)} className={ghostBtn}>Close</button>
            </div>
          </div>
        </Panel>
      )}

      <Panel title={`Upcoming (${upcoming.length})`}>
        {loading ? <p className="text-[13px] text-[#8A8E99]">Loading...</p>
          : upcoming.length === 0 ? <p className="text-[13px] text-[#8A8E99]">No upcoming events.</p>
            : <div className="flex flex-col gap-2">{upcoming.map((e) => card(e, false))}</div>}
      </Panel>

      {past.length > 0 && (
        <Panel title="Past (only you see these)">
          <div className="flex flex-col gap-2">{past.map((e) => card(e, true))}</div>
        </Panel>
      )}
    </div>
  );
}
