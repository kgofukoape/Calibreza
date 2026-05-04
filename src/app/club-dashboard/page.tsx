'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const ALL_DISCIPLINES = [
  'IPSC', 'IDPA', 'Practical Shooting', 'Target Shooting', 'Hunting',
  'Long Range', 'Skeet', 'Trap', 'Air Gun', 'Benchrest', 'Field Shooting',
];

const COMMON_GUN_MAKES = [
  'Glock', 'CZ', 'Sig Sauer', 'Smith & Wesson', 'Beretta', 'Walther',
  'Springfield', 'Heckler & Koch', 'Taurus', 'Ruger', 'Browning',
  'Winchester', 'Remington', 'Mossberg', 'Tikka', 'Sako', 'Other',
];

const COMMON_CALIBRES = [
  '9mm', '.45 ACP', '.40 S&W', '.357 Mag', '.38 Special', '.44 Mag',
  '5.56mm / .223', '7.62x39', '.308 Win', '.30-06', '6.5 Creedmoor',
  '.22 LR', '12 Gauge', '20 Gauge', '.410', 'Other',
];

const ALL_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Public Holidays',
];

const MAX_GALLERY_IMAGES = 10;
const MAX_FILE_SIZE_MB = 2;

interface DaySchedule {
  day: string;
  open: boolean;
  open_time: string;
  close_time: string;
  discipline: string;
  fee: string;
  notes: string;
}

