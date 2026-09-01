'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

// ─── ADVOCACY DASHBOARD ──────────────────────────────────────────────────────
// /advocacy-dashboard
//
// Everything an organisation publishes: profile, press releases, events,
// membership tiers, achievements and people.
//
// TWO RULES THROUGHOUT
//
//   Every write asks which rows it changed. Row-level security does not reject
//   a write it disallows — it matches nothing, and Postgres reports that as
//   success. On this stack a silent failure looks exactly like a success unless
//   you check.
//
//   Nothing here takes money. Membership, donations and event bookings are
//   links to the organisation's own site. Gun X listing what membership costs
//   is information; taking the payment would put it inside a relationship it
//   has no business being in.

const BUCKET = 'advocacy-media';

type Tab = 'profile' | 'press' | 'events' | 'membership' | 'achievements' | 'people';

interface Group {
  id: string; name: string; slug: string; status: string;
  logo_url: string | null; cover_image_url: string | null;
  mission_statement: string | null; about_text: string | null;
  website_url: string | null; contact_email: string | null;
  donate_url: string | null; membership_intro: string | null;
  npo_number: string | null; section_18a: boolean; founded_year: number | null;
  social_links: Record<string, string>;
  press_contact_name: string | null;
  press_contact_email: string | null;
  press_contact_phone: string | null;
}

