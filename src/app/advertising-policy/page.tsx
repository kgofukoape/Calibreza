'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// ─── POLICY VERSION ──────────────────────────────────────────────────────────
// Bump this whenever the Terms or Guidelines wording changes. The booking flow
// stores the same value as `policy_version`, so you always know which version
// each advertiser agreed to (POPIA evidence requirement). Local const, not
// exported — Next.js page files may only export the component + metadata.
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

        {/* Jump links */}
        <div className="flex flex-wrap gap-3 mb-10 pb-6 border-b border-white/5">
          <a href="#guidelines" className="text-[11px] font-black uppercase tracking-widest text-[#C9922A] border border-[#C9922A]/30 bg-[#C9922A]/5 px-4 py-2 rounded-sm hover:bg-[#C9922A]/10 transition-all">
            ↓ Guidelines (Plain English)
          </a>
          <a href="#terms" className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] border border-white/10 px-4 py-2 rounded-sm hover:text-[#F0EDE8] hover:border-white/20 transition-all">
            ↓ Full Terms
          </a>
        </div>

        {/* ═══════════════════ GUIDELINES ═══════════════════ */}
        <section id="guidelines" className="mb-16 scroll-mt-6">
          <div className="bg-[#13151A] border border-[#C9922A]/20 rounded-sm p-3 mb-6 inline-block">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#C9922A]">The 30-Second Version</span>
          </div>

          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight mb-3">
            Advertising <span className="text-[#C9922A]">Guidelines</span>
          </h2>
          <p className="text-[14px] text-[#8A8E99] leading-relaxed mb-8">
            This is the plain-English summary of how advertising works on Gun X. The full legal detail lives in our <a href="#terms" className="text-[#C9922A] hover:brightness-125">Advertising Terms</a> below — by booking an ad, you agree to both.
          </p>

          <GuideBlock title="What We're About">
            <p>Gun X serves the lawful, clean South African shooting community and dealer network. Advertisers from any industry are welcome — gun shops, optics and gear, ranges, security firms, power tools, insurance, whatever fits the audience. We just need every ad to stay on the right side of the line.</p>
          </GuideBlock>

          <GuideBlock title="What Your Ad Can't Contain">
            <ul className="space-y-2.5">
              <Pro t="Illegal stuff">no black-market sales, unlicensed firearm transfers, or illegal conversion kits. Anything firearm-related moves through proper dealer / SAPS channels, full stop.</Pro>
              <Pro t="Adult or exploitative material">no pornographic, explicit, or sexually suggestive creative.</Pro>
              <Pro t="Hate or harm">no racist content, hate speech, or anything that incites or glorifies real-world violence.</Pro>
              <Pro t="Scams or deception">no fake listings, financial scams, or seriously misleading claims.</Pro>
              <Pro t="Direct competitors">no advertising for rival firearm classified platforms.</Pro>
            </ul>
          </GuideBlock>

          <GuideBlock title="One Firearm Rule Worth Knowing">
            <p>Your ad can promote your business and your products all day long. What it <strong className="text-[#F0EDE8]">can't</strong> do is act as the checkout for a specific firearm or ammunition — "buy this rifle, click here." Those link through to your verified dealer listing instead, where the proper checks already happen. Brand and product advertising is wide open; only the direct point-of-sale for a regulated item is off-limits in a banner.</p>
          </GuideBlock>

          <GuideBlock title="How Booking Works">
            <ol className="list-decimal pl-5 space-y-2 marker:text-[#C9922A] marker:font-bold">
              <li><strong className="text-[#F0EDE8]">Submit.</strong> Upload your creative, pick your slot, page, and duration. It goes to our team for a quick review against the rules above. <strong className="text-[#F0EDE8]">No payment is taken yet.</strong></li>
              <li><strong className="text-[#F0EDE8]">Get cleared.</strong> If it's good, we issue an invoice.</li>
              <li><strong className="text-[#F0EDE8]">Pay within 24 hours</strong> to lock your slot. Miss the window and the spot simply goes back to the pool for someone else — no penalty, you just rebook when you're ready.</li>
              <li><strong className="text-[#F0EDE8]">Go live.</strong> Once we've got payment, your ad runs for the booked period.</li>
            </ol>
            <p className="mt-3"><strong className="text-[#F0EDE8]">Rejected? It costs you nothing.</strong> We don't take your money before approval, so if your creative doesn't fit, we tell you why, you fix it, and you try again. Zero charge.</p>
          </GuideBlock>

          <GuideBlock title="The Basics on Responsibility">
            <ul className="space-y-2">
              <li className="flex gap-3"><span className="text-[#C9922A] flex-shrink-0">•</span><span>By submitting an ad, you confirm you have the right to use the images and logos in it, and that what you're advertising is real and legal. <strong className="text-[#F0EDE8]">Your ad is your responsibility, not ours.</strong></span></li>
              <li className="flex gap-3"><span className="text-[#C9922A] flex-shrink-0">•</span><span>We can decline or remove any ad, at our discretion — including pulling something later if it turns out to break the rules.</span></li>
              <li className="flex gap-3"><span className="text-[#C9922A] flex-shrink-0">•</span><span>If <em>we</em> drop the ball — our server goes down, a technical fault on our end stops your paid ad running — we'll make it right with a replacement slot or a fair pro-rata refund, your choice.</span></li>
            </ul>
          </GuideBlock>
        </section>

        {/* ═══════════════════ TERMS ═══════════════════ */}
        <section id="terms" className="scroll-mt-6">
          <div className="bg-[#13151A] border border-white/10 rounded-sm p-3 mb-6 inline-block">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99]">The Binding Detail</span>
          </div>

          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-3xl font-black uppercase tracking-tight mb-3">
            Advertising <span className="text-[#C9922A]">Terms</span>
          </h2>
          <p className="text-[14px] text-[#8A8E99] leading-relaxed mb-8 bg-[#13151A] border border-white/5 rounded-sm p-4">
            <strong className="text-[#F0EDE8]">Plain-language note:</strong> these Terms sit behind the Guidelines above. The Guidelines are the short version; these Terms are what you're legally bound to when you book an ad. We've kept them as lean as we sensibly can.
          </p>

          <Term n="1" title="What These Cover">
            <p>These Terms govern the submission, approval, payment, and display of advertisements ("Ads") on gunx.co.za and its subdomains (the "Platform"). They apply to anyone who submits an Ad ("you"). Where they conflict with our general Terms of Use on advertising specifically, these Terms win.</p>
          </Term>

          <Term n="2" title="Who Can Advertise">
            <p>You must hold a valid Gun X account, be at least 18 (or an authorised representative of a company), and have the authority and the rights to everything you upload. Advertisers from any lawful industry are welcome.</p>
          </Term>

          <Term n="3" title="How the Agreement Forms">
            <p>Submitting an Ad is an <strong className="text-[#F0EDE8]">offer</strong> to advertise. We accept it by approving the Ad and issuing an invoice. A <strong className="text-[#F0EDE8]">binding contract forms when we receive your payment</strong>. No payment is taken before approval, so a rejected Ad creates no charge and no contract.</p>
          </Term>

          <Term n="4" title="Approval and Payment">
            <ol className="list-decimal pl-5 space-y-2 marker:text-[#C9922A] marker:font-bold">
              <li>You submit your creative, slot, page, and duration. It enters review.</li>
              <li>If approved, we invoice you. <strong className="text-[#F0EDE8]">Payment is due within 24 hours.</strong> A reminder is sent before the window closes.</li>
              <li>If payment isn't received in time, the slot is released back to the pool. There's no penalty — you simply rebook subject to availability. You agreed to this when you booked, so it isn't a surprise.</li>
              <li>Once paid, your Ad is scheduled and runs for the booked period.</li>
            </ol>
          </Term>

          <Term n="5" title="Content Standards">
            <p>Your Ad must comply with our Guidelines above and South African law. In short, it must not promote anything unlawful, adult / exploitative, hateful or violence-glorifying, scammy or seriously misleading, or a competing firearms platform.</p>
            <p className="mt-3"><strong className="text-[#F0EDE8]">Firearm-specific:</strong> an Ad may promote your business and products, but it may not act as the direct point-of-sale for a specific firearm or ammunition. Such offers must link to a verified dealer listing on the Platform, where the relevant Firearms Control Act and SAPS / dealer-transfer checks apply.</p>
          </Term>

          <Term n="6" title="Your Warranties">
            <p>By submitting an Ad you confirm that: you own or have permission for all creative content (images, logos, copy); what you advertise is real and may lawfully be supplied in South Africa; your claims are true and not misleading; and you have authority to agree to these Terms.</p>
          </Term>

          <Term n="7" title="Your Responsibility (Indemnity)">
            <p>Your Ad is your responsibility. You indemnify GX SA (Pty) Ltd, its directors, and staff against any claim, loss, or cost arising from your Ad — including breach of your warranties above, infringement of someone else's rights, or breach of law. This is drawn to your attention because it matters: by booking, you accept it.</p>
          </Term>

          <Term n="8" title="Our Rights">
            <p>We may <strong className="text-[#F0EDE8]">decline or remove any Ad at our discretion</strong>, including pulling an Ad later if it turns out to break the rules or the law. We review Ads as a courtesy and a quality check; doing so doesn't make us the author of, or responsible for, advertiser content, and we don't undertake to monitor everything continuously. If you believe an Ad infringes your rights, tell us at <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-125">support@gunx.co.za</a> and we'll act on a valid notice.</p>
          </Term>

          <Term n="9" title="If We're at Fault">
            <p>If we fail to run a paid, approved, live Ad for a reason on our side (e.g. platform downtime or a server fault), you may choose either an equivalent replacement placement or a fair pro-rata refund of the unused portion. The choice is yours.</p>
          </Term>

          <Term n="10" title="Liability">
            <p>To the maximum extent the law allows, our total liability connected to any Ad is limited to the fee you paid for that Ad. Nothing in these Terms excludes liability that can't lawfully be excluded under South African law (including under the Consumer Protection Act where it applies to you).</p>
          </Term>

          <Term n="11" title="Your Information (POPIA)">
            <p>When you book, we process your name, contact details, company name, and submission contents to administer your booking, contact you, and meet our legal duties. We use trusted service providers (for hosting, email, and messaging), some of which may process data outside South Africa, under appropriate safeguards. We record your acceptance of these Terms (date, time, version) as proof of agreement. Full detail, your rights, and our Information Officer's contact are in our Privacy / POPIA Notice.</p>
          </Term>

          <Term n="12" title="Changes">
            <p>We may update these Terms. The version in force when you book governs that booking. Material changes get a new version number and effective date.</p>
          </Term>

          <Term n="13" title="Governing Law and Disputes">
            <p>These Terms are governed by South African law. Disputes are subject to [the jurisdiction of the South African courts]. The rest of these Terms stay in force even if one part is found unenforceable (severability). These Terms, the Guidelines, and the documents they reference are the whole agreement on advertising. You may not cede your rights under them without our consent.</p>
          </Term>

          <Term n="14" title="Contact">
            <p>GX SA (Pty) Ltd · <a href="mailto:support@gunx.co.za" className="text-[#C9922A] hover:brightness-125">support@gunx.co.za</a><br />
            [Registered address · CIPC registration number · Information Officer contact to be inserted]</p>
          </Term>
        </section>

        {/* CTA */}
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

function GuideBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-xl font-black uppercase tracking-tight mb-3 text-[#F0EDE8]">
        {title}
      </h3>
      <div className="text-[14px] text-[#8A8E99] leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

function Term({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-lg md:text-xl font-black uppercase tracking-tight mb-2 flex items-baseline gap-3">
        <span className="text-[#C9922A]">{n}.</span>
        <span>{title}</span>
      </h3>
      <div className="text-[14px] text-[#8A8E99] leading-relaxed space-y-2 pl-1">
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
