'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#08090B] border-t border-white/5 pt-10 pb-6 px-4 md:px-6 mt-auto">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">

          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-2xl font-black text-[#F0EDE8] leading-none tracking-tighter uppercase block mb-3">
                GUN <span className="text-[#C9922A]">X</span>
              </span>
            </Link>
            <p className="text-[13px] text-[#8A8E99] leading-relaxed mb-4">South Africa's cleanest classified portal for legal firearms.</p>
            <div className="flex flex-col gap-1 text-[11px] text-[#8A8E99] font-bold">
              <span>FCA Compliant</span>
              <span>POPI Act</span>
              <span>GX SA (Pty) Ltd</span>
            </div>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-4">Browse</h3>
            <ul className="space-y-2">
              {[['Pistols','/browse/pistols'],['Rifles','/browse/rifles'],['Shotguns','/browse/shotguns'],['Revolvers','/browse/revolvers'],['Air Guns','/browse/air-guns'],['Optics','/browse/optics'],['Ammunition','/browse/ammunition'],['Knives','/browse/knives'],['Accessories','/browse/accessories']].map(([l,h]) => (
                <li key={h}><Link href={h} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-4">Platform</h3>
            <ul className="space-y-2">
              {[['Dealer Directory','/dealers'],['Post a Listing','/sell'],['Clubs & Ranges','/clubs'],['Services','/services'],['Industry Jobs','/jobs'],['Wanted Ads','/wanted'],['FA Ownership','/firearm-ownership']].map(([l,h]) => (
                <li key={h}><Link href={h} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-4">Dealers</h3>
            <ul className="space-y-2">
              {[['Apply as Dealer','/dealer/apply'],['Dealer Login','/dealer/login'],['Dealer Pricing','/dealer/pricing'],['List a Club','/clubs/apply'],['List a Range','/clubs/range-apply'],['List a Service','/services/apply'],['Post a Job','/jobs']].map(([l,h]) => (
                <li key={h}><Link href={h} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[13px] font-black uppercase tracking-widest text-[#F0EDE8] mb-4">Company</h3>
            <ul className="space-y-2">
              {[['About Us','/about'],['Contact','/contact'],['FAQs','/faqs'],['Report a Listing','/report'],['Advertise','/advertise']].map(([l,h]) => (
                <li key={h}><Link href={h} className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors">{l}</Link></li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-white/5">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif" }} className="text-[11px] font-black uppercase tracking-widest text-[#8A8E99] mb-2">Contact</p>
              <a href="mailto:support@gunx.co.za" className="text-[13px] text-[#C9922A] hover:brightness-125 transition-all block mb-1">support@gunx.co.za</a>
              <a href="mailto:pewpew@gunx.co.za" className="text-[13px] text-[#8A8E99] hover:text-[#C9922A] transition-colors block">pewpew@gunx.co.za</a>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[12px] text-[#8A8E99]">© {year} GX SA (Pty) Ltd — All rights reserved</p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-[12px] text-[#8A8E99]">
            {[['Terms of Use','/terms'],['Privacy Policy','/privacy'],['POPI Act','/popi'],['Legal Disclaimer','/legal']].map(([l,h]) => (
              <Link key={h} href={h} className="hover:text-[#C9922A] transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}