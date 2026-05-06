'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const NOTIFY_URL = '/api/rsvp/notify';

const FEE_LABEL: Record<string, string> = {
  session: 'per session',
  '30min': 'per 30 min',
  hour: 'per hour',
  day: 'per day',
};

export default function ClubDetailPage() {
  const params = useParams();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [selectedImage, setSelectedImage] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slotsForDate, setSlotsForDate] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ user_name: '', user_email: '', user_phone: '', pax: 1, notes: '' });
  const [rsvpSending, setRsvpSending] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpError, setRsvpError] = useState('');

  useEffect(() => { fetchAll(); }, [params.slug]);

  const fetchAll = async () => {
    const { data } = await supabase.from('clubs').select('*').eq('slug', params.slug).in('status', ['active', 'approved']).single();
    if (!data) { setLoading(false); return; }
    setClub(data);
    const schedule = Array.isArray(data.operating_schedule) ? data.operating_schedule : [];
    const days = Array.from({ length: 21 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const sched = schedule.find((s: any) => s.day === dayName);
      return { date: dateStr, dayName, dayShort: dayName.slice(0, 3), dayNum: d.getDate(), month: d.toLocaleDateString('en-ZA', { month: 'short' }), isOpen: sched?.open ?? false, sched };
    });
    setCalendarDays(days);
    const firstOpen = days.find(d => d.isOpen);
    if (firstOpen) setSelectedDate(firstOpen.date);
    const { data: resultData } = await supabase.from('shoot_results').select('*').eq('club_id', data.id).order('shoot_date', { ascending: false }).limit(10);
    setResults(resultData || []);
    if (data.city) {
      try {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(data.city + ', South Africa')}?format=j1`);
        if (res.ok) setWeather(await res.json());
      } catch (e) { /* non-critical */ }
    }
    setLoading(false);
  };

  useEffect(() => { if (club && selectedDate) fetchSlots(selectedDate); }, [selectedDate, club]);

  const fetchSlots = async (date: string) => {
    setSlotsLoading(true);
    const { data } = await supabase.from('range_time_slots').select('*').eq('club_id', club.id).eq('slot_date', date).neq('status', 'blocked').order('start_time');
    setSlotsForDate(data || []);
    setSelectedSlot(null);
    setSlotsLoading(false);
  };

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpForm.user_name || !rsvpForm.user_email) { setRsvpError('Please fill in your name and email'); return; }
    if (!selectedDate) { setRsvpError('Please select a date'); return; }
    if (slotsForDate.length > 0 && !selectedSlot) { setRsvpError('Please select a time slot'); return; }
    setRsvpSending(true); setRsvpError('');
    try {
      const dayName = calendarDays.find(d => d.date === selectedDate)?.dayName || '';
      const confirmationToken = crypto.randomUUID();

      const { error: rsvpErr } = await supabase.from('shoot_rsvps').insert({
        club_id: club.id, day: dayName, shoot_date: selectedDate,
        user_name: rsvpForm.user_name, user_email: rsvpForm.user_email,
        user_phone: rsvpForm.user_phone || null, pax: Number(rsvpForm.pax),
        notes: rsvpForm.notes || null, time_slot_id: selectedSlot?.id || null,
        status: 'pending', confirmation_token: confirmationToken,
      });

      if (rsvpErr) {
        setRsvpError(`Booking failed: ${rsvpErr.message}`);
        setRsvpSending(false);
        return;
      }

      if (selectedSlot) {
        supabase.rpc('increment_slot_bookings', { slot_id: selectedSlot.id }).then(({ error }) => { if (error) console.warn('Slot increment:', error); });
        setSlotsForDate(p => p.map(s => s.id === selectedSlot.id ? { ...s, booked_count: s.booked_count + 1, status: s.booked_count + 1 >= s.capacity ? 'full' : 'available' } : s));
      }

      // Call Next.js API route — server-side, no CORS issues
      const emailRes = await fetch(NOTIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: confirmationToken,
          rsvp: { ...rsvpForm, day: dayName, shoot_date: selectedDate, time_slot: selectedSlot ? `${selectedSlot.start_time.slice(0,5)} – ${selectedSlot.end_time.slice(0,5)}` : null },
          club: { name: club.name, email: club.email, phone: club.phone, booking_required: club.booking_required },
        }),
      });

      if (!emailRes.ok) {
        const err = await emailRes.json();
        console.error('Email API error:', err);
      }

      setRsvpDone(true);
    } catch (err: any) {
      setRsvpError(`Error: ${err?.message || 'Please try again or call the range directly.'}`);
    } finally {
      setRsvpSending(false);
    }
  };

  const currentWeather = weather?.current_condition?.[0];
  const tempC = currentWeather?.temp_C || '';
  const windKmph = currentWeather?.windspeedKmph || '';
  const windDir = currentWeather?.winddir16Point || '';
  const visibilityKm = currentWeather?.visibility || '';
  const uvIndex = currentWeather?.uvIndex || '';
  const humidity = currentWeather?.humidity || '';
  const weatherDesc = currentWeather?.weatherDesc?.[0]?.value || '';
  const weatherCode = Number(currentWeather?.weatherCode || 0);
  const getWeatherIcon = (code: number) => {
    if (code === 113) return '☀️';
    if ([116, 119].includes(code)) return '⛅';
    if ([122, 143, 248, 260].includes(code)) return '🌫️';
    if ([176, 293, 296, 299, 302, 305, 308].includes(code)) return '🌧️';
    if ([200, 386, 389].includes(code)) return '⛈️';
    return '🌤️';
  };

  if (loading) return <div className="min-h-screen bg-[#0D0F13] flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" /></div></div>;
  if (!club) return <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center flex-col gap-4"><div className="text-5xl">⊕</div><h1 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-3xl font-black uppercase">Not Found</h1><Link href="/clubs" className="text-[#C9922A] font-bold uppercase tracking-widest text-sm">← Back to Clubs & Ranges</Link></div></div>;

  const isRange = club.facility_type === 'range';
  const images = club.images?.length > 0 ? club.images.slice(0, 10) : [];
  const openSchedule = Array.isArray(club.operating_schedule) ? club.operating_schedule.filter((d: any) => d.open) : [];
  const hasCompliance = club.saps_reg_number || club.range_rules || club.what_to_bring;
  const selectedDayInfo = calendarDays.find(d => d.date === selectedDate);
  const priceLabel = club.range_fee ? `R${club.range_fee} ${FEE_LABEL[club.range_fee_type || 'session'] || 'per session'}` : null;

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'hours', label: 'Hours & Schedule' },
    ...(isRange ? [{ id: 'facilities', label: 'Facilities' }] : []),
    { id: 'book', label: '✋ Book / RSVP' },
    ...(results.length > 0 ? [{ id: 'results', label: `Results (${results.length})` }] : []),
    ...(images.length > 0 ? [{ id: 'gallery', label: `Gallery (${images.length})` }] : []),
    ...(hasCompliance ? [{ id: 'safety', label: 'Safety & Rules' }] : []),
    { id: 'contact', label: 'Contact & Fees' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* TOP LEADERBOARD */}
      <div className="w-full flex justify-center pt-3 pb-2 px-4">
        <div className="w-full max-w-[970px] h-[120px] lg:h-[160px] bg-[#12141a] border border-white/5 flex items-center justify-center relative">
          <span className="text-[10px] text-[#5A5E69] uppercase tracking-[0.4em] font-bold">Top Leaderboard Ad Space</span>
          <div className="absolute inset-0 border border-dashed border-white/10 opacity-20" />
        </div>
      </div>

      {/* COVER */}
      <div className="relative bg-[#12141a] overflow-hidden" style={{height:'260px'}}>
        {club.cover_url ? <img src={club.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} /> : <div className="w-full h-full bg-gradient-to-br from-[#191C23] via-[#13151A] to-[#0D0F13]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F13] via-[#0D0F13]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full pb-5">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-end gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-sm border-4 border-[#0D0F13] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xl bg-[#C9922A]">
              {club.logo_url ? <img src={club.logo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} /> : <span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-black font-black text-4xl">{club.name?.charAt(0)}</span>}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 flex-wrap mb-1.5">
                <h1 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-3xl md:text-5xl font-black uppercase tracking-tight">{club.name}</h1>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-wider ${isRange?'bg-[#C9922A] text-black':'bg-white/10 text-[#F0EDE8]'}`}>{isRange?'🎯 Range':'🏛️ Club'}</span>
                {club.is_verified && <span className="bg-[#2A9C6E] text-white text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-wider">✓ Verified</span>}
                {club.saps_reg_number && <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-sm uppercase tracking-wider">🛡️ SAPS Registered</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#8A8E99] font-bold uppercase tracking-widest">
                <span>📍 {club.city}{club.province?`, ${club.province}`:''}</span>
                {priceLabel && <span className="text-[#C9922A]">💰 {priceLabel}</span>}
                {club.disciplines?.length > 0 && <span>🎯 {club.disciplines.slice(0,2).join(' · ')}{club.disciplines.length>2?` +${club.disciplines.length-2}`:''}</span>}
              </div>
            </div>
            <div className="flex gap-3 pb-1 flex-shrink-0">
              {club.phone && <a href={`tel:${club.phone}`} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110">📞 Call</a>}
              {club.email && <a href={`mailto:${club.email}`} className="border border-white/20 font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:bg-white/5">✉ Email</a>}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE STATUS + WEATHER BAR */}
      <div className={`border-b px-4 md:px-6 py-3 ${club.is_open_today ? 'bg-green-500/5 border-green-500/20' : 'bg-[#0D0F13] border-white/5'}`}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${club.is_open_today ? 'bg-green-400 animate-pulse' : 'bg-[#5A5E69]'}`} />
              <span className="font-black text-[13px] uppercase tracking-widest">{club.is_open_today ? 'Open Today' : 'Closed Today'}</span>
            </div>
            {isRange && club.lanes_available > 0 && <span className="text-[#C9922A] font-bold text-[13px]">· {club.lanes_available} of {club.booth_count||club.lane_count||'?'} lanes available</span>}
            {club.guns_for_hire && <span className={`text-[13px] font-bold ${club.hire_guns_available ? 'text-[#C9922A]' : 'text-[#5A5E69] line-through'}`}>🔫 Guns for hire {club.hire_guns_available?'✓':'unavailable today'}</span>}
            {club.ammo_in_stock?.length > 0 && <div className="flex items-center gap-1.5 flex-wrap"><span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Ammo:</span>{club.ammo_in_stock.map((a: string) => <span key={a} className="px-2 py-0.5 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[11px] font-bold text-[#C9922A]">{a}</span>)}</div>}
          </div>
          {currentWeather && (
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-sm px-3 py-1.5">
              <span className="text-xl">{getWeatherIcon(weatherCode)}</span>
              <div className="flex items-center gap-2 text-[12px] flex-wrap">
                <span className="font-black text-[#F0EDE8]">{tempC}°C</span>
                <span className="text-[#8A8E99]">·</span>
                <span className="text-[#8A8E99]">💨 {windKmph}km/h {windDir}</span>
                <span className="text-[#8A8E99]">·</span>
                <span className="text-[#8A8E99]">👁 {visibilityKm}km</span>
                {uvIndex && <><span className="text-[#8A8E99]">·</span><span className="text-[#8A8E99]">UV {uvIndex}</span></>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="bg-[#0D0F13] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{fontFamily:"'Barlow Condensed',sans-serif"}}
                className={`py-4 text-[13px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${activeTab===tab.id?'border-[#C9922A] text-[#C9922A]':'border-transparent text-[#8A8E99] hover:text-white'}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3-COLUMN LAYOUT */}
      <div className="flex w-full items-start flex-1">
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[180px] pl-2 pt-4">
          <div className="sticky top-[57px] w-full bg-[#12141a] border border-white/5 flex flex-col items-center justify-center p-3 text-center" style={{height:'600px'}}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 x 600</div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 py-6 md:py-8 px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <main className="flex-1 min-w-0">

              {/* ABOUT */}
              {activeTab === 'about' && (
                <div className="flex flex-col gap-5">
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-4 text-[#C9922A]">About {club.name}</h2>
                    <p className="text-[#8A8E99] leading-relaxed text-[14px] whitespace-pre-wrap">{club.description || `Welcome to ${club.name}. Contact us for more information.`}</p>
                  </div>
                  {currentWeather && (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                      <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-4">Current <span className="text-[#C9922A]">Conditions</span></h2>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-5xl">{getWeatherIcon(weatherCode)}</span>
                        <div><p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-4xl font-black">{tempC}°C</p><p className="text-[#8A8E99] text-[13px] capitalize">{weatherDesc}</p></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          {icon:'💨', label:'Wind', value:`${windKmph} km/h ${windDir}`, note: Number(windKmph) > 30 ? '⚠ May affect accuracy' : 'Good conditions'},
                          {icon:'👁️', label:'Visibility', value:`${visibilityKm} km`, note: Number(visibilityKm) < 5 ? 'Poor visibility' : 'Good visibility'},
                          {icon:'💧', label:'Humidity', value:`${humidity}%`, note:''},
                          {icon:'☀️', label:'UV Index', value:uvIndex||'—', note: Number(uvIndex) > 6 ? 'Wear sunscreen' : 'Moderate'},
                        ].map((s,i) => (
                          <div key={i} className="bg-[#0D0F13] border border-white/5 rounded-sm p-3">
                            <p className="text-lg mb-1">{s.icon}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">{s.label}</p>
                            <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[15px] font-black">{s.value}</p>
                            {s.note && <p className="text-[9px] text-[#8A8E99] mt-0.5">{s.note}</p>}
                          </div>
                        ))}
                      </div>
                      {Number(windKmph) > 40 && <div className="mt-3 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm p-3"><p className="text-[#C9922A] font-black text-[12px] uppercase tracking-widest">⚠️ High wind advisory — {windKmph}km/h winds may significantly affect accuracy at longer distances</p></div>}
                      <p className="text-[10px] text-[#5A5E69] mt-3">Live weather for {club.city} · Updates on each page visit</p>
                    </div>
                  )}
                  {club.disciplines?.length > 0 && (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                      <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-4">Disciplines</h2>
                      <div className="flex flex-wrap gap-2">{club.disciplines.map((d: string) => <span key={d} className="bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A] text-[12px] font-black uppercase tracking-wider px-3 py-1.5 rounded-sm">🎯 {d}</span>)}</div>
                    </div>
                  )}
                  {club.additional_info && <div className="bg-[#13151A] border border-white/5 rounded-sm p-6"><h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-4">Good to Know</h2><p className="text-[#8A8E99] leading-relaxed text-[14px] whitespace-pre-wrap">{club.additional_info}</p></div>}
                </div>
              )}

              {/* HOURS */}
              {activeTab === 'hours' && (
                <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">Operating Hours</h2>
                  {openSchedule.length > 0 ? (
                    <div className="space-y-2">
                      {(club.operating_schedule || []).map((day: any, i: number) => (
                        <div key={i} className={`flex items-center gap-4 rounded-sm px-4 py-3 ${day.open ? 'bg-[#0D0F13] border border-white/5' : 'opacity-40 bg-[#0D0F13]/50 border border-white/5'}`}>
                          <span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className={`w-28 font-black uppercase text-[14px] flex-shrink-0 ${day.day==='Public Holidays'?'text-[#C9922A]':day.open?'text-[#F0EDE8]':'text-[#5A5E69]'}`}>{day.day}</span>
                          {day.open ? (
                            <div className="flex-1 flex items-center gap-4 flex-wrap">
                              <span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[#C9922A] font-black text-[14px]">{day.open_time} – {day.close_time}</span>
                              {day.discipline && <span className="text-[12px] text-[#8A8E99]">· {day.discipline}</span>}
                              {day.fee && <span className="text-[12px] text-[#C9922A] font-bold">· R{day.fee}</span>}
                              {day.notes && <span className="text-[12px] text-[#8A8E99] italic">· {day.notes}</span>}
                            </div>
                          ) : <span className="text-[13px] font-bold text-[#5A5E69]">Closed</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8"><p className="text-[#8A8E99] text-[13px]">Operating hours not set — contact the {isRange?'range':'club'} directly.</p>{club.phone && <a href={`tel:${club.phone}`} className="inline-block mt-4 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110">📞 Call Now</a>}</div>
                  )}
                </div>
              )}

              {/* FACILITIES */}
              {activeTab === 'facilities' && isRange && (
                <div className="flex flex-col gap-5">
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">Range Facilities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                      {[
                        {label:'Environment', value:club.range_environment||'—', icon:club.range_environment==='indoor'?'🏠':club.range_environment==='both'?'🏠🌳':'🌳'},
                        {label:'Booths / Lanes', value:(club.booth_count||club.lane_count)?`${club.booth_count||club.lane_count} booths`:'—', icon:'🎯'},
                        {label:'Max Distance', value:club.max_distance_m?`${club.max_distance_m}m`:'—', icon:'📏'},
                        {label:'Covered Booths', value:club.covered_lanes?'Yes':'No', icon:'🏗️'},
                        {label:'Booking Required', value:club.booking_required?'Yes':'Walk-in', icon:'📋'},
                        {label:'Range Officer', value:club.range_officer_on_duty?'On Duty':'No', icon:'👮'},
                      ].map((s,i) => (
                        <div key={i} className="bg-[#0D0F13] border border-white/5 rounded-sm p-4">
                          <div className="text-2xl mb-2">{s.icon}</div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">{s.label}</p>
                          <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-lg font-black uppercase">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {club.booth_distances && <div className="pt-4 border-t border-white/5"><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Booth Layout</p><p className="text-[13px] leading-relaxed">{club.booth_distances}</p></div>}
                  </div>
                  {club.guns_for_hire && (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase">Guns for <span className="text-[#C9922A]">Hire</span></h2>
                        <span className={`px-3 py-1.5 rounded-sm text-[11px] font-black uppercase tracking-widest ${club.hire_guns_available?'bg-green-500/10 border border-green-500/20 text-green-400':'bg-white/5 border border-white/10 text-[#5A5E69]'}`}>{club.hire_guns_available?'✓ Available Today':'Unavailable Today'}</span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-5">
                        {club.hire_gun_makes?.length > 0 && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Makes</p><div className="flex flex-wrap gap-1.5">{club.hire_gun_makes.map((m: string) => <span key={m} className="px-2.5 py-1 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[12px] font-bold text-[#C9922A]">{m}</span>)}</div></div>}
                        {club.hire_gun_calibres?.length > 0 && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Calibres</p><div className="flex flex-wrap gap-1.5">{club.hire_gun_calibres.map((c: string) => <span key={c} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-sm text-[12px] font-bold">{c}</span>)}</div></div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BOOK / RSVP */}
              {activeTab === 'book' && (
                <div className="flex flex-col gap-5">
                  {rsvpDone ? (
                    <div className="bg-[#13151A] border border-white/5 rounded-sm p-8 text-center">
                      <div className="w-20 h-20 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-full flex items-center justify-center mx-auto mb-5"><span className="text-4xl">⏳</span></div>
                      <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-3xl font-black uppercase mb-2 text-[#C9922A]">Request Sent!</h2>
                      <p className="text-[#8A8E99] text-[14px] mb-6">{club.name} has been notified and will confirm your booking.<br/>Watch your inbox at <span className="text-[#F0EDE8] font-bold">{rsvpForm.user_email}</span> for their response.</p>
                      <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-5 text-left max-w-sm mx-auto mb-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">Booking Summary</p>
                        <div className="space-y-2 text-[13px]">
                          <div className="flex justify-between"><span className="text-[#8A8E99]">Range</span><span className="font-bold">{club.name}</span></div>
                          <div className="flex justify-between"><span className="text-[#8A8E99]">Day</span><span className="font-bold text-[#C9922A]">{selectedDayInfo?.dayName}</span></div>
                          <div className="flex justify-between"><span className="text-[#8A8E99]">Date</span><span className="font-bold">{selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'}) : '—'}</span></div>
                          {selectedSlot && <div className="flex justify-between"><span className="text-[#8A8E99]">Time</span><span className="font-bold">{selectedSlot.start_time.slice(0,5)} – {selectedSlot.end_time.slice(0,5)}</span></div>}
                          <div className="flex justify-between"><span className="text-[#8A8E99]">People</span><span className="font-bold">{rsvpForm.pax}</span></div>
                          <div className="flex justify-between"><span className="text-[#8A8E99]">Status</span><span className="font-bold text-[#C9922A]">⏳ Awaiting confirmation</span></div>
                        </div>
                      </div>
                      <div className="bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm p-4 text-left max-w-sm mx-auto mb-6">
                        <p className="text-[#C9922A] font-black text-[12px] uppercase tracking-widest mb-1">What happens next</p>
                        <p className="text-[#8A8E99] text-[12px] leading-relaxed">{club.name} will click <strong className="text-[#F0EDE8]">Confirm</strong> or <strong className="text-[#F0EDE8]">Decline</strong> in their email. You'll be notified either way. <strong className="text-[#C9922A]">Please don't arrive until confirmed.</strong></p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => { setRsvpDone(false); setSelectedSlot(null); setRsvpForm({ user_name: '', user_email: '', user_phone: '', pax: 1, notes: '' }); }} className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:bg-white/5">Register Another</button>
                        {club.phone && <a href={`tel:${club.phone}`} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110">📞 Call Range</a>}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* CALENDAR */}
                      <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                        <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-2 text-[#C9922A]">Select a Date</h2>
                        <p className="text-[12px] text-[#8A8E99] mb-4">Next 21 days · Greyed out = closed</p>
                        <div className="flex gap-2 overflow-x-auto pb-3">
                          {calendarDays.map((day, i) => {
                            const isSelected = day.date === selectedDate;
                            return (
                              <button key={i} onClick={() => day.isOpen && setSelectedDate(day.date)} disabled={!day.isOpen}
                                className={`flex-shrink-0 w-[72px] py-3 rounded-sm border text-center transition-all ${!day.isOpen ? 'bg-[#0D0F13]/30 border-white/5 opacity-30 cursor-not-allowed' : isSelected ? 'bg-[#C9922A] border-[#C9922A]' : 'bg-[#0D0F13] border-white/10 hover:border-[#C9922A]/40 cursor-pointer'}`}>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-black' : 'text-[#8A8E99]'}`}>{day.dayShort}</p>
                                <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className={`text-[18px] font-black leading-tight ${isSelected ? 'text-black' : day.isOpen ? 'text-[#F0EDE8]' : 'text-[#5A5E69]'}`}>{day.dayNum}</p>
                                <p className={`text-[9px] mb-1 ${isSelected ? 'text-black/70' : 'text-[#8A8E99]'}`}>{day.month}</p>
                                {day.isOpen && day.sched?.open_time && <p className={`text-[8px] font-bold ${isSelected ? 'text-black/70' : 'text-[#8A8E99]/70'}`}>{day.sched.open_time}</p>}
                              </button>
                            );
                          })}
                        </div>
                        {selectedDate && selectedDayInfo && (
                          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3 flex-wrap">
                            <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[16px] font-black uppercase">{selectedDayInfo.dayName}, {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})}</p>
                            {selectedDayInfo.sched?.discipline && <span className="text-[11px] text-[#C9922A] font-bold border border-[#C9922A]/30 px-2 py-0.5 rounded-sm">🎯 {selectedDayInfo.sched.discipline}</span>}
                            {selectedDayInfo.sched?.open_time && <span className="text-[13px] text-[#8A8E99]">⏰ {selectedDayInfo.sched.open_time} – {selectedDayInfo.sched.close_time}</span>}
                            {selectedDayInfo.sched?.fee && <span className="text-[13px] text-[#C9922A] font-bold">💰 R{selectedDayInfo.sched.fee}</span>}
                          </div>
                        )}
                      </div>

                      {/* TIME SLOTS */}
                      {selectedDate && (
                        <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4">{slotsForDate.length > 0 ? 'Select a Time Slot' : 'Time Slots'}</h2>
                          {slotsLoading ? (
                            <div className="flex items-center gap-3 py-6"><div className="w-5 h-5 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" /><p className="text-[#8A8E99] text-[13px]">Loading slots...</p></div>
                          ) : slotsForDate.length === 0 ? (
                            <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-4"><p className="text-[#8A8E99] text-[13px]">No specific time slots set for this date — register below and the range will confirm a time with you.</p></div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {slotsForDate.map((slot, i) => {
                                const isFull = slot.status === 'full' || slot.booked_count >= slot.capacity;
                                const isSelected = selectedSlot?.id === slot.id;
                                return (
                                  <button key={i} onClick={() => !isFull && setSelectedSlot(isSelected ? null : slot)} disabled={isFull}
                                    className={`p-4 rounded-sm border text-center transition-all ${isFull ? 'border-red-500/20 bg-red-500/5 cursor-not-allowed opacity-60' : isSelected ? 'border-[#C9922A] bg-[#C9922A]/10' : 'border-[#2A9C6E]/20 bg-[#2A9C6E]/5 hover:border-[#2A9C6E]/50 cursor-pointer'}`}>
                                    <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className={`text-[16px] font-black mb-1 ${isFull ? 'text-[#5A5E69]' : isSelected ? 'text-[#C9922A]' : 'text-[#F0EDE8]'}`}>{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isFull ? 'text-red-400' : isSelected ? 'text-[#C9922A]' : 'text-[#2A9C6E]'}`}>{isFull ? '● Full' : isSelected ? '✓ Selected' : `${slot.capacity - slot.booked_count} spot${slot.capacity - slot.booked_count !== 1 ? 's' : ''} left`}</p>
                                    {slot.notes && <p className="text-[9px] text-[#8A8E99] mt-1">{slot.notes}</p>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* RSVP FORM */}
                      {selectedDate && (
                        <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                          <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-2 text-[#C9922A]">Your Details</h2>
                          <p className="text-[12px] text-[#8A8E99] mb-5">Free · No payment · {club.name} will confirm your booking via email.</p>
                          {rsvpError && <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-sm p-3 text-red-400 text-[13px]">{rsvpError}</div>}
                          <form onSubmit={handleRsvp} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Full Name *</label><input className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 placeholder-[#8A8E99]/40" placeholder="Your name" value={rsvpForm.user_name} onChange={e=>setRsvpForm(p=>({...p,user_name:e.target.value}))} required /></div>
                              <div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Email *</label><input type="email" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 placeholder-[#8A8E99]/40" placeholder="your@email.com" value={rsvpForm.user_email} onChange={e=>setRsvpForm(p=>({...p,user_email:e.target.value}))} required /></div>
                              <div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Phone (optional)</label><input className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 placeholder-[#8A8E99]/40" placeholder="Cell number" value={rsvpForm.user_phone} onChange={e=>setRsvpForm(p=>({...p,user_phone:e.target.value}))} /></div>
                              <div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Number of People</label><div className="flex items-center gap-3"><button type="button" onClick={()=>setRsvpForm(p=>({...p,pax:Math.max(1,p.pax-1)}))} className="w-9 h-9 bg-[#0D0F13] border border-white/10 rounded-sm font-black text-lg hover:border-[#C9922A]/30">−</button><span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black w-8 text-center">{rsvpForm.pax}</span><button type="button" onClick={()=>setRsvpForm(p=>({...p,pax:p.pax+1}))} className="w-9 h-9 bg-[#0D0F13] border border-white/10 rounded-sm font-black text-lg hover:border-[#C9922A]/30">+</button></div></div>
                            </div>
                            <div><label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5">Notes (optional)</label><input className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 placeholder-[#8A8E99]/40" placeholder="e.g. First time visitor, bringing own firearm" value={rsvpForm.notes} onChange={e=>setRsvpForm(p=>({...p,notes:e.target.value}))} /></div>
                            <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-4">
                              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Booking Summary</p>
                              <div className="flex flex-wrap gap-4 text-[13px]">
                                <span><span className="text-[#8A8E99]">Date: </span><span className="font-bold text-[#C9922A]">{selectedDayInfo?.dayName}, {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'short'}) : '—'}</span></span>
                                {selectedSlot && <span><span className="text-[#8A8E99]">Time: </span><span className="font-bold">{selectedSlot.start_time.slice(0,5)} – {selectedSlot.end_time.slice(0,5)}</span></span>}
                                <span><span className="text-[#8A8E99]">People: </span><span className="font-bold">{rsvpForm.pax}</span></span>
                                {priceLabel && <span><span className="text-[#8A8E99]">Fee: </span><span className="font-bold text-[#C9922A]">{priceLabel}</span></span>}
                              </div>
                            </div>
                            <button type="submit" disabled={rsvpSending} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                              {rsvpSending ? 'Sending Request...' : `Request Booking at ${club.name}`}
                            </button>
                            <p className="text-[11px] text-[#8A8E99] text-center">Free · No payment · Range will confirm via email</p>
                          </form>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* RESULTS */}
              {activeTab === 'results' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">Shoot Results Board</h2>
                    {results.map((r, i) => (
                      <div key={i} className="bg-[#0D0F13] border border-white/5 rounded-sm overflow-hidden mb-4">
                        <div className="px-4 py-3 border-b border-white/5"><p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="font-black text-[15px] uppercase">{r.title}</p><p className="text-[11px] text-[#8A8E99]">{r.discipline} · {new Date(r.shoot_date).toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})}</p></div>
                        {r.results?.length > 0 && <div className="divide-y divide-white/5">{r.results.map((entry: any, ei: number) => (<div key={ei} className="flex items-center gap-4 px-4 py-3"><span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className={`w-8 text-center font-black text-[15px] ${ei===0?'text-[#FFD700]':ei===1?'text-[#C0C0C0]':ei===2?'text-[#CD7F32]':'text-[#8A8E99]'}`}>{ei===0?'🥇':ei===1?'🥈':ei===2?'🥉':`${ei+1}.`}</span><span className="flex-1 font-bold text-[13px]">{entry.name}</span><span className="text-[#C9922A] font-black text-[13px]">{entry.score}</span></div>))}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GALLERY */}
              {activeTab === 'gallery' && (
                <div className="flex flex-col gap-4">
                  {images.length > 0 ? (
                    <>
                      <div className="w-full bg-[#13151A] border border-white/5 rounded-sm overflow-hidden relative" style={{height:'400px'}}>
                        <img src={images[selectedImage]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} />
                        {images.length > 1 && (<><button onClick={()=>setSelectedImage(i=>Math.max(0,i-1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white text-xl hover:bg-black/80">‹</button><button onClick={()=>setSelectedImage(i=>Math.min(images.length-1,i+1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white text-xl hover:bg-black/80">›</button><div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-sm">{selectedImage+1} / {images.length}</div></>)}
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">{images.map((img: string, idx: number) => (<button key={idx} onClick={()=>setSelectedImage(idx)} className={`rounded-sm overflow-hidden transition-all relative ${selectedImage===idx?'border-2 border-[#C9922A]':'border border-white/10 hover:border-[#C9922A]/50'}`} style={{paddingBottom:'100%'}}><img src={img} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} /></button>))}</div>
                    </>
                  ) : <div className="bg-[#13151A] border border-white/5 rounded-sm p-16 text-center"><p className="text-5xl mb-4 opacity-20">📷</p><p className="text-[#8A8E99]">No photos uploaded yet</p></div>}
                </div>
              )}

              {/* SAFETY */}
              {activeTab === 'safety' && hasCompliance && (
                <div className="flex flex-col gap-5">
                  {club.saps_reg_number && <div className="bg-green-500/5 border border-green-500/20 rounded-sm p-5 flex items-center gap-4"><span className="text-3xl">🛡️</span><div><p className="text-[11px] font-black uppercase tracking-widest text-green-400 mb-0.5">SAPS Registered Shooting Range</p><p className="font-black text-[15px]">{club.saps_reg_number}</p>{club.compliance_cert_url && <a href={club.compliance_cert_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#C9922A] font-bold">View Certificate →</a>}</div></div>}
                  {club.range_rules && <div className="bg-[#13151A] border border-white/5 rounded-sm p-6"><h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-4 text-[#C9922A]">Range Rules</h2><p className="text-[#8A8E99] leading-relaxed text-[14px] whitespace-pre-wrap">{club.range_rules}</p></div>}
                  {club.what_to_bring && <div className="bg-[#13151A] border border-white/5 rounded-sm p-6"><h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-4 text-[#C9922A]">What To Bring</h2><p className="text-[#8A8E99] leading-relaxed text-[14px] whitespace-pre-wrap">{club.what_to_bring}</p></div>}
                </div>
              )}

              {/* CONTACT */}
              {activeTab === 'contact' && (
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-5 text-[#C9922A]">Get In Touch</h2>
                    <div className="flex flex-col gap-4">
                      {club.phone && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Phone</p><a href={`tel:${club.phone}`} className="text-lg font-bold text-[#C9922A] hover:brightness-110">{club.phone}</a></div>}
                      {club.email && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Email</p><a href={`mailto:${club.email}`} className="text-lg font-bold hover:text-[#C9922A]">{club.email}</a></div>}
                      {club.address && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Address</p><p className="text-lg font-bold leading-snug">{club.address}</p></div>}
                      {club.website && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Website</p><a href={club.website} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-[#C9922A] hover:underline">Visit Website →</a></div>}
                    </div>
                  </div>
                  <div className="bg-[#13151A] border border-white/5 rounded-sm p-6">
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase mb-5">Pricing</h2>
                    <div className="space-y-3">
                      {club.range_fee ? <div className="flex justify-between items-center py-3 border-b border-white/5"><span className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">Range Fee</span><div className="text-right"><span className="text-2xl font-black text-[#C9922A]">R{club.range_fee}</span><span className="text-[11px] text-[#8A8E99] ml-1">{FEE_LABEL[club.range_fee_type||'session']}</span></div></div> : null}
                      {club.membership_fee ? <div className="flex justify-between items-center py-3 border-b border-white/5"><span className="text-[13px] text-[#8A8E99] font-bold uppercase tracking-widest">Annual Membership</span><span className="text-2xl font-black text-[#C9922A]">R{Number(club.membership_fee).toLocaleString('en-ZA')}</span></div> : null}
                      {!club.range_fee && !club.membership_fee && <p className="text-[#8A8E99] text-[13px]">Contact the {isRange?'range':'club'} for pricing.</p>}
                    </div>
                  </div>
                </div>
              )}

            </main>

            {/* SIDEBAR */}
            <aside className="w-full lg:w-[260px] flex-shrink-0 flex flex-col gap-4">
              <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
                <h3 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-lg font-black uppercase mb-4">Quick Info</h3>
                <div className="flex flex-col gap-3 text-[13px]">
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Location</p><p className="font-bold">{club.city}{club.province?`, ${club.province}`:''}</p></div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Status Today</p><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${club.is_open_today?'bg-green-400 animate-pulse':'bg-[#5A5E69]'}`} /><p className={`font-bold ${club.is_open_today?'text-green-400':'text-[#5A5E69]'}`}>{club.is_open_today?'Open Today':'Closed Today'}</p></div></div>
                  {currentWeather && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Weather Now</p><p className="font-bold">{getWeatherIcon(weatherCode)} {tempC}°C · 💨 {windKmph}km/h</p>{Number(windKmph) > 30 && <p className="text-[10px] text-[#C9922A] mt-0.5">⚠ High wind</p>}</div>}
                  {isRange && club.booth_count && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Booths</p><p className="font-bold">{club.booth_count} total{club.lanes_available>0?` · ${club.lanes_available} free now`:''}</p></div>}
                  {isRange && club.max_distance_m && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Max Distance</p><p className="font-bold">{club.max_distance_m}m</p></div>}
                  {club.range_fee && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Range Fee</p><p className="font-black text-[16px] text-[#C9922A]">R{club.range_fee} <span className="text-[11px] font-bold text-[#8A8E99]">{FEE_LABEL[club.range_fee_type||'session']}</span></p></div>}
                  {club.booking_required && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Booking</p><p className="font-bold text-[#C9922A]">Required</p></div>}
                  {club.disciplines?.length > 0 && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Disciplines</p><div className="flex flex-wrap gap-1">{club.disciplines.map((d: string) => <span key={d} className="text-[10px] bg-[#0D0F13] border border-white/10 text-[#8A8E99] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wider">{d}</span>)}</div></div>}
                  {openSchedule.length > 0 && <div><p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-0.5">Open Days</p><p className="font-bold">{openSchedule.length} days/week</p></div>}
                  {club.saps_reg_number && <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/20 rounded-sm px-2.5 py-2"><span className="text-green-400">🛡️</span><span className="text-[11px] font-bold text-green-400">SAPS Registered</span></div>}
                </div>
                <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-white/5">
                  <button onClick={() => setActiveTab('book')} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:brightness-110 transition-all text-center">✋ Request Booking</button>
                  {club.phone && <a href={`tel:${club.phone}`} className="w-full border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">📞 Call {isRange?'Range':'Club'}</a>}
                  {club.email && <a href={`mailto:${club.email}`} className="w-full border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">✉ Email</a>}
                  {club.website && <a href={club.website} target="_blank" rel="noopener noreferrer" className="w-full border border-white/10 text-[#8A8E99] font-black uppercase tracking-widest text-[12px] py-3 rounded-sm hover:bg-white/5 transition-all text-center">🌐 Website</a>}
                </div>
              </div>
              <div className="w-full bg-[#12141a] border border-white/5 flex flex-col items-center justify-center" style={{height:'250px'}}>
                <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-2">Advertisement</span>
                <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold mx-4 mb-4">300 × 250</div>
              </div>
              <Link href="/clubs" className="text-[12px] text-[#8A8E99] font-bold uppercase tracking-widest hover:text-[#C9922A] transition-colors">← Back to All Clubs & Ranges</Link>
            </aside>
          </div>
        </div>

        <aside className="hidden xl:flex flex-col flex-shrink-0 w-[180px] pr-2 pt-4">
          <div className="sticky top-[57px] w-full bg-[#12141a] border border-white/5 flex flex-col items-center justify-center p-3 text-center" style={{height:'600px'}}>
            <span className="text-[9px] text-[#5A5E69] uppercase tracking-widest mb-3">Advertisement</span>
            <div className="flex-1 w-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-[#3A3E49] font-bold">160 x 600</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
