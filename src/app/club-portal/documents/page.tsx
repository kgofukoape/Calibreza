'use client';

import React from 'react';
import { useClubPortal } from '@/components/club-portal/ClubPortalContext';
import { PortalTitle, Panel, fmtDate, validity } from '@/components/club-portal/ui';

// Read-only: compliance details and documents are locked after applying
// (database guard). Changes go through support.

const DOCS: Array<[string, string]> = [
  ['affiliation_letter_url', 'Affiliation letter'],
  ['accreditation_cert_url', 'SAPS accreditation certificate'],
  ['business_registration_url', 'CIPC registration'],
  ['constitution_url', 'Club constitution'],
];

export default function ClubPortalDocuments() {
  const { club } = useClubPortal();
  const valid = validity(club.compliance_valid_until);

  const row = (k: string, v: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 py-3 border-b border-white/5 text-[13px]">
      <span className="text-[#8A8E99]">{k}</span>
      <span className="font-bold sm:text-right">{v || '-'}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <PortalTitle a="Compliance" b="documents" sub="These were checked when your club was approved, so they are locked." />
      <Panel title="Compliance">
        {row('Status', club.compliance_status === 'accredited' ? 'SAPS-accredited association'
          : club.compliance_status === 'affiliated' ? 'Affiliated club' : null)}
        {row('Affiliated to', (club.associations || []).join(', '))}
        {row('SAPS accreditation no.', club.accreditation_number)}
        {row('Valid until', club.compliance_valid_until ? (
          <span className={valid === 'expired' ? 'text-[#E63946]' : valid === 'soon' ? 'text-[#F59E0B]' : ''}>
            {fmtDate(club.compliance_valid_until)}{valid === 'expired' ? ' (expired)' : valid === 'soon' ? ' (expires soon)' : ''}
          </span>
        ) : null)}
        {row('CIPC no.', club.cipc_number)}
        {row('Responsible person', [club.responsible_person_name, club.responsible_person_role].filter(Boolean).join(', '))}
      </Panel>
      <Panel title="Documents on file">
        {DOCS.map(([k, label]) => row(label, club[k]
          ? <span className="text-[#2A9C6E]">On file</span>
          : <span className="text-[#8A8E99]">Not on file</span>))}
      </Panel>
      <p className="text-[13px] text-[#8A8E99] leading-relaxed">
        To update anything here, for example a new affiliation letter each year, email{' '}
        <a className="text-[#C9922A]" href="mailto:support@gunx.co.za?subject=Club%20documents%20update">support@gunx.co.za</a>{' '}
        with the new document attached.
      </p>
    </div>
  );
}
