'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const CLUB_DOCS = [
  { type: 'cipc_registration', label: 'CIPC / CK Registration Document', description: 'Company registration certificate from CIPC (formerly CK document)', required: true, icon: '🏢' },
  { type: 'saps_affiliation', label: 'SAPS Affiliation / Approval Letter', description: 'Proof of SAPS recognition or affiliation for your shooting club', required: true, icon: '🛡️' },
  { type: 'responsible_person', label: 'Responsible Person Certificate (Section 21)', description: 'Competency certificate of the designated responsible person', required: true, icon: '👤' },
  { type: 'proof_of_address', label: 'Proof of Address', description: 'Utility bill or bank statement not older than 3 months', required: false, icon: '📍' },
];

const RANGE_DOCS = [
  { type: 'cipc_registration', label: 'CIPC / CK Registration Document', description: 'Company registration certificate from CIPC', required: true, icon: '🏢' },
  { type: 'saps_range_approval', label: 'SAPS Range Approval Letter', description: 'Official SAPS approval for operation of a shooting range', required: true, icon: '🛡️' },
  { type: 'responsible_person', label: 'Responsible Person Certificate (Section 21)', description: 'Competency certificate of the designated responsible person', required: true, icon: '👤' },
  { type: 'public_liability', label: 'Public Liability Insurance Certificate', description: 'Current public liability insurance policy for the range', required: true, icon: '📋' },
  { type: 'proof_of_address', label: 'Proof of Address', description: 'Utility bill or bank statement not older than 3 months', required: false, icon: '📍' },
];

const DEALER_DOCS = [
  { type: 'cipc_registration', label: 'CIPC / CK Registration Document', description: 'Company registration certificate from CIPC', required: true, icon: '🏢' },
  { type: 'dealers_licence', label: "Dealer's Licence (Section 13 — FCA)", description: 'Firearms dealer licence issued in terms of Section 13 of the Firearms Control Act (Act 60 of 2000)', required: true, icon: '🔫' },
  { type: 'responsible_person', label: 'Responsible Person Certificate (Section 21)', description: 'Competency certificate of the designated responsible person under the FCA', required: true, icon: '👤' },
  { type: 'tax_clearance', label: 'Tax Clearance Certificate', description: 'Valid SARS tax clearance certificate (not older than 12 months)', required: true, icon: '📊' },
  { type: 'public_liability', label: 'Public Liability Insurance', description: 'Current public liability insurance certificate', required: false, icon: '📋' },
  { type: 'proof_of_address', label: 'Proof of Business Address', description: 'Utility bill or bank statement not older than 3 months', required: false, icon: '📍' },
];

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-[#C9922A]/10 text-[#C9922A] border border-[#C9922A]/30',
  approved: 'bg-[#2A9C6E]/10 text-[#2A9C6E] border border-[#2A9C6E]/30',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending:  '⏳ Under Review',
  approved: '✓ Verified',
  rejected: '✕ Rejected',
};

interface DocumentUploadSectionProps {
  entityType: 'club' | 'range' | 'dealer';
  entityId: string;
  facilityType?: string;
}

