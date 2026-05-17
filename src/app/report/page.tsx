'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';

const REPORT_REASONS = [
  {
    id: 'my_gun',
    icon: '🔫',
    title: 'This is my firearm',
    desc: 'This firearm was stolen from me or listed without my permission.',
    urgent: true,
    followUp: 'Please provide your case number or police report reference if you have one. We will remove this listing immediately and contact SAPS on your behalf.',
    placeholder: 'Describe the situation. Include your SAPS case number if available...',
  },
  {
    id: 'scam',
    icon: '⚠️',
    title: 'I think this is a scam',
    desc: 'The seller is asking for upfront payment, won\'t meet at a dealer, or something feels wrong.',
    urgent: true,
    followUp: 'Tell us what raised your suspicion. Do not send any money or share personal banking details.',
    placeholder: 'What made you suspicious? Include any communication details if possible...',
  },
  {
    id: 'illegal',
    icon: '🚫',
    title: 'This is an illegal firearm or item',
    desc: 'The listed item appears to be prohibited, unregistered, or illegal under South African law.',
    urgent: true,
    followUp: 'Please describe why you believe this item is illegal. We will review and report to SAPS if confirmed.',
    placeholder: 'Why do you believe this item is illegal? Be as specific as possible...',
  },
  {
    id: 'stolen',
    icon: '🕵️',
    title: 'This may be a stolen firearm',
    desc: 'You have reason to believe this firearm was stolen (serial number match, known stolen listing etc.).',
    urgent: true,
    followUp: 'Provide any identifying details such as serial number, make, or model that match a known stolen firearm.',
    placeholder: 'What information do you have about this firearm being stolen?...',
  },
  {
    id: 'wrong_info',
    icon: '📝',
    title: 'Incorrect or misleading information',
    desc: 'The listing contains false specs, wrong calibre, altered photos, or misleading descriptions.',
    urgent: false,
    followUp: 'Tell us what information is incorrect so we can contact the seller.',
    placeholder: 'What specific information is incorrect or misleading?...',
  },
  {
    id: 'duplicate',
    icon: '📋',
    title: 'Duplicate listing',
    desc: 'This item has been listed more than once by the same seller.',
    urgent: false,
    followUp: 'If you know the URL of the other listing, please include it.',
    placeholder: 'Include the URL of the other listing if you have it...',
  },
  {
    id: 'sold',
    icon: '✅',
    title: 'This item has already been sold',
    desc: 'The seller confirmed the sale but hasn\'t removed the listing.',
    urgent: false,
    followUp: 'When did the seller confirm the item was sold?',
    placeholder: 'Any additional details...',
  },
  {
    id: 'other',
    icon: '💬',
    title: 'Other reason',
    desc: 'Something else is wrong with this listing.',
    urgent: false,
    followUp: 'Please describe the issue in as much detail as possible.',
    placeholder: 'Describe the issue...',
  },
];

