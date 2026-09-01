'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';

// ─── ADVOCACY GROUP PROFILE ──────────────────────────────────────────────────
// /advocacy/[slug]
//
// Everything the organisation publishes. Every route to money — joining,
// donating, booking an event — leaves for their own site. Gun X shows what it
// costs and who to contact; it does not stand between an organisation and its
// supporters.

/**
 * A third-party URL out of a database row. Anything that is not http(s) —
 * javascript:, data: — is refused rather than rendered, because a link is a
 * thing a visitor clicks and this one was typed by somebody else.
 */
function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.toString() : null;
  } catch { return null; }
}

const SOCIALS: [string, string][] = [
  ['facebook', 'Facebook'],
  ['x', 'X'],
  ['instagram', 'Instagram'],
  ['youtube', 'YouTube'],
];

export default function AdvocacyProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [group, setGroup] = useState<any>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { if (slug) load(); }, [slug]);

  const load = async () => {
    const { data: g } = await supabase
      .from('advocacy_groups').select('*').eq('slug', slug).eq('status', 'active').maybeSingle();

    if (!g) { setNotFound(true); setLoading(false); return; }
    setGroup(g);

    const nowIso = new Date().toISOString();
    const [r, e, t, a, p] = await Promise.all([
      supabase.from('press_releases').select('*').eq('group_id', g.id)
        .not('published_at', 'is', null).lte('published_at', nowIso)
        .order('published_at', { ascending: false }),
      // Upcoming only. A past event left on the page is the same failure as a
      // sold listing left in search — it wastes the reader's time and teaches
      // them the page is not maintained.
      supabase.from('advocacy_events').select('*').eq('group_id', g.id)
        .eq('is_published', true).gte('starts_at', nowIso).order('starts_at'),
      supabase.from('advocacy_membership_tiers').select('*').eq('group_id', g.id).order('sort_order'),
      supabase.from('advocacy_achievements').select('*').eq('group_id', g.id)
        .order('year', { ascending: false }),
      supabase.from('advocacy_people').select('*').eq('group_id', g.id).order('sort_order'),
    ]);

    setReleases(r.data || []); setEvents(e.data || []); setTiers(t.data || []);
    setAchievements(a.data || []); setPeople(p.data || []);
    setLoading(false);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <div className="max-w-[900px] mx-auto px-4 py-24 text-center">
        <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
      </div>
      <Footer />
    </div>
  );

  if (notFound || !group) return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <div className="max-w-[900px] mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4 opacity-20">⚖️</div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase mb-2">Organisation not found</h1>
        <p className="text-[#8A8E99] text-sm mb-6">This organisation is not listed, or its profile is not currently active.</p>
        <Link href="/advocacy" className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110">
          All organisations
        </Link>
      </div>
      <Footer />
    </div>
  );

  const website = safeUrl(group.website_url);
  const donate  = safeUrl(group.donate_url);
  const social  = group.social_links || {};
  const section = "bg-[#13151A] border border-white/5 rounded-sm p-6";
  const h2 = "text-2xl font-black uppercase text-[#F0EDE8] mb-4 pb-3 border-b border-white/5";

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      {/* COVER */}
      <div className="relative h-[180px] md:h-[260px] bg-[#191C23] overflow-hidden">
        {group.cover_image_url ? (
          <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1d24] to-[#0D0F13]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] via-[#0D0F13]/40 to-transparent" />
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-6">
        <div className="relative -mt-16 flex flex-col sm:flex-row sm:items-end gap-5 mb-6">
          <div className="w-24 h-24 rounded-sm bg-[#C9922A] border-4 border-[#0D0F13] flex items-center justify-center overflow-hidden flex-shrink-0">
            {group.logo_url
              ? <img src={group.logo_url} alt="" className="w-full h-full object-cover" />
              : <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-4xl">{group.name.charAt(0)}</span>}
          </div>

          <div className="flex-1 min-w-0 pb-1">
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none">{group.name}</h1>
            <div className="flex items-center gap-3 flex-wrap mt-2 text-[11px] font-bold uppercase tracking-widest text-[#8A8E99]">
              {group.founded_year && <span>Est. {group.founded_year}</span>}
              {group.npo_number && <span>NPO {group.npo_number}</span>}
              {group.section_18a && (
                <span className="text-[#2A9C6E] border border-[#2A9C6E]/30 bg-[#2A9C6E]/10 px-2 py-0.5 rounded-sm">
                  Section 18A · donations tax deductible
                </span>
              )}
            </div>
          </div>
        </div>

        {group.mission_statement && (
          <p className="text-[15px] md:text-[16px] text-[#C4C0B8] leading-relaxed mb-6 max-w-3xl">
            {group.mission_statement}
          </p>
        )}

        {/* ACTIONS — every one of these leaves for their own site */}
        <div className="flex flex-wrap gap-3 mb-8">
          {donate && (
            <a href={donate} target="_blank" rel="noopener noreferrer nofollow"
              className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
              Donate →
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer nofollow"
              className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
              Visit Website →
            </a>
          )}
          {SOCIALS.map(([key, label]) => {
            const url = safeUrl(social[key]);
            return url ? (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer nofollow"
                className="border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[11px] px-4 py-3 rounded-sm hover:text-[#F0EDE8] hover:bg-white/5 transition-all">
                {label}
              </a>
            ) : null;
          })}
        </div>

        <div className="space-y-5 pb-10">

          {/* ABOUT */}
          {group.about_text && (
            <div className={section}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={h2}>About</h2>
              <div className="text-[14.5px] text-[#C4C0B8] leading-relaxed whitespace-pre-wrap">{group.about_text}</div>
            </div>
          )}

          {/* UPCOMING EVENTS */}
          {events.length > 0 && (
            <div className={section}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={h2}>
                Upcoming <span className="text-[#C9922A]">Events</span>
              </h2>
              <div className="space-y-4">
                {events.map(ev => {
                  const booking = safeUrl(ev.booking_url);
                  return (
                    <div key={ev.id} className="border border-white/5 rounded-sm overflow-hidden">
                      {ev.banner_url && <img src={ev.banner_url} alt="" className="w-full h-[140px] object-cover" />}
                      <div className="p-5">
                        <p className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] mb-1">
                          {fmtDateTime(ev.starts_at)}
                          {ev.ends_at && ` — ${fmtDateTime(ev.ends_at)}`}
                        </p>
                        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-2">{ev.title}</h3>
                        {ev.description && <p className="text-[13.5px] text-[#8A8E99] leading-relaxed mb-3 whitespace-pre-wrap">{ev.description}</p>}

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-[#C4C0B8] mb-4">
                          {ev.location_name && <span>📍 {ev.location_name}{ev.province && `, ${ev.province}`}</span>}
                          {ev.address && <span className="text-[#8A8E99]">{ev.address}</span>}
                          <span className="text-[#C9922A] font-bold">
                            {ev.price ? `R${Number(ev.price).toLocaleString('en-ZA')}` : 'Free'}
                            {ev.price_note && <span className="text-[#8A8E99] font-normal ml-2">{ev.price_note}</span>}
                          </span>
                        </div>

                        {booking && (
                          <a href={booking} target="_blank" rel="noopener noreferrer nofollow"
                            className="inline-block border border-[#C9922A]/40 text-[#C9922A] font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:bg-[#C9922A]/10 transition-all">
                            Book on their site →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MEMBERSHIP */}
          {(tiers.length > 0 || group.membership_intro) && (
            <div className={section}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={h2}>Membership</h2>
              {group.membership_intro && (
                <p className="text-[14px] text-[#C4C0B8] leading-relaxed mb-5 whitespace-pre-wrap">{group.membership_intro}</p>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {tiers.map(t => {
                  const join = safeUrl(t.join_url) || website;
                  return (
                    <div key={t.id} className="border border-white/5 rounded-sm p-5">
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">{t.name}</h3>
                      <p className="text-[#C9922A] font-black text-2xl leading-none my-2">
                        {t.price ? `R${Number(t.price).toLocaleString('en-ZA')}` : 'Free'}
                        {t.price && <span className="text-[12px] text-[#8A8E99] font-bold ml-1">/ {t.period}</span>}
                      </p>
                      {t.description && <p className="text-[12.5px] text-[#8A8E99] leading-relaxed mb-3">{t.description}</p>}
                      {t.benefits?.length > 0 && (
                        <ul className="space-y-1.5 mb-4">
                          {t.benefits.map((b: string, i: number) => (
                            <li key={i} className="text-[12.5px] text-[#C4C0B8] flex gap-2">
                              <span className="text-[#C9922A] flex-shrink-0">✓</span>{b}
                            </li>
                          ))}
                        </ul>
                      )}
                      {join && (
                        <a href={join} target="_blank" rel="noopener noreferrer nofollow"
                          className="inline-block border border-[#C9922A]/40 text-[#C9922A] font-black uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-sm hover:bg-[#C9922A]/10 transition-all">
                          Join →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11.5px] text-[#5A5E69] leading-relaxed mt-5 pt-4 border-t border-white/5">
                Membership is handled entirely by {group.name}. Gun X does not process
                joining fees or subscriptions and holds no member records.
              </p>
            </div>
          )}

          {/* ACHIEVEMENTS */}
          {achievements.length > 0 && (
            <div className={section}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={h2}>Track Record</h2>
              <div className="space-y-4">
                {achievements.map(a => {
                  const link = safeUrl(a.link_url);
                  return (
                    <div key={a.id} className="flex gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      {a.year && (
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                          className="text-[#C9922A] font-black text-xl flex-shrink-0 w-14">{a.year}</span>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-[15px] text-[#F0EDE8]">{a.title}</h3>
                        {a.description && <p className="text-[13px] text-[#8A8E99] leading-relaxed mt-1">{a.description}</p>}
                        {link && (
                          <a href={link} target="_blank" rel="noopener noreferrer nofollow"
                            className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] hover:underline mt-2 inline-block">
                            Read more →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PEOPLE */}
          {people.length > 0 && (
            <div className={section}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={h2}>Leadership</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {people.map(p => (
                  <div key={p.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-sm bg-[#C9922A] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {p.photo_url
                        ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-black font-black text-xl">{p.name.charAt(0)}</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[14px] text-[#F0EDE8]">{p.name}</p>
                      {p.role && <p className="text-[11px] font-bold uppercase tracking-widest text-[#C9922A] mb-1">{p.role}</p>}
                      {p.bio && <p className="text-[12.5px] text-[#8A8E99] leading-relaxed">{p.bio}</p>}
                      {p.email && <a href={`mailto:${p.email}`} className="text-[12px] text-[#C9922A] hover:underline mt-1 inline-block">{p.email}</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRESS RELEASES */}
          <div className={section}>
            <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-white/5">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase text-[#F0EDE8]">
                Press <span className="text-[#C9922A]">Releases</span>
              </h2>
              <Link href="/press" className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#C9922A]">All →</Link>
            </div>

            {/* Attribution sits with the statements. Someone arriving here from a
                shared link never sees the notice on the /press page. */}
            <div className="border-l-2 border-[#C9922A] bg-[#C9922A]/[0.05] px-4 py-3 mb-5">
              <p className="text-[12px] text-[#C4C0B8] leading-relaxed">
                Statements below are published by {group.name} and are their own. They do
                not reflect the position of GX SA (Pty) Ltd.
              </p>
            </div>

            {releases.length === 0 ? (
              <p className="text-[#8A8E99] text-sm">No press releases published yet.</p>
            ) : (
              <div className="space-y-5">
                {releases.map(r => {
                  const pdf = safeUrl(r.pdf_url);
                  return (
                    <article key={r.id} className="pb-5 border-b border-white/5 last:border-0 last:pb-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">
                        {fmtDate(r.published_at)}
                        {r.original_source && <span className="text-[#5A5E69] normal-case font-normal tracking-normal ml-2">· {r.original_source}</span>}
                      </p>
                      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className="text-2xl font-black uppercase tracking-tight mb-2 leading-tight">{r.title}</h3>
                      {r.summary && <p className="text-[13.5px] text-[#C4C0B8] leading-relaxed mb-3 italic">{r.summary}</p>}

                      {/* Text, never markup — a third party is writing into a
                          page served from your domain. */}
                      <div className="text-[14px] text-[#C4C0B8] leading-relaxed whitespace-pre-wrap">{r.content}</div>

                      {pdf && (
                        <a href={pdf} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 mt-4 border border-white/10 rounded-sm px-4 py-3 hover:border-[#C9922A]/40 hover:bg-white/[0.02] transition-all">
                          <span className="text-2xl">📄</span>
                          <span>
                            <span className="block text-[12.5px] font-bold text-[#F0EDE8]">Download the full release</span>
                            <span className="block text-[11px] text-[#8A8E99]">PDF · {fmtDate(r.published_at)}</span>
                          </span>
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* CONTACT */}
          {(group.contact_email || group.press_contact_name || group.press_contact_email) && (
            <div className={section}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className={h2}>Contact</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {group.contact_email && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">General</p>
                    <a href={`mailto:${group.contact_email}`} className="text-[#C9922A] text-[14px] hover:underline break-all">{group.contact_email}</a>
                  </div>
                )}
                {(group.press_contact_name || group.press_contact_email) && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Media Enquiries</p>
                    {group.press_contact_name && <p className="text-[14px] text-[#F0EDE8] font-bold">{group.press_contact_name}</p>}
                    {group.press_contact_email && (
                      <a href={`mailto:${group.press_contact_email}`} className="text-[#C9922A] text-[14px] hover:underline break-all block">{group.press_contact_email}</a>
                    )}
                    {group.press_contact_phone && (
                      <a href={`tel:${group.press_contact_phone}`} className="text-[#8A8E99] text-[13px] hover:text-[#C9922A]">{group.press_contact_phone}</a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}