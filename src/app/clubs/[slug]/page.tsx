'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

export default function ClubDetailPage() {
  const params = useParams();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => { fetchClub(); }, [params.slug]);

  const fetchClub = async () => {
    const { data } = await supabase
      .from('clubs')
      .select('*')
      .eq('slug', params.slug)
      .in('status', ['active', 'approved'])
      .single();
    setClub(data || null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="text-5xl">⊕</div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase">Not Found</h1>
          <Link href="/clubs" className="text-[#C9922A] font-bold uppercase tracking-widest text-sm hover:brightness-125">← Back to Clubs & Ranges</Link>
        </div>
      </div>
    );
  }

  const isRange = club.facility_type === 'range';
  const images = club.images?.length > 0 ? club.images.slice(0, 10) : [];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'shootdays', label: isRange ? 'Sessions' : 'Shoot Days' },
    ...(isRange ? [{ id: 'facilities', label: 'Facilities' }] : []),
    { id: 'gallery', label: `Gallery${images.length > 0 ? ` (${images.length})` : ''}` },
    { id: 'contact', label: 'Contact & Fees' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* TOP LEADERBOARD — same as home page */}
      <div className="w-full flex justify-center pt-3 pb-2 px-4">
        <div className="w-full max-w-[970px] h-[120px] lg:h-[160px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Top Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* COVER PHOTO */}
      <div className="relative h-[200px] md:h-[280px] bg-[#12141a] overflow-hidden">
        {club.cover_url ? (
          <img src={club.cover_url} alt="Cover" className="w-full h-full object-cover opacity-70" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#191C23] via-[#13151A] to-[#0D0F13]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] via-[#0D0F13]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full pb-5 md:pb-6">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-end gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-sm bg-[#C9922A] border-4 border-[#0D0F13] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xl">
              {club.logo_url
                ? <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                : <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-4xl">{club.name?.charAt(0)}</span>
              }
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#F0EDE8]">
                  {club.name}
                </h1>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-wider flex-shrink-0 ${isRange ? 'bg-[#C9922A] text-black' : 'bg-white/10 text-[#F0EDE8]'}`}>
                  {isRange ? '🎯 Range' : '🏛️ Club'}
                </span>
                {club.is_verified && (
                  <span className="bg-[#2A9C6E] text-white text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-wider flex-shrink-0">✓ Verified</span>
                )}
              </div>
              <p className="text-[12px] text-[#8A8E99] font-bold uppercase tracking-widest">
                📍 {club.city}{club.province ? `, ${club.province}` : ''}
                {club.disciplines?.length > 0 && ` · 🎯 ${club.disciplines.slice(0, 2).join(' · ')}`}
              </p>
            </div>
            <div className="flex gap-3 pb-1 flex-shrink-0">
              {club.phone && (
                <a href={`tel:${club.phone}`} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all">📞 Call</a>
              )}
              {club.email && (
                <a href={`mailto:${club.email}`} className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:bg-white/5 transition-all">✉ Email</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABS BAR */}
      <div className="bg-[#0D0F13] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className={`py-4 text-[14px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id ? 'border-[#C9922A] text-[#C9922A]' : 'border-transparent text-[#8A8E99] hover:text-white'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3-COLUMN LAYOUT — matches home page exactly */}
      <div className="flex w-full items-start flex-1">

        {/* LEFT SKYSCRAPER AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[180px] pl-2 pt-4">
          <div className="sticky top-[57px] w-full h-[600px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center p-3 text-center">
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 x 600</div>
          </div>
        </aside>

        {/* CENTRE CONTENT */}
        <div className="flex-1 min-w-0 py-6 md:py-8 px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* MAIN TAB CONTENT */}
            <main className="flex-1 min-w-0">

              {/* ABOUT */}
              {activeTab === 'about' && (
                <div className="flex flex-col gap-5">
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4 text-[#C9922A]">About {club.name}</h2>
                    <p className="text-[#8A8E99] leading-relaxed text-[14px] whitespace-pre-wrap">
                      {club.description || `Welcome to ${club.name}. We are a ${isRange ? 'shooting range' : 'shooting club'} based in ${club.city}. Contact us for more information.`}
                    </p>
                  </div>

                  {club.disciplines?.length > 0 && (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">Disciplines</h2>
                      <div className="flex flex-wrap gap-2">
                        {club.disciplines.map((d: string) => (
                          <span key={d} className="bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A] text-[12px] font-black uppercase tracking-wider px-3 py-1.5 rounded-sm">🎯 {d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {club.associations?.length > 0 && (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">Affiliated With</h2>
                      <div className="flex flex-wrap gap-2">
                        {club.associations.map((a: string) => (
                          <span key={a} className="bg-[#191C23] border border-white/10 text-[#F0EDE8] text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {club.additional_info && (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">Additional Info</h2>
                      <p className="text-[#8A8E99] leading-relaxed text-[14px] whitespace-pre-wrap">{club.additional_info}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SHOOT DAYS / SESSIONS */}
              {activeTab === 'shootdays' && (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
                    {isRange ? 'Public Shoot Sessions' : 'Shoot Days & Schedule'}
                  </h2>
                  {club.shoot_days?.filter((d: any) => d.day).length > 0 ? (
                    <div className="flex flex-col gap-3 mb-8">
                      {club.shoot_days.filter((d: any) => d.day).map((day: any, idx: number) => (
                        <div key={idx} className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="font-black uppercase tracking-widest text-[14px]">{day.day}</p>
                              {day.discipline && <p className="text-[12px] text-[#C9922A] font-bold uppercase tracking-wider mt-0.5">🎯 {day.discipline}</p>}
                              {day.notes && <p className="text-[12px] text-[#8A8E99] mt-1">{day.notes}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              {day.time && <p className="text-[13px] font-black">🕐 {day.time}</p>}
                              {day.fee && <p className="text-[13px] font-bold text-[#C9922A]">R {Number(day.fee).toLocaleString('en-ZA')}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 mb-8">
                      <div className="text-4xl mb-3">📅</div>
                      <p className="text-[#8A8E99] text-sm">No {isRange ? 'sessions' : 'shoot days'} listed yet. Contact {isRange ? 'the range' : 'the club'} directly for their schedule.</p>
                    </div>
                  )}
                  <div className="pt-6 border-t border-white/5">
                    <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-[#8A8E99]">Weekly Overview</h3>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map(day => {
                        const hasShoot = club.shoot_days?.some((s: any) => s.day?.toLowerCase().startsWith(day.toLowerCase().slice(0, 3)));
                        return (
                          <div key={day} className={`rounded-sm p-2 text-center ${hasShoot ? 'bg-[#C9922A]/10 border border-[#C9922A]/30' : 'bg-[#0D0F13] border border-white/5'}`}>
                            <p className="text-[9px] font-black uppercase tracking-wider text-[#8A8E99]">{day.slice(0, 3)}</p>
                            <p className={`text-[11px] font-black mt-1 ${hasShoot ? 'text-[#C9922A]' : 'text-white/20'}`}>{hasShoot ? '✓' : '–'}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* FACILITIES (Range only) */}
              {activeTab === 'facilities' && isRange && (
                <div className="flex flex-col gap-5">
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">Range Facilities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                      {[
                        { label: 'Environment', value: club.range_environment || '—', icon: club.range_environment === 'indoor' ? '🏠' : club.range_environment === 'both' ? '🏠🌳' : '🌳' },
                        { label: 'Booths / Lanes', value: (club.booth_count || club.lane_count) ? `${club.booth_count || club.lane_count}` : '—', icon: '🎯' },
                        { label: 'Max Distance', value: club.max_distance_m ? `${club.max_distance_m}m` : '—', icon: '📏' },
                        { label: 'Covered Booths', value: club.covered_lanes ? 'Yes' : 'No', icon: '🏗️' },
                        { label: 'Booking Required', value: club.booking_required ? 'Yes' : 'Walk-in', icon: '📋' },
                        { label: 'Range Officer', value: club.range_officer_on_duty ? 'On Duty' : 'No', icon: '👮' },
                      ].map((s, i) => (
                        <div key={i} className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                          <div className="text-2xl mb-2">{s.icon}</div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">{s.label}</p>
                          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {club.booth_distances && (
                      <div className="pt-5 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Booth Distances</p>
                        <p className="text-[13px] text-[#F0EDE8] leading-relaxed">{club.booth_distances}</p>
                      </div>
                    )}
                  </div>

                  {club.guns_for_hire && (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-5">Guns for <span className="text-[#C9922A]">Hire</span></h2>
                      <div className="grid md:grid-cols-2 gap-5">
                        {club.hire_gun_makes?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Makes Available</p>
                            <div className="flex flex-wrap gap-1.5">
                              {club.hire_gun_makes.map((m: string) => (
                                <span key={m} className="px-2.5 py-1 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[12px] font-bold text-[#C9922A]">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {club.hire_gun_calibres?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Calibres Available</p>
                            <div className="flex flex-wrap gap-1.5">
                              {club.hire_gun_calibres.map((c: string) => (
                                <span key={c} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-sm text-[12px] font-bold">{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GALLERY */}
              {activeTab === 'gallery' && (
                <div className="flex flex-col gap-4">
                  {images.length > 0 ? (
                    <>
                      <div className="w-full bg-[#13151A] border border-white/5 rounded-sm overflow-hidden relative" style={{ height: '400px' }}>
                        <img src={images[selectedImage]} alt="" className="w-full h-full object-cover" />
                        {images.length > 1 && (
                          <>
                            <button onClick={() => setSelectedImage(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white text-xl hover:bg-black/80 transition-all">‹</button>
                            <button onClick={() => setSelectedImage(i => Math.min(images.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white text-xl hover:bg-black/80 transition-all">›</button>
                            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm">{selectedImage + 1} / {images.length}</div>
                          </>
                        )}
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        {images.map((img: string, idx: number) => (
                          <button key={idx} onClick={() => setSelectedImage(idx)}
                            className={`aspect-square bg-[#13151A] rounded-sm overflow-hidden transition-all ${selectedImage === idx ? 'border-2 border-[#C9922A]' : 'border border-white/10 hover:border-[#C9922A]/50'}`}>
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center">
                      <div className="text-5xl mb-4 opacity-20">📷</div>
                      <p className="text-[#8A8E99]">No photos uploaded yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* CONTACT & FEES */}
              {activeTab === 'contact' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">Get In Touch</h2>
                    <div className="flex flex-col gap-5">
                      {club.phone && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Phone</p><a href={`tel:${club.phone}`} className="text-lg font-bold text-[#C9922A] hover:brightness-110">{club.phone}</a></div>}
                      {club.email && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Email</p><a href={`mailto:${club.email}`} className="text-lg font-bold hover:text-[#C9922A] transition-colors">{club.email}</a></div>}
                      {club.address && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Address</p><p className="text-lg font-bold leading-snug">{club.address}</p></div>}
                      {club.website && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Website</p><a href={club.website} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-[#C9922A] hover:underline">Visit Website →</a></div>}
                    </div>
                  </div>
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">Fees & Pricing</h2>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">Annual Membership</span>
                        {club.membership_fee ? <span className="text-xl font-black text-[#C9922A]">R {Number(club.membership_fee).toLocaleString('en-ZA')}</span> : <span className="text-[13px] text-[#8A8E99]">Contact for info</span>}
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">Range Fee</span>
                        {club.range_fee ? <span className="text-xl font-black text-[#C9922A]">R {Number(club.range_fee).toLocaleString('en-ZA')}</span> : <span className="text-[13px] text-[#8A8E99]">Contact for info</span>}
                      </div>
                      <p className="text-[12px] text-[#8A8E99] leading-relaxed mt-2">Fees may vary. Contact {isRange ? 'the range' : 'the club'} directly for current pricing.</p>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* RIGHT CONTENT SIDEBAR (Quick Info) */}
            <aside className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-4">
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4">Quick Info</h3>
                <div className="flex flex-col gap-3 text-[13px]">
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Location</p><p className="font-bold">{club.city}{club.province ? `, ${club.province}` : ''}</p></div>
                  {isRange && club.booth_count && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Booths</p><p className="font-bold">{club.booth_count} booths</p></div>}
                  {isRange && club.max_distance_m && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Max Distance</p><p className="font-bold">{club.max_distance_m}m</p></div>}
                  {isRange && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Guns for Hire</p><p className={`font-bold ${club.guns_for_hire ? 'text-[#C9922A]' : 'text-[#8A8E99]'}`}>{club.guns_for_hire ? '✓ Available' : 'Not available'}</p></div>}
                  {club.disciplines?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Disciplines</p>
                      <div className="flex flex-wrap gap-1">
                        {club.disciplines.map((d: string) => (
                          <span key={d} className="text-[10px] bg-[#0D0F13] border border-white/10 text-[#8A8E99] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {club.shoot_days?.filter((d: any) => d.day).length > 0 && (
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">{isRange ? 'Session Days' : 'Shoot Days'}</p><p className="font-bold">{club.shoot_days.filter((d: any) => d.day).length} day{club.shoot_days.filter((d: any) => d.day).length !== 1 ? 's' : ''}/week</p></div>
                  )}
                  {club.membership_fee && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Membership From</p><p className="text-[16px] font-black text-[#C9922A]">R {Number(club.membership_fee).toLocaleString('en-ZA')}/yr</p></div>}
                </div>
                <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-white/5">
                  {club.phone && <a href={`tel:${club.phone}`} className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:brightness-110 transition-all text-center">📞 Call {isRange ? 'Range' : 'Club'}</a>}
                  {club.email && <a href={`mailto:${club.email}`} className="w-full border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">✉ Send Email</a>}
                  {club.website && <a href={club.website} target="_blank" rel="noopener noreferrer" className="w-full border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">🌐 Website</a>}
                </div>
              </div>

              {/* 300×250 ad */}
              <div className="w-full h-[250px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-2">Advertisement</span>
                <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold mx-4 mb-4">300 × 250</div>
              </div>

              <Link href="/clubs" className="text-[12px] text-[#8A8E99] font-bold uppercase tracking-widest hover:text-[#C9922A] transition-colors">
                ← Back to All Clubs & Ranges
              </Link>
            </aside>
          </div>
        </div>

        {/* RIGHT SKYSCRAPER AD */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[180px] pr-2 pt-4">
          <div className="sticky top-[57px] w-full h-[600px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center p-3 text-center">
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 x 600</div>
          </div>
        </aside>

      </div>
    </div>
  );
}
