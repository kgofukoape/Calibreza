'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PROVINCES = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Free State','Limpopo','Mpumalanga','North West','Northern Cape'];
const ALL_DISCIPLINES = ['IPSC','IDPA','Practical Shooting','Target Shooting','Hunting','Long Range','Skeet','Trap','Air Gun','Benchrest','Field Shooting'];
const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Public Holidays'];
const COMMON_GUN_MAKES = ['Glock','CZ','Sig Sauer','Smith & Wesson','Beretta','Walther','Springfield','Heckler & Koch','Taurus','Ruger','Browning','Winchester','Remington','Mossberg','Tikka','Sako','Other'];
const COMMON_CALIBRES = ['9mm','.45 ACP','.40 S&W','.357 Mag','.38 Special','.44 Mag','5.56mm / .223','7.62x39','.308 Win','.30-06','6.5 Creedmoor','.22 LR','12 Gauge','20 Gauge','.410','Other'];
const AMMO_OPTIONS = ['9mm','5.56mm / .223','.308 Win','.22 LR','12 Gauge','7.62x39','.45 ACP','.40 S&W','.357 Mag','6.5 Creedmoor'];
const FEE_TYPES = [
  { value: 'session', label: 'Per Session' },
  { value: '30min', label: 'Per 30 Minutes' },
  { value: 'hour', label: 'Per Hour' },
  { value: 'day', label: 'Per Day' },
];
const MAX_GALLERY = 10;
const MAX_MB = 2;

interface DaySchedule {
  day: string; open: boolean; open_time: string; close_time: string;
  discipline: string; fee: string; notes: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = ALL_DAYS.map(day => ({
  day, open: true, open_time: '08:00', close_time: '17:00', discipline: '', fee: '', notes: '',
}));

export default function ClubDashboardPage() {
  const router = useRouter();
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Profile
  const [pf, setPf] = useState<any>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [galleryError, setGalleryError] = useState('');

  // Schedule
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  // Live Status
  const [liveStatus, setLiveStatus] = useState({ is_open_today: false, lanes_available: 0, hire_guns_available: true, ammo_in_stock: [] as string[] });
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // RSVPs
  const [rsvps, setRsvps] = useState<any[]>([]);

  // Compliance
  const [complianceSaving, setComplianceSaving] = useState(false);
  const [complianceMsg, setComplianceMsg] = useState('');

  // Results
  const [results, setResults] = useState<any[]>([]);
  const [showResultForm, setShowResultForm] = useState(false);
  const [resultForm, setResultForm] = useState({ title: '', discipline: '', shoot_date: '', entries: [{ name: '', score: '', notes: '' }] });
  const [resultSaving, setResultSaving] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  // Bookings / Time Slots
  const [selectedSlotDate, setSelectedSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [slotSaving, setSlotSaving] = useState(false);
  const [slotMsg, setSlotMsg] = useState('');
  const [newSlot, setNewSlot] = useState({ start_time: '08:00', end_time: '09:00', capacity: 1, notes: '' });
  const [bulkInterval, setBulkInterval] = useState(30);
  const [bulkCapacity, setBulkCapacity] = useState(1);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }
    const { data, error } = await supabase.from('clubs').select('*').eq('user_id', user.id).single();
    if (error || !data) { router.push('/dealer/login'); return; }
    setClub(data);
    setPf(data);
    setLogoPreview(data.logo_url || '');
    setCoverPreview(data.cover_url || '');
    setExistingImages(data.images || []);
    setLiveStatus({ is_open_today: data.is_open_today || false, lanes_available: data.lanes_available || 0, hire_guns_available: data.hire_guns_available ?? true, ammo_in_stock: data.ammo_in_stock || [] });
    if (data.operating_schedule?.length) {
      const merged = DEFAULT_SCHEDULE.map(def => data.operating_schedule.find((s: DaySchedule) => s.day === def.day) || def);
      setSchedule(merged);
    }
    const { data: rsvpData } = await supabase.from('shoot_rsvps').select('*').eq('club_id', data.id).order('created_at', { ascending: false }).limit(100);
    setRsvps(rsvpData || []);
    const { data: resultData } = await supabase.from('shoot_results').select('*').eq('club_id', data.id).order('shoot_date', { ascending: false }).limit(20);
    setResults(resultData || []);
    setLoading(false);
  };

  const fetchSlotsForDate = async (date: string) => {
    if (!club) return;
    const { data } = await supabase.from('range_time_slots').select('*').eq('club_id', club.id).eq('slot_date', date).order('start_time');
    setTimeSlots(data || []);
  };

  useEffect(() => { if (club && activeTab === 'bookings') fetchSlotsForDate(selectedSlotDate); }, [selectedSlotDate, club, activeTab]);

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/dealer/login'); };

