'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useClubPortal } from '@/components/club-portal/ClubPortalContext';
import { PortalTitle, Panel, Notice, inputCls, labelCls, goldBtn } from '@/components/club-portal/ui';

// Everything the public club page shows, except what is locked after
// approval (name, compliance): those change through support.

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];
const DISCIPLINES = [
  'IPSC', 'IDPA', 'Practical Shooting', 'Target Shooting', 'Hunting',
  'Long Range', 'PRS', 'Benchrest', 'Field Shooting', 'Skeet', 'Trap',
  'Sporting Clays', 'Air Gun', 'Airsoft',
];
const LINKS: Array<[string, string]> = [
  ['website', 'Website'],
  ['facebook_url', 'Facebook page'],
  ['instagram_url', 'Instagram'],
  ['practiscore_url', 'PractiScore (where shooters register for matches)'],
];

export default function ClubPortalProfile() {
  const { club, readOnly, reload } = useClubPortal();
  const [f, setF] = useState(() => ({
    description: club.description || '',
    disciplines: (club.disciplines || []) as string[],
    founded_year: club.founded_year ? String(club.founded_year) : '',
    address: club.address || '',
    lat: club.lat as number | null,
    lng: club.lng as number | null,
    province: club.province || '',
    city: club.city || '',
    phone: club.phone || '',
    email: club.email || '',
    whatsapp: club.whatsapp || '',
    website: club.website || '',
    facebook_url: club.facebook_url || '',
    instagram_url: club.instagram_url || '',
    practiscore_url: club.practiscore_url || '',
    shoots_at: club.shoots_at || '',
    range_setting: club.range_setting || '',
    shoots_at_range: club.shoots_at_range || '',
  }));
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (d: string) => setF((p) => ({
    ...p, disciplines: p.disciplines.includes(d) ? p.disciplines.filter((x) => x !== d) : [...p.disciplines, d],
  }));

  const upload = async (file: File, folder: string) => {
    if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5MB.`);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${folder}/${club.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('club-images').upload(path, file);
    if (error) throw new Error(error.message);
    return supabase.storage.from('club-images').getPublicUrl(path).data.publicUrl;
  };

  // Trim, remove spaces, and insist on a full web address.
  const cleanLink = (v: string): string | null | false => {
    const s = v.trim().replace(/\s+/g, '').replace(/\/+$/, '');
    if (!s) return null;
    if (!/^https?:\/\/[^\s/]+\.[^\s]+/i.test(s)) return false;
    return s;
  };

  const save = async () => {
    setMsg(null);
    const problems: string[] = [];
    if (f.description.trim().length < 20) problems.push('a description of at least 20 characters');
    if (f.disciplines.length === 0) problems.push('at least one discipline');
    if (!f.address.trim() || !f.province || !f.city.trim()) problems.push('address, province and city');
    if (!f.phone.trim() || !f.email.trim()) problems.push('club phone and email');
    if (f.founded_year && (Number(f.founded_year) < 1850 || Number(f.founded_year) > new Date().getFullYear())) {
      problems.push('a real year founded');
    }
    const links: Record<string, string | null> = {};
    for (const [k, label] of LINKS) {
      const c = cleanLink((f as any)[k]);
      if (c === false) problems.push(`${label}: a full web address starting with https://`);
      else links[k] = c;
    }
    if (f.shoots_at === 'own' && !f.range_setting) problems.push('indoor or outdoor range');
    if (f.shoots_at === 'other' && !f.shoots_at_range.trim()) problems.push('the range you use');
    if (problems.length) {
      setMsg({ kind: 'err', text: 'Please check: ' + problems.join('; ') + '.' });
      return;
    }

    setBusy(true);
    try {
      const logo_url = logo ? await upload(logo, 'logos') : club.logo_url;
      const cover_url = cover ? await upload(cover, 'covers') : club.cover_url;
      const { error } = await supabase.from('shooting_clubs').update({
        description: f.description.trim(),
        disciplines: f.disciplines,
        founded_year: f.founded_year ? parseInt(f.founded_year, 10) : null,
        address: f.address.trim(),
        lat: f.lat,
        lng: f.lng,
        province: f.province,
        city: f.city.trim(),
        phone: f.phone.trim(),
        email: f.email.trim(),
        whatsapp: f.whatsapp.trim() || null,
        ...links,
        shoots_at: f.shoots_at || null,
        range_setting: f.shoots_at === 'own' ? f.range_setting : null,
        shoots_at_range: f.shoots_at === 'other' ? f.shoots_at_range.trim() : null,
        logo_url,
        cover_url,
      }).eq('id', club.id);
      if (error) throw new Error(error.message);
      await reload();
      setLogo(null);
      setCover(null);
      setMsg({ kind: 'ok', text: 'Saved. Your public page is up to date.' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'Could not save.' });
    }
    setBusy(false);
  };

  const chip = (on: boolean) =>
    'px-3 py-2 rounded-sm text-[12px] font-bold border transition-all disabled:opacity-50 ' +
    (on ? 'bg-[#C9922A] text-black border-[#C9922A]' : 'bg-[#0D0F13] text-[#8A8E99] border-white/10 hover:text-[#F0EDE8]');
  const choice = (on: boolean) =>
    'flex-1 text-left px-4 py-3 rounded-sm border text-[13px] transition-all disabled:opacity-50 ' +
    (on ? 'border-[#C9922A] bg-[#C9922A]/10 text-[#F0EDE8]' : 'border-white/10 bg-[#0D0F13] text-[#8A8E99]');
  const imageField = (text: string, current: string | null, file: File | null, pick: (x: File | null) => void) => (
    <label className={`flex items-center gap-3 bg-[#0D0F13] border border-white/10 rounded-sm p-3 ${readOnly ? 'opacity-50' : 'cursor-pointer hover:border-[#C9922A]/50'}`}>
      {current && !file && <img src={current} alt="" className="w-14 h-14 object-cover rounded-sm flex-shrink-0" />}
      <span className="flex-1 text-[13px]">{text}</span>
      <span className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] break-all">
        {file ? file.name : current ? 'Replace' : 'Choose'}
      </span>
      <input type="file" accept="image/*" className="hidden" disabled={readOnly}
        onChange={(e) => pick(e.target.files?.[0] || null)} />
    </label>
  );

  return (
    <div className="flex flex-col gap-5">
      <PortalTitle a="Club" b="profile" sub="What visitors see on your club page." />

      <Panel title="About">
        <div className="flex flex-col gap-4">
          <div>
            <p className={labelCls}>Club name</p>
            <p className="text-[14px]">{club.name} <span className="text-[11px] text-[#8A8E99]">(to change it, email support@gunx.co.za)</span></p>
          </div>
          <div>
            <label className={labelCls}>What the club is about *</label>
            <textarea rows={6} className={inputCls} disabled={readOnly} value={f.description}
              onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Disciplines *</label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((d) => (
                <button key={d} type="button" disabled={readOnly} onClick={() => toggle(d)} className={chip(f.disciplines.includes(d))}>{d}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Year founded</label>
              <input className={inputCls} inputMode="numeric" maxLength={4} disabled={readOnly} value={f.founded_year}
                onChange={(e) => set('founded_year', e.target.value.replace(/[^0-9]/g, ''))} />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-2">
              {imageField('Logo', club.logo_url, logo, setLogo)}
              {imageField('Cover photo (wide works best)', club.cover_url, cover, setCover)}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Location">
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Address * (choose from the suggestions)</label>
            {readOnly ? <p className="text-[14px]">{f.address}</p> : (
              <AddressAutocomplete value={f.address} onChange={(v: string) => set('address', v)}
                onSelect={(r) => setF((p) => ({
                  ...p, address: r.address, lat: r.lat, lng: r.lng,
                  city: r.city || p.city, province: r.province || p.province,
                }))} />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Province *</label>
              <select className={inputCls} disabled={readOnly} value={f.province} onChange={(e) => set('province', e.target.value)}>
                <option value="">Select</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>City or town *</label>
              <input className={inputCls} disabled={readOnly} value={f.city} onChange={(e) => set('city', e.target.value)} />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Contact and links">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Club phone *</label>
            <input type="tel" className={inputCls} disabled={readOnly} value={f.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Club email *</label>
            <input type="email" className={inputCls} disabled={readOnly} value={f.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>WhatsApp</label>
            <input type="tel" className={inputCls} disabled={readOnly} value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          </div>
          {LINKS.map(([k, label]) => (
            <div key={k} className={k === 'practiscore_url' ? 'sm:col-span-2' : ''}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} disabled={readOnly} placeholder="https://" value={(f as any)[k]}
                onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Where you shoot">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" disabled={readOnly} onClick={() => set('shoots_at', 'own')} className={choice(f.shoots_at === 'own')}>
              <strong className="block text-[#F0EDE8]">We have our own range</strong>
            </button>
            <button type="button" disabled={readOnly} onClick={() => set('shoots_at', 'other')} className={choice(f.shoots_at === 'other')}>
              <strong className="block text-[#F0EDE8]">We use another range</strong>
            </button>
          </div>
          {f.shoots_at === 'own' && (
            <select className={inputCls} disabled={readOnly} value={f.range_setting} onChange={(e) => set('range_setting', e.target.value)}>
              <option value="">Indoor or outdoor?</option>
              <option value="outdoor">Outdoor</option>
              <option value="indoor">Indoor</option>
              <option value="both">Both</option>
            </select>
          )}
          {f.shoots_at === 'other' && (
            <input className={inputCls} disabled={readOnly} placeholder="Name of the range you use" value={f.shoots_at_range}
              onChange={(e) => set('shoots_at_range', e.target.value)} />
          )}
        </div>
      </Panel>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {!readOnly && (
        <div><button onClick={save} disabled={busy} className={goldBtn}>{busy ? 'Saving...' : 'Save profile'}</button></div>
      )}
    </div>
  );
}
