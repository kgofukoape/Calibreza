'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { recordConsent } from '@/lib/auth';
import { LEGAL_DOCUMENTS } from '@/lib/legal';
import { BUSINESS_TYPES } from '@/lib/business';
import { PLAN_LIST } from '@/lib/plans';

// ─── DEALER APPLICATION ──────────────────────────────────────────────────────
// This page previously allowed anonymous submission, which caused three faults:
//
//   1. dealers.user_id was never set. /dealer/login and /dealer-dashboard both
//      look the business up by user_id, so every dealer who applied this way
//      was permanently locked out of the account they had just created.
//
//   2. Documents were uploaded to a flat path in the dealer-documents bucket.
//      That bucket is now private, and its read policy is scoped to
//      {user_id}/... — so uploads must be pathed per user or nobody, not even
//      the uploader, can read them back.
//
//   3. The three acceptance checkboxes gated the submit button and were then
//      discarded. Nothing recorded what the dealer agreed to.
//
// Requiring sign-in fixes all three at once: there is a user id to store, a
// folder to upload into, and a token to prove identity when recording consent.
//
// A note on the checkbox wording. The three boxes are three different kinds of
// statement and are now labelled as such:
//   • the Terms and Dealer Agreement are a CONTRACT — you agree to them;
//   • the Privacy Policy and POPI Notice are a NOTICE — you are told, you do
//     not "consent" to them, and saying you do misrepresents the lawful basis
//     for processing, which is contract and legal obligation, not consent;
//   • FCA compliance is a DECLARATION OF FACT about the business — a warranty,
//     not permission.

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
];

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export default function DealerApplyPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [isPersonalAccount, setIsPersonalAccount] = useState(false);
  const [existingApplication, setExistingApplication] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    registrationNumber: '',
    businessType: 'company',
    yearsInBusiness: '',
    contactPerson: '',
    responsiblePersonEmail: '',
    email: '',
    phone: '',
    alternatePhone: '',
    streetAddress: '',
    city: '',
    province: 'Gauteng',
    postalCode: '',
    sapsNumber: '',
    selectedTier: 'free',
    agreeTerms: false,
    acknowledgePrivacy: false,
    declareFCA: false,
  });

  const [files, setFiles] = useState({
    sapsCertificate: null as File | null,
    businessRegistration: null as File | null,
    idDocument: null as File | null,
  });

  // ── Auth gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // A dealer record must be owned by a business account. Allowing a
        // personal account to create one puts us back where we started: the
        // shop's listings tied to one employee's private login.
        const { data: profile } = await supabase
          .from('users')
          .select('account_type')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.account_type === 'personal') {
          setIsPersonalAccount(true);
          setCheckingAuth(false);
          return;
        }

        setUserId(user.id);
        setAccountEmail(user.email || '');

        // Captured at business registration; prefilled here so it is not asked twice.
        const meta = user.user_metadata || {};
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          contactPerson: meta.responsible_person || '',
          responsiblePersonEmail: meta.responsible_person_email || '',
        }));

        // Applying twice creates a second dealers row for the same account, and
        // the login lookup uses .single() — two rows would break it.
        const { data: existing } = await supabase
          .from('dealers')
          .select('business_name, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) setExistingApplication(existing.status);
      }

      setCheckingAuth(false);
    };
    check();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [fieldName]: e.target.files![0] }));
    }
  };

  // Uploads into {user_id}/... because the dealer-documents read policy is
  // scoped to the uploader's own folder. Returns the storage path, NOT a public
  // URL — the bucket is private, so a public URL would not resolve. The admin
  // console generates a short-lived signed URL from this path when reviewing.
  const uploadFile = async (file: File, docType: string, uid: string) => {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`${file.name} is larger than 5MB. Please upload a smaller file.`);
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `${uid}/${docType}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('dealer-documents')
      .upload(path, file, { upsert: false });
    if (uploadError) throw uploadError;
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!userId) throw new Error('Your session has expired. Please sign in again.');
      if (!formData.agreeTerms) throw new Error('Please accept the Terms of Use and Dealer Agreement');
      if (!formData.acknowledgePrivacy) throw new Error('Please confirm you have read the Privacy Policy and POPI Act Notice');
      if (!formData.declareFCA) throw new Error('Please confirm your FCA compliance declaration');
      if (!files.sapsCertificate) throw new Error('SAPS Dealer Certificate is required');
      if (!files.businessRegistration) throw new Error('Business Registration document is required');
      if (!files.idDocument) throw new Error('ID Document is required');

      const sapsCertPath = await uploadFile(files.sapsCertificate, 'saps-certificate', userId);
      const businessRegPath = await uploadFile(files.businessRegistration, 'business-registration', userId);
      const idDocPath = await uploadFile(files.idDocument, 'id-document', userId);

      const slug = formData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const { error: insertError } = await supabase.from('dealers').insert({
        user_id: userId,
        business_name: formData.businessName,
        slug,
        registration_number: formData.registrationNumber,
        business_type: formData.businessType,
        years_in_business: parseInt(formData.yearsInBusiness),
        contact_person: formData.contactPerson,
        responsible_person: formData.contactPerson,
        responsible_person_email: formData.responsiblePersonEmail,
        email: formData.email,
        phone: formData.phone,
        alternate_phone: formData.alternatePhone,
        address: formData.streetAddress,
        city: formData.city,
        province: formData.province,
        postal_code: formData.postalCode,
        saps_dealer_number: formData.sapsNumber,
        saps_certificate_url: sapsCertPath,
        business_registration_url: businessRegPath,
        id_document_url: idDocPath,
        subscription_tier: formData.selectedTier,
        status: 'pending',
      });

      if (insertError) throw insertError;

      // ── Record what was agreed to ────────────────────────────────────────
      // Non-blocking: the application is already saved and refusing to show
      // success would be worse than a missing record. Logged loudly so a gap
      // is discoverable rather than silent.
      const consentRecorded = await recordConsent('dealer_application', false, formData.businessName);
      if (!consentRecorded) {
        console.error('[dealer/apply] consent record was not written for', formData.businessName);
      }

      // ── Notify admin ─────────────────────────────────────────────────────
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type:     'dealer_applied',
            name:     formData.businessName,
            city:     formData.city,
            province: formData.province,
            email:    formData.email,
          }),
        });
      } catch (notifyErr) {
        console.error('Notify failed (non-blocking):', notifyErr);
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 4000);

    } catch (err: any) {
      setError(err.message || 'Application failed. Please try again.');
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[600px] mx-auto px-6 py-32 text-center">
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
        </main>
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!userId) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[600px] mx-auto px-6 py-20 text-center">
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-12">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-black uppercase mb-4">
              Business <span className="text-[#C9922A]">Account</span> Needed
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-4">
              A dealer listing is owned by a business account, not by a person. That account
              is the login your staff share to manage inventory, enquiries and your
              subscription.
            </p>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              If you work for a dealer, you can also keep your own personal Gun X account for
              buying and selling. The two are separate and do not affect each other.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/business/register"
                className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-4 rounded-sm hover:brightness-110 transition-all">
                Register Business
              </Link>
              <Link href="/business/login"
                className="flex-1 border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-6 py-4 rounded-sm hover:bg-white/5 transition-all">
                Business Sign In
              </Link>
            </div>
            <p className="text-xs text-[#8A8E99] mt-6">
              Looking for a personal account instead?{' '}
              <Link href="/signup" className="text-[#C9922A] hover:brightness-110">Register here</Link>.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Signed in, but with a personal account ─────────────────────────────────
  if (isPersonalAccount) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[600px] mx-auto px-6 py-20 text-center">
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-12">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-black uppercase mb-4">
              That&apos;s a <span className="text-[#C9922A]">Personal</span> Account
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              You are signed in with a personal account, which is for buying and selling as an
              individual. A dealer listing needs its own business account so your staff can
              share access and your listings stay with the business rather than with you.
            </p>
            <Link href="/business/register"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:brightness-110 transition-all">
              {BUSINESS_TYPES.dealer.icon} Register a Dealer Account
            </Link>
            <p className="text-xs text-[#8A8E99] mt-6">
              Your personal account stays exactly as it is.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Already applied ────────────────────────────────────────────────────────
  if (existingApplication) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[600px] mx-auto px-6 py-20 text-center">
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-12">
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-black uppercase mb-4">
              Application <span className="text-[#C9922A]">{existingApplication}</span>
            </h1>
            <p className="text-[#8A8E99] text-sm leading-relaxed mb-8">
              This account already has a dealer application on file. You do not need to
              apply again. If something needs correcting, email{' '}
              <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-110">support@gunx.co.za</a>.
            </p>
            <Link href="/dashboard"
              className="inline-block border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-4 rounded-sm hover:bg-white/5 transition-all">
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Submitted ──────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[600px] mx-auto px-6 py-20 text-center">
          <div className="bg-green-500/10 border border-green-500/20 rounded-sm p-12">
            <div className="text-6xl mb-6">✅</div>
            <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl font-black uppercase mb-4">
              Application <span className="text-[#C9922A]">Submitted!</span>
            </h1>
            <p className="text-[#8A8E99] mb-6">
              Thank you for applying to become a Gun X dealer. We&apos;ll review your application
              and contact you within 2-3 business days. Once approved, sign in with this same
              account to reach your dealer dashboard.
            </p>
            <p className="text-sm text-[#8A8E99]">Redirecting…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-[900px] mx-auto px-6 py-20">

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm mb-6">
            <span className="text-4xl">🏪</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Dealer <span className="text-[#C9922A]">Application</span>
          </h1>
          <p className="text-[#8A8E99] text-[14px] uppercase tracking-widest font-bold mb-4">
            Join South Africa&apos;s Premier Firearms Marketplace
          </p>
          <p className="text-sm text-[#F0EDE8] max-w-2xl mx-auto">
            Complete the application below. All dealers must be licensed under the Firearms Control Act (FCA) with a valid SAPS dealer number.
          </p>
          <p className="text-xs text-[#8A8E99] mt-4">
            Applying as <span className="text-[#C9922A]">{accountEmail}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-sm">
              {error}
            </div>
          )}

          {/* Business Information */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Business Name <span className="text-red-500">*</span></label>
                <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. City Guns &amp; Ammo" />
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Business Type <span className="text-red-500">*</span></label>
                <select name="businessType" value={formData.businessType} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors">
                  <option value="company">Company (Pty Ltd)</option>
                  <option value="sole_proprietor">Sole Proprietor</option>
                  <option value="partnership">Partnership</option>
                  <option value="close_corporation">Close Corporation (CC)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Registration Number <span className="text-red-500">*</span></label>
                <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 2020/123456/07" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Years in Business <span className="text-red-500">*</span></label>
                <input type="number" name="yearsInBusiness" value={formData.yearsInBusiness} onChange={handleInputChange} required min="0"
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 5" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Contact Person <span className="text-red-500">*</span></label>
                <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="Full name of authorised person" />
                <p className="text-xs text-[#8A8E99] mt-2">The person accountable for this account and authorised to accept our agreements.</p>
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Their Email <span className="text-red-500">*</span></label>
                <input type="email" name="responsiblePersonEmail" value={formData.responsiblePersonEmail} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="johan@yourbusiness.co.za" />
                <p className="text-xs text-[#8A8E99] mt-2">For notices about this account. Not published.</p>
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Business Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="dealer@example.com" />
                <p className="text-xs text-[#8A8E99] mt-2">Shown on your public dealer profile. Can differ from your account email.</p>
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Phone Number <span className="text-red-500">*</span></label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 011 234 5678" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Alternate Phone (Optional)</label>
                <input type="tel" name="alternatePhone" value={formData.alternatePhone} onChange={handleInputChange}
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 082 123 4567" />
              </div>
            </div>
          </div>

          {/* Physical Address */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              Physical Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Street Address <span className="text-red-500">*</span></label>
                <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 123 Main Street, Sandton" />
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">City <span className="text-red-500">*</span></label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. Johannesburg" />
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Province <span className="text-red-500">*</span></label>
                <select name="province" value={formData.province} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors">
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Postal Code <span className="text-red-500">*</span></label>
                <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 2000" />
              </div>
            </div>
          </div>

          {/* SAPS Licensing */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              SAPS Licensing (FCA Compliance)
            </h2>

            <div className="border-l-2 border-[#C9922A] bg-[#C9922A]/[0.07] pl-4 pr-4 py-3 mb-6">
              <p className="text-[13px] text-[#C4C0B8] leading-relaxed">
                These documents are stored privately and are visible only to you and to our
                verification team. They are not published on your dealer profile and are not
                accessible to other users.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">SAPS Dealer Number <span className="text-red-500">*</span></label>
                <input type="text" name="sapsNumber" value={formData.sapsNumber} onChange={handleInputChange} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. D12345678" />
                <p className="text-xs text-[#8A8E99] mt-2">Your official SAPS dealer registration number as issued by the South African Police Service</p>
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">SAPS Dealer Certificate <span className="text-red-500">*</span></label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'sapsCertificate')} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-bold file:bg-[#C9922A] file:text-black hover:file:brightness-110" />
                <p className="text-xs text-[#8A8E99] mt-2">Upload your current SAPS dealer certificate (PDF, JPG, or PNG — max 5MB)</p>
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">Business Registration Document <span className="text-red-500">*</span></label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'businessRegistration')} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-bold file:bg-[#C9922A] file:text-black hover:file:brightness-110" />
                <p className="text-xs text-[#8A8E99] mt-2">CIPC registration, CK1/CK2 forms, or sole proprietor registration</p>
              </div>
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">ID Document of Contact Person <span className="text-red-500">*</span></label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'idDocument')} required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-bold file:bg-[#C9922A] file:text-black hover:file:brightness-110" />
                <p className="text-xs text-[#8A8E99] mt-2">South African ID or passport of the authorised contact person</p>
              </div>
            </div>
          </div>

          {/* Subscription Selection */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              Choose Your Plan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                ...PLAN_LIST.map(p => ({
                  value: p.id,
                  label: p.label.toUpperCase(),
                  price: p.priceLabel,
                  listings: p.listingLimitLabel,
                })),
              ].map(tier => (
                <label key={tier.value} className={`cursor-pointer border-2 rounded-sm p-6 transition-all ${formData.selectedTier === tier.value ? 'border-[#C9922A] bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'}`}>
                  <input type="radio" name="selectedTier" value={tier.value} checked={formData.selectedTier === tier.value} onChange={handleInputChange} className="sr-only" />
                  <div className="text-center">
                    <h3 className="font-black uppercase text-xl mb-2">{tier.label}</h3>
                    <p className="text-[#C9922A] text-3xl font-black mb-2">{tier.price}</p>
                    <p className="text-xs text-[#8A8E99]">{tier.listings}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-[#8A8E99] text-center mt-4">
              You can upgrade or downgrade your plan at any time from your dashboard
            </p>
          </div>

          {/* Legal Agreements */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              Agreements and Declarations
            </h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleInputChange} required
                  className="w-5 h-5 mt-[2px] flex-shrink-0 accent-[#C9922A]" />
                <span className="text-sm text-[#F0EDE8] leading-relaxed">
                  I agree to the{' '}
                  <Link href={LEGAL_DOCUMENTS.terms.href} target="_blank" className="text-[#C9922A] hover:brightness-110">Terms of Use</Link> and the{' '}
                  <Link href={LEGAL_DOCUMENTS['dealer-terms'].href} target="_blank" className="text-[#C9922A] hover:brightness-110">Dealer Agreement</Link>,
                  and I am authorised to bind this business to them <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="acknowledgePrivacy" checked={formData.acknowledgePrivacy} onChange={handleInputChange} required
                  className="w-5 h-5 mt-[2px] flex-shrink-0 accent-[#C9922A]" />
                <span className="text-sm text-[#F0EDE8] leading-relaxed">
                  I have read the{' '}
                  <Link href={LEGAL_DOCUMENTS.privacy.href} target="_blank" className="text-[#C9922A] hover:brightness-110">Privacy Policy</Link> and{' '}
                  <Link href={LEGAL_DOCUMENTS.popi.href} target="_blank" className="text-[#C9922A] hover:brightness-110">POPI Act Notice</Link>,
                  and understand how the information in this application will be used <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="declareFCA" checked={formData.declareFCA} onChange={handleInputChange} required
                  className="w-5 h-5 mt-[2px] flex-shrink-0 accent-[#C9922A]" />
                <span className="text-sm text-[#F0EDE8] leading-relaxed">
                  I declare that this business holds a valid dealer&apos;s licence under the{' '}
                  <strong>Firearms Control Act 60 of 2000</strong>, that the documents uploaded above are
                  true and current, and that I will notify Gun X if that licence lapses, is suspended
                  or is withdrawn <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Submitting Application...' : 'Submit Dealer Application'}
            </button>
            <Link href="/dealer/pricing"
              className="flex-1 border border-white/10 text-[#F0EDE8] text-center font-black uppercase tracking-widest text-[14px] px-8 py-4 rounded-sm hover:bg-white/5 transition-all">
              View Pricing Details
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}