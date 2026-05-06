'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const TABS = [
  { id: 'member', label: '👤 Member', desc: 'Private buyer or seller' },
  { id: 'dealer', label: '🏪 Dealer', desc: 'Licensed firearms dealer or retailer' },
  { id: 'service', label: '🔧 Service', desc: 'Gunsmith, instructor or service provider' },
  { id: 'club_range', label: '⊕ Club & Range', desc: 'Shooting club or range facility' },
];

const SERVICE_TYPES = [
  { id: 'gunsmith', label: 'Gunsmith' },
  { id: 'instructor', label: 'Firearms Instructor' },
  { id: 'storage', label: 'Firearm Storage' },
  { id: 'legal', label: 'Legal Services' },
  { id: 'other', label: 'Other' },
];

const CLUB_DISCIPLINES = [
  'IPSC / Practical Shooting', 'IDPA', 'Long Range / Precision',
  'Clay Shooting / Skeet', 'Hunting', '3-Gun', 'Air Gun',
  'Service Pistol', 'Benchrest', 'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const [tab, setTab] = useState('member');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [account, setAccount] = useState({
    email: '', password: '', confirmPassword: '', fullName: '', phone: '',
  });

  const [dealer, setDealer] = useState({
    business_name: '', saps_dealer_number: '', address: '', city: '',
    province: 'Gauteng', postal_code: '', website: '', description: '',
  });

  const [club, setClub] = useState({
    name: '', contact_email: '', phone: '', address: '', city: '',
    province: 'Gauteng', website: '', description: '', disciplines: [] as string[],
  });

  const [service, setService] = useState({
    name: '', type: 'gunsmith', city: '', province: 'Gauteng',
    phone: '', email: '', website: '', description: '',
  });

  const inputClass = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-2.5 text-[14px] text-[#F0EDE8] focus:outline-none focus:border-[#C9922A]/60 transition-colors placeholder-white/20";
  const labelClass = "block text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-1.5";

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setAccount({ ...account, [e.target.name]: e.target.value });
  const handleDealerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDealer({ ...dealer, [e.target.name]: e.target.value });
  const handleClubChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setClub({ ...club, [e.target.name]: e.target.value });
  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setService({ ...service, [e.target.name]: e.target.value });

  const toggleDiscipline = (d: string) =>
    setClub(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(d)
        ? prev.disciplines.filter(x => x !== d)
        : [...prev.disciplines, d],
    }));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (account.password !== account.confirmPassword) { setError('Passwords do not match'); return; }
    if (account.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (tab === 'member') { handleMemberSubmit(); return; }
    setStep(2);
  };

  const handleMemberSubmit = async () => {
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { full_name: account.fullName, phone: account.phone } },
      });
      if (authError) throw authError;
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: { full_name: account.fullName } },
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error('Failed to create account');

      if (tab === 'dealer') {
        const slug = dealer.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const { error: e } = await supabase.from('dealers').insert({
          user_id: userId, business_name: dealer.business_name, slug,
          email: account.email, phone: account.phone,
          saps_dealer_number: dealer.saps_dealer_number,
          address: dealer.address, city: dealer.city, province: dealer.province,
          postal_code: dealer.postal_code, website: dealer.website,
          description: dealer.description, status: 'pending', subscription_tier: 'free',
        });
        if (e) throw e;
      } else if (tab === 'club' || tab === 'range') {
        const slug = club.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const { error: e } = await supabase.from('clubs').insert({
          name: club.name, slug, email: club.contact_email || account.email,
          phone: club.phone || account.phone, address: club.address,
          city: club.city, province: club.province, website: club.website,
          description: club.description, disciplines: club.disciplines,
          is_range: tab === 'range', status: 'pending', is_verified: false,
        });
        if (e) throw e;
      } else if (tab === 'service') {
        const slug = service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const { error: e } = await supabase.from('services').insert({
          name: service.name, slug, type: service.type,
          city: service.city, province: service.province,
          phone: service.phone || account.phone, email: service.email || account.email,
          website: service.website, description: service.description,
          status: 'pending', is_verified: false,
        });
        if (e) throw e;
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const tabLabel = TABS.find(t => t.id === tab)?.label || '';

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <div className="max-w-[720px] mx-auto px-4 py-10 md:py-16">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center justify-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Register</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-2">
            Join <span className="text-[#C9922A]">Gun X</span>
          </h1>
          <p className="text-[#8A8E99] text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-[#C9922A] hover:brightness-125 font-bold">Sign in</Link>
          </p>
        </div>

        {/* SUCCESS SCREEN */}
        {step === 3 ? (
          <div className="bg-[#13151A] border border-[#10B981]/30 rounded-sm p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl font-black uppercase mb-3">
              {tab === 'member' ? 'Welcome to Gun X!' : 'Application Submitted!'}
            </h2>
            <p className="text-[#8A8E99] text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              {tab === 'member'
                ? 'Your account has been created. Check your email to confirm your address then sign in.'
                : 'Your application has been received. Our team will review it within 1–2 business days and contact you via email.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login"
                className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
                Sign In
              </Link>
              <Link href="/"
                className="border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:bg-white/5 transition-all">
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* STEP INDICATOR — only for non-member tabs */}
            {tab !== 'member' && (
              <div className="flex items-center gap-3 mb-8">
                {[1, 2].map(s => (
                  <React.Fragment key={s}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black transition-all ${
                      step >= s ? 'bg-[#C9922A] text-black' : 'bg-white/10 text-[#8A8E99]'
                    }`}>{step > s ? '✓' : s}</div>
                    {s < 2 && (
                      <div className={`flex-1 h-[2px] transition-all ${step > s ? 'bg-[#C9922A]' : 'bg-white/10'}`} />
                    )}
                  </React.Fragment>
                ))}
                <span className="text-[11px] text-[#8A8E99] uppercase tracking-widest font-bold ml-2">
                  {step === 1 ? 'Account Details' : 'Business Details'}
                </span>
              </div>
            )}

            {/* STEP 1 — ACCOUNT + TAB SELECTOR */}
            {step === 1 && (
              <>
                {/* TAB SELECTOR */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {TABS.map(t => (
                    <button key={t.id} type="button" onClick={() => { setTab(t.id); setError(''); }}
                      className={`p-3 rounded-sm border text-left transition-all ${
                        tab === t.id
                          ? 'bg-[#C9922A]/10 border-[#C9922A]/50 text-[#C9922A]'
                          : 'bg-[#13151A] border-white/10 text-[#8A8E99] hover:border-white/20 hover:text-white'
                      }`}>
                      <div className="text-[12px] font-black uppercase tracking-wider">{t.label}</div>
                      <div className="text-[10px] mt-0.5 leading-tight opacity-70">{t.desc}</div>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleStep1} className="bg-[#13151A] border border-white/5 rounded-sm p-6 space-y-4">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    className="text-2xl font-black uppercase mb-2">
                    Account <span className="text-[#C9922A]">Details</span>
                  </h2>

                  {/* Context banner per tab */}
                  {tab === 'member' && (
                    <div className="bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm p-3 text-[12px] text-[#C9922A]">
                      ℹ️ Create a free account to post listings, save favourites and contact sellers.
                    </div>
                  )}
                  {tab === 'dealer' && (
                    <div className="bg-[#4CC9F0]/10 border border-[#4CC9F0]/20 rounded-sm p-3 text-[12px] text-[#4CC9F0]">
                      🏪 Dealer accounts require a valid SAPS dealer number. Applications reviewed within 1–2 business days.
                    </div>
                  )}
                  {tab === 'club_range' && (
                    <div className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/20 rounded-sm p-4">
                      <p className="text-[12px] text-[#2A9C6E] font-bold mb-3">⊕ Clubs and ranges have dedicated listing forms:</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <a href="/clubs/apply"
                          className="flex-1 bg-[#2A9C6E] text-white font-black uppercase tracking-widest text-[12px] px-4 py-3 rounded-sm hover:brightness-110 transition-all text-center">
                          ⊕ List a Shooting Club
                        </a>
                        <a href="/clubs/range-apply"
                          className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-4 py-3 rounded-sm hover:brightness-110 transition-all text-center">
                          🎯 List a Shooting Range
                        </a>
                      </div>
                      <p className="text-[11px] text-[#8A8E99] mt-3">No account required — submit your application and our team will contact you within 48 hours.</p>
                    </div>
                  )}
                  {tab === 'club' && (
                    <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-sm p-3 text-[12px] text-[#10B981]">
                      ⊕ Register your club to appear in the Clubs & Ranges directory and post job listings.
                    </div>
                  )}
                  {tab === 'range' && (
                    <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-sm p-3 text-[12px] text-[#10B981]">
                      🎯 Register your shooting range to be listed in our directory and connect with local shooters.
                    </div>
                  )}
                  {tab === 'service' && (
                    <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-sm p-3 text-[12px] text-[#8B5CF6]">
                      🔧 Register as a service provider — gunsmiths, instructors, storage facilities and more.
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-sm">{error}</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Full Name <span className="text-red-400">*</span></label>
                      <input name="fullName" value={account.fullName} onChange={handleAccountChange} required
                        className={inputClass} placeholder="Your full name" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Email Address <span className="text-red-400">*</span></label>
                      <input name="email" type="email" value={account.email} onChange={handleAccountChange} required
                        className={inputClass} placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className={labelClass}>Password <span className="text-red-400">*</span></label>
                      <input name="password" type="password" value={account.password} onChange={handleAccountChange} required
                        className={inputClass} placeholder="Min 8 characters" />
                    </div>
                    <div>
                      <label className={labelClass}>Confirm Password <span className="text-red-400">*</span></label>
                      <input name="confirmPassword" type="password" value={account.confirmPassword} onChange={handleAccountChange} required
                        className={inputClass} placeholder="Repeat password" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Phone Number</label>
                      <input name="phone" value={account.phone} onChange={handleAccountChange}
                        className={inputClass} placeholder="e.g. 082 555 1234" />
                    </div>
                  </div>

                  {tab !== 'club_range' && (
                    <button type="submit" disabled={loading}
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 mt-2">
                      {loading ? 'Creating Account...' :
                        tab === 'member' ? 'Create Free Account →' : `Continue — ${tabLabel} Details →`}
                    </button>
                  )}

                  <p className="text-[11px] text-[#8A8E99] text-center">
                    By registering you agree to our{' '}
                    <Link href="/terms" className="text-[#C9922A] hover:underline">Terms of Use</Link> and{' '}
                    <Link href="/privacy" className="text-[#C9922A] hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              </>
            )}

            {/* STEP 2 — BUSINESS DETAILS */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="bg-[#13151A] border border-white/5 rounded-sm p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase">
                    {tab === 'dealer' ? 'Dealer' : tab === 'club' ? 'Club' : tab === 'range' ? 'Range' : 'Service'}{' '}
                    <span className="text-[#C9922A]">Details</span>
                  </h2>
                  <button type="button" onClick={() => { setStep(1); setError(''); }}
                    className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] hover:text-white transition-colors">
                    ← Back
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3 text-red-400 text-sm">{error}</div>
                )}

                {/* DEALER FIELDS */}
                {tab === 'dealer' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Business Name <span className="text-red-400">*</span></label>
                      <input name="business_name" value={dealer.business_name} onChange={handleDealerChange} required
                        className={inputClass} placeholder="e.g. Cape Arms Trading" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>SAPS Dealer Number <span className="text-red-400">*</span></label>
                      <input name="saps_dealer_number" value={dealer.saps_dealer_number} onChange={handleDealerChange} required
                        className={inputClass} placeholder="e.g. WC/12345/D" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Trading Address</label>
                      <input name="address" value={dealer.address} onChange={handleDealerChange}
                        className={inputClass} placeholder="Street address" />
                    </div>
                    <div>
                      <label className={labelClass}>City</label>
                      <input name="city" value={dealer.city} onChange={handleDealerChange}
                        className={inputClass} placeholder="e.g. Cape Town" />
                    </div>
                    <div>
                      <label className={labelClass}>Province</label>
                      <select name="province" value={dealer.province} onChange={handleDealerChange} className={inputClass}>
                        {PROVINCES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Postal Code</label>
                      <input name="postal_code" value={dealer.postal_code} onChange={handleDealerChange}
                        className={inputClass} placeholder="e.g. 8001" />
                    </div>
                    <div>
                      <label className={labelClass}>Website</label>
                      <input name="website" value={dealer.website} onChange={handleDealerChange}
                        className={inputClass} placeholder="https://yourstore.co.za" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Business Description</label>
                      <textarea name="description" value={dealer.description} onChange={handleDealerChange} rows={3}
                        className={`${inputClass} resize-none`}
                        placeholder="Tell buyers about your store, specialisations, brands stocked..." />
                    </div>
                  </div>
                )}

                {/* CLUB / RANGE FIELDS */}
                {(tab === 'club' || tab === 'range') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>{tab === 'range' ? 'Range' : 'Club'} Name <span className="text-red-400">*</span></label>
                      <input name="name" value={club.name} onChange={handleClubChange} required
                        className={inputClass} placeholder={tab === 'range' ? 'e.g. Cape Town Shooting Range' : 'e.g. Highveld IPSC Club'} />
                    </div>
                    <div>
                      <label className={labelClass}>Contact Email</label>
                      <input name="contact_email" type="email" value={club.contact_email} onChange={handleClubChange}
                        className={inputClass} placeholder="club@example.co.za" />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input name="phone" value={club.phone} onChange={handleClubChange}
                        className={inputClass} placeholder="011 555 1234" />
                    </div>
                    <div>
                      <label className={labelClass}>City</label>
                      <input name="city" value={club.city} onChange={handleClubChange}
                        className={inputClass} placeholder="e.g. Johannesburg" />
                    </div>
                    <div>
                      <label className={labelClass}>Province</label>
                      <select name="province" value={club.province} onChange={handleClubChange} className={inputClass}>
                        {PROVINCES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Address</label>
                      <input name="address" value={club.address} onChange={handleClubChange}
                        className={inputClass} placeholder="Physical address" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Website</label>
                      <input name="website" value={club.website} onChange={handleClubChange}
                        className={inputClass} placeholder="https://yourclub.co.za" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Shooting Disciplines</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {CLUB_DISCIPLINES.map(d => (
                          <label key={d} className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={club.disciplines.includes(d)}
                              onChange={() => toggleDiscipline(d)} className="w-4 h-4 accent-[#C9922A]" />
                            <span className="text-[13px] text-[#8A8E99] group-hover:text-[#F0EDE8] transition-colors">{d}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Description</label>
                      <textarea name="description" value={club.description} onChange={handleClubChange} rows={3}
                        className={`${inputClass} resize-none`}
                        placeholder="Tell us about your club, events, membership..." />
                    </div>
                  </div>
                )}

                {/* SERVICE FIELDS */}
                {tab === 'service' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Business / Practice Name <span className="text-red-400">*</span></label>
                      <input name="name" value={service.name} onChange={handleServiceChange} required
                        className={inputClass} placeholder="e.g. Cape Arms Gunsmith" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Service Type</label>
                      <select name="type" value={service.type} onChange={handleServiceChange} className={inputClass}>
                        {SERVICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>City</label>
                      <input name="city" value={service.city} onChange={handleServiceChange}
                        className={inputClass} placeholder="e.g. Cape Town" />
                    </div>
                    <div>
                      <label className={labelClass}>Province</label>
                      <select name="province" value={service.province} onChange={handleServiceChange} className={inputClass}>
                        {PROVINCES.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input name="phone" value={service.phone} onChange={handleServiceChange}
                        className={inputClass} placeholder="082 555 1234" />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input name="email" type="email" value={service.email} onChange={handleServiceChange}
                        className={inputClass} placeholder="you@example.co.za" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Website</label>
                      <input name="website" value={service.website} onChange={handleServiceChange}
                        className={inputClass} placeholder="https://yourservice.co.za" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>Description</label>
                      <textarea name="description" value={service.description} onChange={handleServiceChange} rows={3}
                        className={`${inputClass} resize-none`}
                        placeholder="Describe your services, specialisations, qualifications..." />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[15px] py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 mt-2">
                  {loading ? 'Submitting...' : 'Submit Application →'}
                </button>

                <p className="text-[11px] text-[#8A8E99] text-center leading-relaxed">
                  By submitting you agree to our{' '}
                  <Link href="/terms" className="text-[#C9922A] hover:underline">Terms of Use</Link> and{' '}
                  <Link href="/privacy" className="text-[#C9922A] hover:underline">Privacy Policy</Link>.
                  All applications are reviewed within 1–2 business days.
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
