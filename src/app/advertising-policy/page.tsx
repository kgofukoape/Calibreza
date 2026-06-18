'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── POLICY VERSION ──────────────────────────────────────────────────────────
// Bump this whenever the policy wording changes. The booking flow uses the same
// value as `policy_version` so you always know which version each advertiser
// agreed to (POPIA evidence requirement). Kept as a local const (not exported)
// because Next.js page files may only export the component + metadata.
const ADVERTISING_POLICY_VERSION = '1.0';

export default function AdvertisingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0D0F13] text-[#F0EDE8] flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-[820px] mx-auto w-full px-4 md:px-6 py-8 md:py-12">

        {/* Breadcrumb */}
        <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-[#C9922A]">Home</Link><span>/</span>
          <Link href="/advertise" className="hover:text-[#C9922A]">Advertise</Link><span>/</span>
          <span className="text-[#F0EDE8]">Advertising Policy</span>
        </div>

        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2">
          Advertising <span className="text-[#C9922A]">Policy</span>
        </h1>
        <p className="text-[#8A8E99] text-sm mb-2">GX SA (Pty) Ltd · Version {ADVERTISING_POLICY_VERSION}</p>
        <p className="text-[#8A8E99] text-[12px] mb-8 italic">Effective date to be confirmed on publication.</p>

        <div className="prose-gx space-y-8">

          <Section n="1" title="Introduction">
            <p>This Advertising Policy governs the submission, approval, payment, and display of all advertisements ("Ads") on the Gun X platform at gunx.co.za and its subdomains (the "Platform"). It forms a binding agreement between GX SA (Pty) Ltd ("Gun X", "we", "us") and any person or entity that submits an Ad ("Advertiser", "you").</p>
            <p>By submitting an Ad and accepting this Policy, you confirm you have read, understood, and agree to be bound by these terms. This Policy operates alongside our Terms of Use and Privacy Policy / POPIA Notice; where it conflicts with those in respect of advertising specifically, this Policy prevails.</p>
          </Section>

          <Section n="2" title="Who May Advertise">
            <p>Advertising is available to registered Gun X account holders, including private members, dealers, distributors, wholesalers, clubs, ranges, security service providers, and other lawful service providers operating within or adjacent to the South African firearms community.</p>
            <p>You must hold a valid Gun X account; be at least 18 years of age (or a duly authorised representative of a juristic person); have authority to enter into this agreement; and own or hold all rights, licences, and permissions for the creative content you submit.</p>
          </Section>

          <Section n="3" title="How Advertising Works — Approval Before Payment">
            <p>Gun X operates on an <strong className="text-[#F0EDE8]">approval-first basis</strong>. No payment is taken when you submit an Ad.</p>
            <ol className="list-decimal pl-5 space-y-2 marker:text-[#C9922A] marker:font-bold">
              <li><strong className="text-[#F0EDE8]">Submit.</strong> You upload your creative, choose your slot, page, and duration, and accept this Policy. Your Ad enters our review queue. No payment is taken at this stage.</li>
              <li><strong className="text-[#F0EDE8]">Review.</strong> We review every Ad against this Policy as soon as reasonably possible, and either approve it or reject it with a reason.</li>
              <li><strong className="text-[#F0EDE8]">Payment on approval.</strong> If approved, we issue an invoice. You must pay within 24 hours of approval. A reminder is sent before the window closes.</li>
              <li><strong className="text-[#F0EDE8]">Go live.</strong> Once payment is received, your Ad is scheduled and displayed for the booked period.</li>
              <li><strong className="text-[#F0EDE8]">Non-payment.</strong> If payment is not received within 24 hours of approval, the reserved slot is automatically released. You may rebook subject to availability.</li>
            </ol>
            <p>Because no payment is taken before approval, a rejected Ad costs you nothing.</p>
          </Section>

          <Section n="4" title="Advertising Standards — Prohibited Content">
            <p>Gun X serves the lawful, licensed firearms community in South Africa. All Ads must align with this purpose and with South African law. You may <strong className="text-[#F0EDE8]">not</strong> submit any Ad that:</p>
            <ul className="space-y-2.5">
              <Pro t="Unlawful content">promotes or facilitates any activity unlawful under South African law; promotes firearms, ammunition, or related items otherwise than in accordance with the Firearms Control Act 60 of 2000 ("FCA"); or promotes unlicensed dealing, illegal modification, or circumvention of the FCA.</Pro>
              <Pro t="Sexual and exploitative content">contains pornographic, sexually explicit, or sexually suggestive material; or sexualises, exploits, or endangers minors in any way.</Pro>
              <Pro t="Hate, harm, and discrimination">promotes hatred, violence, or discrimination on grounds set out in section 9 of the Constitution or the Promotion of Equality and Prevention of Unfair Discrimination Act 4 of 2000; or incites or glorifies harm against any person.</Pro>
              <Pro t="Misleading content">contains false, misleading, or deceptive representations, consistent with section 41 of the Consumer Protection Act 68 of 2008 ("CPA").</Pro>
              <Pro t="Fraud and scams">promotes scams, fraudulent schemes, counterfeit goods, or deceptive financial offers.</Pro>
              <Pro t="Intellectual property">infringes the copyright, trade marks, or other rights of any third party, or uses third-party IP without authorisation.</Pro>
              <Pro t="Competitor and conflicting content">promotes a directly competing firearms marketplace, or content that materially conflicts with the lawful operation of Gun X.</Pro>
              <Pro t="Data and privacy">collects personal information from users otherwise than in compliance with the Protection of Personal Information Act 4 of 2013 ("POPIA").</Pro>
            </ul>
            <p>This list is not exhaustive. Gun X may decline any Ad that, in its reasonable assessment, is inconsistent with this Policy or applicable law.</p>
          </Section>

          <Section n="5" title="Advertiser Warranties">
            <p>By submitting an Ad, you warrant that: the Ad and its creative content comply with this Policy and all applicable South African law (including the FCA, CPA, POPIA, and the Electronic Communications and Transactions Act 25 of 2002); you own or hold all rights and consents necessary to use the creative content; all claims and representations are true and not misleading; the goods or services advertised may lawfully be supplied in South Africa; and you have authority to enter into this agreement.</p>
          </Section>

          <Section n="6" title="Rejection and Amendment">
            <p>If your Ad is rejected, we will give you a reason. Because no payment is taken before approval, rejection carries no charge. You may amend your Ad to address the reason and resubmit, subject to slot availability. Gun X may reject any Ad that breaches this Policy or applicable law, in its reasonable discretion.</p>
          </Section>

          <Section n="7" title="Payment, Scheduling, and the 24-Hour Window">
            <p>Advertising fees are those published on our Advertise page at the time of booking. On approval, an invoice is issued and <strong className="text-[#F0EDE8]">payment must be received within 24 hours</strong>. A reminder is sent before the window closes.</p>
            <p>If payment is not received within the 24-hour window, the slot is automatically released. No penalty or charge applies — you simply forfeit the reservation and may rebook subject to availability. Where Gun X is unable to display a paid, approved, live Ad for reasons attributable to us, we will, consistent with section 47 of the CPA, supply an equivalent placement or refund the unused portion of the fee.</p>
          </Section>

          <Section n="8" title="Slot Availability">
            <p>Ad slots are sold per placement and per page for a defined period; availability is shown at booking. Gun X takes reasonable steps to prevent the same slot and page being sold for overlapping periods. If a double-booking nonetheless occurs, we will arrange an alternative placement or date, or refund any affected fee where no suitable alternative exists.</p>
          </Section>

          <Section n="9" title="Personal Information (POPIA)">
            <p>When you submit an Ad we process personal information including your name, email, telephone number, company name, and submission contents, to administer your booking, contact you, and meet our legal obligations, on the lawful bases in section 11 of POPIA.</p>
            <p>We record your acceptance of this Policy — the date and time of acceptance and the Policy version accepted — as evidence of your agreement, and retain this record for at least the period required by law. Our full data practices, your data-subject rights, and our Information Officer's contact details are set out in our Privacy Policy / POPIA Notice.</p>
          </Section>

          <Section n="10" title="Indemnity and Liability">
            <p>You indemnify GX SA (Pty) Ltd, its directors, employees, and agents against any claim, loss, or expense arising from your Ad, including any breach of your warranties, infringement of third-party rights, or contravention of law. To the maximum extent permitted by law, Gun X's total liability arising from any Ad is limited to the fee paid for that Ad. Nothing in this Policy excludes liability that cannot lawfully be excluded under South African law.</p>
          </Section>

          <Section n="11" title="Changes to This Policy">
            <p>Gun X may amend this Policy from time to time. The version in force when you submit an Ad governs that Ad. Material changes are reflected by an updated version number and effective date.</p>
          </Section>

          <Section n="12" title="Governing Law">
            <p>This Policy is governed by the laws of the Republic of South Africa.</p>
          </Section>

          <Section n="13" title="Contact">
            <p>GX SA (Pty) Ltd<br />Email: <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-125">support@gunx.co.za</a></p>
          </Section>

        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
          <Link href="/advertise" className="border border-white/20 text-[#F0EDE8] font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:bg-white/5 transition-all text-center">
            ← Back to Advertise
          </Link>
          <Link href="/advertise/book" className="bg-[#C9922A] text-black font-black uppercase tracking-widest text-[12px] px-6 py-3 rounded-sm hover:brightness-110 transition-all text-center">
            Book an Ad Slot →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3 flex items-baseline gap-3">
        <span className="text-[#C9922A]">{n}.</span>
        <span>{title}</span>
      </h2>
      <div className="text-[14px] text-[#8A8E99] leading-relaxed space-y-3 pl-1">
        {children}
      </div>
    </section>
  );
}

function Pro({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="text-[#E63946] flex-shrink-0 font-black">✕</span>
      <span><strong className="text-[#F0EDE8]">{t}</strong> — {children}</span>
    </li>
  );
}
