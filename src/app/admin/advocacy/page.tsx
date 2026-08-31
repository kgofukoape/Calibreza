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
// Where an organisation edits its profile and publishes press releases.
//
// Every write here checks the rows it changed rather than trusting the absence
// of an error. Row-level security does not reject a disallowed write — it
// matches nothing, which Postgres reports as success. On this stack a silent
// failure and a success look identical unless you ask.

interface Group {
  id: string;
  name: string;
  slug: string;
  status: string;
  mission_statement: string | null;
  about_text: string | null;
  website_url: string | null;
  contact_email: string | null;
}

interface Release {
  id: string;
  title: string;
  content: string;
  published_at: string | null;
  created_at: string;
}

export default function AdvocacyDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [tab, setTab] = useState<'releases' | 'profile'>('releases');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Composer
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    mission_statement: '', about_text: '', website_url: '', contact_email: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/business/login'); return; }

    const { data: g } = await supabase
      .from('advocacy_groups')
      .select('id, name, slug, status, mission_statement, about_text, website_url, contact_email')
      .eq('owner_user_id', session.user.id)
      .maybeSingle();

    if (!g) { router.push('/advocacy/apply'); return; }

    setGroup(g as Group);
    setProfile({
      mission_statement: g.mission_statement || '',
      about_text: g.about_text || '',
      website_url: g.website_url || '',
      contact_email: g.contact_email || '',
    });

    const { data: r } = await supabase
      .from('press_releases')
      .select('id, title, content, published_at, created_at')
      .eq('group_id', (g as Group).id)
      .order('created_at', { ascending: false });

    setReleases((r || []) as Release[]);
    setLoading(false);
  };

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 5000);
  };

  // ── PUBLISH / UPDATE ─────────────────────────────────────────────────────
  const savePress = async (publish: boolean) => {
    if (!group) return;
    if (!title.trim()) { flash('err', 'A title is required.'); return; }
    if (content.trim().length < 20) { flash('err', 'The release is too short to publish.'); return; }

    setSaving(true);

    const payload: any = {
      title: title.trim(),
      content: content.trim(),
    };
    // Only set on publish. Saving a draft must not silently make it public.
    if (publish) payload.published_at = new Date().toISOString();

    const query = editingId
      ? supabase.from('press_releases').update(payload).eq('id', editingId).select('id')
      : supabase.from('press_releases').insert({ ...payload, group_id: group.id }).select('id');

    const { data, error } = await query;
    setSaving(false);

    if (error) {
      // The database refuses content containing script markup. Say so plainly
      // rather than showing a constraint name.
      flash('err',
        error.message.includes('press_releases_no_script')
          ? 'Press releases are plain text. Please remove any HTML or script markup.'
          : `Could not save: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      flash('err', 'Nothing was saved — your account does not appear to have permission. Contact support@gunx.co.za.');
      return;
    }

    setTitle(''); setContent(''); setEditingId(null);
    flash('ok', publish ? 'Published. It is live on the press feed now.' : 'Saved as a draft.');
    load();
  };

  const unpublish = async (r: Release) => {
    if (!confirm(`Take "${r.title}" off the public feed?\n\nIt stays here as a draft and can be republished.`)) return;

    const { data, error } = await supabase
      .from('press_releases').update({ published_at: null }).eq('id', r.id).select('id');

    if (error) { flash('err', error.message); return; }
    if (!data?.length) { flash('err', 'Nothing changed — permission denied.'); return; }

    flash('ok', 'Removed from the public feed.');
    load();
  };

  const remove = async (r: Release) => {
    if (!confirm(`Delete "${r.title}" permanently?\n\nThis cannot be undone.`)) return;

    const { data, error } = await supabase
      .from('press_releases').delete().eq('id', r.id).select('id');

    if (error) { flash('err', error.message); return; }
    if (!data?.length) { flash('err', 'Nothing was deleted — permission denied.'); return; }

    flash('ok', 'Deleted.');
    load();
  };

  const edit = (r: Release) => {
    setEditingId(r.id); setTitle(r.title); setContent(r.content); setTab('releases');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveProfile = async () => {
    if (!group) return;
    setSavingProfile(true);

    const { data, error } = await supabase
      .from('advocacy_groups')
      .update({
        mission_statement: profile.mission_statement.trim() || null,
        about_text: profile.about_text.trim() || null,
        website_url: profile.website_url.trim() || null,
        contact_email: profile.contact_email.trim() || null,
      })
      .eq('id', group.id)
      .select('id');

    setSavingProfile(false);

    if (error) { flash('err', `Could not save: ${error.message}`); return; }
    if (!data?.length) { flash('err', 'Nothing was saved — permission denied.'); return; }
    flash('ok', 'Profile updated.');
  };

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50";
  const lbl = "text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2 block";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <div className="max-w-[900px] mx-auto px-4 py-24 text-center">
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!group) return null;

  const isActive = group.status === 'active';

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-8">
        <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9922A] mb-2">
              Advocacy Dashboard
            </p>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">
              {group.name}
            </h1>
          </div>

          {isActive && (
            <Link href={`/advocacy/${group.slug}`}
              className="flex-shrink-0 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:bg-white/5 transition-all text-center">
              View public profile →
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-8 space-y-5">

        {/* Pending organisations can edit but not publish, and should be told
            why rather than finding the buttons mysteriously inert. */}
        {!isActive && (
          <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm p-5">
            <p className="text-[13px] text-[#C9922A] leading-relaxed">
              <strong className="uppercase tracking-widest font-black">
                {group.status === 'suspended' ? 'Listing suspended' : 'Awaiting review'}
              </strong><br />
              {group.status === 'suspended'
                ? 'This listing is not currently public. Contact support@gunx.co.za.'
                : 'Your organisation is not public yet. You can prepare your profile and draft releases now — publishing unlocks once the listing is approved.'}
            </p>
          </div>
        )}

        {msg && (
          <div className={`rounded-sm px-4 py-3 border text-[13px] font-bold ${
            msg.kind === 'ok'
              ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]'
              : 'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
          }`}>
            {msg.text}
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2">
          {([['releases', 'Press Releases'], ['profile', 'Profile']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm transition-all ${
                tab === id ? 'bg-[#C9922A] text-black' : 'border border-white/10 text-[#8A8E99] hover:text-[#F0EDE8]'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'releases' ? (
          <>
            {/* COMPOSER */}
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 space-y-5">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="text-2xl font-black uppercase pb-3 border-b border-white/5">
                {editingId ? 'Edit release' : 'New release'}
              </h2>

              <div>
                <label className={lbl}>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Submission on the Firearms Control Amendment Bill" className={inp} />
              </div>

              <div>
                <label className={lbl}>Statement</label>
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  rows={12}
                  placeholder="Write your statement here. Plain text — line breaks are preserved."
                  className={inp} />
                <p className="text-[11px] text-[#8A8E99] mt-1.5 leading-relaxed">
                  Plain text only. HTML and script markup are rejected — your statement
                  appears on a page shared with other organisations, and markup from one
                  publisher could affect every reader of the feed.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => savePress(true)} disabled={saving || !isActive}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-30">
                  {saving ? 'Saving…' : editingId ? 'Update & publish' : 'Publish'}
                </button>
                <button onClick={() => savePress(false)} disabled={saving}
                  className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all disabled:opacity-30">
                  Save draft
                </button>
                {editingId && (
                  <button onClick={() => { setEditingId(null); setTitle(''); setContent(''); }}
                    className="text-[#8A8E99] font-black uppercase tracking-widest text-[12px] px-4 py-3 hover:text-[#F0EDE8] transition-all">
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* EXISTING */}
            <div className="space-y-3">
              {releases.length === 0 ? (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-10 text-center">
                  <p className="text-[#8A8E99] text-sm">No press releases yet.</p>
                </div>
              ) : releases.map(r => (
                <div key={r.id} className="bg-[#13151A] border border-white/5 rounded-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-xl font-black uppercase text-[#F0EDE8] truncate">{r.title}</h3>
                      <p className="text-[11px] text-[#8A8E99] mt-0.5">
                        {r.published_at
                          ? `Published ${new Date(r.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : 'Draft — not public'}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border ${
                      r.published_at
                        ? 'bg-[#2A9C6E]/10 border-[#2A9C6E]/30 text-[#2A9C6E]'
                        : 'bg-white/5 border-white/10 text-[#8A8E99]'
                    }`}>
                      {r.published_at ? 'Live' : 'Draft'}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#8A8E99] leading-relaxed line-clamp-2 mb-4">{r.content}</p>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => edit(r)}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border border-white/10 text-[#F0EDE8] rounded-sm hover:bg-white/5 transition-all">
                      Edit
                    </button>
                    {r.published_at && (
                      <button onClick={() => unpublish(r)}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border border-[#C9922A]/30 text-[#C9922A] rounded-sm hover:bg-[#C9922A]/10 transition-all">
                        Unpublish
                      </button>
                    )}
                    <button onClick={() => remove(r)}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 border border-[#E63946]/30 text-[#E63946] rounded-sm hover:bg-[#E63946]/10 transition-all">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* PROFILE */
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 space-y-5">
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black uppercase pb-3 border-b border-white/5">
              Profile
            </h2>

            <div>
              <label className={lbl}>Mission Statement</label>
              <textarea value={profile.mission_statement} rows={3} maxLength={300}
                onChange={e => setProfile(p => ({ ...p, mission_statement: e.target.value }))}
                className={inp} />
            </div>

            <div>
              <label className={lbl}>About</label>
              <textarea value={profile.about_text} rows={8}
                onChange={e => setProfile(p => ({ ...p, about_text: e.target.value }))}
                className={inp} />
            </div>

            <div>
              <label className={lbl}>Website</label>
              <input value={profile.website_url}
                onChange={e => setProfile(p => ({ ...p, website_url: e.target.value }))}
                placeholder="https://yourorganisation.org.za" className={inp} />
            </div>

            <div>
              <label className={lbl}>Contact Email</label>
              <input type="email" value={profile.contact_email}
                onChange={e => setProfile(p => ({ ...p, contact_email: e.target.value }))}
                className={inp} />
            </div>

            <button onClick={saveProfile} disabled={savingProfile}
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-40">
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>

            <p className="text-[11px] text-[#8A8E99] leading-relaxed pt-2 border-t border-white/5">
              Your organisation's name cannot be changed here — email
              support@gunx.co.za if it needs to. That keeps a listed organisation
              from quietly becoming a different one after approval.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}