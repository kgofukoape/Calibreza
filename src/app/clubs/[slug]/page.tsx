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
      .eq('status', 'active')
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
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase">Club Not Found</h1>
          <Link href="/clubs" className="text-[#C9922A] font-bold uppercase tracking-widest text-sm hover:brightness-125">← Back to Clubs</Link>
        </div>
      </div>
    );
  }

  const images = club.images?.length > 0 ? club.images.slice(0, 10) : [];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* COVER PHOTO — Facebook/X style */}
      <div className="relative h-[220px] md:h-[320px] bg-[#12141a] overflow-hidden">
        {club.cover_url ? (
          <img src={club.cover_url} alt="Club Cover" className="w-full h-full object-cover opacity-70" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#191C23] via-[#13151A] to-[#0D0F13]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] via-[#0D0F13]/40 to-transparent" />

        {/* Profile info overlay at bottom */}
        <div className="absolute bottom-0 left-0 w-full pb-5 md:pb-8">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-end md:items-end gap-4">
            {/* Logo */}
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-sm bg-[#C9922A] border-4 border-[#0D0F13] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xl">
              {club.logo_url ? (
                <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-black font-black text-4xl">
                  {club.name?.charAt(0)}
                </span>
              )}
            </div>

            {/* Name + details */}
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="text-3xl md:text-5xl font-black uppercase tracking-tight text-[#F0EDE8]">
                  {club.name}
                </h1>
                {club.is_verified && (
                  <span className="bg-[#2A9C6E] text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-wider flex-shrink-0">
                    ✓ Verified Club
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#8A8E99] font-bold uppercase tracking-widest">
                <span>📍 {club.city}{club.province ? `, ${club.province}` : ''}</span>
                {club.disciplines?.length > 0 && (
                  <span>🎯 {club.disciplines.slice(0, 3).join(' · ')}</span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3 pb-1 flex-shrink-0">
              {club.phone && (
                <a href={`tel:${club.phone}`}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 transition-all">
                  📞 Call
                </a>
              )}
              {club.email && (
                <a href={`mailto:${club.email}`}
                  className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:bg-white/5 transition-all">
                  ✉ Email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LEADERBOARD AD */}
      <div className="w-full flex justify-center py-3 px-4 md:px-6 bg-[#0D0F13]">
        <div className="w-full max-w-[970px] h-[70px] md:h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* TABS */}
      <div className="bg-[#0D0F13] border-b border-white/5 sticky top-[68px] md:top-[80px] z-40">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {[
              { id: 'about', label: 'About' },
              { id: 'shootdays', label: 'Shoot Days' },
              { id: 'gallery', label: `Gallery${images.length > 0 ? ` (${images.length})` : ''}` },
              { id: 'contact', label: 'Contact & Fees' },
            ].map(tab => (
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

      {/* MAIN CONTENT */}
      <div className="max-w-[1280px] mx-auto w-full px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-8">

        {/* LEFT CONTENT */}
        <main className="flex-1 min-w-0">

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="flex flex-col gap-6">
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4 text-[#C9922A]">
                  About {club.name}
                </h2>
                <p className="text-[#8A8E99] leading-relaxed text-[14px] whitespace-pre-wrap">
                  {club.description || `Welcome to ${club.name}. We are a shooting club based in ${club.city}. Contact us for more information about membership and shoot days.`}
                </p>
              </div>

              {/* Disciplines */}
              {club.disciplines?.length > 0 && (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">
                    Disciplines
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {club.disciplines.map((d: string) => (
                      <span key={d} className="bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A] text-[12px] font-black uppercase tracking-wider px-3 py-1.5 rounded-sm">
                        🎯 {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Associations */}
              {club.associations?.length > 0 && (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-4">
                    Affiliated With
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {club.associations.map((a: string) => (
                      <span key={a} className="bg-[#191C23] border border-white/10 text-[#F0EDE8] text-[12px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mid-page ad */}
              <div className="w-full h-[90px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
                <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">728 × 90 Ad Space</span>
                <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
              </div>
            </div>
          )}

          {/* SHOOT DAYS TAB */}
          {activeTab === 'shootdays' && (
            <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
                Shoot Days & Schedule
              </h2>
              {club.shoot_days && Array.isArray(club.shoot_days) && club.shoot_days.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {club.shoot_days.map((day: any, idx: number) => (
                    <div key={idx} className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-black uppercase tracking-widest text-[14px] text-[#F0EDE8]">{day.day || day.name}</p>
                          {day.discipline && <p className="text-[12px] text-[#C9922A] font-bold uppercase tracking-wider mt-0.5">🎯 {day.discipline}</p>}
                          {day.notes && <p className="text-[12px] text-[#8A8E99] mt-1">{day.notes}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {day.time && <p className="text-[13px] font-black text-[#F0EDE8]">🕐 {day.time}</p>}
                          {day.fee && <p className="text-[13px] font-bold text-[#C9922A]">R {Number(day.fee).toLocaleString('en-ZA')}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-[#8A8E99] text-sm">No shoot days listed yet.</p>
                  <p className="text-[#8A8E99] text-sm mt-1">Contact the club directly for their schedule.</p>
                </div>
              )}

              {/* Weekly schedule grid */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-[#8A8E99]">
                  Weekly Overview
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map(day => {
                    const hasShoot = club.shoot_days?.some((s: any) =>
                      s.day?.toLowerCase().includes(day.toLowerCase().slice(0, 3))
                    );
                    return (
                      <div key={day} className={`rounded-sm p-2 text-center ${hasShoot ? 'bg-[#C9922A]/10 border border-[#C9922A]/30' : 'bg-[#0D0F13] border border-white/5'}`}>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#8A8E99]">{day.slice(0, 3)}</p>
                        <p className={`text-[11px] font-black mt-1 ${hasShoot ? 'text-[#C9922A]' : 'text-white/20'}`}>
                          {hasShoot ? '✓' : '–'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="flex flex-col gap-4">
              {images.length > 0 ? (
                <>
                  {/* Main image */}
                  <div className="w-full bg-[#13151A] border border-white/5 rounded-sm overflow-hidden relative" style={{ height: '400px' }}>
                    <img src={images[selectedImage]} alt="" className="w-full h-full object-cover" />
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white text-xl hover:bg-black/80 transition-all">
                          ‹
                        </button>
                        <button onClick={() => setSelectedImage(i => Math.min(images.length - 1, i + 1))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white text-xl hover:bg-black/80 transition-all">
                          ›
                        </button>
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm">
                          {selectedImage + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {images.map((img: string, idx: number) => (
                      <button key={idx} onClick={() => setSelectedImage(idx)}
                        className={`aspect-square bg-[#13151A] rounded-sm overflow-hidden transition-all ${
                          selectedImage === idx ? 'border-2 border-[#C9922A]' : 'border border-white/10 hover:border-[#C9922A]/50'
                        }`}>
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

          {/* CONTACT & FEES TAB */}
          {activeTab === 'contact' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
                  Get In Touch
                </h2>
                <div className="flex flex-col gap-5">
                  {club.phone && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Phone</p>
                      <a href={`tel:${club.phone}`} className="text-lg font-bold text-[#C9922A] hover:brightness-110">{club.phone}</a>
                    </div>
                  )}
                  {club.email && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Email</p>
                      <a href={`mailto:${club.email}`} className="text-lg font-bold hover:text-[#C9922A] transition-colors">{club.email}</a>
                    </div>
                  )}
                  {club.address && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Address</p>
                      <p className="text-lg font-bold leading-snug">{club.address}</p>
                    </div>
                  )}
                  {club.website && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Website</p>
                      <a href={club.website} target="_blank" rel="noopener noreferrer"
                        className="text-lg font-bold text-[#C9922A] hover:underline">Visit Website →</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Fees */}
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-6">
                  Fees & Pricing
                </h2>
                <div className="flex flex-col gap-4">
                  {club.membership_fee ? (
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">Annual Membership</span>
                      <span className="text-xl font-black text-[#C9922A]">R {Number(club.membership_fee).toLocaleString('en-ZA')}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">Annual Membership</span>
                      <span className="text-[13px] text-[#8A8E99]">Contact club</span>
                    </div>
                  )}
                  {club.range_fee ? (
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">Range Fee</span>
                      <span className="text-xl font-black text-[#C9922A]">R {Number(club.range_fee).toLocaleString('en-ZA')}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">Range Fee</span>
                      <span className="text-[13px] text-[#8A8E99]">Contact club</span>
                    </div>
                  )}
                  <p className="text-[12px] text-[#8A8E99] leading-relaxed mt-2">
                    Fees may vary by shoot day and discipline. Contact the club directly for the most up-to-date pricing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-full lg:w-[280px] xl:w-[320px] flex-shrink-0 flex flex-col gap-4">

          {/* Quick Info Card */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase mb-4 text-[#F0EDE8]">
              Quick Info
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Location</p>
                <p className="text-[13px] font-bold">{club.city}{club.province ? `, ${club.province}` : ''}</p>
              </div>
              {club.disciplines?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Disciplines</p>
                  <div className="flex flex-wrap gap-1">
                    {club.disciplines.map((d: string) => (
                      <span key={d} className="text-[10px] bg-[#0D0F13] border border-white/10 text-[#8A8E99] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {club.shoot_days?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Shoot Days</p>
                  <p className="text-[13px] font-bold">{club.shoot_days.length} day{club.shoot_days.length !== 1 ? 's' : ''} per week</p>
                </div>
              )}
              {club.membership_fee && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Membership From</p>
                  <p className="text-[16px] font-black text-[#C9922A]">R {Number(club.membership_fee).toLocaleString('en-ZA')}/yr</p>
                </div>
              )}
            </div>

            {/* Contact buttons */}
            <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-white/5">
              {club.phone && (
                <a href={`tel:${club.phone}`}
                  className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:brightness-110 transition-all text-center">
                  📞 Call Club
                </a>
              )}
              {club.email && (
                <a href={`mailto:${club.email}`}
                  className="w-full border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">
                  ✉ Send Email
                </a>
              )}
              {club.website && (
                <a href={club.website} target="_blank" rel="noopener noreferrer"
                  className="w-full border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">
                  🌐 Website
                </a>
              )}
            </div>
          </div>

          {/* Sidebar Ad */}
          <div className="w-full h-[250px] bg-[#12141a] border border-white/5 flex flex-col items-center justify-center">
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-2">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold mx-4 mb-4">
              300 × 250
            </div>
          </div>

          {/* Back link */}
          <Link href="/clubs" className="text-[12px] text-[#8A8E99] font-bold uppercase tracking-widest hover:text-[#C9922A] transition-colors">
            ← Back to All Clubs
          </Link>
        </aside>
      </div>
    </div>
  );
}