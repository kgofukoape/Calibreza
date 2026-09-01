'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import { BUSINESS_TYPES } from '@/lib/business';

// ─── ADVOCACY APPLICATION ────────────────────────────────────────────────────
// /advocacy/apply
//
// Deliberately short. This is a directory listing, not a licence application —
// there is no regulator to satisfy and no document that proves an organisation
// is what it says it is. Asking for paperwork we cannot verify would be theatre.
//
// What we do check is a working contact address, because that is how you
// confirm the person applying actually speaks for the organisation before
// approving it.

export default function AdvocacyApplyPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [existing, setExisting] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    mission_statement: '',
    about_text: '',
    website_url: '',
    contact_email: '',
    npo_number: '',
    founded_year: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { check(); }, []);

  const check = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setChecking(false); return; }

    setUser(session.user);

    const { data: profile } = await supabase
      .from('users').select('account_type, email').eq('id', session.user.id).maybeSingle();
    setAccountType(profile?.account_type || null);

    // An account that already applied should see where it stands rather than a
    // blank form it cannot submit.
    const { data: group } = await supabase
      .from('advocacy_groups')
      .select('id, name, slug, status')
      .eq('owner_user_id', session.user.id)
      .maybeSingle();
    setExisting(group);

    setForm(f => ({ ...f, contact_email: profile?.email || session.user.email || '' }));
    setChecking(false);
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setError('');

    if (!form.name.trim() || form.name.trim().length < 3) {
      setError('Please enter the organisation\'s full name.'); return;
    }
    if (!form.mission_statement.trim()) {
      setError('A short mission statement is required — it is what appears on your directory card.'); return;
    }
    if (!form.contact_email.trim()) {
      setError('A contact email address is required.'); return;
    }
    if (!agreed) {
      setError('Please confirm you are authorised to represent this organisation.'); return;
    }

    setSubmitting(true);

    try {
      const { data, error: insErr } = await supabase
        .from('advocacy_groups')
        .insert({
          name: form.name.trim(),
          mission_statement: form.mission_statement.trim(),
          about_text: form.about_text.trim() || null,
          website_url: form.website_url.trim() || null,
          contact_email: form.contact_email.trim(),
          npo_number: form.npo_number.trim() || null,
          founded_year: form.founded_year ? Number(form.founded_year) : null,
          owner_user_id: user.id,
          // Pending, always. The policy refuses anything else, and it should:
          // an organisation listing itself without review is how the directory
          // stops being worth anything.
          status: 'pending',
        })
        .select('id, name')
        .single();

      if (insErr) throw insErr;

      // Consent is recorded server-side against the same bundle every other
      // business application uses.
      await fetch('/api/legal/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: BUSINESS_TYPES.advocacy.consentContext,
          subject_reference: data.id,
        }),
      }).catch(() => { /* the application stands; consent retries on next sign-in */ });

      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'advocacy_application',
          data: { name: data.name, email: form.contact_email.trim() },
        }),
      }).catch(() => {});

      router.push('/advocacy-dashboard');
    } catch (e: any) {
      setError(
        e.message?.includes('duplicate') || e.code === '23505'
          ? 'This account has already applied. Check your dashboard for the current status.'
          : `Could not submit: ${e.message}`
      );
      setSubmitting(false);
    }
  };

  const inp = "w-full bg-[#0D0F13] border border-white/10 rounded-sm px-4 py-3 text-[14px] text-[#F0EDE8] placeholder-[#8A8E99]/40 focus:outline-none focus:border-[#C9922A]/50";
  const lbl = "text-[10px] font-black uppercase tracking-widest text-[#8A8E99] mb-2 block";
  const sec = "bg-[#13151A] border border-white/5 rounded-sm p-6 space-y-5";

  // ── GATES ────────────────────────────────────────────────────────────────

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <div className="max-w-[700px] mx-auto px-4 py-24 text-center">
          <p className="text-[#8A8E99] text-sm uppercase tracking-widest font-bold">Loading…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <div className="max-w-[700px] mx-auto px-4 py-16">
          <div className={sec}>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl font-black uppercase">List your organisation</h1>
            <p className="text-[14px] text-[#8A8E99] leading-relaxed">
              A directory listing is owned by a business account, not by a person.
              That account is what lets your organisation publish press releases and
              update its own profile later.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/business/register"
                className="flex-1 text-center bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
                Register a business account
              </Link>
              <Link href="/business/login"
                className="flex-1 text-center border border-white/10 text-[#F0EDE8] font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all">
                Sign in
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (accountType === 'personal') {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <div className="max-w-[700px] mx-auto px-4 py-16">
          <div className={sec}>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl font-black uppercase">Business account needed</h1>
            <p className="text-[14px] text-[#8A8E99] leading-relaxed">
              You are signed in with a personal account. An organisation listing needs
              its own business account, so that it survives any one person moving on.
            </p>
            <Link href="/business/register"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
              Register a business account
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (existing) {
    return (
      <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
        <Navbar />
        <div className="max-w-[700px] mx-auto px-4 py-16">
          <div className={sec}>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              className="text-3xl font-black uppercase">{existing.name}</h1>
            <p className="text-[14px] text-[#8A8E99] leading-relaxed">
              {existing.status === 'active'
                ? 'Your organisation is listed and live.'
                : existing.status === 'suspended'
                  ? 'This listing is currently suspended. Contact support@gunx.co.za if you believe this is in error.'
                  : 'Your application has been received and is awaiting review. We will email you when it is decided.'}
            </p>
            <Link href="/advocacy-dashboard"
              className="inline-block bg-[#C9922A] text-black font-black uppercase tracking-widest text-[13px] px-6 py-3 rounded-sm hover:brightness-110 transition-all">
              Go to dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── FORM ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8]">
      <Navbar />

      <div className="bg-[#13151A] border-b border-white/5 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-[800px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-2 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A]">Home</Link>
            <span>/</span>
            <Link href="/advocacy" className="hover:text-[#C9922A]">Advocacy</Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">Apply</span>
          </div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            List Your <span className="text-[#C9922A]">Organisation</span>
          </h1>
          <p className="text-[#8A8E99] text-sm mt-2 uppercase tracking-widest font-bold">
            Free · No commission · No membership handling
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-8 space-y-5">

        {/* Scope, stated before they fill anything in. An organisation
            expecting a membership system should find that out now, not after
            being approved. */}
        <div className="bg-[#13151A] border-l-2 border-[#C9922A] rounded-sm px-4 py-4">
          <p className="text-[13px] text-[#C4C0B8] leading-relaxed">
            <strong className="text-[#F0EDE8]">What a listing gives you:</strong> a
            profile page in our directory, a link out to your own website, and a feed
            where you publish your own press releases.
          </p>
          <p className="text-[13px] text-[#8A8E99] leading-relaxed mt-2">
            <strong className="text-[#C4C0B8]">What it does not:</strong> Gun X does not
            handle memberships, subscriptions or donations. Those stay entirely on your
            own systems, and we never hold your members' details.
          </p>
        </div>

        {error && (
          <div className="bg-[#E63946]/10 border border-[#E63946]/30 rounded-sm px-4 py-3">
            <p className="text-[13px] text-[#E63946] font-bold">{error}</p>
          </div>
        )}

        <div className={sec}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-2xl font-black uppercase pb-3 border-b border-white/5">
            Organisation
          </h2>

          <div>
            <label className={lbl}>Full Name <span className="text-[#E63946]">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Gun Owners of South Africa" className={inp} />
          </div>

          <div>
            <label className={lbl}>Mission Statement <span className="text-[#E63946]">*</span></label>
            <textarea value={form.mission_statement} onChange={e => set('mission_statement', e.target.value)}
              rows={3} maxLength={300}
              placeholder="One or two sentences describing what your organisation does."
              className={inp} />
            <p className="text-[11px] text-[#8A8E99] mt-1.5">
              Appears on your directory card. {300 - form.mission_statement.length} characters left.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>NPO Registration Number</label>
              <input value={form.npo_number} onChange={e => set('npo_number', e.target.value)}
                placeholder="123-456 NPO" className={inp} />
              <p className="text-[11px] text-[#8A8E99] mt-1.5 leading-relaxed">
                Optional, but it can be checked against the DSD register — which turns
                a claim into evidence and makes review quicker.
              </p>
            </div>
            <div>
              <label className={lbl}>Founded</label>
              <input type="number" value={form.founded_year} onChange={e => set('founded_year', e.target.value)}
                placeholder="1994" className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>About</label>
            <textarea value={form.about_text} onChange={e => set('about_text', e.target.value)}
              rows={7}
              placeholder="A fuller description for your profile page — history, focus areas, what you campaign on."
              className={inp} />
          </div>
        </div>

        <div className={sec}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-2xl font-black uppercase pb-3 border-b border-white/5">
            Contact
          </h2>

          <div>
            <label className={lbl}>Website</label>
            <input value={form.website_url} onChange={e => set('website_url', e.target.value)}
              placeholder="https://yourorganisation.org.za" className={inp} />
            <p className="text-[11px] text-[#8A8E99] mt-1.5">
              This is where the "Visit Website" button on your profile sends people —
              the route by which anyone joins or donates.
            </p>
          </div>

          <div>
            <label className={lbl}>Contact Email <span className="text-[#E63946]">*</span></label>
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
              placeholder="info@yourorganisation.org.za" className={inp} />
            <p className="text-[11px] text-[#8A8E99] mt-1.5">
              Shown publicly on your profile, and how we confirm you speak for the
              organisation before approving the listing.
            </p>
          </div>
        </div>

        <div className={sec}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#C9922A] flex-shrink-0" />
            <span className="text-[13px] text-[#C4C0B8] leading-relaxed">
              I am authorised to represent this organisation, and I accept the{' '}
              <Link href="/terms" target="_blank" className="text-[#C9922A] hover:underline">Terms of Use</Link> and{' '}
              <Link href="/privacy" target="_blank" className="text-[#C9922A] hover:underline">Privacy Policy</Link>.
              I understand that anything published under this listing is my organisation's
              own statement and not that of GX SA (Pty) Ltd.
            </span>
          </label>
        </div>

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full bg-[#C9922A] text-black font-black uppercase tracking-widest text-[14px] px-6 py-4 rounded-sm hover:brightness-110 transition-all disabled:opacity-40">
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>

        <p className="text-[12px] text-[#8A8E99] text-center leading-relaxed pb-8">
          Applications are usually reviewed within two business days.
        </p>
      </div>

      <Footer />
    </div>
  );
}