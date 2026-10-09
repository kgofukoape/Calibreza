'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { recordConsent } from '@/lib/auth';
import { LEGAL_DOCUMENTS } from '@/lib/legal';

// --- SHOOTING CLUB APPLICATION -----------------------------------------------
// Clubs list for free (agreed Oct 2026) but must be lawful: either an
// SAPS-accredited association (Firearms Control Act s8, Reg 4), or a club
// affiliated to an accredited body (CHASA, SADPA, SAPSA and so on), with
// proof. Plus proof the club exists as an entity (CIPC registration or a
// club constitution) and a named responsible person.
//
// Shoot days, membership options and photos are added from the dashboard
// after approval, so the application stays short.

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const DISCIPLINES = [
  'IPSC', 'IDPA', 'Practical Shooting', 'Target Shooting', 'Hunting',
  'Long Range', 'PRS', 'Benchrest', 'Field Shooting', 'Skeet', 'Trap',
  'Sporting Clays', 'Air Gun', 'Airsoft',
];

const ASSOCIATIONS = [
  { code: 'CHASA', full: 'Confederation of Hunters Associations of SA' },
  { code: 'SADPA', full: 'SA Defensive Pistol Association' },
  { code: 'SAPSA', full: 'SA Practical Shooting Association (IPSC)' },
  { code: 'NATSHOOT', full: 'National Shooting Sport Foundation of SA' },
  { code: 'SAHGCA', full: 'SA Hunters and Game Conservation Association' },
  { code: 'NHSA', full: 'National Hunting and Shooting Association' },
];

const MAX_DOC_BYTES = 5 * 1024 * 1024;
const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png';

