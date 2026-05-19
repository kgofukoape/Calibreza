'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

export default function DealerApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    registrationNumber: '',
    businessType: 'company',
    yearsInBusiness: '',
    
    // Contact Information
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    
    // Physical Address
    streetAddress: '',
    city: '',
    province: 'Gauteng',
    postalCode: '',
    
    // SAPS & Licensing
    sapsNumber: '',
    
    // Subscription
    selectedTier: 'free',
    
    // Legal
    agreeTerms: false,
    agreePOPI: false,
    agreeFCA: false,
  });

  // File uploads
  const [files, setFiles] = useState({
    sapsCertificate: null as File | null,
    businessRegistration: null as File | null,
    idDocument: null as File | null,
  });

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

  const uploadFile = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('dealer-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('dealer-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.agreeTerms || !formData.agreePOPI || !formData.agreeFCA) {
        throw new Error('Please accept all terms and conditions');
      }

      if (!files.sapsCertificate) {
        throw new Error('SAPS Dealer Certificate is required');
      }

      if (!files.businessRegistration) {
        throw new Error('Business Registration document is required');
      }

      if (!files.idDocument) {
        throw new Error('ID Document is required');
      }

      // Upload files
      const sapsCertUrl = await uploadFile(files.sapsCertificate, 'saps-certificates');
      const businessRegUrl = await uploadFile(files.businessRegistration, 'business-registrations');
      const idDocUrl = await uploadFile(files.idDocument, 'id-documents');

      // Create slug from business name
      const slug = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Insert dealer application
      const { error: insertError } = await supabase
        .from('dealers')
        .insert({
          business_name: formData.businessName,
          slug: slug,
          registration_number: formData.registrationNumber,
          business_type: formData.businessType,
          years_in_business: parseInt(formData.yearsInBusiness),
          contact_person: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          alternate_phone: formData.alternatePhone,
          address: formData.streetAddress,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          saps_dealer_number: formData.sapsNumber,
          saps_certificate_url: sapsCertUrl,
          business_registration_url: businessRegUrl,
          id_document_url: idDocUrl,
          subscription_tier: formData.selectedTier,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/dealer/login');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Application failed. Please try again.');
      setLoading(false);
    }
  };

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
              Thank you for applying to become a Gun X dealer. We'll review your application and contact you within 2-3 business days.
            </p>
            <p className="text-sm text-[#8A8E99]">
              Redirecting to login page...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      <main className="max-w-[900px] mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C9922A]/10 border border-[#C9922A]/20 rounded-sm mb-6">
            <span className="text-4xl">🏪</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4">
            Dealer <span className="text-[#C9922A]">Application</span>
          </h1>
          <p className="text-[#8A8E99] text-[14px] uppercase tracking-widest font-bold mb-4">
            Join South Africa's Premier Firearms Marketplace
          </p>
          <p className="text-sm text-[#F0EDE8] max-w-2xl mx-auto">
            Complete the application below. All dealers must be licensed under the Firearms Control Act (FCA) with a valid SAPS dealer number.
          </p>
        </div>

        {/* Application Form */}
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
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. City Guns & Ammo"
                />
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                >
                  <option value="company">Company (Pty Ltd)</option>
                  <option value="sole_proprietor">Sole Proprietor</option>
                  <option value="partnership">Partnership</option>
                  <option value="close_corporation">Close Corporation (CC)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 2020/123456/07"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Years in Business <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="yearsInBusiness"
                  value={formData.yearsInBusiness}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              Contact Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="Full name of authorized person"
                />
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="dealer@example.com"
                />
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 011 234 5678"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Alternate Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 082 123 4567"
                />
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
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 123 Main Street, Sandton"
                />
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. Johannesburg"
                />
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                >
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="North West">North West</option>
                  <option value="Northern Cape">Northern Cape</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. 2000"
                />
              </div>
            </div>
          </div>

          {/* SAPS Licensing */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              SAPS Licensing (FCA Compliance)
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  SAPS Dealer Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sapsNumber"
                  value={formData.sapsNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors"
                  placeholder="e.g. D12345678"
                />
                <p className="text-xs text-[#8A8E99] mt-2">
                  Your official SAPS dealer registration number as issued by the South African Police Service
                </p>
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  SAPS Dealer Certificate <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'sapsCertificate')}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-bold file:bg-[#C9922A] file:text-black hover:file:brightness-110"
                />
                <p className="text-xs text-[#8A8E99] mt-2">
                  Upload your current SAPS dealer certificate (PDF, JPG, or PNG - Max 5MB)
                </p>
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  Business Registration Document <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'businessRegistration')}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-bold file:bg-[#C9922A] file:text-black hover:file:brightness-110"
                />
                <p className="text-xs text-[#8A8E99] mt-2">
                  CIPC registration, CK1/CK2 forms, or sole proprietor registration
                </p>
              </div>

              <div>
                <label className="block text-[#8A8E99] text-[11px] font-black uppercase tracking-widest mb-2">
                  ID Document of Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'idDocument')}
                  required
                  className="w-full bg-[#0D0F13] border border-white/10 text-[#F0EDE8] px-4 py-3 rounded-sm outline-none focus:border-[#C9922A] transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-bold file:bg-[#C9922A] file:text-black hover:file:brightness-110"
                />
                <p className="text-xs text-[#8A8E99] mt-2">
                  South African ID or passport of the authorized contact person
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Selection */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              Choose Your Plan
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`cursor-pointer border-2 rounded-sm p-6 transition-all ${formData.selectedTier === 'free' ? 'border-[#C9922A] bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'}`}>
                <input
                  type="radio"
                  name="selectedTier"
                  value="free"
                  checked={formData.selectedTier === 'free'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <h3 className="font-black uppercase text-xl mb-2">FREE</h3>
                  <p className="text-[#C9922A] text-3xl font-black mb-2">R0</p>
                  <p className="text-xs text-[#8A8E99]">5 listings</p>
                </div>
              </label>

              <label className={`cursor-pointer border-2 rounded-sm p-6 transition-all ${formData.selectedTier === 'pro' ? 'border-[#C9922A] bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'}`}>
                <input
                  type="radio"
                  name="selectedTier"
                  value="pro"
                  checked={formData.selectedTier === 'pro'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <h3 className="font-black uppercase text-xl mb-2">PRO</h3>
                  <p className="text-[#C9922A] text-3xl font-black mb-2">R499</p>
                  <p className="text-xs text-[#8A8E99]">50 listings</p>
                </div>
              </label>

              <label className={`cursor-pointer border-2 rounded-sm p-6 transition-all ${formData.selectedTier === 'premium' ? 'border-[#C9922A] bg-[#C9922A]/10' : 'border-white/10 hover:border-white/20'}`}>
                <input
                  type="radio"
                  name="selectedTier"
                  value="premium"
                  checked={formData.selectedTier === 'premium'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <h3 className="font-black uppercase text-xl mb-2">PREMIUM</h3>
                  <p className="text-[#C9922A] text-3xl font-black mb-2">R799</p>
                  <p className="text-xs text-[#8A8E99]">Unlimited</p>
                </div>
              </label>
            </div>

            <p className="text-xs text-[#8A8E99] text-center mt-4">
              You can upgrade or downgrade your plan at any time from your dashboard
            </p>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-[#13151A] border border-white/5 rounded-sm p-8">
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-black uppercase mb-6 text-[#C9922A]">
              Legal Agreements
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  required
                  className="w-5 h-5 mt-1 rounded-sm bg-[#0D0F13] border border-white/10"
                />
                <span className="text-sm text-[#F0EDE8]">
                  I agree to Gun X's <Link href="/terms" className="text-[#C9922A] hover:brightness-110">Terms of Service</Link> and <Link href="/dealer-terms" className="text-[#C9922A] hover:brightness-110">Dealer Agreement</Link> <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreePOPI"
                  checked={formData.agreePOPI}
                  onChange={handleInputChange}
                  required
                  className="w-5 h-5 mt-1 rounded-sm bg-[#0D0F13] border border-white/10"
                />
                <span className="text-sm text-[#F0EDE8]">
                  I consent to the processing of my personal information in accordance with the <Link href="/popi" className="text-[#C9922A] hover:brightness-110">POPI Act</Link> <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeFCA"
                  checked={formData.agreeFCA}
                  onChange={handleInputChange}
                  required
                  className="w-5 h-5 mt-1 rounded-sm bg-[#0D0F13] border border-white/10"
                />
                <span className="text-sm text-[#F0EDE8]">
                  I confirm that my business is fully compliant with the <strong>Firearms Control Act (FCA) Act 60 of 2000</strong> and holds a valid SAPS dealer license <span className="text-red-500">*</span>
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-8 py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Application...' : 'Submit Dealer Application'}
            </button>
            <Link
              href="/dealer/pricing"
              className="flex-1 border border-white/10 text-[#F0EDE8] text-center font-black uppercase tracking-widest text-[14px] px-8 py-4 rounded-sm hover:bg-white/5 transition-all"
            >
              View Pricing Details
            </Link>
          </div>

          <p className="text-xs text-[#8A8E99] text-center">
            Already have an account? <Link href="/dealer/login" className="text-[#C9922A] font-bold hover:brightness-110">Sign in here</Link>
          </p>
        </form>
      </main>
    </div>
  );
}