export default function AdvocacyDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [tab, setTab] = useState<Tab>('profile');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [releases, setReleases] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  const [profile, setProfile] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { load(); }, []);

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setMsg(null), 6000);
  };

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/business/login'); return; }

    const { data: g } = await supabase
      .from('advocacy_groups').select('*').eq('owner_user_id', session.user.id).maybeSingle();

    if (!g) { router.push('/advocacy/apply'); return; }

    setGroup(g as Group);
    setProfile({
      mission_statement: g.mission_statement || '', about_text: g.about_text || '',
      website_url: g.website_url || '', contact_email: g.contact_email || '',
      donate_url: g.donate_url || '', membership_intro: g.membership_intro || '',
      npo_number: g.npo_number || '', section_18a: g.section_18a || false,
      founded_year: g.founded_year || '',
      press_contact_name: g.press_contact_name || '',
      press_contact_email: g.press_contact_email || '',
      press_contact_phone: g.press_contact_phone || '',
      facebook: g.social_links?.facebook || '', x: g.social_links?.x || '',
      instagram: g.social_links?.instagram || '', youtube: g.social_links?.youtube || '',
    });

    const [r, e, t, a, p] = await Promise.all([
      supabase.from('press_releases').select('*').eq('group_id', g.id).order('published_at', { ascending: false, nullsFirst: false }),
      supabase.from('advocacy_events').select('*').eq('group_id', g.id).order('starts_at'),
      supabase.from('advocacy_membership_tiers').select('*').eq('group_id', g.id).order('sort_order'),
      supabase.from('advocacy_achievements').select('*').eq('group_id', g.id).order('year', { ascending: false }),
      supabase.from('advocacy_people').select('*').eq('group_id', g.id).order('sort_order'),
    ]);

    setReleases(r.data || []); setEvents(e.data || []); setTiers(t.data || []);
    setAchievements(a.data || []); setPeople(p.data || []);
    setLoading(false);
  };

  // ── UPLOAD ───────────────────────────────────────────────────────────────
  // Path is {group_id}/{kind}/{file}. The storage policy resolves ownership
  // through advocacy_groups rather than trusting the path, so naming another
  // group's folder achieves nothing.
  const upload = async (file: File, kind: string): Promise<string | null> => {
    if (!group) return null;
    if (file.size > 5 * 1024 * 1024) { flash('err', 'Files must be under 5MB.'); return null; }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `${group.id}/${kind}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (error) { flash('err', `Upload failed: ${error.message}`); return null; }

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  /** Every write goes through here so none can silently do nothing. */
  const write = async (q: any, okText: string) => {
    setBusy(true);
    const { data, error } = await q.select('id');
    setBusy(false);

    if (error) {
      flash('err',
        error.message.includes('no_script')
          ? 'Content must be plain text. Please remove any HTML or script markup.'
          : `Could not save: ${error.message}`);
      return false;
    }
    if (!data || data.length === 0) {
      flash('err', 'Nothing was saved — your account does not appear to have permission. Contact support@gunx.co.za.');
      return false;
    }
    flash('ok', okText);
    setEditing(null);
    load();
    return true;
  };

  const saveProfile = async () => {
    if (!group) return;
    await write(
      supabase.from('advocacy_groups').update({
        mission_statement: profile.mission_statement.trim() || null,
        about_text: profile.about_text.trim() || null,
        website_url: profile.website_url.trim() || null,
        contact_email: profile.contact_email.trim() || null,
        donate_url: profile.donate_url.trim() || null,
        membership_intro: profile.membership_intro.trim() || null,
        npo_number: profile.npo_number.trim() || null,
        section_18a: !!profile.section_18a,
        founded_year: profile.founded_year ? Number(profile.founded_year) : null,
        press_contact_name: profile.press_contact_name.trim() || null,
        press_contact_email: profile.press_contact_email.trim() || null,
        press_contact_phone: profile.press_contact_phone.trim() || null,
        social_links: {
          facebook: profile.facebook.trim() || undefined,
          x: profile.x.trim() || undefined,
          instagram: profile.instagram.trim() || undefined,
          youtube: profile.youtube.trim() || undefined,
        },
      }).eq('id', group.id),
      'Profile updated.'
    );
  };

  const setImage = async (file: File, kind: 'logo' | 'cover') => {
    if (!group) return;
    const url = await upload(file, kind);
    if (!url) return;
    await write(
      supabase.from('advocacy_groups')
        .update(kind === 'logo' ? { logo_url: url } : { cover_image_url: url })
        .eq('id', group.id),
      `${kind === 'logo' ? 'Logo' : 'Cover image'} updated.`
    );
  };

  const remove = async (table: string, id: string, label: string) => {
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
    await write(supabase.from(table).delete().eq('id', id), `${label} deleted.`);
  };

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50";
  const lbl = "text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2 block";
  const card = "bg-[#13151A] border border-white/5 rounded-sm p-6 space-y-5";
  const btn = "bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-40";
  const btnGhost = "border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[11px] px-4 py-2 rounded-sm hover:bg-white/5 transition-all";
  const fileInp = inp + " file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-bold file:bg-[#C9922A] file:text-black";

  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <div className="max-w-[900px] mx-auto px-4 py-24 text-center">
        <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
      </div>
      <Footer />
    </div>
  );

  if (!group) return null;
  const isActive = group.status === 'active';

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9922A] mb-2">Advocacy Dashboard</p>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-4xl font-black uppercase tracking-tight leading-none">{group.name}</h1>
          </div>
          {isActive && (
            <Link href={`/advocacy/${group.slug}`} className={btnGhost + " text-center"}>View public profile →</Link>
          )}
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8 space-y-5">

        {!isActive && (
          <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm p-5">
            <p className="text-[13px] text-[#C9922A] leading-relaxed">
              <strong className="uppercase tracking-widest font-black">
                {group.status === 'suspended' ? 'Listing suspended' : 'Awaiting review'}
              </strong><br />
              {group.status === 'suspended'
                ? 'This listing is not public. Contact support@gunx.co.za.'
                : 'Prepare everything now — it all goes live the moment your listing is approved.'}
            </p>
          </div>
        )}

        {msg && (
          <div className={`rounded-sm px-4 py-3 border text-[13px] font-bold ${
            msg.kind === 'ok' ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]'
                              : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'}`}>
            {msg.text}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {([['profile','Profile'],['press','Press'],['events','Events'],
             ['membership','Membership'],['achievements','Achievements'],['people','People']] as [Tab,string][])
            .map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setEditing(null); }}
              className={`font-black uppercase tracking-widest text-[11px] px-4 py-2.5 rounded-sm transition-all ${
                tab === id ? 'bg-[#C9922A] text-black' : 'border border-white/10 text-[#8A8E99] hover:text-[#F0EDE8]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ PROFILE ══════════════════════════════════════════════════════ */}
        {tab === 'profile' && (
          <>
            <div className={card}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">Images</h2>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={lbl}>Logo</label>
                  {group.logo_url && <img src={group.logo_url} alt="" className="w-20 h-20 object-cover rounded-sm mb-3 border border-white/10" />}
                  <input type="file" accept="image/*" className={fileInp}
                    onChange={e => e.target.files?.[0] && setImage(e.target.files[0], 'logo')} />
                  <p className="text-[11px] text-[#8A8E99] mt-1.5">Square works best. Max 5MB.</p>
                </div>
                <div>
                  <label className={lbl}>Cover Image</label>
                  {group.cover_image_url && <img src={group.cover_image_url} alt="" className="w-full h-20 object-cover rounded-sm mb-3 border border-white/10" />}
                  <input type="file" accept="image/*" className={fileInp}
                    onChange={e => e.target.files?.[0] && setImage(e.target.files[0], 'cover')} />
                  <p className="text-[11px] text-[#8A8E99] mt-1.5">Wide banner, roughly 1600×400. Max 5MB.</p>
                </div>
              </div>
            </div>

            <div className={card}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">About</h2>

              <div><label className={lbl}>Mission Statement</label>
                <textarea rows={3} maxLength={300} className={inp} value={profile.mission_statement}
                  onChange={e => setProfile({ ...profile, mission_statement: e.target.value })} /></div>

              <div><label className={lbl}>About</label>
                <textarea rows={8} className={inp} value={profile.about_text}
                  onChange={e => setProfile({ ...profile, about_text: e.target.value })} /></div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div><label className={lbl}>Founded (year)</label>
                  <input type="number" className={inp} placeholder="1994" value={profile.founded_year}
                    onChange={e => setProfile({ ...profile, founded_year: e.target.value })} /></div>
                <div><label className={lbl}>NPO Registration Number</label>
                  <input className={inp} placeholder="123-456 NPO" value={profile.npo_number}
                    onChange={e => setProfile({ ...profile, npo_number: e.target.value })} />
                  <p className="text-[11px] text-[#8A8E99] mt-1.5">Checkable against the DSD register — it is what turns a claim into evidence.</p></div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={!!profile.section_18a} className="mt-1 w-4 h-4 accent-[#C9922A]"
                  onChange={e => setProfile({ ...profile, section_18a: e.target.checked })} />
                <span className="text-[13px] text-[#C4C0B8] leading-relaxed">
                  We are approved under section 18A and issue tax certificates for donations.
                  <span className="block text-[11px] text-[#8A8E99] mt-1">
                    Only tick this if you hold SARS approval. Donors rely on it when deciding
                    whether a donation is deductible, and getting it wrong is their problem
                    at assessment time, not just yours.
                  </span>
                </span>
              </label>
            </div>

            <div className={card}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">Links & Contact</h2>

              <div className="grid sm:grid-cols-2 gap-5">
                <div><label className={lbl}>Website</label>
                  <input className={inp} placeholder="https://…" value={profile.website_url}
                    onChange={e => setProfile({ ...profile, website_url: e.target.value })} /></div>
                <div><label className={lbl}>Donate Link</label>
                  <input className={inp} placeholder="https://…/donate" value={profile.donate_url}
                    onChange={e => setProfile({ ...profile, donate_url: e.target.value })} />
                  <p className="text-[11px] text-[#8A8E99] mt-1.5">Donations are taken on your site. Gun X handles no money.</p></div>
                <div><label className={lbl}>Facebook</label>
                  <input className={inp} value={profile.facebook} onChange={e => setProfile({ ...profile, facebook: e.target.value })} /></div>
                <div><label className={lbl}>X (Twitter)</label>
                  <input className={inp} value={profile.x} onChange={e => setProfile({ ...profile, x: e.target.value })} /></div>
                <div><label className={lbl}>Instagram</label>
                  <input className={inp} value={profile.instagram} onChange={e => setProfile({ ...profile, instagram: e.target.value })} /></div>
                <div><label className={lbl}>YouTube</label>
                  <input className={inp} value={profile.youtube} onChange={e => setProfile({ ...profile, youtube: e.target.value })} /></div>
                <div><label className={lbl}>General Contact Email</label>
                  <input className={inp} value={profile.contact_email} onChange={e => setProfile({ ...profile, contact_email: e.target.value })} /></div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-5">
                <p className="text-[12px] text-[#8A8E99] leading-relaxed">
                  <strong className="text-[#C4C0B8]">Press contact.</strong> Journalists covering
                  firearm policy need a person to call, not a general inbox. This is often the
                  most used thing on the page.
                </p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><label className={lbl}>Name</label>
                    <input className={inp} value={profile.press_contact_name} onChange={e => setProfile({ ...profile, press_contact_name: e.target.value })} /></div>
                  <div><label className={lbl}>Email</label>
                    <input className={inp} value={profile.press_contact_email} onChange={e => setProfile({ ...profile, press_contact_email: e.target.value })} /></div>
                  <div><label className={lbl}>Phone</label>
                    <input className={inp} value={profile.press_contact_phone} onChange={e => setProfile({ ...profile, press_contact_phone: e.target.value })} /></div>
                </div>
              </div>

              <button onClick={saveProfile} disabled={busy} className={btn}>
                {busy ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </>
        )}

        {/* ══ PRESS ════════════════════════════════════════════════════════ */}
        {tab === 'press' && (
          <PressSection
            group={group} releases={releases} isActive={isActive}
            editing={editing} setEditing={setEditing}
            upload={upload} write={write} remove={remove}
            busy={busy} classes={{ inp, lbl, card, btn, btnGhost, fileInp }}
          />
        )}

        {/* ══ EVENTS ═══════════════════════════════════════════════════════ */}
        {tab === 'events' && (
          <EventsSection
            group={group} events={events}
            editing={editing} setEditing={setEditing}
            upload={upload} write={write} remove={remove}
            busy={busy} classes={{ inp, lbl, card, btn, btnGhost, fileInp }}
          />
        )}

        {/* ══ MEMBERSHIP ═══════════════════════════════════════════════════ */}
        {tab === 'membership' && (
          <MembershipSection
            group={group} tiers={tiers} intro={profile.membership_intro}
            setIntro={(v: string) => setProfile({ ...profile, membership_intro: v })}
            saveIntro={saveProfile}
            editing={editing} setEditing={setEditing}
            write={write} remove={remove}
            busy={busy} classes={{ inp, lbl, card, btn, btnGhost }}
          />
        )}

        {/* ══ ACHIEVEMENTS ═════════════════════════════════════════════════ */}
        {tab === 'achievements' && (
          <AchievementsSection
            group={group} items={achievements}
            editing={editing} setEditing={setEditing}
            write={write} remove={remove}
            busy={busy} classes={{ inp, lbl, card, btn, btnGhost }}
          />
        )}

        {/* ══ PEOPLE ═══════════════════════════════════════════════════════ */}
        {tab === 'people' && (
          <PeopleSection
            group={group} people={people}
            editing={editing} setEditing={setEditing}
            upload={upload} write={write} remove={remove}
            busy={busy} classes={{ inp, lbl, card, btn, btnGhost, fileInp }}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SECTIONS
// ═════════════════════════════════════════════════════════════════════════════

function PressSection({ group, releases, isActive, editing, setEditing, upload, write, remove, busy, classes }: any) {
  const { inp, lbl, card, btn, btnGhost, fileInp } = classes;
  const [f, setF] = useState<any>({ title: '', summary: '', content: '', published_at: '', original_source: '' });
  const [pdf, setPdf] = useState<File | null>(null);

  useEffect(() => {
    if (editing) setF({
      title: editing.title || '', summary: editing.summary || '', content: editing.content || '',
      published_at: editing.published_at ? editing.published_at.slice(0, 10) : '',
      original_source: editing.original_source || '',
    });
  }, [editing]);

  const save = async (publish: boolean) => {
    if (!f.title.trim()) return alert('A title is required.');
    if (f.content.trim().length < 20) return alert('The statement is too short.');

    let pdf_url = editing?.pdf_url || null;
    if (pdf) {
      const url = await upload(pdf, 'press');
      if (!url) return;
      pdf_url = url;
    }

    const payload: any = {
      title: f.title.trim(),
      summary: f.summary.trim() || null,
      content: f.content.trim(),
      original_source: f.original_source.trim() || null,
      pdf_url,
    };

    // A date typed by the publisher wins, which is what makes archived releases
    // possible — a 2019 statement carries its 2019 date rather than today's.
    if (publish) {
      payload.published_at = f.published_at
        ? new Date(f.published_at).toISOString()
        : new Date().toISOString();
    }

    const ok = await write(
      editing
        ? supabase.from('press_releases').update(payload).eq('id', editing.id)
        : supabase.from('press_releases').insert({ ...payload, group_id: group.id }),
      publish ? 'Published.' : 'Saved as a draft.'
    );
    if (ok) { setF({ title: '', summary: '', content: '', published_at: '', original_source: '' }); setPdf(null); }
  };

  return (
    <>
      <div className={card}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
          {editing ? 'Edit release' : 'New release'}
        </h2>

        <div><label className={lbl}>Title</label>
          <input className={inp} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>

        <div><label className={lbl}>Summary</label>
          <input className={inp} placeholder="One line shown in the feed." value={f.summary}
            onChange={e => setF({ ...f, summary: e.target.value })} /></div>

        <div><label className={lbl}>Statement</label>
          <textarea rows={10} className={inp} value={f.content}
            onChange={e => setF({ ...f, content: e.target.value })} />
          <p className="text-[11px] text-[#8A8E99] mt-1.5 leading-relaxed">
            Required even when you attach a PDF — it is what appears in search
            results and what someone reads on a phone with no PDF viewer.
          </p></div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div><label className={lbl}>Attach PDF (optional)</label>
            <input type="file" accept="application/pdf" className={fileInp}
              onChange={e => setPdf(e.target.files?.[0] || null)} />
            {editing?.pdf_url && !pdf && (
              <p className="text-[11px] text-[#2A9C6E] mt-1.5">A PDF is already attached.</p>
            )}</div>
          <div><label className={lbl}>Date</label>
            <input type="date" className={inp} value={f.published_at}
              onChange={e => setF({ ...f, published_at: e.target.value })} />
            <p className="text-[11px] text-[#8A8E99] mt-1.5">
              Leave blank for today. Set an earlier date for statements issued before
              you joined Gun X.
            </p></div>
        </div>

        <div><label className={lbl}>Originally published by (optional)</label>
          <input className={inp} placeholder="e.g. Issued on our website, March 2019" value={f.original_source}
            onChange={e => setF({ ...f, original_source: e.target.value })} />
          <p className="text-[11px] text-[#8A8E99] mt-1.5">
            Shown on archived releases so an older statement is not mistaken for a new one.
          </p></div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => save(true)} disabled={busy || !isActive} className={btn}>
            {editing ? 'Update & publish' : 'Publish'}
          </button>
          <button onClick={() => save(false)} disabled={busy} className={btnGhost + " px-6 py-3 text-[12px]"}>
            Save draft
          </button>
          {editing && <button onClick={() => setEditing(null)} className="text-[#8A8E99] text-[12px] font-black uppercase tracking-widest px-4">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {releases.length === 0 ? (
          <div className={card}><p className="text-[#8A8E99] text-sm">No press releases yet.</p></div>
        ) : releases.map((r: any) => (
          <div key={r.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase truncate">{r.title}</h3>
                <p className="text-[11px] text-[#8A8E99] mt-0.5">
                  {r.published_at
                    ? new Date(r.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Draft'}
                  {r.pdf_url && <span className="text-[#C9922A] ml-2">PDF attached</span>}
                </p>
              </div>
              <span className={`flex-shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-sm border ${
                r.published_at ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]' : 'bg-white/5 border-white/10 text-[#8A8E99]'}`}>
                {r.published_at ? 'Live' : 'Draft'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => setEditing(r)} className={btnGhost}>Edit</button>
              {r.published_at && (
                <button onClick={() => write(supabase.from('press_releases').update({ published_at: null }).eq('id', r.id), 'Removed from the feed.')}
                  className="text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-[#C9922A]/30 text-[#C9922A] rounded-sm hover:bg-[#C9922A]/10">
                  Unpublish
                </button>
              )}
              <button onClick={() => remove('press_releases', r.id, 'press release')}
                className="text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-[#E63946]/30 text-[#E63946] rounded-sm hover:bg-[#E63946]/10">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EventsSection({ group, events, editing, setEditing, upload, write, remove, busy, classes }: any) {
  const { inp, lbl, card, btn, btnGhost, fileInp } = classes;
  const [f, setF] = useState<any>({ title: '', description: '', location_name: '', address: '', province: '', starts_at: '', ends_at: '', price: '', price_note: '', booking_url: '' });
  const [banner, setBanner] = useState<File | null>(null);

  useEffect(() => {
    if (editing) setF({
      title: editing.title || '', description: editing.description || '',
      location_name: editing.location_name || '', address: editing.address || '',
      province: editing.province || '',
      starts_at: editing.starts_at ? editing.starts_at.slice(0, 16) : '',
      ends_at: editing.ends_at ? editing.ends_at.slice(0, 16) : '',
      price: editing.price ?? '', price_note: editing.price_note || '',
      booking_url: editing.booking_url || '',
    });
  }, [editing]);

  const save = async (publish: boolean) => {
    if (!f.title.trim()) return alert('A title is required.');
    if (!f.starts_at) return alert('A start date and time is required.');

    let banner_url = editing?.banner_url || null;
    if (banner) {
      const url = await upload(banner, 'events');
      if (!url) return;
      banner_url = url;
    }

    const payload: any = {
      title: f.title.trim(), description: f.description.trim() || null,
      location_name: f.location_name.trim() || null, address: f.address.trim() || null,
      province: f.province.trim() || null,
      starts_at: new Date(f.starts_at).toISOString(),
      ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
      price: f.price === '' ? null : Number(f.price),
      price_note: f.price_note.trim() || null,
      booking_url: f.booking_url.trim() || null,
      banner_url, is_published: publish,
    };

    const ok = await write(
      editing
        ? supabase.from('advocacy_events').update(payload).eq('id', editing.id)
        : supabase.from('advocacy_events').insert({ ...payload, group_id: group.id }),
      publish ? 'Event published.' : 'Event saved as a draft.'
    );
    if (ok) { setF({ title: '', description: '', location_name: '', address: '', province: '', starts_at: '', ends_at: '', price: '', price_note: '', booking_url: '' }); setBanner(null); }
  };

  return (
    <>
      <div className={card}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
          {editing ? 'Edit event' : 'New event'}
        </h2>

        <div><label className={lbl}>Title</label>
          <input className={inp} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>

        <div><label className={lbl}>Description</label>
          <textarea rows={5} className={inp} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>

        <div><label className={lbl}>Banner</label>
          <input type="file" accept="image/*" className={fileInp} onChange={e => setBanner(e.target.files?.[0] || null)} />
          {editing?.banner_url && !banner && <p className="text-[11px] text-[#2A9C6E] mt-1.5">A banner is already set.</p>}</div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div><label className={lbl}>Starts</label>
            <input type="datetime-local" className={inp} value={f.starts_at} onChange={e => setF({ ...f, starts_at: e.target.value })} /></div>
          <div><label className={lbl}>Ends (optional)</label>
            <input type="datetime-local" className={inp} value={f.ends_at} onChange={e => setF({ ...f, ends_at: e.target.value })} /></div>
          <div><label className={lbl}>Venue</label>
            <input className={inp} placeholder="e.g. Pretoria Shooting Club" value={f.location_name} onChange={e => setF({ ...f, location_name: e.target.value })} /></div>
          <div><label className={lbl}>Province</label>
            <input className={inp} value={f.province} onChange={e => setF({ ...f, province: e.target.value })} /></div>
        </div>

        <div><label className={lbl}>Address</label>
          <input className={inp} value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div><label className={lbl}>Price (R)</label>
            <input type="number" step="0.01" className={inp} placeholder="Leave blank if free" value={f.price}
              onChange={e => setF({ ...f, price: e.target.value })} /></div>
          <div><label className={lbl}>Price note</label>
            <input className={inp} placeholder="e.g. Members free, guests R150" value={f.price_note}
              onChange={e => setF({ ...f, price_note: e.target.value })} /></div>
        </div>

        <div><label className={lbl}>Booking link</label>
          <input className={inp} placeholder="https://…" value={f.booking_url} onChange={e => setF({ ...f, booking_url: e.target.value })} />
          <p className="text-[11px] text-[#8A8E99] mt-1.5">
            Bookings and payment happen on your own site. Gun X does not sell tickets.
          </p></div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => save(true)} disabled={busy} className={btn}>
            {editing ? 'Update & publish' : 'Publish event'}
          </button>
          <button onClick={() => save(false)} disabled={busy} className={btnGhost + " px-6 py-3 text-[12px]"}>Save draft</button>
          {editing && <button onClick={() => setEditing(null)} className="text-[#8A8E99] text-[12px] font-black uppercase tracking-widest px-4">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className={card}><p className="text-[#8A8E99] text-sm">No events yet.</p></div>
        ) : events.map((ev: any) => (
          <div key={ev.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase truncate">{ev.title}</h3>
                <p className="text-[11px] text-[#8A8E99] mt-0.5">
                  {new Date(ev.starts_at).toLocaleString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {ev.location_name && ` · ${ev.location_name}`}
                </p>
              </div>
              <span className={`flex-shrink-0 text-[9px] font-black uppercase px-2 py-1 rounded-sm border ${
                ev.is_published ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]' : 'bg-white/5 border-white/10 text-[#8A8E99]'}`}>
                {ev.is_published ? 'Live' : 'Draft'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => setEditing(ev)} className={btnGhost}>Edit</button>
              <button onClick={() => remove('advocacy_events', ev.id, 'event')}
                className="text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-[#E63946]/30 text-[#E63946] rounded-sm hover:bg-[#E63946]/10">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MembershipSection({ group, tiers, intro, setIntro, saveIntro, editing, setEditing, write, remove, busy, classes }: any) {
  const { inp, lbl, card, btn, btnGhost } = classes;
  const [f, setF] = useState<any>({ name: '', price: '', period: 'year', description: '', benefits: '', join_url: '' });

  useEffect(() => {
    if (editing) setF({
      name: editing.name || '', price: editing.price ?? '', period: editing.period || 'year',
      description: editing.description || '', benefits: (editing.benefits || []).join('\n'),
      join_url: editing.join_url || '',
    });
  }, [editing]);

  const save = async () => {
    if (!f.name.trim()) return alert('A tier name is required.');
    const payload = {
      name: f.name.trim(),
      price: f.price === '' ? null : Number(f.price),
      period: f.period,
      description: f.description.trim() || null,
      benefits: f.benefits.split('\n').map((b: string) => b.trim()).filter(Boolean),
      join_url: f.join_url.trim() || null,
    };
    const ok = await write(
      editing
        ? supabase.from('advocacy_membership_tiers').update(payload).eq('id', editing.id)
        : supabase.from('advocacy_membership_tiers').insert({ ...payload, group_id: group.id }),
      'Membership tier saved.'
    );
    if (ok) setF({ name: '', price: '', period: 'year', description: '', benefits: '', join_url: '' });
  };

  return (
    <>
      <div className={card}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">Membership</h2>
        <p className="text-[12px] text-[#8A8E99] leading-relaxed">
          What membership costs and what it includes. Joining happens on your own
          site — Gun X takes no subscriptions and holds no member records.
        </p>
        <div><label className={lbl}>Introduction</label>
          <textarea rows={3} className={inp} value={intro} onChange={e => setIntro(e.target.value)} /></div>
        <button onClick={saveIntro} disabled={busy} className={btnGhost + " px-6 py-3 text-[12px]"}>Save introduction</button>
      </div>

      <div className={card}>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase pb-3 border-b border-white/5">
          {editing ? 'Edit tier' : 'Add a tier'}
        </h3>

        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className={lbl}>Name</label>
            <input className={inp} placeholder="e.g. Individual" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><label className={lbl}>Price (R)</label>
            <input type="number" step="0.01" className={inp} placeholder="Blank if free" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></div>
          <div><label className={lbl}>Per</label>
            <select className={inp} value={f.period} onChange={e => setF({ ...f, period: e.target.value })}>
              <option value="year">Year</option><option value="month">Month</option><option value="once">Once-off</option>
            </select></div>
        </div>

        <div><label className={lbl}>Description</label>
          <input className={inp} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>

        <div><label className={lbl}>What you get</label>
          <textarea rows={6} className={inp} placeholder="One benefit per line" value={f.benefits}
            onChange={e => setF({ ...f, benefits: e.target.value })} /></div>

        <div><label className={lbl}>Join link</label>
          <input className={inp} placeholder="https://…/join" value={f.join_url} onChange={e => setF({ ...f, join_url: e.target.value })} /></div>

        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className={btn}>{editing ? 'Update tier' : 'Add tier'}</button>
          {editing && <button onClick={() => setEditing(null)} className="text-[#8A8E99] text-[12px] font-black uppercase tracking-widest px-4">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {tiers.map((t: any) => (
          <div key={t.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">{t.name}</h3>
                <p className="text-[#C9922A] font-black text-[15px]">
                  {t.price ? `R${Number(t.price).toLocaleString('en-ZA')} / ${t.period}` : 'Free'}
                </p>
                {t.benefits?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {t.benefits.map((b: string, i: number) => (
                      <li key={i} className="text-[12px] text-[#8A8E99]">· {b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing(t)} className={btnGhost}>Edit</button>
              <button onClick={() => remove('advocacy_membership_tiers', t.id, 'tier')}
                className="text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-[#E63946]/30 text-[#E63946] rounded-sm hover:bg-[#E63946]/10">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AchievementsSection({ group, items, editing, setEditing, write, remove, busy, classes }: any) {
  const { inp, lbl, card, btn, btnGhost } = classes;
  const [f, setF] = useState<any>({ title: '', description: '', year: '', link_url: '' });

  useEffect(() => {
    if (editing) setF({
      title: editing.title || '', description: editing.description || '',
      year: editing.year ?? '', link_url: editing.link_url || '',
    });
  }, [editing]);

  const save = async () => {
    if (!f.title.trim()) return alert('A title is required.');
    const payload = {
      title: f.title.trim(), description: f.description.trim() || null,
      year: f.year === '' ? null : Number(f.year),
      link_url: f.link_url.trim() || null,
    };
    const ok = await write(
      editing
        ? supabase.from('advocacy_achievements').update(payload).eq('id', editing.id)
        : supabase.from('advocacy_achievements').insert({ ...payload, group_id: group.id }),
      'Achievement saved.'
    );
    if (ok) setF({ title: '', description: '', year: '', link_url: '' });
  };

  return (
    <>
      <div className={card}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
          {editing ? 'Edit achievement' : 'Add an achievement'}
        </h2>
        <p className="text-[12px] text-[#8A8E99] leading-relaxed">
          Court victories, legislative submissions, campaigns won. A mission statement
          says what you intend; this says what came of it, and it is usually the most
          persuasive part of the page.
        </p>

        <div className="grid sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3"><label className={lbl}>Title</label>
            <input className={inp} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
          <div><label className={lbl}>Year</label>
            <input type="number" className={inp} value={f.year} onChange={e => setF({ ...f, year: e.target.value })} /></div>
        </div>

        <div><label className={lbl}>Description</label>
          <textarea rows={4} className={inp} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>

        <div><label className={lbl}>Link (optional)</label>
          <input className={inp} placeholder="Judgment, article or submission" value={f.link_url}
            onChange={e => setF({ ...f, link_url: e.target.value })} /></div>

        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className={btn}>{editing ? 'Update' : 'Add'}</button>
          {editing && <button onClick={() => setEditing(null)} className="text-[#8A8E99] text-[12px] font-black uppercase tracking-widest px-4">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((a: any) => (
          <div key={a.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
            <div className="flex items-baseline gap-3">
              {a.year && <span className="text-[#C9922A] font-black text-[15px] flex-shrink-0">{a.year}</span>}
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase">{a.title}</h3>
            </div>
            {a.description && <p className="text-[12px] text-[#8A8E99] mt-2 leading-relaxed">{a.description}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditing(a)} className={btnGhost}>Edit</button>
              <button onClick={() => remove('advocacy_achievements', a.id, 'achievement')}
                className="text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-[#E63946]/30 text-[#E63946] rounded-sm hover:bg-[#E63946]/10">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PeopleSection({ group, people, editing, setEditing, upload, write, remove, busy, classes }: any) {
  const { inp, lbl, card, btn, btnGhost, fileInp } = classes;
  const [f, setF] = useState<any>({ name: '', role: '', bio: '', email: '' });
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (editing) setF({
      name: editing.name || '', role: editing.role || '',
      bio: editing.bio || '', email: editing.email || '',
    });
  }, [editing]);

  const save = async () => {
    if (!f.name.trim()) return alert('A name is required.');

    let photo_url = editing?.photo_url || null;
    if (photo) {
      const url = await upload(photo, 'people');
      if (!url) return;
      photo_url = url;
    }

    const payload = {
      name: f.name.trim(), role: f.role.trim() || null,
      bio: f.bio.trim() || null, email: f.email.trim() || null, photo_url,
    };
    const ok = await write(
      editing
        ? supabase.from('advocacy_people').update(payload).eq('id', editing.id)
        : supabase.from('advocacy_people').insert({ ...payload, group_id: group.id }),
      'Saved.'
    );
    if (ok) { setF({ name: '', role: '', bio: '', email: '' }); setPhoto(null); }
  };

  return (
    <>
      <div className={card}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase pb-3 border-b border-white/5">
          {editing ? 'Edit person' : 'Add a person'}
        </h2>

        {/* These are named individuals with photographs. Whose agreement that
            needs is worth stating where the photograph is chosen. */}
        <div className="bg-[#C9922A]/[0.07] border-l-2 border-[#C9922A] px-4 py-3">
          <p className="text-[12px] text-[#C4C0B8] leading-relaxed">
            Publish only people who have agreed to appear here. Their name, role and
            photograph become public, and it is your organisation's responsibility to
            have their permission. Do not publish personal addresses or private numbers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div><label className={lbl}>Name</label>
            <input className={inp} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><label className={lbl}>Role</label>
            <input className={inp} placeholder="e.g. Chairperson" value={f.role} onChange={e => setF({ ...f, role: e.target.value })} /></div>
        </div>

        <div><label className={lbl}>Biography</label>
          <textarea rows={5} className={inp} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} /></div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div><label className={lbl}>Photograph</label>
            <input type="file" accept="image/*" className={fileInp} onChange={e => setPhoto(e.target.files?.[0] || null)} />
            {editing?.photo_url && !photo && <p className="text-[11px] text-[#2A9C6E] mt-1.5">A photograph is already set.</p>}</div>
          <div><label className={lbl}>Work email (optional)</label>
            <input className={inp} value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></div>
        </div>

        <div className="flex gap-3">
          <button onClick={save} disabled={busy} className={btn}>{editing ? 'Update' : 'Add'}</button>
          {editing && <button onClick={() => setEditing(null)} className="text-[#8A8E99] text-[12px] font-black uppercase tracking-widest px-4">Cancel</button>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {people.map((p: any) => (
          <div key={p.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-sm bg-[#C9922A] overflow-hidden flex items-center justify-center flex-shrink-0">
                {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                             : <span className="text-black font-black">{p.name.charAt(0)}</span>}
              </div>
              <div className="min-w-0">
                <p className="font-black text-[14px] text-[#F0EDE8] truncate">{p.name}</p>
                <p className="text-[11px] text-[#8A8E99]">{p.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className={btnGhost}>Edit</button>
              <button onClick={() => remove('advocacy_people', p.id, 'person')}
                className="text-[11px] font-black uppercase tracking-widest px-4 py-2 border border-[#E63946]/30 text-[#E63946] rounded-sm hover:bg-[#E63946]/10">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}