export default function ClubApplyPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [personal, setPersonal] = useState(false);
  const [existing, setExisting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [accreditationDoc, setAccreditationDoc] = useState<File | null>(null);
  const [affiliationDoc, setAffiliationDoc] = useState<File | null>(null);
  const [cipcDoc, setCipcDoc] = useState<File | null>(null);
  const [constitutionDoc, setConstitutionDoc] = useState<File | null>(null);

  const [f, setF] = useState({
    name: '', description: '', founded_year: '',
    disciplines: [] as string[],
    address: '', lat: null as number | null, lng: null as number | null,
    province: '', city: '', phone: '', email: '',
    website: '', facebook_url: '', instagram_url: '', whatsapp: '',
    compliance_status: '' as '' | 'accredited' | 'affiliated',
    accreditation_number: '',
    associations: [] as string[],
    other_association: '',
    rp_name: '', rp_role: '', rp_email: '', rp_phone: '',
    shoots_at: '' as '' | 'own' | 'other',
    range_setting: '', shoots_at_range: '',
    cipc_number: '', valid_until: '',
  });

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const toggle = (k: 'disciplines' | 'associations', v: string) =>
    setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users').select('account_type').eq('id', user.id).maybeSingle();
        if (profile?.account_type === 'personal') {
          setPersonal(true);
          setChecking(false);
          return;
        }
        setUserId(user.id);
        // Any club or range already on this account counts.
        const [{ data: sc }, { data: rg }] = await Promise.all([
          supabase.from('shooting_clubs').select('status').eq('user_id', user.id).maybeSingle(),
          supabase.from('clubs').select('status').eq('user_id', user.id).maybeSingle(),
        ]);
        if (sc || rg) setExisting((sc || rg)!.status);
        const meta = user.user_metadata || {};
        setF((p) => ({
          ...p,
          email: p.email || user.email || '',
          rp_name: meta.responsible_person || '',
          rp_email: meta.responsible_person_email || '',
        }));
      }
      setChecking(false);
    })();
  }, []);

  const uploadDoc = async (file: File, kind: string, uid: string) => {
    if (file.size > MAX_DOC_BYTES) throw new Error(`${file.name} is larger than 5MB.`);
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const path = `${uid}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('business-documents').upload(path, file, { upsert: false });
    if (error) throw new Error(error.message);
    return path; // private bucket: admin opens it with a signed link
  };

  const uploadImage = async (file: File, folder: string) => {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('club-images').upload(path, file);
    if (error) throw new Error(error.message);
    return supabase.storage.from('club-images').getPublicUrl(path).data.publicUrl;
  };

  const problems = (): string[] => {
    const p: string[] = [];
    if (!f.name.trim()) p.push('Club name');
    if (f.description.trim().length < 20) p.push('A description of at least 20 characters');
    if (f.disciplines.length === 0) p.push('At least one discipline');
    if (!f.address.trim() || !f.province || !f.city.trim()) p.push('Address, province and city');
    if (!f.phone.trim() || !f.email.trim()) p.push('Club phone and email');
    if (!f.compliance_status) p.push('Accredited or affiliated');
    if (f.compliance_status === 'accredited') {
      if (!f.accreditation_number.trim()) p.push('SAPS accreditation number');
      if (!accreditationDoc) p.push('Accreditation certificate');
    }
    if (f.compliance_status === 'affiliated') {
      if (f.associations.length === 0 && !f.other_association.trim()) p.push('The association you are affiliated to');
      if (!affiliationDoc) p.push('Affiliation letter for this year');
    }
    if (!cipcDoc && !constitutionDoc) p.push('CIPC registration or club constitution (at least one)');
    if (!f.rp_name.trim() || !f.rp_role.trim() || !f.rp_email.trim() || !f.rp_phone.trim()) {
      p.push('Responsible person: name, role, email and phone');
    }
    if (!f.shoots_at) p.push('Where the club shoots');
    if (cipcDoc && !f.cipc_number.trim()) p.push('CIPC registration number');
    if (!f.valid_until) p.push('Valid until date for your affiliation or accreditation');
    else if (f.valid_until < new Date().toISOString().slice(0, 10)) p.push('A valid until date that has not passed');
    if (f.shoots_at === 'own' && !f.range_setting) p.push('Indoor or outdoor range');
    if (f.shoots_at === 'other' && !f.shoots_at_range.trim()) p.push('The range you use');
    if (!acceptTerms || !acceptPrivacy) p.push('Accept the Terms and Privacy Policy');
    return p;
  };

  const submit = async () => {
    setErr('');
    const missing = problems();
    if (missing.length) {
      setErr('Still needed: ' + missing.join('; ') + '.');
      return;
    }
    if (!userId) {
      setErr('Your session has expired. Please sign in again.');
      return;
    }
    setBusy(true);
    try {
      const accreditation_cert_url = f.compliance_status === 'accredited' && accreditationDoc
        ? await uploadDoc(accreditationDoc, 'accreditation-certificate', userId) : null;
      const affiliation_letter_url = f.compliance_status === 'affiliated' && affiliationDoc
        ? await uploadDoc(affiliationDoc, 'affiliation-letter', userId) : null;
      const cipcPath = cipcDoc ? await uploadDoc(cipcDoc, 'cipc-registration', userId) : null;
      const constitutionPath = constitutionDoc
        ? await uploadDoc(constitutionDoc, 'club-constitution', userId) : null;
      const logo_url = logo ? await uploadImage(logo, 'logos') : null;
      const cover_url = cover ? await uploadImage(cover, 'covers') : null;

      const associations = [...f.associations];
      if (f.other_association.trim()) associations.push(`Other: ${f.other_association.trim()}`);

      const slug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { error } = await supabase.from('shooting_clubs').insert({
        user_id: userId,
        name: f.name.trim(),
        slug,
        description: f.description.trim(),
        founded_year: f.founded_year ? parseInt(f.founded_year, 10) : null,
        disciplines: f.disciplines,
        address: f.address.trim(),
        lat: f.lat,
        lng: f.lng,
        province: f.province,
        city: f.city.trim(),
        phone: f.phone.trim(),
        email: f.email.trim(),
        website: f.website.trim() || null,
        facebook_url: f.facebook_url.trim() || null,
        instagram_url: f.instagram_url.trim() || null,
        whatsapp: f.whatsapp.trim() || null,
        logo_url,
        cover_url,
        compliance_status: f.compliance_status,
        accreditation_number: f.compliance_status === 'accredited' ? f.accreditation_number.trim() : null,
        accreditation_cert_url,
        affiliation_letter_url,
        associations,
        cipc_number: f.cipc_number.trim() || null,
        compliance_valid_until: f.valid_until,
        business_registration_url: cipcPath,
        constitution_url: constitutionPath,
        responsible_person_name: f.rp_name.trim(),
        responsible_person_role: f.rp_role.trim(),
        responsible_person_email: f.rp_email.trim(),
        responsible_person_phone: f.rp_phone.trim(),
        shoots_at: f.shoots_at,
        range_setting: f.shoots_at === 'own' ? f.range_setting : null,
        shoots_at_range: f.shoots_at === 'other' ? f.shoots_at_range.trim() : null,
      });
      if (error) throw new Error(error.message);

      const ok = await recordConsent('club_application', false, f.name.trim());
      if (!ok) console.error('[clubs/apply] consent not recorded for', f.name);

      try {
        const { data: s } = await supabase.auth.getSession();
        await fetch('/api/applications/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${s.session?.access_token || ''}`,
          },
          body: JSON.stringify({ kind: 'shooting_club' }),
        });
      } catch (e) {
        console.error('Notify failed (non-blocking):', e);
      }

      router.push('/business/pending');
    } catch (e: any) {
      setErr(e?.message || 'Could not submit. Please try again.');
      setBusy(false);
    }
  };

  // --- UI helpers ---------------------------------------------------------------
  const input = 'w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60';
  const label = 'block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5';
  const section = 'bg-[#13151A] border border-white/5 rounded-sm p-5 md:p-6';
  const chip = (on: boolean) =>
    'px-3 py-2 rounded-sm text-[12px] font-bold border transition-all ' +
    (on ? 'bg-[#C9922A] text-black border-[#C9922A]' : 'bg-[#0D0F13] text-[#8A8E99] border-white/10 hover:text-[#F0EDE8]');
  const choice = (on: boolean) =>
    'flex-1 text-left px-4 py-3 rounded-sm border text-[13px] transition-all ' +
    (on ? 'border-[#C9922A] bg-[#C9922A]/10 text-[#F0EDE8]' : 'border-white/10 bg-[#0D0F13] text-[#8A8E99]');
  const heading = (n: number, t: string) => (
    <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      className="text-xl font-black uppercase mb-4">
      <span className="text-[#C9922A]">{n}.</span> {t}
    </h2>
  );
  const fileField = (text: string, file: File | null, onPick: (x: File | null) => void, accept = DOC_ACCEPT) => (
    <label className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 cursor-pointer hover:border-[#C9922A]/50">
      <span className="text-[13px] text-[#F0EDE8]">{text}</span>
      <span className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] break-all">
        {file ? file.name : 'Choose file'}
      </span>
      <input type="file" accept={accept} className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] || null)} />
    </label>
  );

  const gate = (title: React.ReactNode, body: React.ReactNode) => (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-[560px] w-full bg-[#13151A] border border-white/5 rounded-sm p-8 sm:p-10 text-center">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl font-black uppercase mb-4">{title}</h1>
          {body}
        </div>
      </div>
    </div>
  );

  if (checking) {
    return gate('Loading', <p className="text-[#8A8E99] text-sm">One moment...</p>);
  }
  if (personal) {
    return gate(<>Business <span className="text-[#C9922A]">account</span> needed</>, (
      <>
        <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
          You are signed in with a personal account. A club listing needs its own business
          account, so the club owns it rather than one member.
        </p>
        <Link href="/business/register" className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm">
          Register a club account
        </Link>
      </>
    ));
  }
  if (!userId) {
    return gate(<>Business <span className="text-[#C9922A]">account</span> needed</>, (
      <>
        <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
          A club listing is owned by a business account that your committee can share.
          Listing your club on Gun X is free.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/business/register" className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-4 rounded-sm">
            Register
          </Link>
          <Link href="/business/login" className="flex-1 border border-white/10 font-black uppercase tracking-widest text-[13px] px-6 py-4 rounded-sm">
            Sign in
          </Link>
        </div>
      </>
    ));
  }
  if (existing) {
    return gate(<>Application <span className="text-[#C9922A]">on file</span></>, (
      <>
        <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
          This account already has a club or range on file. To change something, email{' '}
          <a href="mailto:support@gunx.co.za" className="text-[#C9922A]">support@gunx.co.za</a>.
        </p>
        <Link href="/business/pending" className="inline-block border border-white/10 font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm">
          View my application
        </Link>
      </>
    ));
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />
      <main className="max-w-[760px] mx-auto w-full px-4 py-8 md:py-12 flex flex-col gap-5">
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl font-black uppercase">
            List your <span className="text-[#C9922A]">club</span>
          </h1>
          <p className="text-[#8A8E99] text-sm mt-2 leading-relaxed">
            Free for shooting clubs. Your club must be SAPS-accredited or affiliated to an
            accredited association, and you will need to upload proof. We review every
            application, usually within 2 to 3 business days.
          </p>
        </div>

        {/* 1. ABOUT */}
        <div className={section}>
          {heading(1, 'About the club')}
          <div className="flex flex-col gap-4">
            <div>
              <label className={label}>Club name *</label>
              <input className={input} value={f.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className={label}>What the club is about *</label>
              <textarea className={input} rows={5} value={f.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Who you are, what you shoot, who is welcome, what makes the club special." />
            </div>
            <div>
              <label className={label}>Disciplines *</label>
              <div className="flex flex-wrap gap-2">
                {DISCIPLINES.map((d) => (
                  <button type="button" key={d} onClick={() => toggle('disciplines', d)} className={chip(f.disciplines.includes(d))}>{d}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={label}>Year founded</label>
                <input className={input} inputMode="numeric" maxLength={4} value={f.founded_year}
                  onChange={(e) => set('founded_year', e.target.value.replace(/[^0-9]/g, ''))} />
              </div>
              <div className="sm:col-span-2 flex flex-col gap-2">
                {fileField('Logo (optional)', logo, setLogo, 'image/*')}
                {fileField('Cover photo (optional)', cover, setCover, 'image/*')}
              </div>
            </div>
          </div>
        </div>

        {/* 2. LOCATION AND CONTACT */}
        <div className={section}>
          {heading(2, 'Location and contact')}
          <div className="flex flex-col gap-4">
            <div>
              <label className={label}>Address * (choose from the suggestions)</label>
              <AddressAutocomplete
                value={f.address}
                onChange={(v: string) => set('address', v)}
                onSelect={(r) => setF((p) => ({
                  ...p, address: r.address, lat: r.lat, lng: r.lng,
                  city: r.city || p.city, province: r.province || p.province,
                }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Province *</label>
                <select className={input} value={f.province} onChange={(e) => set('province', e.target.value)}>
                  <option value="">Select</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>City or town *</label>
                <input className={input} value={f.city} onChange={(e) => set('city', e.target.value)} />
              </div>
              <div>
                <label className={label}>Club phone *</label>
                <input className={input} type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <label className={label}>Club email *</label>
                <input className={input} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div>
                <label className={label}>Website</label>
                <input className={input} value={f.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
              </div>
              <div>
                <label className={label}>WhatsApp</label>
                <input className={input} type="tel" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
              </div>
              <div>
                <label className={label}>Facebook page</label>
                <input className={input} value={f.facebook_url} onChange={(e) => set('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div>
                <label className={label}>Instagram</label>
                <input className={input} value={f.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMPLIANCE */}
        <div className={section}>
          {heading(3, 'Compliance')}
          <div className="flex flex-col gap-5">
            <div>
              <label className={label}>Your club is *</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" onClick={() => set('compliance_status', 'affiliated')} className={choice(f.compliance_status === 'affiliated')}>
                  <strong className="block text-[#F0EDE8]">Affiliated to an accredited association</strong>
                  Most clubs. Members get dedicated status through the association.
                </button>
                <button type="button" onClick={() => set('compliance_status', 'accredited')} className={choice(f.compliance_status === 'accredited')}>
                  <strong className="block text-[#F0EDE8]">An SAPS-accredited association</strong>
                  Accredited by SAPS in your own right.
                </button>
              </div>
            </div>

            {f.compliance_status === 'affiliated' && (
              <div className="flex flex-col gap-3">
                <label className={label}>Affiliated to *</label>
                <div className="flex flex-wrap gap-2">
                  {ASSOCIATIONS.map((a) => (
                    <button type="button" key={a.code} title={a.full}
                      onClick={() => toggle('associations', a.code)} className={chip(f.associations.includes(a.code))}>
                      {a.code}
                    </button>
                  ))}
                </div>
                <input className={input} value={f.other_association}
                  onChange={(e) => set('other_association', e.target.value)}
                  placeholder="Other accredited association (if not listed)" />
                {fileField('Affiliation letter or certificate for this year *', affiliationDoc, setAffiliationDoc)}
              </div>
            )}

            {f.compliance_status === 'accredited' && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className={label}>SAPS accreditation number *</label>
                  <input className={input} value={f.accreditation_number} onChange={(e) => set('accreditation_number', e.target.value)} />
                </div>
                {fileField('SAPS accreditation certificate *', accreditationDoc, setAccreditationDoc)}
              </div>
            )}

            {f.compliance_status && (
              <div>
                <label className={label}>
                  {f.compliance_status === 'affiliated' ? 'Affiliation letter valid until *' : 'Accreditation valid until *'}
                </label>
                <input type="date" className={input} value={f.valid_until}
                  onChange={(e) => set('valid_until', e.target.value)} />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <label className={label}>Proof the club exists * (upload one or both)</label>
              {fileField('CIPC registration certificate (company or NPC)', cipcDoc, setCipcDoc)}
              <input className={input} value={f.cipc_number} onChange={(e) => set('cipc_number', e.target.value)}
                placeholder="CIPC registration number, e.g. 2015/123456/08 (required with a CIPC certificate)" />
              {fileField('Signed club constitution (voluntary association)', constitutionDoc, setConstitutionDoc)}
            </div>

            <div>
              <label className={label}>Responsible person *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className={input} placeholder="Full name" value={f.rp_name} onChange={(e) => set('rp_name', e.target.value)} />
                <input className={input} placeholder="Role, e.g. Chairperson" value={f.rp_role} onChange={(e) => set('rp_role', e.target.value)} />
                <input className={input} type="email" placeholder="Email" value={f.rp_email} onChange={(e) => set('rp_email', e.target.value)} />
                <input className={input} type="tel" placeholder="Phone" value={f.rp_phone} onChange={(e) => set('rp_phone', e.target.value)} />
              </div>
            </div>
            <p className="text-[12px] text-[#8A8E99]">PDF, JPG or PNG, up to 5MB each. Documents are private and only seen by the Gun X team.</p>
          </div>
        </div>

        {/* 4. WHERE YOU SHOOT */}
        <div className={section}>
          {heading(4, 'Where you shoot')}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => set('shoots_at', 'own')} className={choice(f.shoots_at === 'own')}>
                <strong className="block text-[#F0EDE8]">We have our own range</strong>
              </button>
              <button type="button" onClick={() => set('shoots_at', 'other')} className={choice(f.shoots_at === 'other')}>
                <strong className="block text-[#F0EDE8]">We use another range</strong>
              </button>
            </div>
            {f.shoots_at === 'own' && (
              <select className={input} value={f.range_setting} onChange={(e) => set('range_setting', e.target.value)}>
                <option value="">Indoor or outdoor? *</option>
                <option value="outdoor">Outdoor</option>
                <option value="indoor">Indoor</option>
                <option value="both">Both</option>
              </select>
            )}
            {f.shoots_at === 'other' && (
              <input className={input} placeholder="Name of the range you use *" value={f.shoots_at_range}
                onChange={(e) => set('shoots_at_range', e.target.value)} />
            )}
          </div>
        </div>

        {/* AGREEMENTS */}
        <div className={section}>
          <div className="flex flex-col gap-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-[3px] w-4 h-4 accent-[#C9922A]" />
              <span className="text-[13px] text-[#8A8E99] leading-relaxed">
                I agree to the{' '}
                <Link href={LEGAL_DOCUMENTS.terms.href} target="_blank" className="text-[#C9922A]">Terms of Use</Link>{' '}
                and I am authorised to accept them for this club *
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)}
                className="mt-[3px] w-4 h-4 accent-[#C9922A]" />
              <span className="text-[13px] text-[#8A8E99] leading-relaxed">
                I have read the{' '}
                <Link href={LEGAL_DOCUMENTS.privacy.href} target="_blank" className="text-[#C9922A]">Privacy Policy</Link>{' '}
                and{' '}
                <Link href={LEGAL_DOCUMENTS.popi.href} target="_blank" className="text-[#C9922A]">POPI Act Notice</Link> *
              </span>
            </label>
          </div>
        </div>

        {err && <p className="text-[13px] text-[#E63946] leading-relaxed">{err}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={submit} disabled={busy}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-4 rounded-sm hover:brightness-110 disabled:opacity-50">
            {busy ? 'Submitting...' : 'Submit club application'}
          </button>
          <Link href="/clubs" className="px-8 py-4 border border-white/10 font-black uppercase tracking-widest text-[13px] rounded-sm text-center">
            Cancel
          </Link>
        </div>
      </main>
    </div>
  );
}
