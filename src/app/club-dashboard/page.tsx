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

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ShootDay {
  day: string;
  discipline: string;
  time: string;
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
  shoot_days?: ShootDay[];
  disciplines?: string[];
}

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

  // Shoot days state
  const [shootDays, setShootDays] = useState<ShootDay[]>([]);
  const [shootDaysSaving, setShootDaysSaving] = useState(false);
  const [shootDaysMsg, setShootDaysMsg] = useState('');

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
    setShootDays(data.shoot_days?.length ? data.shoot_days : [{ day: '', discipline: '', time: '', fee: '', notes: '' }]);
    setLoading(false);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/dealer/login'); };

  const uploadImage = async (file: File, path: string) => {
    const ext = file.name.split('.').pop();
    const filePath = `${path}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('club-images').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('club-images').getPublicUrl(filePath);
    return publicUrl;
  };

  const handleProfileSave = async () => {
    if (!club) return;
    setProfileSaving(true); setProfileMsg('');
    try {
      let logo_url = profileForm.logo_url || '';
      let cover_url = profileForm.cover_url || '';
      if (logoFile) logo_url = await uploadImage(logoFile, 'logos');
      if (coverFile) cover_url = await uploadImage(coverFile, 'covers');
      const { error } = await supabase.from('clubs').update({
        name: profileForm.name, description: profileForm.description,
        province: profileForm.province, city: profileForm.city, address: profileForm.address,
        phone: profileForm.phone, email: profileForm.email, website: profileForm.website,
        is_members_only: profileForm.is_members_only, membership_fee: profileForm.membership_fee,
        booking_required: profileForm.booking_required, range_officer_on_duty: profileForm.range_officer_on_duty,
        public_shoot_days: profileForm.public_shoot_days, lane_count: profileForm.lane_count,
        max_distance_m: profileForm.max_distance_m, covered_lanes: profileForm.covered_lanes,
        disciplines: profileForm.disciplines, logo_url, cover_url,
      }).eq('id', club.id);
      if (error) throw error;
      setClub({ ...club, ...profileForm, logo_url, cover_url });
      setProfileMsg('✓ Profile saved successfully');
    } catch (err: any) {
      setProfileMsg('✗ ' + (err.message || 'Failed to save'));
    } finally { setProfileSaving(false); }
  };

  const handleShootDaysSave = async () => {
    if (!club) return;
    setShootDaysSaving(true); setShootDaysMsg('');
    try {
      const { error } = await supabase.from('clubs').update({ shoot_days: shootDays.filter(d => d.day) }).eq('id', club.id);
      if (error) throw error;
      setShootDaysMsg('✓ Shoot days saved');
    } catch (err: any) {
      setShootDaysMsg('✗ ' + (err.message || 'Failed to save'));
    } finally { setShootDaysSaving(false); }
  };

  const addShootDay = () => setShootDays(p => [...p, { day: '', discipline: '', time: '', fee: '', notes: '' }]);
  const removeShootDay = (i: number) => setShootDays(p => p.filter((_, idx) => idx !== i));
  const updateSD = (i: number, f: string, v: string) => setShootDays(p => p.map((d, idx) => idx === i ? { ...d, [f]: v } : d));
  const toggleDisc = (d: string) => {
    const curr = profileForm.disciplines || [];
    setProfileForm(p => ({ ...p, disciplines: curr.includes(d) ? curr.filter(x => x !== d) : [...curr, d] }));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isRange = club?.facility_type === 'range';
  const FL = isRange ? 'Range' : 'Club';
  const FI = isRange ? '🎯' : '🏛️';

  const nav = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'profile', label: 'Edit Profile', icon: '✏️' },
    { id: 'shootdays', label: isRange ? 'Sessions' : 'Shoot Days', icon: '📅' },
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
          <Link href="/">
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-2xl font-black tracking-tighter uppercase text-[#F0EDE8]">
              GUN <span className="text-[#C9922A]">X</span>
            </span>
          </Link>
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
          <Link href={`/clubs/${club?.slug}`}
            className="block text-center px-3 py-2 bg-white/5 hover:bg-white/10 rounded-sm text-[11px] font-black uppercase tracking-widest transition-colors">
            View Public Page
          </Link>
          <button onClick={handleSignOut}
            className="w-full text-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-[11px] font-black uppercase tracking-widest transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
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
              {club?.cover_url && (
                <div className="w-full h-[150px] rounded-sm overflow-hidden border border-white/5">
                  <img src={club.cover_url} alt="" className="w-full h-full object-cover opacity-50" />
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Type', value: isRange ? 'Shooting Range' : 'Shooting Club', icon: FI },
                  { label: 'Province', value: club?.province || '—', icon: '📍' },
                  { label: isRange ? 'Lanes' : 'Public Shoots', value: isRange ? (club?.lane_count?.toString() || '—') : (club?.public_shoot_days ? 'Yes' : 'No'), icon: '🎯' },
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Covered Lanes', value: club?.covered_lanes ? 'Yes' : 'No', icon: '🏗️' },
                    { label: 'Booking Required', value: club?.booking_required ? 'Yes' : 'No', icon: '📋' },
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

              <div className={sec}>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">
                    {isRange ? 'Public Sessions' : 'Shoot Days'} <span className="text-[#C9922A]">Schedule</span>
                  </h2>
                  <button onClick={() => setActiveTab('shootdays')} className="text-[10px] font-black uppercase tracking-widest text-[#C9922A] hover:brightness-125">Manage →</button>
                </div>
                {club?.shoot_days?.filter(d => d.day).length ? (
                  <div className="space-y-2">
                    {club.shoot_days.filter(d => d.day).map((sd, i) => (
                      <div key={i} className="flex items-center gap-4 bg-[#0D0F13] border border-white/5 rounded-sm px-4 py-3">
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="w-20 text-[#C9922A] font-black uppercase text-[13px] flex-shrink-0">{sd.day}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold">{sd.discipline || '—'}</p>
                          <p className="text-[11px] text-[#8A8E99]">{sd.time || 'Time TBC'}{sd.notes ? ` · ${sd.notes}` : ''}</p>
                        </div>
                        {sd.fee && <span className="text-[#C9922A] font-black text-[13px]">R{sd.fee}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-sm">
                    <p className="text-[#8A8E99] text-[13px] mb-3">No shoot days added yet</p>
                    <button onClick={() => setActiveTab('shootdays')} className="text-[11px] font-black uppercase tracking-widest text-[#C9922A]">+ Add Shoot Days</button>
                  </div>
                )}
              </div>

              <div className={sec}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Contact <span className="text-[#C9922A]">Info</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                  <div><div className={lbl}>Email</div><p>{club?.email || '—'}</p></div>
                  <div><div className={lbl}>Phone</div><p>{club?.phone || '—'}</p></div>
                  <div><div className={lbl}>Website</div><p>{club?.website || '—'}</p></div>
                </div>
                {club?.description && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className={lbl}>About</div>
                    <p className="text-[13px] text-[#8A8E99] leading-relaxed">{club.description}</p>
                  </div>
                )}
              </div>
            </>
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
                      <div className={`h-[130px] border-2 border-dashed rounded-sm overflow-hidden flex items-center justify-center transition-colors ${logoPreview ? 'border-[#C9922A]/40' : 'border-white/15 hover:border-[#C9922A]/30'}`}>
                        {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-cover" /> : <div className="text-center"><p className="text-3xl mb-1">{FI}</p><p className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest">Upload Logo</p></div>}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }}} />
                    </label>
                  </div>
                  <div>
                    <div className={lbl}>Cover Photo</div>
                    <label className="block cursor-pointer">
                      <div className={`h-[130px] border-2 border-dashed rounded-sm overflow-hidden flex items-center justify-center transition-colors ${coverPreview ? 'border-[#C9922A]/40' : 'border-white/15 hover:border-[#C9922A]/30'}`}>
                        {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> : <div className="text-center"><p className="text-3xl mb-1">🖼️</p><p className="text-[10px] text-[#8A8E99] font-bold uppercase tracking-widest">Upload Cover</p></div>}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }}} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className={sec}>
                <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">{FL} <span className="text-[#C9922A]">Information</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={lbl}>{FL} Name</label>
                    <input className={inp} value={profileForm.name || ''} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={lbl}>Description</label>
                    <textarea className={`${inp} resize-none`} rows={4} value={profileForm.description || ''} onChange={e => setProfileForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Province</label>
                    <select className={inp} value={profileForm.province || ''} onChange={e => setProfileForm(p => ({ ...p, province: e.target.value }))}>
                      {PROVINCES.map(pv => <option key={pv}>{pv}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>City / Town</label>
                    <input className={inp} value={profileForm.city || ''} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={lbl}>Address</label>
                    <input className={inp} value={profileForm.address || ''} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Phone</label>
                    <input className={inp} value={profileForm.phone || ''} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className={lbl}>Email</label>
                    <input className={inp} type="email" value={profileForm.email || ''} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={lbl}>Website</label>
                    <input className={inp} value={profileForm.website || ''} onChange={e => setProfileForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                  </div>
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

              {/* Range specific */}
              {isRange && (
                <div className={sec}>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Range <span className="text-[#C9922A]">Facilities</span></h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={lbl}>Number of Lanes</label>
                      <input type="number" className={inp} value={profileForm.lane_count || ''} onChange={e => setProfileForm(p => ({ ...p, lane_count: parseInt(e.target.value) }))} />
                    </div>
                    <div>
                      <label className={lbl}>Max Distance (m)</label>
                      <input type="number" className={inp} value={profileForm.max_distance_m || ''} onChange={e => setProfileForm(p => ({ ...p, max_distance_m: parseInt(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[['covered_lanes','Covered Lanes'],['booking_required','Booking Required'],['range_officer_on_duty','Range Officer On Duty'],['public_shoot_days','Hosts Public Shoot Days'],['is_members_only','Members Only']].map(([f, label]) => (
                      <label key={f} className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 hover:border-[#C9922A]/30 transition-colors">
                        <input type="checkbox" className="accent-[#C9922A]" checked={!!(profileForm as any)[f]} onChange={e => setProfileForm(p => ({ ...p, [f]: e.target.checked }))} />
                        <span className="text-[12px] font-bold">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!isRange && (
                <div className={sec}>
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase mb-4">Membership & <span className="text-[#C9922A]">Fees</span></h2>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5">
                      <input type="checkbox" className="accent-[#C9922A]" checked={!!profileForm.is_members_only} onChange={e => setProfileForm(p => ({ ...p, is_members_only: e.target.checked }))} />
                      <span className="text-[12px] font-bold">Members Only</span>
                    </label>
                    <div>
                      <label className={lbl}>Annual Fee (R)</label>
                      <input type="number" className={inp} value={profileForm.membership_fee || ''} onChange={e => setProfileForm(p => ({ ...p, membership_fee: parseFloat(e.target.value) }))} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button onClick={handleProfileSave} disabled={profileSaving}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
                {profileMsg && <span className={`text-[12px] font-bold ${profileMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{profileMsg}</span>}
              </div>
            </div>
          )}

          {/* ── SHOOT DAYS ── */}
          {activeTab === 'shootdays' && (
            <div className="max-w-3xl space-y-5">
              <div className={sec}>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">
                      {isRange ? 'Public Shoot' : 'Shoot'} <span className="text-[#C9922A]">{isRange ? 'Sessions' : 'Days'}</span>
                    </h2>
                    <p className="text-[11px] text-[#8A8E99] mt-0.5">{isRange ? 'Set your public shooting sessions for visitors' : 'Schedule your club shoot days for members'}</p>
                  </div>
                  <button onClick={addShootDay} className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 px-3 py-1.5 rounded-sm hover:bg-[#C9922A]/10 transition-all">+ Add Day</button>
                </div>
                <div className="space-y-3">
                  {shootDays.map((sd, i) => (
                    <div key={i} className="bg-[#0D0F13] border border-white/10 rounded-sm p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className={lbl}>Day</label>
                          <select className={inp} value={sd.day} onChange={e => updateSD(i, 'day', e.target.value)}>
                            <option value="">Select day...</option>
                            {DAYS_OF_WEEK.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Discipline</label>
                          <input className={inp} value={sd.discipline} placeholder="e.g. IPSC" onChange={e => updateSD(i, 'discipline', e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>Time</label>
                          <input className={inp} value={sd.time} placeholder="e.g. 08:00–13:00" onChange={e => updateSD(i, 'time', e.target.value)} />
                        </div>
                        <div>
                          <label className={lbl}>Fee (R)</label>
                          <input type="number" className={inp} value={sd.fee} placeholder="150" onChange={e => updateSD(i, 'fee', e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={lbl}>Notes</label>
                          <input className={inp} value={sd.notes} placeholder="e.g. Pre-registration required" onChange={e => updateSD(i, 'notes', e.target.value)} />
                        </div>
                      </div>
                      {shootDays.length > 1 && (
                        <button onClick={() => removeShootDay(i)} className="text-[10px] text-red-400 font-black uppercase tracking-widest hover:text-red-300">Remove</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <button onClick={handleShootDaysSave} disabled={shootDaysSaving}
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50">
                    {shootDaysSaving ? 'Saving...' : 'Save Schedule'}
                  </button>
                  {shootDaysMsg && <span className={`text-[12px] font-bold ${shootDaysMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{shootDaysMsg}</span>}
                </div>
              </div>

              {shootDays.some(d => d.day) && (
                <div className={sec}>
                  <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase text-[#8A8E99] mb-3">Preview</h3>
                  <div className="space-y-2">
                    {shootDays.filter(d => d.day).map((sd, i) => (
                      <div key={i} className="flex items-center gap-4 bg-[#0D0F13] border border-white/5 rounded-sm px-4 py-3">
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="w-20 text-[#C9922A] font-black uppercase text-[13px] flex-shrink-0">{sd.day}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold">{sd.discipline || '—'}</p>
                          <p className="text-[11px] text-[#8A8E99]">{sd.time || 'Time TBC'}{sd.notes ? ` · ${sd.notes}` : ''}</p>
                        </div>
                        {sd.fee && <span className="text-[#C9922A] font-black text-[13px]">R{sd.fee}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                {[['Account Email', club?.email || '—'],['Account Type', FL],['Status', club?.status || '—']].map(([label, val]) => (
                  <div key={label} className="bg-[#0D0F13] border border-white/10 rounded-sm p-4">
                    <div className={lbl}>{label}</div>
                    <p className="text-[13px] font-bold">{val}</p>
                  </div>
                ))}
                <button onClick={handleSignOut}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-sm text-red-400 text-[12px] font-black uppercase tracking-widest transition-all mt-2">
                  Sign Out
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