interface ClubData {
  id: string;
  name: string;
  slug: string;
  facility_type: string;
  status: string;
  province: string;
  city: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  is_members_only: boolean;
  membership_fee: number;
  lane_count?: number;
  max_distance_m?: number;
  covered_lanes?: boolean;
  public_shoot_days: boolean;
  booking_required: boolean;
  range_officer_on_duty: boolean;
  logo_url?: string;
  cover_url?: string;
  images?: string[];
  operating_schedule?: DaySchedule[];
  disciplines?: string[];
  booth_count?: number;
  booth_distances?: string;
  guns_for_hire?: boolean;
  hire_gun_makes?: string[];
  hire_gun_calibres?: string[];
  additional_info?: string;
  range_environment?: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = ALL_DAYS.map(day => ({
  day,
  open: true,
  open_time: '08:00',
  close_time: '17:00',
  discipline: '',
  fee: '',
  notes: '',
}));

export default function ClubDashboardPage() {
  const router = useRouter();
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Profile state
  const [profileForm, setProfileForm] = useState<Partial<ClubData>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  // Gallery state
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [galleryError, setGalleryError] = useState('');

  // Schedule state
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');

  useEffect(() => { fetchClub(); }, []);

  const fetchClub = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/dealer/login'); return; }
    const { data, error } = await supabase.from('clubs').select('*').eq('user_id', user.id).single();
    if (error || !data) { router.push('/dealer/login'); return; }
    setClub(data);
    setProfileForm(data);
    setLogoPreview(data.logo_url || '');
    setCoverPreview(data.cover_url || '');
    setExistingImages(data.images || []);

    // Merge saved schedule with defaults so all days always show
    if (data.operating_schedule?.length) {
      const saved = data.operating_schedule;
      const merged = DEFAULT_SCHEDULE.map(def => {
        const found = saved.find((s: DaySchedule) => s.day === def.day);
        return found || def;
      });
      setSchedule(merged);
    }
    setLoading(false);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/dealer/login'); };

  const uploadImage = async (file: File, path: string) => {
    const ext = file.name.split('.').pop();
    const filePath = `${path}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('club-images').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('club-images').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGalleryError('');
    const files = Array.from(e.target.files || []);
    const totalSlots = MAX_GALLERY_IMAGES - existingImages.length - galleryFiles.length;
    const toAdd: File[] = [];
    for (const file of files) {
      if (toAdd.length >= totalSlots) break;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { setGalleryError(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB — skipped`); continue; }
      toAdd.push(file);
    }
    setGalleryFiles(prev => [...prev, ...toAdd]);
    setGalleryPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const toggleMake = (make: string) => {
    const curr = profileForm.hire_gun_makes || [];
    setProfileForm(p => ({ ...p, hire_gun_makes: curr.includes(make) ? curr.filter(x => x !== make) : [...curr, make] }));
  };

  const toggleCalibre = (cal: string) => {
    const curr = profileForm.hire_gun_calibres || [];
    setProfileForm(p => ({ ...p, hire_gun_calibres: curr.includes(cal) ? curr.filter(x => x !== cal) : [...curr, cal] }));
  };

  const toggleDisc = (d: string) => {
    const curr = profileForm.disciplines || [];
    setProfileForm(p => ({ ...p, disciplines: curr.includes(d) ? curr.filter(x => x !== d) : [...curr, d] }));
  };

  const updateDay = (idx: number, field: keyof DaySchedule, value: any) => {
    setSchedule(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const setAllOpen = (open: boolean) => {
    setSchedule(prev => prev.map(d => ({ ...d, open })));
  };

  const handleProfileSave = async () => {
    if (!club) return;
    setProfileSaving(true); setProfileMsg('');
    try {
      let logo_url = profileForm.logo_url || '';
      let cover_url = profileForm.cover_url || '';
      if (logoFile) logo_url = await uploadImage(logoFile, 'logos');
      if (coverFile) cover_url = await uploadImage(coverFile, 'covers');
      const newImageUrls: string[] = [];
      for (const file of galleryFiles) newImageUrls.push(await uploadImage(file, 'gallery'));
      const allImages = [...existingImages, ...newImageUrls];

      const { error } = await supabase.from('clubs').update({
        name: profileForm.name, description: profileForm.description,
        province: profileForm.province, city: profileForm.city, address: profileForm.address,
        phone: profileForm.phone, email: profileForm.email, website: profileForm.website,
        is_members_only: profileForm.is_members_only, membership_fee: profileForm.membership_fee,
        booking_required: profileForm.booking_required, range_officer_on_duty: profileForm.range_officer_on_duty,
        public_shoot_days: profileForm.public_shoot_days, lane_count: profileForm.lane_count,
        max_distance_m: profileForm.max_distance_m, covered_lanes: profileForm.covered_lanes,
        disciplines: profileForm.disciplines, booth_count: profileForm.booth_count,
        booth_distances: profileForm.booth_distances, guns_for_hire: profileForm.guns_for_hire,
        hire_gun_makes: profileForm.guns_for_hire ? profileForm.hire_gun_makes : [],
        hire_gun_calibres: profileForm.guns_for_hire ? profileForm.hire_gun_calibres : [],
        additional_info: profileForm.additional_info, range_environment: profileForm.range_environment,
        logo_url, cover_url, images: allImages,
      }).eq('id', club.id);

      if (error) throw error;
      setClub({ ...club, ...profileForm, logo_url, cover_url, images: allImages });
      setExistingImages(allImages);
      setGalleryFiles([]); setGalleryPreviews([]);
      setProfileMsg('✓ Profile saved successfully');
    } catch (err: any) {
      setProfileMsg('✗ ' + (err.message || 'Failed to save'));
    } finally { setProfileSaving(false); }
  };

  const handleScheduleSave = async () => {
    if (!club) return;
    setScheduleSaving(true); setScheduleMsg('');
    try {
      const { error } = await supabase.from('clubs').update({ operating_schedule: schedule }).eq('id', club.id);
      if (error) throw error;
      setClub({ ...club, operating_schedule: schedule });
      setScheduleMsg('✓ Schedule saved');
    } catch (err: any) {
      setScheduleMsg('✗ ' + (err.message || 'Failed to save'));
    } finally { setScheduleSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isRange = club?.facility_type === 'range';
  const FL = isRange ? 'Range' : 'Club';
  const FI = isRange ? '🎯' : '🏛️';
  const totalGalleryCount = existingImages.length + galleryFiles.length;
  const canAddMoreImages = totalGalleryCount < MAX_GALLERY_IMAGES;
  const openDays = schedule.filter(d => d.open);

  const nav = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'profile', label: 'Edit Profile', icon: '✏️' },
    { id: 'schedule', label: isRange ? 'Hours & Sessions' : 'Schedule', icon: '📅' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[13px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 transition-colors placeholder-[#8A8E99]/40";
  const lbl = "block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";
  const sec = "bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6";

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex">

      {/* SIDEBAR */}
      <aside className="w-[256px] bg-[#0A0C10] border-r border-white/5 flex flex-col flex-shrink-0 min-h-screen">
        <div className="p-5 border-b border-white/5">
          <Link href="/"><span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black tracking-tighter uppercase text-[#F0EDE8]">GUN <span className="text-[#C9922A]">X</span></span></Link>
          <p className="text-[9px] font-bold text-[#8A8E99] tracking-[0.3em] uppercase mt-1">{FL} Portal</p>
        </div>

        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-sm overflow-hidden bg-[#C9922A]/10 border border-[#C9922A]/20 flex items-center justify-center flex-shrink-0">
              {club?.logo_url ? <img src={club.logo_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">{FI}</span>}
            </div>
            <div className="min-w-0">
              <p className="font-black text-[13px] truncate">{club?.name}</p>
              <p className="text-[10px] text-[#8A8E99] uppercase tracking-widest truncate">{club?.city}, {club?.province}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-widest rounded-sm">{club?.status}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-[12px] font-black uppercase tracking-widest transition-all ${
                activeTab === item.id ? 'bg-[#C9922A]/10 border border-[#C9922A]/20 text-[#C9922A]' : 'text-[#8A8E99] hover:text-[#F0EDE8] hover:bg-white/5'
              }`}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5 space-y-1.5">
          <Link href={`/clubs/${club?.slug}`} className="block text-center px-3 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-[11px] font-black uppercase tracking-widest transition-colors">View Public Page</Link>
          <button onClick={handleSignOut} className="w-full text-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-[11px] font-black uppercase tracking-widest transition-colors">Sign Out</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-[#0A0C10] border-b border-white/5 px-8 py-5 sticky top-0 z-10">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight">
            {nav.find(n => n.id === activeTab)?.label} <span className="text-[#C9922A]">— {FL}</span>
          </h1>
        </header>

        <div className="p-6 md:p-8 space-y-5">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <>
              {/* Cover banner — fixed display */}
              {club?.cover_url && (
                <div className="w-full rounded-sm overflow-hidden border border-white/5" style={{ height: '200px' }}>
                  <img src={club.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Type', value: isRange ? 'Shooting Range' : 'Shooting Club', icon: FI },
                  { label: 'Province', value: club?.province || '—', icon: '📍' },
                  { label: isRange ? 'Booths' : 'Type', value: isRange ? (club?.booth_count?.toString() || '—') : 'Club', icon: '🎯' },
                  { label: isRange ? 'Max Distance' : 'Members Only', value: isRange ? (club?.max_distance_m ? `${club.max_distance_m}m` : '—') : (club?.is_members_only ? 'Yes' : 'Open'), icon: isRange ? '📏' : '🔒' },
                ].map((s, i) => (
                  <div key={i} className={sec}>
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className={lbl}>{s.label}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase">{s.value}</div>
                  </div>
                ))}
              </div>

              {isRange && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Environment', value: club?.range_environment || '—', icon: club?.range_environment === 'indoor' ? '🏠' : club?.range_environment === 'both' ? '🏠🌳' : '🌳' },
                    { label: 'Covered Booths', value: club?.covered_lanes ? 'Yes' : 'No', icon: '🏗️' },
                    { label: 'Guns for Hire', value: club?.guns_for_hire ? 'Available' : 'No', icon: '🔫' },
                    { label: 'Range Officer', value: club?.range_officer_on_duty ? 'On Duty' : 'No', icon: '👮' },
                  ].map((s, i) => (
                    <div key={i} className={sec}>
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <div className={lbl}>{s.label}</div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg font-black uppercase">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {isRange && club?.guns_for_hire && (
                <div className={sec}>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Guns for <span className="text-[#C9922A]">Hire</span></h2>
                  <div className="grid grid-cols-2 gap-4">
                    {club.hire_gun_makes?.length > 0 && (
                      <div><div className={lbl}>Makes</div><div className="flex flex-wrap gap-1.5 mt-1">{club.hire_gun_makes.map(m => <span key={m} className="px-2 py-1 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm text-[11px] font-bold text-[#C9922A]">{m}</span>)}</div></div>
                    )}
                    {club.hire_gun_calibres?.length > 0 && (
                      <div><div className={lbl}>Calibres</div><div className="flex flex-wrap gap-1.5 mt-1">{club.hire_gun_calibres.map(c => <span key={c} className="px-2 py-1 bg-white/5 border border-white/10 rounded-sm text-[11px] font-bold">{c}</span>)}</div></div>
                    )}
                  </div>
                </div>
              )}

              {/* Operating hours summary */}
              <div className={sec}>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">
                    Operating <span className="text-[#C9922A]">Hours</span>
                  </h2>
                  <button onClick={() => setActiveTab('schedule')} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">Manage →</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {schedule.map((d, i) => (
                    <div key={i} className={`p-3 rounded-sm border ${d.open ? 'bg-[#0D0F13] border-white/10' : 'bg-[#0D0F13]/50 border-white/5 opacity-40'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">{d.day.slice(0, 3)}</p>
                      {d.open ? (
                        <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black text-[#C9922A]">{d.open_time} – {d.close_time}</p>
                      ) : (
                        <p className="text-[12px] font-bold text-[#5A5E69]">Closed</p>
                      )}
                      {d.discipline && <p className="text-[10px] text-[#8A8E99] mt-0.5 truncate">{d.discipline}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery */}
              {club?.images && club.images.length > 0 && (
                <div className={sec}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">{FL} <span className="text-[#C9922A]">Gallery</span></h2>
                    <button onClick={() => setActiveTab('profile')} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">Manage →</button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {club.images.map((url, i) => (
                      <div key={i} className="rounded-sm overflow-hidden bg-[#0D0F13] border border-white/5" style={{ aspectRatio: '1', position: 'relative' }}>
                        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={sec}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Contact <span className="text-[#C9922A]">Info</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                  <div><div className={lbl}>Email</div><p>{club?.email || '—'}</p></div>
                  <div><div className={lbl}>Phone</div><p>{club?.phone || '—'}</p></div>
                  <div><div className={lbl}>Website</div><p>{club?.website || '—'}</p></div>
                </div>
                {club?.description && <div className="mt-4 pt-4 border-t border-white/5"><div className={lbl}>About</div><p className="text-[13px] text-[#8A8E99] leading-relaxed">{club.description}</p></div>}
              </div>
            </>
          )}

          {/* ── SCHEDULE ── */}
          {activeTab === 'schedule' && (
            <div className="max-w-4xl space-y-5">
              <div className={sec}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">
                      {isRange ? 'Operating Hours &' : ''} <span className="text-[#C9922A]">{isRange ? 'Sessions' : 'Shoot Days'}</span>
                    </h2>
                    <p className="text-[11px] text-[#8A8E99] mt-0.5">Toggle days open/closed · Set hours, discipline and fee per day · Includes public holidays</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAllOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-3 py-1.5 rounded-sm hover:bg-[#C9922A]/10 transition-all">All Open</button>
                    <button onClick={() => setAllOpen(false)} className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-3 py-1.5 rounded-sm hover:bg-white/5 transition-all">All Closed</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {schedule.map((day, i) => (
                  <div key={day.day} className={`rounded-sm border transition-all ${day.open ? 'bg-[#13151A] border-white/5' : 'bg-[#0D0F13] border-white/5 opacity-60'}`}>
                    {/* Day header row */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Toggle */}
                      <button
                        onClick={() => updateDay(i, 'open', !day.open)}
                        className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0 ${day.open ? 'bg-[#C9922A]' : 'bg-white/10'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${day.open ? 'left-5' : 'left-0.5'}`} />
                      </button>

                      {/* Day name */}
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        className={`w-32 font-black uppercase text-[14px] flex-shrink-0 ${day.open ? 'text-[#F0EDE8]' : 'text-[#5A5E69]'} ${day.day === 'Public Holidays' ? 'text-[#C9922A]' : ''}`}>
                        {day.day}
                      </span>

                      {day.open ? (
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <label className={lbl}>Opens</label>
                            <input type="time" className={inp} value={day.open_time} onChange={e => updateDay(i, 'open_time', e.target.value)} />
                          </div>
                          <div>
                            <label className={lbl}>Closes</label>
                            <input type="time" className={inp} value={day.close_time} onChange={e => updateDay(i, 'close_time', e.target.value)} />
                          </div>
                          <div>
                            <label className={lbl}>Discipline</label>
                            <input className={inp} value={day.discipline} placeholder="e.g. IPSC" onChange={e => updateDay(i, 'discipline', e.target.value)} />
                          </div>
                          <div>
                            <label className={lbl}>Fee (R)</label>
                            <input type="number" className={inp} value={day.fee} placeholder="150" onChange={e => updateDay(i, 'fee', e.target.value)} />
                          </div>
                          <div>
                            <label className={lbl}>Notes</label>
                            <input className={inp} value={day.notes} placeholder="e.g. Members only" onChange={e => updateDay(i, 'notes', e.target.value)} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#5A5E69] font-bold uppercase tracking-widest">Closed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save */}
              <div className="flex items-center gap-4 pt-2">
                <button onClick={handleScheduleSave} disabled={scheduleSaving}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                  {scheduleSaving ? 'Saving...' : 'Save Schedule'}
                </button>
                {scheduleMsg && <span className={`text-[12px] font-bold ${scheduleMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{scheduleMsg}</span>}
              </div>

              {/* Preview */}
              <div className={sec}>
                <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase text-[#8A8E99] mb-3">Public Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {schedule.map((d, i) => (
                    <div key={i} className={`p-3 rounded-sm border ${d.open ? 'bg-[#0D0F13] border-white/10' : 'bg-[#0D0F13]/30 border-white/5 opacity-40'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${d.day === 'Public Holidays' ? 'text-[#C9922A]' : 'text-[#8A8E99]'}`}>{d.day}</p>
                      {d.open ? (
                        <>
                          <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black text-[#C9922A]">{d.open_time} – {d.close_time}</p>
                          {d.discipline && <p className="text-[10px] text-[#8A8E99] mt-0.5">{d.discipline}</p>}
                          {d.fee && <p className="text-[10px] text-[#C9922A] font-bold mt-0.5">R{d.fee}</p>}
                        </>
                      ) : (
                        <p className="text-[12px] font-bold text-[#5A5E69]">Closed</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EDIT PROFILE ── */}
          {activeTab === 'profile' && (
            <div className="space-y-5 max-w-3xl">

              {/* Logo & Cover */}
              <div className={sec}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Photos & <span className="text-[#C9922A]">Branding</span></h2>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <div className={lbl}>{FL} Logo</div>
                    <label className="block cursor-pointer">
                      <div className={`border-2 border-dashed rounded-sm overflow-hidden flex items-center justify-center transition-colors ${logoPreview ? 'border-[#C9922A]/40' : 'border-white/15 hover:border-[#C9922A]/30'}`} style={{ height: '130px' }}>
                        {logoPreview
                          ? <img src={logoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                          : <div className="text-center"><p className="text-3xl mb-1">{FI}</p><p className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest">Upload Logo</p></div>
                        }
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }}} />
                    </label>
                  </div>
                  <div>
                    <div className={lbl}>Cover Photo <span className="text-[#8A8E99] font-normal normal-case tracking-normal">(wide banner — use landscape)</span></div>
                    <label className="block cursor-pointer">
                      <div className={`border-2 border-dashed rounded-sm overflow-hidden flex items-center justify-center transition-colors ${coverPreview ? 'border-[#C9922A]/40' : 'border-white/15 hover:border-[#C9922A]/30'}`} style={{ height: '130px' }}>
                        {coverPreview
                          ? <img src={coverPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                          : <div className="text-center"><p className="text-3xl mb-1">🖼️</p><p className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest">Upload Cover</p><p className="text-[9px] text-[#8A8E99]/60 mt-0.5">Best: 1600×400px landscape</p></div>
                        }
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }}} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Gallery */}
              <div className={sec}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">{FL} <span className="text-[#C9922A]">Gallery</span></h2>
                    <p className="text-[11px] text-[#8A8E99] mt-0.5">Up to {MAX_GALLERY_IMAGES} photos · Max {MAX_FILE_SIZE_MB}MB each · Square crops best</p>
                  </div>
                  <span className="text-[11px] font-black text-[#8A8E99]">{totalGalleryCount}/{MAX_GALLERY_IMAGES}</span>
                </div>
                {galleryError && <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 text-[12px]">{galleryError}</div>}
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((url, i) => (
                    <div key={`ex-${i}`} className="relative rounded-sm overflow-hidden bg-[#0D0F13] border border-white/10 group" style={{ aspectRatio: '1' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0 }} />
                      <button onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                  {galleryPreviews.map((url, i) => (
                    <div key={`new-${i}`} className="relative rounded-sm overflow-hidden bg-[#0D0F13] border border-[#C9922A]/30 group" style={{ aspectRatio: '1' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', position: 'absolute', inset: 0 }} />
                      <div className="absolute top-1 left-1 w-4 h-4 bg-[#C9922A] rounded-full text-[8px] flex items-center justify-center text-black font-black">N</div>
                      <button onClick={() => { setGalleryFiles(p => p.filter((_, idx) => idx !== i)); setGalleryPreviews(p => p.filter((_, idx) => idx !== i)); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    </div>
                  ))}
                  {canAddMoreImages && (
                    <label className="bg-[#0D0F13] border-2 border-dashed border-white/20 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-[#C9922A]/40 transition-colors" style={{ aspectRatio: '1' }}>
                      <span className="text-xl text-[#8A8E99]">+</span>
                      <span className="text-[9px] text-[#8A8E99] mt-0.5 font-bold">Add</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} />
                    </label>
                  )}
                </div>
              </div>

              {/* Basic info */}
              <div className={sec}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">{FL} <span className="text-[#C9922A]">Information</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className={lbl}>{FL} Name</label><input className={inp} value={profileForm.name || ''} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} /></div>
                  <div className="md:col-span-2"><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={4} value={profileForm.description || ''} onChange={e => setProfileForm(p => ({ ...p, description: e.target.value }))} /></div>
                  <div><label className={lbl}>Province</label><select className={inp} value={profileForm.province || ''} onChange={e => setProfileForm(p => ({ ...p, province: e.target.value }))}>{PROVINCES.map(pv => <option key={pv}>{pv}</option>)}</select></div>
                  <div><label className={lbl}>City / Town</label><input className={inp} value={profileForm.city || ''} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} /></div>
                  <div className="md:col-span-2"><label className={lbl}>Address</label><input className={inp} value={profileForm.address || ''} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} /></div>
                  <div><label className={lbl}>Phone</label><input className={inp} value={profileForm.phone || ''} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div><label className={lbl}>Email</label><input className={inp} type="email" value={profileForm.email || ''} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className="md:col-span-2"><label className={lbl}>Website</label><input className={inp} value={profileForm.website || ''} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." /></div>
                </div>
              </div>

              {/* Disciplines */}
              <div className={sec}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4"><span className="text-[#C9922A]">Disciplines</span></h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ALL_DISCIPLINES.map(d => (
                    <label key={d} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-sm border transition-all ${(profileForm.disciplines || []).includes(d) ? 'border-[#C9922A]/50 bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'}`}>
                      <input type="checkbox" className="accent-[#C9922A]" checked={(profileForm.disciplines || []).includes(d)} onChange={() => toggleDisc(d)} />
                      <span className="text-[12px] font-bold">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Range facilities */}
              {isRange && (
                <>
                  <div className={sec}>
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Range <span className="text-[#C9922A]">Facilities</span></h2>
                    <div className="mb-4">
                      <label className={lbl}>Range Environment</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[['outdoor', '🌳 Outdoor'], ['indoor', '🏠 Indoor'], ['both', '🏠🌳 Both']].map(([val, label]) => (
                          <label key={val} className={`flex items-center gap-2 cursor-pointer p-3 rounded-sm border text-center justify-center transition-all ${profileForm.range_environment === val ? 'border-[#C9922A]/50 bg-[#C9922A]/10 text-[#C9922A]' : 'border-white/10 hover:border-white/20'}`}>
                            <input type="radio" name="range_environment" className="hidden" checked={profileForm.range_environment === val} onChange={() => setProfileForm(p => ({ ...p, range_environment: val }))} />
                            <span className="text-[12px] font-black uppercase tracking-widest">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><label className={lbl}>Number of Booths / Lanes</label><input type="number" className={inp} value={profileForm.booth_count || ''} onChange={e => setProfileForm(p => ({ ...p, booth_count: parseInt(e.target.value), lane_count: parseInt(e.target.value) }))} placeholder="e.g. 12" /></div>
                      <div><label className={lbl}>Max Distance (m)</label><input type="number" className={inp} value={profileForm.max_distance_m || ''} onChange={e => setProfileForm(p => ({ ...p, max_distance_m: parseInt(e.target.value) }))} placeholder="e.g. 300" /></div>
                    </div>
                    <div className="mb-4">
                      <label className={lbl}>Booth Distances</label>
                      <textarea className={`${inp} resize-none`} rows={2} value={profileForm.booth_distances || ''} onChange={e => setProfileForm(p => ({ ...p, booth_distances: e.target.value }))} placeholder="e.g. Booths 1–6: 25m pistol, Booths 7–10: 50m rifle, Booths 11–12: 100m long range" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[['covered_lanes','Covered Booths / Lanes'],['booking_required','Booking Required'],['range_officer_on_duty','Range Officer On Duty'],['public_shoot_days','Hosts Public Shoot Days'],['is_members_only','Members Only']].map(([f, label]) => (
                        <label key={f} className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 hover:border-[#C9922A]/30 transition-colors">
                          <input type="checkbox" className="accent-[#C9922A]" checked={!!(profileForm as any)[f]} onChange={e => setProfileForm(p => ({ ...p, [f]: e.target.checked }))} />
                          <span className="text-[12px] font-bold">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Guns for hire */}
                  <div className={sec}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">Guns for <span className="text-[#C9922A]">Hire</span></h2>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="accent-[#C9922A] w-4 h-4" checked={!!profileForm.guns_for_hire} onChange={e => setProfileForm(p => ({ ...p, guns_for_hire: e.target.checked }))} />
                        <span className="text-[12px] font-black uppercase tracking-widest">{profileForm.guns_for_hire ? '✓ Available' : 'Not Available'}</span>
                      </label>
                    </div>
                    {profileForm.guns_for_hire && (
                      <>
                        <div className="mb-4">
                          <label className={lbl}>Gun Makes Available for Hire</label>
                          <div className="grid grid-cols-3 gap-2">
                            {COMMON_GUN_MAKES.map(make => (
                              <label key={make} className={`flex items-center gap-2 cursor-pointer p-2 rounded-sm border transition-all ${(profileForm.hire_gun_makes || []).includes(make) ? 'border-[#C9922A]/50 bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'}`}>
                                <input type="checkbox" className="accent-[#C9922A]" checked={(profileForm.hire_gun_makes || []).includes(make)} onChange={() => toggleMake(make)} />
                                <span className="text-[11px] font-bold">{make}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={lbl}>Calibres Available for Hire</label>
                          <div className="grid grid-cols-3 gap-2">
                            {COMMON_CALIBRES.map(cal => (
                              <label key={cal} className={`flex items-center gap-2 cursor-pointer p-2 rounded-sm border transition-all ${(profileForm.hire_gun_calibres || []).includes(cal) ? 'border-[#C9922A]/50 bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'}`}>
                                <input type="checkbox" className="accent-[#C9922A]" checked={(profileForm.hire_gun_calibres || []).includes(cal)} onChange={() => toggleCalibre(cal)} />
                                <span className="text-[11px] font-bold">{cal}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Club membership */}
              {!isRange && (
                <div className={sec}>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Membership & <span className="text-[#C9922A]">Fees</span></h2>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5">
                      <input type="checkbox" className="accent-[#C9922A]" checked={!!profileForm.is_members_only} onChange={e => setProfileForm(p => ({ ...p, is_members_only: e.target.checked }))} />
                      <span className="text-[12px] font-bold">Members Only</span>
                    </label>
                    <div><label className={lbl}>Annual Fee (R)</label><input type="number" className={inp} value={profileForm.membership_fee || ''} onChange={e => setProfileForm(p => ({ ...p, membership_fee: parseFloat(e.target.value) }))} /></div>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className={sec}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Additional <span className="text-[#C9922A]">Information</span></h2>
                <textarea className={`${inp} resize-none`} rows={4} value={profileForm.additional_info || ''} onChange={e => setProfileForm(p => ({ ...p, additional_info: e.target.value }))} placeholder="Parking, ammo sales, range rules, safety requirements, what to bring..." />
              </div>

              <div className="flex items-center gap-4 pb-4">
                <button onClick={handleProfileSave} disabled={profileSaving}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
                {profileMsg && <span className={`text-[12px] font-bold ${profileMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{profileMsg}</span>}
              </div>
            </div>
          )}

          {/* ── MEMBERS ── */}
          {activeTab === 'members' && (
            <div className={`${sec} max-w-2xl`}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4"><span className="text-[#C9922A]">Members</span></h2>
              <div className="border-2 border-dashed border-white/10 rounded-sm p-10 text-center">
                <p className="text-3xl mb-3">👥</p>
                <p className="text-[#8A8E99] text-[13px]">Member management coming in the next release</p>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div className={`${sec} max-w-lg`}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4"><span className="text-[#C9922A]">Settings</span></h2>
              <div className="space-y-3">
                {[['Account Email', club?.email || '—'], ['Account Type', FL], ['Status', club?.status || '—']].map(([label, val]) => (
                  <div key={label} className="bg-[#0D0F13] border border-white/10 rounded-sm p-4">
                    <div className={lbl}>{label}</div>
                    <p className="text-[13px] font-bold">{val}</p>
                  </div>
                ))}
                <button onClick={handleSignOut} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-[12px] font-black uppercase tracking-widest transition-all mt-2">Sign Out</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