export function DocumentUploadSection({ entityType, entityId, facilityType }: DocumentUploadSectionProps) {
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const docDefs = entityType === 'dealer'
    ? DEALER_DOCS
    : facilityType === 'range' || entityType === 'range'
    ? RANGE_DOCS
    : CLUB_DOCS;

  useEffect(() => {
    if (entityId) loadDocs();
  }, [entityId]);

  const loadDocs = async () => {
    const { data } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);
    setDocs(data || []);
  };

  const getDocStatus = (docType: string) => docs.find(d => d.doc_type === docType) || null;

  const handleUpload = async (docType: string, docLabel: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum size is 10MB.'); return; }

    setUploading(prev => ({ ...prev, [docType]: true }));
    setError(''); setSuccess('');

    try {
      const ext = file.name.split('.').pop();
      const filePath = `${entityType}/${entityId}/${docType}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('verification-docs')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('verification-docs').getPublicUrl(filePath);

      const existing = getDocStatus(docType);
      if (existing) {
        await supabase.from('verification_documents').update({
          file_url: publicUrl, file_name: file.name, file_size: file.size,
          status: 'pending', rejection_reason: null,
          uploaded_at: new Date().toISOString(), reviewed_at: null,
        }).eq('id', existing.id);
      } else {
        await supabase.from('verification_documents').insert({
          entity_type: entityType, entity_id: entityId,
          doc_type: docType, doc_label: docLabel,
          file_url: publicUrl, file_name: file.name, file_size: file.size, status: 'pending',
        });
      }

      await loadDocs();
      setSuccess(`${docLabel} uploaded successfully. Our team will review it within 48 hours.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [docType]: false }));
    }
  };

  const requiredCount = docDefs.filter(d => d.required).length;
  const approvedCount = docs.filter(d => d.status === 'approved').length;
  const pendingCount = docs.filter(d => d.status === 'pending').length;

  const isFullyVerified = docDefs
    .filter(d => d.required)
    .every(d => docs.find(ud => ud.doc_type === d.type && ud.status === 'approved'));

  return (
    <div className="flex flex-col gap-5 max-w-[750px]">

      {/* STATUS BANNER */}
      <div className={`rounded-sm p-5 border ${isFullyVerified ? 'bg-[#2A9C6E]/5 border-[#2A9C6E]/30' : pendingCount > 0 ? 'bg-[#C9922A]/5 border-[#C9922A]/30' : 'bg-[#13151A] border-white/5'}`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-1">Verification Status</p>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black uppercase mb-1">
              {isFullyVerified ? 'Verified ✓' : pendingCount > 0 ? 'Under Review' : 'Unverified'}
            </p>
            <p className="text-[#8A8E99] text-[13px]">
              {approvedCount} of {requiredCount} required documents approved
              {pendingCount > 0 && ` · ${pendingCount} under review`}
            </p>
          </div>
          {isFullyVerified && (
            <div className="flex items-center gap-2 bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm px-3 py-2">
              <span className="text-[#2A9C6E] font-black text-[12px] uppercase tracking-widest">🛡️ Verified Badge Active</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-[#8A8E99] mb-1.5">
            <span>Document progress</span>
            <span>{approvedCount}/{requiredCount} required approved</span>
          </div>
          <div className="w-full h-2 bg-[#0D0F13] rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-[#2A9C6E] rounded-full transition-all" style={{ width: `${requiredCount > 0 ? (approvedCount / requiredCount) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-sm p-3 text-red-400 text-[13px]">{error}</div>}
      {success && <div className="bg-[#2A9C6E]/10 border border-[#2A9C6E]/30 rounded-sm p-3 text-[#2A9C6E] text-[13px] font-bold">{success}</div>}

      {/* DOCUMENT LIST */}
      <div className="bg-[#13151A] border border-white/5 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase">Required Documents</h3>
          <p className="text-[12px] text-[#8A8E99] mt-1">Max 10MB per file · PDF, JPG, PNG accepted · Review within 48 hours</p>
        </div>

        <div className="divide-y divide-white/5">
          {docDefs.map(doc => {
            const uploaded = getDocStatus(doc.type);
            const isUploading = uploading[doc.type];

            return (
              <div key={doc.type} className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{doc.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-black text-[14px] text-[#F0EDE8]">{doc.label}</p>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${doc.required ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-[#8A8E99] border border-white/10'}`}>
                          {doc.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#8A8E99]">{doc.description}</p>

                      {uploaded && (
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${STATUS_STYLES[uploaded.status] || STATUS_STYLES.pending}`}>
                            {STATUS_LABELS[uploaded.status] || 'Pending'}
                          </span>
                          {uploaded.file_url && (
                            <a href={uploaded.file_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#C9922A] font-bold hover:brightness-125 transition-all">
                              📎 {uploaded.file_name || 'View Document'}
                            </a>
                          )}
                          {uploaded.uploaded_at && (
                            <span className="text-[10px] text-[#5A5E69]">
                              {new Date(uploaded.uploaded_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}

                      {uploaded?.status === 'rejected' && uploaded.rejection_reason && (
                        <div className="mt-2 bg-red-500/5 border border-red-500/20 rounded-sm px-3 py-2">
                          <p className="text-[11px] text-red-400"><strong>Reason:</strong> {uploaded.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* UPLOAD BUTTON */}
                  <label className={`flex-shrink-0 ${isUploading || uploaded?.status === 'approved' ? 'pointer-events-none' : 'cursor-pointer'}`}>
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-sm border font-black text-[11px] uppercase tracking-widest transition-all ${
                      uploaded?.status === 'approved' ? 'border-[#2A9C6E]/30 text-[#2A9C6E] bg-[#2A9C6E]/5' :
                      uploaded ? 'border-[#C9922A]/40 text-[#C9922A] bg-[#C9922A]/5 hover:bg-[#C9922A]/10' :
                      'border-white/20 text-[#F0EDE8] hover:border-[#C9922A]/40 hover:text-[#C9922A]'
                    }`}>
                      {isUploading
                        ? <><div className="w-3.5 h-3.5 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />Uploading...</>
                        : uploaded?.status === 'approved' ? <>✓ Verified</>
                        : uploaded ? <>↑ Replace</>
                        : <>↑ Upload</>
                      }
                    </div>
                    {uploaded?.status !== 'approved' && (
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(doc.type, doc.label, file);
                          e.target.value = '';
                        }}
                      />
                    )}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WHY VERIFY */}
      <div className="bg-[#13151A] border border-white/5 rounded-sm p-5">
        <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="font-black uppercase text-[15px] mb-4">Why Verify?</h4>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: '🛡️', title: 'Verified Badge', desc: 'Displayed on your profile and in search results — builds instant trust' },
            { icon: '📈', title: 'More Leads', desc: 'Verified profiles receive significantly more enquiries from buyers' },
            { icon: '⚡', title: '48 Hour Review', desc: 'Our team reviews all documents within 48 business hours' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="font-black text-[12px] uppercase tracking-wide mb-0.5">{item.title}</p>
                <p className="text-[11px] text-[#8A8E99] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#5A5E69] mt-4 leading-relaxed border-t border-white/5 pt-4">
          All documents are stored securely and only viewed by Gun X admin staff for verification purposes. Documents are never shared with third parties.
        </p>
      </div>
    </div>
  );
}