function ReportPageInner() {
  const searchParams = useSearchParams();
  const listingId    = searchParams.get('listing') || '';
  const listingTitle = searchParams.get('title')   || 'this listing';

  const [step, setStep]           = useState<'reason' | 'details' | 'done'>('reason');
  const [selectedReason, setSelectedReason] = useState<typeof REPORT_REASONS[0] | null>(null);
  const [details, setDetails]     = useState('');
  const [contact, setContact]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  const handleSelectReason = (reason: typeof REPORT_REASONS[0]) => {
    setSelectedReason(reason);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) { setError('Please provide some details about the issue.'); return; }
    setSubmitting(true);
    setError('');

    try {
      // Save to Supabase
      await supabase.from('listing_reports').insert({
        listing_id:     listingId || null,
        listing_title:  listingTitle,
        reason:         selectedReason?.id,
        reason_label:   selectedReason?.title,
        details:        details.trim(),
        reporter_contact: contact.trim() || null,
        is_urgent:      selectedReason?.urgent || false,
        status:         'pending',
      });

      // Notify admin via email
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:          'listing_reported',
          listing_id:    listingId,
          listing_title: listingTitle,
          reason:        selectedReason?.title,
          is_urgent:     selectedReason?.urgent,
          details:       details.trim(),
          contact:       contact.trim() || 'Not provided',
        }),
      });

      setStep('done');
    } catch (err: any) {
      setError('Something went wrong. Please try again or email support@gunx.co.za directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      {/* HEADER */}
      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-[680px] mx-auto text-center">
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">
            Report a <span className="text-red-400">Listing</span>
          </h1>
          {listingTitle !== 'this listing' && (
            <p className="text-[#8A8E99] text-sm">
              Reporting: <span className="text-[#F0EDE8] font-bold">{listingTitle}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-[680px] mx-auto w-full px-4 md:px-6 py-8 md:py-12">

        {/* STEP 1 — Choose reason */}
        {step === 'reason' && (
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-xl font-black uppercase tracking-widest text-[#C9922A] mb-6">
              Why are you reporting this listing?
            </p>
            <div className="space-y-3">
              {REPORT_REASONS.map(reason => (
                <button key={reason.id} onClick={() => handleSelectReason(reason)}
                  className={`w-full text-left flex items-start gap-4 p-4 rounded-sm border transition-all hover:border-[#C9922A]/40 hover:bg-[#C9922A]/5 group ${
                    reason.urgent ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 bg-[#13151A]'
                  }`}>
                  <span className="text-2xl flex-shrink-0 mt-0.5">{reason.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">
                        {reason.title}
                      </p>
                      {reason.urgent && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-sm flex-shrink-0">Urgent</span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#8A8E99]">{reason.desc}</p>
                  </div>
                  <span className="text-[#8A8E99] group-hover:text-[#C9922A] transition-colors text-lg flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Details */}
        {step === 'details' && selectedReason && (
          <div>
            {/* Back */}
            <button onClick={() => { setStep('reason'); setSelectedReason(null); setDetails(''); setError(''); }}
              className="flex items-center gap-2 text-[#8A8E99] hover:text-[#F0EDE8] text-[12px] font-black uppercase tracking-widest mb-6 transition-colors">
              ← Back
            </button>

            {/* Selected reason summary */}
            <div className={`flex items-start gap-3 p-4 rounded-sm border mb-6 ${selectedReason.urgent ? 'border-red-500/30 bg-red-500/5' : 'border-[#C9922A]/20 bg-[#C9922A]/5'}`}>
              <span className="text-2xl flex-shrink-0">{selectedReason.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-[14px]">{selectedReason.title}</p>
                  {selectedReason.urgent && <span className="text-[9px] font-black uppercase tracking-widest text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-sm">Urgent</span>}
                </div>
                <p className="text-[13px] text-[#8A8E99]">{selectedReason.followUp}</p>
              </div>
            </div>

            {/* Urgent warning */}
            {selectedReason.urgent && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-4 mb-6">
                <p className="text-red-400 font-black text-[12px] uppercase tracking-widest mb-1">⚠️ Urgent Report</p>
                <p className="text-[#8A8E99] text-[13px]">
                  This will be escalated to our compliance team immediately. If this involves a crime in progress, please also contact SAPS directly on <strong className="text-[#F0EDE8]">10111</strong>.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">
                  Details *
                </label>
                <textarea
                  rows={5}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder={selectedReason.placeholder}
                  className="w-full bg-[#13151A] border border-white/10 rounded-sm px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50 resize-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">
                  Your contact details <span className="text-[#8A8E99] normal-case font-normal">(optional — so we can follow up)</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="Email or phone number"
                  className="w-full bg-[#13151A] border border-white/10 rounded-sm px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50 transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3">
                  <p className="text-red-400 text-[13px]">{error}</p>
                </div>
              )}

              <button type="submit" disabled={submitting}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className={`w-full font-black uppercase tracking-widest text-[15px] py-4 rounded-sm transition-all ${
                  selectedReason.urgent
                    ? 'bg-red-500 text-white hover:brightness-110 disabled:opacity-50'
                    : 'bg-[#C9922A] text-black hover:brightness-110 disabled:opacity-50'
                }`}>
                {submitting ? 'Submitting Report...' : selectedReason.urgent ? '🚨 Submit Urgent Report' : 'Submit Report'}
              </button>

              <p className="text-[11px] text-[#8A8E99] text-center">
                All reports are reviewed by our team. False reports may result in account suspension.
              </p>
            </form>
          </div>
        )}

        {/* STEP 3 — Done */}
        {step === 'done' && selectedReason && (
          <div className="text-center py-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${selectedReason.urgent ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#C9922A]/10 border border-[#C9922A]/20'}`}>
              <span className="text-4xl">✓</span>
            </div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl font-black uppercase mb-2 text-[#C9922A]">
              Report Submitted
            </h2>
            <p className="text-[#8A8E99] text-[14px] mb-2 max-w-md mx-auto">
              Thank you for helping keep Gun X safe. Our team will review your report
              {selectedReason.urgent ? ' immediately' : ' within 1 business day'}.
            </p>
            {selectedReason.urgent && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-4 mb-6 max-w-md mx-auto text-left">
                <p className="text-red-400 font-black text-[12px] uppercase tracking-widest mb-1">Urgent — What happens next:</p>
                <ul className="text-[#8A8E99] text-[13px] space-y-1">
                  <li>• Listing will be reviewed and may be suspended immediately</li>
                  <li>• Our compliance team will investigate within 2 hours</li>
                  <li>• SAPS will be contacted if criminal activity is confirmed</li>
                  <li>• You will be contacted if you left your details</li>
                </ul>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/browse"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:brightness-110 transition-all">
                Back to Browse
              </Link>
              <a href="mailto:support@gunx.co.za"
                className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-8 py-3 rounded-sm hover:bg-white/5 transition-all">
                Contact Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0F13] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReportPageInner />
    </Suspense>
  );
}