  const uploadImage = async (file: File, path: string) => {
    const ext = file.name.split('.').pop();
    const fp = `${path}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('club-images').upload(fp, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('club-images').getPublicUrl(fp).data.publicUrl;
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGalleryError('');
    const files = Array.from(e.target.files || []);
    const slots = MAX_GALLERY - existingImages.length - galleryFiles.length;
    const toAdd: File[] = [];
    for (const f of files) {
      if (toAdd.length >= slots) break;
      if (f.size > MAX_MB * 1024 * 1024) { setGalleryError(`"${f.name}" exceeds ${MAX_MB}MB — skipped`); continue; }
      toAdd.push(f);
    }
    setGalleryFiles(p => [...p, ...toAdd]);
    setGalleryPreviews(p => [...p, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const handleProfileSave = async () => {
    if (!club) return;
    setProfileSaving(true); setProfileMsg('');
    try {
      let logo_url = pf.logo_url || '';
      let cover_url = pf.cover_url || '';
      if (logoFile) logo_url = await uploadImage(logoFile, 'logos');
      if (coverFile) cover_url = await uploadImage(coverFile, 'covers');
      const newUrls: string[] = [];
      for (const f of galleryFiles) newUrls.push(await uploadImage(f, 'gallery'));
      const allImages = [...existingImages, ...newUrls];
      const { error } = await supabase.from('clubs').update({
        name: pf.name, description: pf.description, province: pf.province, city: pf.city,
        address: pf.address, phone: pf.phone, email: pf.email, website: pf.website,
        is_members_only: pf.is_members_only, membership_fee: pf.membership_fee,
        booking_required: pf.booking_required, range_officer_on_duty: pf.range_officer_on_duty,
        public_shoot_days: pf.public_shoot_days, lane_count: pf.lane_count,
        max_distance_m: pf.max_distance_m, covered_lanes: pf.covered_lanes,
        disciplines: pf.disciplines, booth_count: pf.booth_count, booth_distances: pf.booth_distances,
        guns_for_hire: pf.guns_for_hire,
        hire_gun_makes: pf.guns_for_hire ? pf.hire_gun_makes : [],
        hire_gun_calibres: pf.guns_for_hire ? pf.hire_gun_calibres : [],
        additional_info: pf.additional_info, range_environment: pf.range_environment,
        range_fee: pf.range_fee, range_fee_type: pf.range_fee_type || 'session',
        range_fee_per_30min: pf.range_fee_per_30min, range_fee_per_hour: pf.range_fee_per_hour,
        range_rules: pf.range_rules, what_to_bring: pf.what_to_bring,
        saps_reg_number: pf.saps_reg_number, compliance_cert_url: pf.compliance_cert_url,
        logo_url, cover_url, images: allImages,
      }).eq('id', club.id);
      if (error) throw error;
      setClub({ ...club, ...pf, logo_url, cover_url, images: allImages });
      setExistingImages(allImages); setGalleryFiles([]); setGalleryPreviews([]);
      setProfileMsg('✓ Profile saved');
    } catch (err: any) { setProfileMsg('✗ ' + (err.message || 'Failed')); }
    finally { setProfileSaving(false); }
  };

  const handleScheduleSave = async () => {
    if (!club) return;
    setScheduleSaving(true); setScheduleMsg('');
    try {
      const { error } = await supabase.from('clubs').update({ operating_schedule: schedule }).eq('id', club.id);
      if (error) throw error;
      setClub({ ...club, operating_schedule: schedule });
      setScheduleMsg('✓ Schedule saved');
    } catch (err: any) { setScheduleMsg('✗ ' + (err.message || 'Failed')); }
    finally { setScheduleSaving(false); }
  };

  const handleStatusSave = async () => {
    if (!club) return;
    setStatusSaving(true); setStatusMsg('');
    try {
      const { error } = await supabase.from('clubs').update(liveStatus).eq('id', club.id);
      if (error) throw error;
      setClub({ ...club, ...liveStatus });
      setStatusMsg('✓ Status updated — live on public page');
    } catch (err: any) { setStatusMsg('✗ ' + (err.message || 'Failed')); }
    finally { setStatusSaving(false); }
  };

  const handleComplianceSave = async () => {
    if (!club) return;
    setComplianceSaving(true); setComplianceMsg('');
    try {
      const { error } = await supabase.from('clubs').update({
        saps_reg_number: pf.saps_reg_number, compliance_cert_url: pf.compliance_cert_url,
        range_rules: pf.range_rules, what_to_bring: pf.what_to_bring,
      }).eq('id', club.id);
      if (error) throw error;
      setClub({ ...club, ...pf });
      setComplianceMsg('✓ Compliance info saved');
    } catch (err: any) { setComplianceMsg('✗ ' + (err.message || 'Failed')); }
    finally { setComplianceSaving(false); }
  };

  const handleResultSave = async () => {
    if (!club || !resultForm.title || !resultForm.discipline || !resultForm.shoot_date) {
      setResultMsg('✗ Fill in title, discipline and date'); return;
    }
    setResultSaving(true); setResultMsg('');
    try {
      const entries = resultForm.entries.filter(e => e.name).map((e, i) => ({ ...e, position: i + 1 }));
      const { data, error } = await supabase.from('shoot_results').insert({
        club_id: club.id, title: resultForm.title, discipline: resultForm.discipline,
        shoot_date: resultForm.shoot_date, results: entries,
      }).select().single();
      if (error) throw error;
      setResults(p => [data, ...p]);
      setResultForm({ title: '', discipline: '', shoot_date: '', entries: [{ name: '', score: '', notes: '' }] });
      setShowResultForm(false);
      setResultMsg('✓ Results posted');
    } catch (err: any) { setResultMsg('✗ ' + (err.message || 'Failed')); }
    finally { setResultSaving(false); }
  };

  // Time slot management
  const addSingleSlot = async () => {
    if (!club) return;
    setSlotSaving(true); setSlotMsg('');
    try {
      const { data, error } = await supabase.from('range_time_slots').insert({
        club_id: club.id, slot_date: selectedSlotDate,
        start_time: newSlot.start_time, end_time: newSlot.end_time,
        capacity: newSlot.capacity, notes: newSlot.notes, status: 'available', booked_count: 0,
      }).select().single();
      if (error) throw error;
      setTimeSlots(p => [...p, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setNewSlot({ start_time: newSlot.end_time, end_time: addMinutes(newSlot.end_time, 60), capacity: newSlot.capacity, notes: '' });
      setSlotMsg('✓ Slot added');
    } catch (err: any) { setSlotMsg('✗ ' + (err.message || 'Failed')); }
    finally { setSlotSaving(false); }
  };

  const bulkGenerateSlots = async () => {
    if (!club) return;
    setSlotSaving(true); setSlotMsg('');
    try {
      const dayName = new Date(selectedSlotDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
      const daySchedule = schedule.find(d => d.day === dayName);
      const openTime = daySchedule?.open_time || '08:00';
      const closeTime = daySchedule?.close_time || '17:00';
      const slots = generateTimeSlots(openTime, closeTime, bulkInterval);
      if (slots.length === 0) { setSlotMsg('✗ No slots to generate'); setSlotSaving(false); return; }
      // Delete existing slots for this date first
      await supabase.from('range_time_slots').delete().eq('club_id', club.id).eq('slot_date', selectedSlotDate);
      const inserts = slots.map(s => ({ club_id: club.id, slot_date: selectedSlotDate, start_time: s.start, end_time: s.end, capacity: bulkCapacity, status: 'available', booked_count: 0 }));
      const { data, error } = await supabase.from('range_time_slots').insert(inserts).select();
      if (error) throw error;
      setTimeSlots((data || []).sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)));
      setSlotMsg(`✓ Generated ${data?.length || 0} slots for ${selectedSlotDate}`);
    } catch (err: any) { setSlotMsg('✗ ' + (err.message || 'Failed')); }
    finally { setSlotSaving(false); }
  };

  const deleteSlot = async (id: string) => {
    await supabase.from('range_time_slots').delete().eq('id', id);
    setTimeSlots(p => p.filter(s => s.id !== id));
  };

  const toggleSlotStatus = async (slot: any) => {
    const newStatus = slot.status === 'blocked' ? 'available' : 'blocked';
    await supabase.from('range_time_slots').update({ status: newStatus }).eq('id', slot.id);
    setTimeSlots(p => p.map(s => s.id === slot.id ? { ...s, status: newStatus } : s));
  };

  const generateTimeSlots = (open: string, close: string, intervalMins: number) => {
    const slots = [];
    let current = timeToMinutes(open);
    const end = timeToMinutes(close);
    while (current + intervalMins <= end) {
      slots.push({ start: minutesToTime(current), end: minutesToTime(current + intervalMins) });
      current += intervalMins;
    }
    return slots;
  };

  const timeToMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const minutesToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const addMinutes = (t: string, mins: number) => minutesToTime(Math.min(timeToMinutes(t) + mins, 23 * 60 + 59));

  // Generate next 14 days for date strip
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const toggleMake = (m: string) => setPf((p: any) => ({ ...p, hire_gun_makes: (p.hire_gun_makes||[]).includes(m) ? (p.hire_gun_makes||[]).filter((x: string)=>x!==m) : [...(p.hire_gun_makes||[]),m] }));
  const toggleCal = (c: string) => setPf((p: any) => ({ ...p, hire_gun_calibres: (p.hire_gun_calibres||[]).includes(c) ? (p.hire_gun_calibres||[]).filter((x: string)=>x!==c) : [...(p.hire_gun_calibres||[]),c] }));
  const toggleDisc = (d: string) => setPf((p: any) => ({ ...p, disciplines: (p.disciplines||[]).includes(d) ? (p.disciplines||[]).filter((x: string)=>x!==d) : [...(p.disciplines||[]),d] }));
  const toggleAmmo = (a: string) => setLiveStatus(p => ({ ...p, ammo_in_stock: p.ammo_in_stock.includes(a) ? p.ammo_in_stock.filter((x: string)=>x!==a) : [...p.ammo_in_stock,a] }));
  const updateDay = (i: number, f: string, v: any) => setSchedule(p => p.map((d,idx) => idx===i ? {...d,[f]:v} : d));

  if (loading) return <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" /></div>;

  const isRange = club?.facility_type === 'range';
  const FL = isRange ? 'Range' : 'Club';
  const FI = isRange ? '🎯' : '🏛️';
  const totalGallery = existingImages.length + galleryFiles.length;
  const todayRsvps = rsvps.filter(r => r.shoot_date === new Date().toISOString().split('T')[0]);

  const nav = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'live', label: 'Live Status', icon: '🔴' },
    { id: 'schedule', label: isRange ? 'Hours & Sessions' : 'Schedule', icon: '📅' },
    { id: 'bookings', label: 'Bookings', icon: '🗓️' },
    { id: 'rsvps', label: `RSVPs${rsvps.length ? ` (${rsvps.length})` : ''}`, icon: '✋' },
    { id: 'results', label: 'Results Board', icon: '🏆' },
    { id: 'compliance', label: 'Compliance', icon: '🛡️' },
    { id: 'profile', label: 'Edit Profile', icon: '✏️' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 transition-colors placeholder-[#8A8E99]/40";
  const lbl = "block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";
  const sec = "bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6";

  const slotStatusColor = (slot: any) => {
    if (slot.status === 'blocked') return 'border-white/10 bg-[#0D0F13]/50 opacity-50';
    if (slot.status === 'full' || slot.booked_count >= slot.capacity) return 'border-red-500/20 bg-red-500/5';
    return 'border-[#2A9C6E]/20 bg-[#2A9C6E]/5';
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[256px] bg-[#0A0C10] border-r border-white/5 flex flex-col flex-shrink-0 min-h-screen">
        <div className="p-5 border-b border-white/5">
          <Link href="/"><span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black tracking-tighter uppercase">GUN <span className="text-[#C9922A]">X</span></span></Link>
          <p className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">{FL} Portal</p>
        </div>

        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm overflow-hidden bg-[#C9922A]/10 border border-[#C9922A]/20 flex items-center justify-center flex-shrink-0">
              {club?.logo_url ? <img src={club.logo_url} alt="" className="w-full h-full object-cover object-center" /> : <span>{FI}</span>}
            </div>
            <div className="min-w-0">
              <p className="font-black text-[12px] truncate">{club?.name}</p>
              <p className="text-[9px] text-[#8A8E99] uppercase tracking-widest truncate">{club?.city}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-black uppercase rounded-sm">{club?.status}</span>
                {club?.is_open_today && <span className="px-1.5 py-0.5 bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A] text-[8px] font-black uppercase rounded-sm">Open</span>}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id ? 'bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A]' : 'text-[#8A8E99] hover:text-[#F0EDE8] hover:bg-white/5'
              }`}>
              <span className="text-sm">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-1.5">
          <Link href={`/clubs/${club?.slug}`} target="_blank" className="block text-center px-3 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-[11px] font-black uppercase tracking-widest">View Public Page ↗</Link>
          <button onClick={handleSignOut} className="w-full text-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-[11px] font-black uppercase tracking-widest">Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-[#0A0C10] border-b border-white/5 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
          <h1 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-2xl font-black uppercase tracking-tight">
            {nav.find(n=>n.id===activeTab)?.label} <span className="text-[#C9922A]">— {FL}</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-[11px] font-black uppercase ${club?.is_open_today ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-[#8A8E99]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${club?.is_open_today ? 'bg-green-400 animate-pulse' : 'bg-[#5A5E69]'}`} />
              {club?.is_open_today ? 'Open Today' : 'Closed Today'}
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-5">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {club?.cover_url && (
                <div className="w-full rounded-sm overflow-hidden border border-white/5" style={{height:'180px'}}>
                  <img src={club.cover_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} />
                </div>
              )}
              <div className={`${sec} border-l-4 ${club?.is_open_today ? 'border-l-green-500' : 'border-l-[#5A5E69]'}`}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${club?.is_open_today ? 'bg-green-400 animate-pulse' : 'bg-[#5A5E69]'}`} />
                      <span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">{club?.is_open_today ? 'Open Today' : 'Closed Today'}</span>
                    </div>
                    {isRange && club?.lanes_available > 0 && <span className="text-[#C9922A] font-black text-[14px]">· {club.lanes_available} lanes available</span>}
                  </div>
                  <button onClick={() => setActiveTab('live')} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-3 py-1.5 rounded-sm hover:bg-[#C9922A]/10">Update Status →</button>
                </div>
                {club?.ammo_in_stock?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] self-center">Ammo in stock:</span>
                    {club.ammo_in_stock.map((a: string) => <span key={a} className="px-2 py-0.5 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[11px] font-bold text-[#C9922A]">{a}</span>)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {label:'Type', value:isRange?'Range':'Club', icon:FI},
                  {label:'Province', value:club?.province||'—', icon:'📍'},
                  {label:isRange?'Booths':'Disciplines', value:isRange?(club?.booth_count?.toString()||'—'):(club?.disciplines?.length?.toString()||'0'), icon:'🎯'},
                  {label:'RSVPs This Week', value:rsvps.filter(r=>{ const d=new Date(r.created_at); const w=new Date(); return d>=new Date(w.setDate(w.getDate()-7)); }).length.toString(), icon:'✋'},
                ].map((s,i) => (
                  <div key={i} className={sec}><div className="text-2xl mb-2">{s.icon}</div><div className={lbl}>{s.label}</div><div style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-lg font-black uppercase">{s.value}</div></div>
                ))}
              </div>
              <div className={sec}>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">Operating <span className="text-[#C9922A]">Hours</span></h2>
                  <button onClick={() => setActiveTab('schedule')} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">Manage →</button>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {schedule.map((d,i) => (
                    <div key={i} className={`p-2 rounded-sm border text-center ${d.open ? 'bg-[#0D0F13] border-white/10' : 'bg-[#0D0F13]/30 border-white/5 opacity-40'}`}>
                      <p className={`text-[9px] font-black uppercase tracking-wider mb-1 ${d.day==='Public Holidays'?'text-[#C9922A]':'text-[#8A8E99]'}`}>{d.day.slice(0,3)}</p>
                      {d.open ? <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[10px] font-black text-[#C9922A] leading-tight">{d.open_time}<br/>–{d.close_time}</p> : <p className="text-[10px] font-bold text-[#5A5E69]">Closed</p>}
                    </div>
                  ))}
                </div>
              </div>
              {club?.images?.length > 0 && (
                <div className={sec}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">{FL} <span className="text-[#C9922A]">Gallery</span></h2>
                    <button onClick={() => setActiveTab('profile')} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">Manage →</button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {club.images.map((url: string, i: number) => (
                      <div key={i} className="rounded-sm overflow-hidden bg-[#0D0F13] border border-white/5 relative" style={{paddingBottom:'100%'}}>
                        <img src={url} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {rsvps.length > 0 && (
                <div className={sec}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">Recent <span className="text-[#C9922A]">RSVPs</span></h2>
                    <button onClick={() => setActiveTab('rsvps')} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">View All →</button>
                  </div>
                  <div className="space-y-2">
                    {rsvps.slice(0,5).map((r,i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#0D0F13] border border-white/5 rounded-sm px-4 py-2.5">
                        <div className="w-8 h-8 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm flex items-center justify-center text-[#C9922A] font-black text-[12px] flex-shrink-0">{r.user_name?.charAt(0)?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0"><p className="text-[12px] font-bold">{r.user_name}</p><p className="text-[10px] text-[#8A8E99]">{r.day} · {r.pax} person{r.pax>1?'s':''}</p></div>
                        <span className="text-[10px] text-[#8A8E99]">{new Date(r.created_at).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── LIVE STATUS ── */}
          {activeTab === 'live' && (
            <div className="max-w-2xl space-y-5">
              <div className={sec}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${liveStatus.is_open_today ? 'bg-green-400 animate-pulse' : 'bg-[#5A5E69]'}`} />
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">Live <span className="text-[#C9922A]">Status</span></h2>
                </div>
                <p className="text-[11px] text-[#8A8E99] mb-5">Update this daily — shows live on your public page so shooters know before they drive out.</p>
                <div className="flex items-center justify-between p-4 bg-[#0D0F13] border border-white/10 rounded-sm mb-4">
                  <div><p className="font-black text-[14px] uppercase">{liveStatus.is_open_today ? '✅ Open Today' : '❌ Closed Today'}</p><p className="text-[11px] text-[#8A8E99] mt-0.5">Toggle to update</p></div>
                  <button onClick={() => setLiveStatus(p => ({...p, is_open_today: !p.is_open_today}))} className={`relative w-14 h-7 rounded-full transition-all ${liveStatus.is_open_today ? 'bg-green-500' : 'bg-white/10'}`}>
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${liveStatus.is_open_today ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
                {isRange && (
                  <div className="mb-4">
                    <label className={lbl}>Lanes Available Right Now</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setLiveStatus(p => ({...p, lanes_available: Math.max(0,(p.lanes_available||0)-1)}))} className="w-10 h-10 bg-[#0D0F13] border border-white/10 rounded-sm font-black text-lg hover:border-[#C9922A]/30">−</button>
                      <span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-3xl font-black w-16 text-center">{liveStatus.lanes_available||0}</span>
                      <button onClick={() => setLiveStatus(p => ({...p, lanes_available: (p.lanes_available||0)+1}))} className="w-10 h-10 bg-[#0D0F13] border border-white/10 rounded-sm font-black text-lg hover:border-[#C9922A]/30">+</button>
                      <span className="text-[12px] text-[#8A8E99]">of {club?.booth_count||club?.lane_count||'?'} total</span>
                    </div>
                  </div>
                )}
                {club?.guns_for_hire && (
                  <div className="flex items-center justify-between p-4 bg-[#0D0F13] border border-white/10 rounded-sm mb-4">
                    <div><p className="font-black text-[13px] uppercase">🔫 Guns for Hire</p><p className="text-[11px] text-[#8A8E99] mt-0.5">{liveStatus.hire_guns_available ? 'Available today' : 'Not available today'}</p></div>
                    <button onClick={() => setLiveStatus(p => ({...p, hire_guns_available: !p.hire_guns_available}))} className={`relative w-14 h-7 rounded-full transition-all ${liveStatus.hire_guns_available ? 'bg-[#C9922A]' : 'bg-white/10'}`}>
                      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${liveStatus.hire_guns_available ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                )}
                <div className="mb-5">
                  <label className={lbl}>Ammo In Stock Today</label>
                  <div className="grid grid-cols-2 gap-2">
                    {AMMO_OPTIONS.map(a => (
                      <label key={a} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-sm border transition-all ${liveStatus.ammo_in_stock.includes(a)?'border-[#C9922A]/50 bg-[#C9922A]/10':'border-white/10 hover:border-white/20'}`}>
                        <input type="checkbox" className="accent-[#C9922A]" checked={liveStatus.ammo_in_stock.includes(a)} onChange={() => toggleAmmo(a)} />
                        <span className="text-[12px] font-bold">{a}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={handleStatusSave} disabled={statusSaving} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 disabled:opacity-50">{statusSaving ? 'Updating...' : 'Update Live Status'}</button>
                  {statusMsg && <span className={`text-[12px] font-bold ${statusMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{statusMsg}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKINGS / TIME SLOTS ── */}
          {activeTab === 'bookings' && (
            <div className="space-y-5">
              <div className={sec}>
                <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-1">Booking <span className="text-[#C9922A]">Calendar</span></h2>
                <p className="text-[11px] text-[#8A8E99] mb-5">Set available time slots per day. Shooters see and book these on your public page.</p>

                {/* Date strip */}
                <div className="mb-5">
                  <label className={lbl}>Select Date</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {next14Days.map(date => {
                      const d = new Date(date + 'T12:00:00');
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                      const sched = schedule.find(s => s.day === dayName);
                      const isOpen = sched?.open;
                      const isSelected = date === selectedSlotDate;
                      return (
                        <button key={date} onClick={() => setSelectedSlotDate(date)}
                          className={`flex-shrink-0 w-16 py-2 rounded-sm border text-center transition-all ${isSelected ? 'bg-[#C9922A] border-[#C9922A] text-black' : isOpen ? 'bg-[#0D0F13] border-white/10 hover:border-[#C9922A]/30' : 'bg-[#0D0F13]/50 border-white/5 opacity-40'}`}>
                          <p className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'text-black' : 'text-[#8A8E99]'}`}>{dayName.slice(0,3)}</p>
                          <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className={`text-[15px] font-black ${isSelected ? 'text-black' : ''}`}>{d.getDate()}</p>
                          <p className={`text-[9px] ${isSelected ? 'text-black/70' : 'text-[#8A8E99]'}`}>{d.toLocaleDateString('en-ZA',{month:'short'})}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bulk generate */}
                <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-4 mb-5">
                  <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[13px] font-black uppercase mb-3">⚡ Bulk Generate Slots for {new Date(selectedSlotDate + 'T12:00:00').toLocaleDateString('en-ZA', {weekday:'long', day:'numeric', month:'long'})}</p>
                  <p className="text-[11px] text-[#8A8E99] mb-3">Generates slots from your opening to closing time. Replaces any existing slots for this date.</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className={lbl}>Slot Duration</label>
                      <select className={inp} value={bulkInterval} onChange={e => setBulkInterval(Number(e.target.value))}>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Capacity Per Slot</label>
                      <input type="number" className={inp} value={bulkCapacity} min={1} onChange={e => setBulkCapacity(Number(e.target.value))} />
                    </div>
                  </div>
                  <button onClick={bulkGenerateSlots} disabled={slotSaving} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:brightness-110 disabled:opacity-50">
                    {slotSaving ? 'Generating...' : '⚡ Generate Slots'}
                  </button>
                </div>

                {/* Add single slot */}
                <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-4 mb-5">
                  <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[13px] font-black uppercase mb-3">+ Add Single Slot</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div><label className={lbl}>Start Time</label><input type="time" className={inp} value={newSlot.start_time} onChange={e => setNewSlot(p=>({...p,start_time:e.target.value}))} /></div>
                    <div><label className={lbl}>End Time</label><input type="time" className={inp} value={newSlot.end_time} onChange={e => setNewSlot(p=>({...p,end_time:e.target.value}))} /></div>
                    <div><label className={lbl}>Capacity</label><input type="number" className={inp} value={newSlot.capacity} min={1} onChange={e => setNewSlot(p=>({...p,capacity:Number(e.target.value)}))} /></div>
                    <div><label className={lbl}>Notes</label><input className={inp} value={newSlot.notes} placeholder="Optional" onChange={e => setNewSlot(p=>({...p,notes:e.target.value}))} /></div>
                  </div>
                  <button onClick={addSingleSlot} disabled={slotSaving} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="border border-[#C9922A]/40 text-[#C9922A] font-black uppercase tracking-widest text-[12px] px-5 py-2.5 rounded-sm hover:bg-[#C9922A]/10 disabled:opacity-50">
                    + Add Slot
                  </button>
                </div>

                {slotMsg && <div className={`mb-4 px-4 py-2.5 rounded-sm border text-[12px] font-bold ${slotMsg.startsWith('✓') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{slotMsg}</div>}

                {/* Slots list for selected date */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[13px] font-black uppercase text-[#8A8E99]">
                      Slots for {new Date(selectedSlotDate + 'T12:00:00').toLocaleDateString('en-ZA', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
                    </p>
                    <span className="text-[11px] text-[#8A8E99]">{timeSlots.length} slots</span>
                  </div>
                  {timeSlots.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-sm">
                      <p className="text-3xl mb-2">🗓️</p>
                      <p className="text-[#8A8E99] text-[12px]">No slots set for this date. Use bulk generate or add slots manually above.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timeSlots.map((slot, i) => (
                        <div key={i} className={`flex items-center gap-4 rounded-sm border px-4 py-3 ${slotStatusColor(slot)}`}>
                          <div className="flex-1">
                            <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="font-black text-[14px]">{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</p>
                            {slot.notes && <p className="text-[11px] text-[#8A8E99]">{slot.notes}</p>}
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99]">Booked</p>
                            <p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className={`text-[16px] font-black ${slot.booked_count >= slot.capacity ? 'text-red-400' : 'text-[#2A9C6E]'}`}>{slot.booked_count}/{slot.capacity}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${slot.status === 'blocked' ? 'bg-white/5 text-[#5A5E69]' : slot.status === 'full' || slot.booked_count >= slot.capacity ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/20'}`}>
                            {slot.status === 'blocked' ? 'Blocked' : slot.booked_count >= slot.capacity ? 'Full' : 'Available'}
                          </span>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => toggleSlotStatus(slot)} className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-[#F0EDE8] px-2 py-1 border border-white/10 rounded-sm">
                              {slot.status === 'blocked' ? 'Unblock' : 'Block'}
                            </button>
                            <button onClick={() => deleteSlot(slot.id)} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 px-2 py-1 border border-red-500/20 rounded-sm">Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── RSVPS ── */}
          {activeTab === 'rsvps' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {label:'Total RSVPs', value:rsvps.length, icon:'✋'},
                  {label:'Today', value:todayRsvps.length, icon:'📅'},
                  {label:'Total Pax', value:rsvps.reduce((s,r)=>s+(r.pax||1),0), icon:'👥'},
                ].map((s,i) => (
                  <div key={i} className={sec}><div className="text-2xl mb-2">{s.icon}</div><div className={lbl}>{s.label}</div><div style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-3xl font-black text-[#C9922A]">{s.value}</div></div>
                ))}
              </div>
              <div className={sec}>
                <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4">All <span className="text-[#C9922A]">RSVPs</span></h2>
                {rsvps.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-sm"><p className="text-4xl mb-3">✋</p><p className="text-[#8A8E99] text-[13px]">No RSVPs yet</p></div>
                ) : (
                  <div className="space-y-2">
                    {rsvps.map((r,i) => (
                      <div key={i} className="flex items-center gap-4 bg-[#0D0F13] border border-white/5 rounded-sm px-4 py-3">
                        <div className="w-9 h-9 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm flex items-center justify-center text-[#C9922A] font-black text-[13px] flex-shrink-0">{r.user_name?.charAt(0)?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0"><p className="text-[13px] font-bold">{r.user_name}</p><p className="text-[11px] text-[#8A8E99]">{r.user_email}{r.user_phone ? ` · ${r.user_phone}` : ''}</p></div>
                        <div className="text-right flex-shrink-0"><p className="text-[12px] font-bold text-[#C9922A]">{r.day}</p><p className="text-[10px] text-[#8A8E99]">{r.pax} person{r.pax>1?'s':''}{r.shoot_date ? ` · ${new Date(r.shoot_date).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}` : ''}</p></div>
                        <span className="text-[10px] text-[#5A5E69] flex-shrink-0">{new Date(r.created_at).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── RESULTS BOARD ── */}
          {activeTab === 'results' && (
            <div className="space-y-5 max-w-3xl">
              <div className={sec}>
                <div className="flex items-center justify-between mb-4">
                  <div><h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">Results <span className="text-[#C9922A]">Board</span></h2><p className="text-[11px] text-[#8A8E99] mt-0.5">Post shoot results — appear on your public page</p></div>
                  <button onClick={() => setShowResultForm(!showResultForm)} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-4 py-2 rounded-sm hover:brightness-110">{showResultForm ? 'Cancel' : '+ Post Results'}</button>
                </div>
                {showResultForm && (
                  <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-5 mb-5">
                    <h3 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[14px] font-black uppercase mb-4 text-[#C9922A]">New Shoot Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div><label className={lbl}>Title</label><input className={inp} value={resultForm.title} onChange={e=>setResultForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Saturday IPSC Club Match" /></div>
                      <div><label className={lbl}>Discipline</label><input className={inp} value={resultForm.discipline} onChange={e=>setResultForm(p=>({...p,discipline:e.target.value}))} placeholder="e.g. IPSC Production" /></div>
                      <div><label className={lbl}>Shoot Date</label><input type="date" className={inp} value={resultForm.shoot_date} onChange={e=>setResultForm(p=>({...p,shoot_date:e.target.value}))} /></div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2"><label className={lbl}>Results (position 1 = first row)</label><button onClick={()=>setResultForm(p=>({...p,entries:[...p.entries,{name:'',score:'',notes:''}]}))} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A]">+ Add Row</button></div>
                      <div className="space-y-2">
                        {resultForm.entries.map((e,i) => (
                          <div key={i} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 text-center"><span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-[#C9922A] font-black">{i+1}.</span></div>
                            <div className="col-span-5"><input className={inp} value={e.name} onChange={ev=>setResultForm(p=>({...p,entries:p.entries.map((x,xi)=>xi===i?{...x,name:ev.target.value}:x)}))} placeholder="Shooter name" /></div>
                            <div className="col-span-3"><input className={inp} value={e.score} onChange={ev=>setResultForm(p=>({...p,entries:p.entries.map((x,xi)=>xi===i?{...x,score:ev.target.value}:x)}))} placeholder="Score / Time" /></div>
                            <div className="col-span-2"><input className={inp} value={e.notes} onChange={ev=>setResultForm(p=>({...p,entries:p.entries.map((x,xi)=>xi===i?{...x,notes:ev.target.value}:x)}))} placeholder="Notes" /></div>
                            <div className="col-span-1 text-center">{resultForm.entries.length>1 && <button onClick={()=>setResultForm(p=>({...p,entries:p.entries.filter((_,xi)=>xi!==i)}))} className="text-red-400 text-lg">×</button>}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={handleResultSave} disabled={resultSaving} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-2.5 rounded-sm hover:brightness-110 disabled:opacity-50">{resultSaving ? 'Posting...' : 'Post Results'}</button>
                      {resultMsg && <span className={`text-[12px] font-bold ${resultMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{resultMsg}</span>}
                    </div>
                  </div>
                )}
                {results.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-sm"><p className="text-4xl mb-3">🏆</p><p className="text-[#8A8E99] text-[13px]">No results posted yet</p></div>
                ) : (
                  <div className="space-y-4">
                    {results.map((r,i) => (
                      <div key={i} className="bg-[#0D0F13] border border-white/5 rounded-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                          <div><p style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="font-black text-[15px] uppercase">{r.title}</p><p className="text-[11px] text-[#8A8E99]">{r.discipline} · {new Date(r.shoot_date).toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'})}</p></div>
                        </div>
                        {r.results?.length > 0 && (
                          <div className="divide-y divide-white/5">
                            {r.results.slice(0,5).map((entry: any, ei: number) => (
                              <div key={ei} className="flex items-center gap-4 px-4 py-2.5">
                                <span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className={`w-8 text-center font-black text-[14px] ${ei===0?'text-[#FFD700]':ei===1?'text-[#C0C0C0]':ei===2?'text-[#CD7F32]':'text-[#8A8E99]'}`}>{ei===0?'🥇':ei===1?'🥈':ei===2?'🥉':`${ei+1}.`}</span>
                                <span className="flex-1 text-[13px] font-bold">{entry.name}</span>
                                <span className="text-[#C9922A] font-black text-[13px]">{entry.score}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── COMPLIANCE ── */}
          {activeTab === 'compliance' && (
            <div className="max-w-2xl space-y-5">
              <div className={sec}>
                <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-2">Compliance & <span className="text-[#C9922A]">Safety</span></h2>
                <p className="text-[11px] text-[#8A8E99] mb-5">Builds trust with first-time visitors and parents. Displayed prominently on your public page.</p>
                <div className="space-y-4">
                  <div><label className={lbl}>SAPS Registration Number</label><input className={inp} value={pf.saps_reg_number||''} onChange={e=>setPf((p: any)=>({...p,saps_reg_number:e.target.value}))} placeholder="e.g. WC/12345/2020" /></div>
                  <div><label className={lbl}>Compliance Certificate URL</label><input className={inp} value={pf.compliance_cert_url||''} onChange={e=>setPf((p: any)=>({...p,compliance_cert_url:e.target.value}))} placeholder="https://..." /></div>
                  <div><label className={lbl}>Range Rules</label><textarea className={`${inp} resize-none`} rows={6} value={pf.range_rules||''} onChange={e=>setPf((p: any)=>({...p,range_rules:e.target.value}))} placeholder={'1. Always treat every firearm as if it is loaded\n2. Never point a firearm at anything you do not intend to shoot\n3. Keep your finger off the trigger until ready to shoot\n4. Know your target and what is beyond it\n5. Eye and ear protection mandatory at all times'} /></div>
                  <div><label className={lbl}>What To Bring</label><textarea className={`${inp} resize-none`} rows={4} value={pf.what_to_bring||''} onChange={e=>setPf((p: any)=>({...p,what_to_bring:e.target.value}))} placeholder={'• Valid South African ID or passport\n• Valid firearm licence\n• Eye and ear protection\n• Appropriate footwear'} /></div>
                </div>
                <div className="flex items-center gap-4 mt-5">
                  <button onClick={handleComplianceSave} disabled={complianceSaving} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 disabled:opacity-50">{complianceSaving ? 'Saving...' : 'Save Compliance Info'}</button>
                  {complianceMsg && <span className={`text-[12px] font-bold ${complianceMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{complianceMsg}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ── SCHEDULE ── */}
          {activeTab === 'schedule' && (
            <div className="max-w-4xl space-y-5">
              <div className={sec}>
                <div className="flex items-center justify-between mb-5">
                  <div><h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">Operating <span className="text-[#C9922A]">Hours</span></h2><p className="text-[11px] text-[#8A8E99] mt-0.5">Toggle days · Set times, discipline and fees · Includes public holidays</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => setSchedule(p=>p.map(d=>({...d,open:true})))} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-3 py-1.5 rounded-sm hover:bg-[#C9922A]/10">All Open</button>
                    <button onClick={() => setSchedule(p=>p.map(d=>({...d,open:false})))} className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:bg-white/5">All Closed</button>
                  </div>
                </div>
                <div className="space-y-2">
                  {schedule.map((day, i) => (
                    <div key={day.day} className={`rounded-sm border transition-all ${day.open ? 'bg-[#13151A] border-white/5' : 'bg-[#0D0F13] border-white/5 opacity-50'}`}>
                      <div className="flex items-center gap-4 px-5 py-4">
                        <button onClick={() => updateDay(i,'open',!day.open)} className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${day.open ? 'bg-[#C9922A]' : 'bg-white/10'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${day.open ? 'left-5' : 'left-0.5'}`} />
                        </button>
                        <span style={{fontFamily:"'Barlow Condensed',sans-serif"}} className={`w-36 font-black uppercase text-[13px] flex-shrink-0 ${day.open ? day.day==='Public Holidays'?'text-[#C9922A]':'text-[#F0EDE8]' : 'text-[#5A5E69]'}`}>{day.day}</span>
                        {day.open ? (
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div><label className={lbl}>Opens</label><input type="time" className={inp} value={day.open_time} onChange={e=>updateDay(i,'open_time',e.target.value)} /></div>
                            <div><label className={lbl}>Closes</label><input type="time" className={inp} value={day.close_time} onChange={e=>updateDay(i,'close_time',e.target.value)} /></div>
                            <div><label className={lbl}>Discipline</label><input className={inp} value={day.discipline} placeholder="e.g. IPSC" onChange={e=>updateDay(i,'discipline',e.target.value)} /></div>
                            <div><label className={lbl}>Fee (R)</label><input type="number" className={inp} value={day.fee} placeholder="150" onChange={e=>updateDay(i,'fee',e.target.value)} /></div>
                            <div><label className={lbl}>Notes</label><input className={inp} value={day.notes} placeholder="Members only" onChange={e=>updateDay(i,'notes',e.target.value)} /></div>
                          </div>
                        ) : <span className="text-[11px] text-[#5A5E69] font-bold uppercase tracking-widest">Closed</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-5">
                  <button onClick={handleScheduleSave} disabled={scheduleSaving} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 disabled:opacity-50">{scheduleSaving ? 'Saving...' : 'Save Schedule'}</button>
                  {scheduleMsg && <span className={`text-[12px] font-bold ${scheduleMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{scheduleMsg}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ── EDIT PROFILE ── */}
          {activeTab === 'profile' && (
            <div className="space-y-5 max-w-3xl">
              {/* Logo & Cover */}
              <div className={sec}>
                <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4">Photos & <span className="text-[#C9922A]">Branding</span></h2>
                <div className="grid grid-cols-2 gap-5">
                  <div><div className={lbl}>{FL} Logo</div>
                    <label className="block cursor-pointer">
                      <div className={`border-2 border-dashed rounded-sm overflow-hidden flex items-center justify-center transition-colors ${logoPreview?'border-[#C9922A]/40':'border-white/15 hover:border-[#C9922A]/30'}`} style={{height:'130px'}}>
                        {logoPreview ? <img src={logoPreview} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} /> : <div className="text-center"><p className="text-3xl mb-1">{FI}</p><p className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest">Upload Logo</p></div>}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setLogoFile(f);setLogoPreview(URL.createObjectURL(f));}}} />
                    </label>
                  </div>
                  <div><div className={lbl}>Cover Photo <span className="text-[#8A8E99] font-normal normal-case tracking-normal">(landscape, 1600×400px)</span></div>
                    <label className="block cursor-pointer">
                      <div className={`border-2 border-dashed rounded-sm overflow-hidden flex items-center justify-center transition-colors ${coverPreview?'border-[#C9922A]/40':'border-white/15 hover:border-[#C9922A]/30'}`} style={{height:'130px'}}>
                        {coverPreview ? <img src={coverPreview} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} /> : <div className="text-center"><p className="text-3xl mb-1">🖼️</p><p className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest">Upload Cover</p></div>}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f){setCoverFile(f);setCoverPreview(URL.createObjectURL(f));}}} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div className={sec}>
                <div className="flex items-center justify-between mb-3">
                  <div><h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">{FL} <span className="text-[#C9922A]">Gallery</span></h2><p className="text-[11px] text-[#8A8E99] mt-0.5">Up to {MAX_GALLERY} photos · Max {MAX_MB}MB each</p></div>
                  <span className="text-[11px] font-black text-[#8A8E99]">{totalGallery}/{MAX_GALLERY}</span>
                </div>
                {galleryError && <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 text-[12px]">{galleryError}</div>}
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((url,i) => (
                    <div key={`ex-${i}`} className="relative rounded-sm overflow-hidden bg-[#0D0F13] border border-white/10 group" style={{paddingBottom:'100%'}}>
                      <img src={url} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} />
                      <button onClick={()=>setExistingImages(p=>p.filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                  {galleryPreviews.map((url,i) => (
                    <div key={`new-${i}`} className="relative rounded-sm overflow-hidden bg-[#0D0F13] border border-[#C9922A]/30 group" style={{paddingBottom:'100%'}}>
                      <img src={url} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}} />
                      <div className="absolute top-1 left-1 w-4 h-4 bg-[#C9922A] rounded-full text-[8px] flex items-center justify-center text-black font-black">N</div>
                      <button onClick={()=>{setGalleryFiles(p=>p.filter((_,idx)=>idx!==i));setGalleryPreviews(p=>p.filter((_,idx)=>idx!==i));}} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                  {totalGallery < MAX_GALLERY && (
                    <label className="bg-[#0D0F13] border-2 border-dashed border-white/20 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#C9922A]/40 transition-colors" style={{paddingBottom:'100%',position:'relative'}}>
                      <div style={{position:'absolute',inset:0}} className="flex flex-col items-center justify-center"><span className="text-xl text-[#8A8E99]">+</span><span className="text-[9px] text-[#8A8E99] mt-0.5 font-bold">Add</span></div>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} />
                    </label>
                  )}
                </div>
              </div>

              {/* Basic info */}
              <div className={sec}>
                <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4">{FL} <span className="text-[#C9922A]">Information</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className={lbl}>{FL} Name</label><input className={inp} value={pf.name||''} onChange={e=>setPf((p: any)=>({...p,name:e.target.value}))} /></div>
                  <div className="md:col-span-2"><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={4} value={pf.description||''} onChange={e=>setPf((p: any)=>({...p,description:e.target.value}))} /></div>
                  <div><label className={lbl}>Province</label><select className={inp} value={pf.province||''} onChange={e=>setPf((p: any)=>({...p,province:e.target.value}))}>{PROVINCES.map(pv=><option key={pv}>{pv}</option>)}</select></div>
                  <div><label className={lbl}>City / Town</label><input className={inp} value={pf.city||''} onChange={e=>setPf((p: any)=>({...p,city:e.target.value}))} /></div>
                  <div className="md:col-span-2"><label className={lbl}>Address</label><input className={inp} value={pf.address||''} onChange={e=>setPf((p: any)=>({...p,address:e.target.value}))} /></div>
                  <div><label className={lbl}>Phone</label><input className={inp} value={pf.phone||''} onChange={e=>setPf((p: any)=>({...p,phone:e.target.value}))} /></div>
                  <div><label className={lbl}>Email</label><input className={inp} type="email" value={pf.email||''} onChange={e=>setPf((p: any)=>({...p,email:e.target.value}))} /></div>
                  <div className="md:col-span-2"><label className={lbl}>Website</label><input className={inp} value={pf.website||''} onChange={e=>setPf((p: any)=>({...p,website:e.target.value}))} placeholder="https://..." /></div>
                </div>
              </div>

              {/* Disciplines */}
              <div className={sec}>
                <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4"><span className="text-[#C9922A]">Disciplines</span></h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ALL_DISCIPLINES.map(d => (
                    <label key={d} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-sm border transition-all ${(pf.disciplines||[]).includes(d)?'border-[#C9922A]/50 bg-[#C9922A]/10':'border-white/10 hover:border-white/20'}`}>
                      <input type="checkbox" className="accent-[#C9922A]" checked={(pf.disciplines||[]).includes(d)} onChange={()=>toggleDisc(d)} />
                      <span className="text-[12px] font-bold">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Range facilities + PRICING */}
              {isRange && (
                <>
                  <div className={sec}>
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4">Range <span className="text-[#C9922A]">Facilities</span></h2>
                    <div className="mb-4">
                      <label className={lbl}>Environment</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[['outdoor','🌳 Outdoor'],['indoor','🏠 Indoor'],['both','🏠🌳 Both']].map(([val,label])=>(
                          <label key={val} className={`flex items-center gap-2 cursor-pointer p-3 rounded-sm border text-center justify-center transition-all ${pf.range_environment===val?'border-[#C9922A]/50 bg-[#C9922A]/10 text-[#C9922A]':'border-white/10 hover:border-white/20'}`}>
                            <input type="radio" name="range_environment" className="hidden" checked={pf.range_environment===val} onChange={()=>setPf((p: any)=>({...p,range_environment:val}))} />
                            <span className="text-[12px] font-black uppercase tracking-widest">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><label className={lbl}>Number of Booths</label><input type="number" className={inp} value={pf.booth_count||''} onChange={e=>setPf((p: any)=>({...p,booth_count:parseInt(e.target.value),lane_count:parseInt(e.target.value)}))} placeholder="e.g. 12" /></div>
                      <div><label className={lbl}>Max Distance (m)</label><input type="number" className={inp} value={pf.max_distance_m||''} onChange={e=>setPf((p: any)=>({...p,max_distance_m:parseInt(e.target.value)}))} placeholder="e.g. 300" /></div>
                    </div>
                    <div className="mb-4"><label className={lbl}>Booth Layout / Distances</label><textarea className={`${inp} resize-none`} rows={2} value={pf.booth_distances||''} onChange={e=>setPf((p: any)=>({...p,booth_distances:e.target.value}))} placeholder="e.g. Booths 1–6: 25m pistol, Booths 7–10: 50m rifle" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      {[['covered_lanes','Covered Booths'],['booking_required','Booking Required'],['range_officer_on_duty','Range Officer On Duty'],['public_shoot_days','Public Shoot Days'],['is_members_only','Members Only']].map(([f,label])=>(
                        <label key={f} className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 hover:border-[#C9922A]/30 transition-colors">
                          <input type="checkbox" className="accent-[#C9922A]" checked={!!pf[f]} onChange={e=>setPf((p: any)=>({...p,[f]:e.target.checked}))} />
                          <span className="text-[12px] font-bold">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* PRICING — clearly labelled */}
                  <div className={sec}>
                    <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-2">Range <span className="text-[#C9922A]">Pricing</span></h2>
                    <p className="text-[11px] text-[#8A8E99] mb-4">Set your range fee and how it's charged. Shown clearly on your public page.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Pricing Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {FEE_TYPES.map(ft => (
                            <label key={ft.value} className={`flex items-center gap-2 cursor-pointer p-3 rounded-sm border transition-all ${(pf.range_fee_type||'session')===ft.value?'border-[#C9922A]/50 bg-[#C9922A]/10':'border-white/10 hover:border-white/20'}`}>
                              <input type="radio" name="range_fee_type" className="hidden" checked={(pf.range_fee_type||'session')===ft.value} onChange={()=>setPf((p: any)=>({...p,range_fee_type:ft.value}))} />
                              <span className="text-[12px] font-black uppercase tracking-wider">{ft.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={lbl}>
                          Fee Amount (R) — <span className="text-[#C9922A]">{FEE_TYPES.find(f=>f.value===(pf.range_fee_type||'session'))?.label || 'Per Session'}</span>
                        </label>
                        <input type="number" className={inp} value={pf.range_fee||''} onChange={e=>setPf((p: any)=>({...p,range_fee:parseInt(e.target.value)}))} placeholder="e.g. 150" />
                        {pf.range_fee && <p className="mt-2 text-[#C9922A] font-black text-[13px]">R{pf.range_fee} {FEE_TYPES.find(f=>f.value===(pf.range_fee_type||'session'))?.label?.toLowerCase() || 'per session'}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Guns for hire */}
                  <div className={sec}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase">Guns for <span className="text-[#C9922A]">Hire</span></h2>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-[#C9922A] w-4 h-4" checked={!!pf.guns_for_hire} onChange={e=>setPf((p: any)=>({...p,guns_for_hire:e.target.checked}))} />
                        <span className="text-[12px] font-black uppercase tracking-widest">{pf.guns_for_hire?'✓ Available':'Not Available'}</span>
                      </label>
                    </div>
                    {pf.guns_for_hire && (
                      <>
                        <div className="mb-4"><label className={lbl}>Makes Available</label><div className="grid grid-cols-3 gap-2">{COMMON_GUN_MAKES.map(m=>(<label key={m} className={`flex items-center gap-2 cursor-pointer p-2 rounded-sm border transition-all ${(pf.hire_gun_makes||[]).includes(m)?'border-[#C9922A]/50 bg-[#C9922A]/10':'border-white/10 hover:border-white/20'}`}><input type="checkbox" className="accent-[#C9922A]" checked={(pf.hire_gun_makes||[]).includes(m)} onChange={()=>toggleMake(m)} /><span className="text-[11px] font-bold">{m}</span></label>))}</div></div>
                        <div><label className={lbl}>Calibres Available</label><div className="grid grid-cols-3 gap-2">{COMMON_CALIBRES.map(c=>(<label key={c} className={`flex items-center gap-2 cursor-pointer p-2 rounded-sm border transition-all ${(pf.hire_gun_calibres||[]).includes(c)?'border-[#C9922A]/50 bg-[#C9922A]/10':'border-white/10 hover:border-white/20'}`}><input type="checkbox" className="accent-[#C9922A]" checked={(pf.hire_gun_calibres||[]).includes(c)} onChange={()=>toggleCal(c)} /><span className="text-[11px] font-bold">{c}</span></label>))}</div></div>
                      </>
                    )}
                  </div>
                </>
              )}

              {!isRange && (
                <div className={sec}>
                  <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4">Membership & <span className="text-[#C9922A]">Fees</span></h2>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5"><input type="checkbox" className="accent-[#C9922A]" checked={!!pf.is_members_only} onChange={e=>setPf((p: any)=>({...p,is_members_only:e.target.checked}))} /><span className="text-[12px] font-bold">Members Only</span></label>
                    <div><label className={lbl}>Annual Fee (R)</label><input type="number" className={inp} value={pf.membership_fee||''} onChange={e=>setPf((p: any)=>({...p,membership_fee:parseFloat(e.target.value)}))} /></div>
                  </div>
                </div>
              )}

              <div className={sec}>
                <h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4">Additional <span className="text-[#C9922A]">Information</span></h2>
                <textarea className={`${inp} resize-none`} rows={4} value={pf.additional_info||''} onChange={e=>setPf((p: any)=>({...p,additional_info:e.target.value}))} placeholder="Parking, ammo sales, facilities, anything else shooters should know..." />
              </div>

              <div className="flex items-center gap-4 pb-4">
                <button onClick={handleProfileSave} disabled={profileSaving} style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 disabled:opacity-50">{profileSaving ? 'Saving...' : 'Save Profile'}</button>
                {profileMsg && <span className={`text-[12px] font-bold ${profileMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{profileMsg}</span>}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="max-w-2xl"><div className={sec}><h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4"><span className="text-[#C9922A]">Members</span></h2><div className="border-2 border-dashed border-white/10 rounded-sm p-10 text-center"><p className="text-3xl mb-3">👥</p><p className="text-[#8A8E99] text-[13px]">Member management coming soon</p></div></div></div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-lg"><div className={sec}><h2 style={{fontFamily:"'Barlow Condensed',sans-serif"}} className="text-xl font-black uppercase mb-4"><span className="text-[#C9922A]">Settings</span></h2><div className="space-y-3">{[['Account Email',club?.email||'—'],['Account Type',FL],['Status',club?.status||'—'],['Slug',club?.slug||'—']].map(([label,val])=>(<div key={label} className="bg-[#0D0F13] border border-white/10 rounded-sm p-4"><div className={lbl}>{label}</div><p className="text-[13px] font-bold">{val}</p></div>))}<button onClick={handleSignOut} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-[12px] font-black uppercase tracking-widest transition-all mt-2">Sign Out</button></div></div></div>
          )}

        </div>
      </main>
    </div>
  );
}
