'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { BUSINESS_TYPE_LIST } from '@/lib/business';
import { getBusinessStatus, type BusinessStatus } from '@/lib/businessStatus';

// --- APPROVAL PENDING --------------------------------------------------------
// Where an unapproved business account lives. It can see where its
// application stands, read any message from the Gun X team, upload new copies
// of documents the team asked for, and contact support. It cannot list, buy or
// sell until approved; the database enforces that separately.

const SUPPORT = 'support@gunx.co.za';
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const DOCS: Record<string, Array<[string, string]>> = {
  dealer: [
    ['saps_certificate_url', 'SAPS dealer certificate'],
    ['business_registration_url', 'Business registration'],
    ['id_document_url', 'ID document'],
  ],
  club: [
    ['affiliation_letter_url', 'Affiliation letter'],
    ['accreditation_cert_url', 'SAPS accreditation certificate'],
    ['business_registration_url', 'CIPC registration'],
    ['constitution_url', 'Club constitution'],
  ],
  range: [
    ['saps_registration_url', 'SAPS registration'],
    ['compliance_cert_url', 'Compliance certificate'],
    ['business_registration_url', 'Business registration'],
  ],
  service: [['psira_certificate_url', 'PSIRA certificate']],
};

export default function BusinessPendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<BusinessStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [busyDoc, setBusyDoc] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const load = async (quiet = false) => {
    if (quiet) setChecking(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/business/login');
      return;
    }
    const s = await getBusinessStatus(user.id);
    if (s && !s.needsApproval) {
      router.replace(s.type.dashboardPath);
      return;
    }
    setState(s);
    setLoading(false);
    setChecking(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const call = async (payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/applications/resubmit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Something went wrong');
    return session;
  };

  const uploadDoc = async (column: string, file: File | undefined) => {
    if (!file || !state) return;
    setErr('');
    if (!TYPES.includes(file.type)) { setErr('Please upload a PDF, JPG or PNG file.'); return; }
    if (file.size > MAX_BYTES) { setErr('That file is larger than 10MB.'); return; }
    setBusyDoc(column);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in again.');
      const bucket = state.type.id === 'dealer' ? 'dealer-documents' : 'business-documents';
      const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
      const path = `${user.id}/resubmit-${Date.now()}-${column.replace(/_url$/, '')}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);
      await call({ kind: state.type.id, action: 'upload', column, path });
      await load(true);
    } catch (e: any) {
      setErr(e?.message || 'Upload failed.');
    }
    setBusyDoc(null);
  };

  const sendForReview = async () => {
    if (!state) return;
    setErr('');
    setSending(true);
    try {
      const session = await call({ kind: state.type.id, action: 'submit' });
      // Same forwarding email as a new application, with fresh document links
      const kind = state.type.id === 'range' ? 'club' : state.type.id === 'club' ? 'shooting_club' : state.type.id;
      await fetch('/api/applications/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ kind }),
      }).catch(() => null);
      await load(true);
    } catch (e: any) {
      setErr(e?.message || 'Could not send it for review.');
    }
    setSending(false);
  };

  const heading = (a: string, b: string) => (
    <h1
      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      className="text-3xl sm:text-4xl font-black uppercase leading-none mb-3"
    >
      {a} <span className="text-[#C9922A]">{b}</span>
    </h1>
  );

  const footer = (
    <div className="flex flex-col sm:flex-row gap-3 mt-8">
      <button
        onClick={() => load(true)}
        disabled={checking}
        className="w-full sm:w-auto border border-white/15 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all disabled:opacity-50"
      >
        {checking ? 'Checking...' : 'Check again'}
      </button>
      <button
        onClick={signOut}
        className="w-full sm:w-auto border border-white/15 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all"
      >
        Sign out
      </button>
    </div>
  );

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />
      <main className="max-w-[560px] mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="bg-[#13151A] border border-white/5 rounded-sm p-6 sm:p-10">{children}</div>
      </main>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <main className="max-w-[560px] mx-auto px-4 sm:px-6 py-24 text-center">
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading...</p>
        </main>
      </div>
    );
  }

  // Business account with no application yet
  if (!state) {
    return shell(
      <>
        {heading('Finish your', 'application')}
        <p className="text-[#8A8E99] text-sm leading-relaxed mb-6">
          This business account has no application yet. Choose what you are applying as. Your
          account opens once the Gun X team has checked your documents and approved it.
        </p>
        <div className="space-y-3">
          {BUSINESS_TYPE_LIST.map((t) => (
            <Link
              key={t.id}
              href={t.applyPath}
              className="flex items-center gap-3 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-4 hover:border-[#C9922A]/50 transition-all"
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="flex-1">
                <span className="block font-black uppercase tracking-widest text-[12px]">{t.label}</span>
                <span className="block text-[12px] text-[#8A8E99] mt-1">{t.requirements}</span>
              </span>
            </Link>
          ))}
        </div>
        {footer}
      </>,
    );
  }

  const row = state.row || {};
  const note: string = row.review_note || '';
  const submitted = state.createdAt
    ? new Date(state.createdAt).toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const top = (
    <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8A8E99] mb-3">
      {state.type.label} application
    </p>
  );

  const nameLine = (
    <>
      <p className="text-[#F0EDE8] font-bold mb-1">{state.name}</p>
      {submitted && <p className="text-[12px] text-[#8A8E99] mb-6">Submitted {submitted}</p>}
    </>
  );

  // --- Rejected --------------------------------------------------------------
  if (state.status === 'rejected') {
    return shell(
      <>
        {top}
        {heading('Application', 'not approved')}
        {nameLine}
        {note && (
          <div className="border-l-2 border-[#E63946] pl-4 mb-4 text-sm text-[#F0EDE8] whitespace-pre-wrap">
            {note}
          </div>
        )}
        <p className="text-[#8A8E99] text-sm leading-relaxed">
          If you can resolve this, or think it is a mistake, email{' '}
          <a href={`mailto:${SUPPORT}`} className="text-[#C9922A]">{SUPPORT}</a>.
        </p>
        {footer}
      </>,
    );
  }

  // --- More information needed ---------------------------------------------
  if (state.status === 'info_requested') {
    const docs = DOCS[state.type.id] || [];
    // Only the documents the Gun X team asked for (when it said which).
    const asked: string[] = Array.isArray(row.review_docs) ? row.review_docs : [];
    const missing = docs.filter(([col]) => !row[col] && (asked.length === 0 || asked.includes(col)));
    return shell(
      <>
        {top}
        {heading('More information', 'needed')}
        {nameLine}

        <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">
          Message from the Gun X team
        </p>
        <div className="border-l-2 border-[#C9922A] pl-4 mb-6 text-sm text-[#F0EDE8] whitespace-pre-wrap">
          {note || 'Please contact us for details.'}
        </div>

        {missing.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-3">
              Upload new copies
            </p>
            <div className="space-y-3">
              {missing.map(([col, label]) => (
                <label
                  key={col}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-4 cursor-pointer hover:border-[#C9922A]/50 transition-all"
                >
                  <span className="text-sm font-bold">{label}</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#C9922A]">
                    {busyDoc === col ? 'Uploading...' : 'Choose file'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={busyDoc !== null}
                    onChange={(e) => uploadDoc(col, e.target.files?.[0])}
                  />
                </label>
              ))}
            </div>
            <p className="text-[12px] text-[#8A8E99] mt-2">PDF, JPG or PNG, up to 10MB.</p>
          </div>
        )}

        {docs.length > missing.length && (
          <p className="text-[12px] text-[#2A9C6E] mb-6">
            On file: {docs.filter(([col]) => row[col]).map(([, label]) => label).join(', ')}
          </p>
        )}

        {err && <p className="text-sm text-[#E63946] mb-4">{err}</p>}

        <button
          onClick={sendForReview}
          disabled={sending || busyDoc !== null}
          className="w-full sm:w-auto bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send for review'}
        </button>
        {missing.length > 0 && (
          <p className="text-[12px] text-[#8A8E99] mt-2">
            Upload the documents above first, then send it back to us.
          </p>
        )}
        {footer}
      </>,
    );
  }

  // --- Pending -----------------------------------------------------------------
  const steps = [
    { label: 'Business account created', done: true },
    { label: 'Application and documents submitted', done: true },
    { label: 'Checked by the Gun X team', done: false },
    { label: 'Approved: your dashboard opens', done: false },
  ];

  return shell(
    <>
      {top}
      {heading('Approval', 'pending')}
      {nameLine}

      <ol className="space-y-4 mb-6">
        {steps.map((s, i) => {
          const current = !s.done && (i === 0 || steps[i - 1].done);
          return (
            <li key={s.label} className="flex items-start gap-3">
              <span
                className={
                  'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-black ' +
                  (s.done
                    ? 'bg-[#2A9C6E] text-black'
                    : current
                      ? 'bg-[#C9922A] text-black'
                      : 'bg-white/10 text-[#8A8E99]')
                }
              >
                {s.done ? 'OK' : i + 1}
              </span>
              <span className="pt-1">
                <span className={'block text-sm font-bold ' + (s.done || current ? 'text-[#F0EDE8]' : 'text-[#8A8E99]')}>
                  {s.label}
                </span>
                {current && <span className="block text-[12px] text-[#C9922A] mt-1">In progress</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="bg-[#0D0F13] border border-white/10 rounded-sm p-4 text-sm text-[#8A8E99] leading-relaxed">
        <p className="mb-2">
          <strong className="text-[#F0EDE8]">What happens next.</strong>{' '}
          We check your details and documents, usually within 2 to 3 business days. You will get
          an email when your account is approved, or if we need anything else from you.
        </p>
        <p>
          Until then you cannot list, buy or sell on Gun X. Questions:{' '}
          <a href={`mailto:${SUPPORT}`} className="text-[#C9922A]">{SUPPORT}</a>
        </p>
      </div>

      {footer}
    </>,
  );
}
