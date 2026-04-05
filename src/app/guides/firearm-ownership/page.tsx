'use client';

import React from 'react';
import Link from 'next/link';

export default function FirearmOwnershipGuidePage() {
  return (
    <div className="min-h-screen bg-[#0D0F13]">
      {/* Hero Section */}
      <div className="bg-[#191C23] border-b border-white/5 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[#8A8E99] hover:text-[#C9922A] transition-all mb-6 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-semibold uppercase tracking-wider">Back to Home</span>
          </Link>

          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl font-extrabold uppercase text-[#F0EDE8] mb-4">
            Legal Firearm Ownership in South Africa
          </h1>
          <p className="text-lg text-[#8A8E99]">
            A comprehensive guide to the complete process under the Firearms Control Act (Act 60 of 2000)
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Overview */}
          <section>
            <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-md p-6">
              <h2 className="text-2xl font-bold text-[#F0EDE8] mb-3">Before You Begin</h2>
              <p className="text-[#8A8E99] mb-4">
                Legally owning a firearm in South Africa is a two-part process governed by the Firearms Control Act No. 60 of 2000:
              </p>
              <ol className="list-decimal list-inside text-[#8A8E99] space-y-2">
                <li>Prove you are <strong className="text-[#F0EDE8]">competent</strong> to own a firearm (Competency Certificate)</li>
                <li>License the <strong className="text-[#F0EDE8]">specific firearm</strong> with its serial number (Firearm Licence)</li>
              </ol>
              <p className="text-[#8A8E99] mt-4">
                <strong className="text-[#F0EDE8]">Typical timeframe:</strong> 6-12 months from start to finish
              </p>
            </div>
          </section>

          {/* The 4-Step Process */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-6">
              The Complete Process
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold text-lg">1</div>
                  <h3 className="text-2xl font-bold text-[#F0EDE8]">Training & Proficiency</h3>
                </div>
                
                <p className="text-[#8A8E99] mb-4">
                  Go to a <strong className="text-[#F0EDE8]">PFTC-accredited training provider</strong> (private shooting range or training center). You cannot apply to SAPS without this certificate.
                </p>

                <div className="bg-[#0D0F13] rounded-sm p-4 space-y-3">
                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">What You'll Do:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                      <li>Written exam on the Firearms Control Act (mandatory "Legal Test")</li>
                      <li>Practical shooting test for your chosen firearm type</li>
                      <li>Theory test on safe handling and storage</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">Firearm Types Available:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                      <li>Handgun (Unit Standard 119649)</li>
                      <li>Shotgun (Unit Standard 119652)</li>
                      <li>Manual/Bolt Action Rifle (Unit Standard 119651)</li>
                      <li>Self-loading Rifle/Carbine (Unit Standard 119650)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">What You Receive:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                      <li>Training Certificate</li>
                      <li>PFTC Statement of Results</li>
                    </ul>
                  </div>

                  <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm p-3 mt-3">
                    <p className="text-[#F0EDE8] text-sm">
                      <strong>💡 Pro Tip:</strong> Do training for ALL firearm types at once (handgun, rifle, shotgun). It saves you from repeating the background check process later. Cost per module is similar.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[#C9922A] font-bold">Cost:</span>
                  <span className="text-[#F0EDE8]">R2,000 - R2,500 per module</span>
                  <span className="text-[#8A8E99] text-sm">(includes books, ammo, range fees)</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold text-lg">2</div>
                  <h3 className="text-2xl font-bold text-[#F0EDE8]">Apply for Competency Certificate</h3>
                </div>

                <p className="text-[#8A8E99] mb-4">
                  Visit your local police station to see the <strong className="text-[#F0EDE8]">Designated Firearms Officer (DFO)</strong>. This is where SAPS assesses if you are "fit and proper" to own a firearm.
                </p>

                <div className="bg-[#0D0F13] rounded-sm p-4 space-y-3">
                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">Required Documents:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                      <li>Certified copy of SA ID</li>
                      <li>Proof of residential address (not older than 3 months)</li>
                      <li>Training certificates and PFTC Statement of Results</li>
                      <li>Three character references (people who can vouch for you)</li>
                      <li>Two passport-sized color photos (neutral background, not older than 3 months)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">Form to Complete:</h4>
                    <p className="text-[#8A8E99]">SAPS 517 (Application for Competency Certificate) - in <strong>black ink only</strong></p>
                  </div>

                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">What SAPS Checks:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                      <li>Criminal record</li>
                      <li>History of violence, domestic abuse, or protection orders</li>
                      <li>Substance abuse history</li>
                      <li>Mental health fitness</li>
                      <li>Character references</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">Age Requirements:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                      <li><strong className="text-[#F0EDE8]">21 years or older:</strong> Standard requirement for all licence types</li>
                      <li><strong className="text-[#F0EDE8]">Under 21:</strong> Can apply with "dedicated status" (sport shooting/hunting) and compelling reasons. <strong className="text-red-400">Cannot get Section 13 (self-defence) under 21.</strong></li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#C9922A] font-bold">SAPS Fee:</span>
                    <span className="text-[#F0EDE8]">R92</span>
                    <span className="text-[#8A8E99] text-sm">(cash or bank-guaranteed cheque only)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C9922A] font-bold">Processing Time:</span>
                    <span className="text-[#F0EDE8]">3-6 months typically</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold text-lg">3</div>
                  <h3 className="text-2xl font-bold text-[#F0EDE8]">Buy the Firearm & Install a Safe</h3>
                </div>

                <p className="text-[#8A8E99] mb-4">
                  <strong className="text-red-400">Important:</strong> You cannot apply for a licence without a serial number. You must purchase the firearm first and leave it in "dealer stock" while you wait for your licence.
                </p>

                <div className="bg-[#0D0F13] rounded-sm p-4 space-y-3">
                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">Purchase Process:</h4>
                    <ol className="list-decimal list-inside text-[#8A8E99] space-y-1">
                      <li>Go to a licensed firearm dealer</li>
                      <li>Choose your firearm (get make, model, and serial number)</li>
                      <li>Pay for the firearm (dealer holds it in their vault)</li>
                      <li>Get invoice and dealer's declaration (needed for licence application)</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">Safe Storage Requirements:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                      <li>Must be SABS-approved steel safe</li>
                      <li>Minimum 2mm body thickness, 4mm door thickness</li>
                      <li>At least 3 locking points</li>
                      <li>Must be bolted to floor or wall</li>
                      <li>Firearms and ammunition stored separately</li>
                    </ul>
                    <p className="text-[#8A8E99] mt-2 text-sm">
                      <strong className="text-[#F0EDE8]">The DFO will inspect your safe</strong> at your home before approving your licence. Take <strong>3 color photos</strong>: door closed, door open, bolts visible.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#C9922A] font-bold">Firearm Cost:</span>
                    <span className="text-[#F0EDE8]">R6,000 - R25,000+</span>
                    <span className="text-[#8A8E99] text-sm">(depending on make and model)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C9922A] font-bold">Safe Cost:</span>
                    <span className="text-[#F0EDE8]">R1,500 - R3,500</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold text-lg">4</div>
                  <h3 className="text-2xl font-bold text-[#F0EDE8]">Apply for Firearm Licence</h3>
                </div>

                <p className="text-[#8A8E99] mb-4">
                  Return to the DFO with your competency certificate (or apply simultaneously if timing works out). This application is for the <strong className="text-[#F0EDE8]">specific firearm</strong> with its serial number.
                </p>

                <div className="bg-[#0D0F13] rounded-sm p-4 space-y-3">
                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">Required Documents:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                      <li>Certified copy of SA ID</li>
                      <li>Proof of address (not older than 3 months)</li>
                      <li>SAPS Competency Certificate</li>
                      <li>Training certificates (some DFOs request this)</li>
                      <li>Dealer's invoice with firearm details (make, model, serial number)</li>
                      <li>Dealer's declaration (SAPS 350(a) - completed by dealer)</li>
                      <li>Photos of your safe (3 photos: closed, open, bolts)</li>
                      <li>Two passport-sized color photos</li>
                      <li><strong className="text-[#C9922A]">Detailed written motivation</strong> (most critical part!)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">Form to Complete:</h4>
                    <p className="text-[#8A8E99]">SAPS 271 (Application for Licence to Possess a Firearm) - in <strong>black ink only</strong></p>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-3">
                    <h4 className="text-red-400 font-semibold mb-2">⚠️ The Motivation Letter (Critical!):</h4>
                    <p className="text-[#8A8E99] mb-2">
                      This is where most applications succeed or fail. You must write a detailed letter explaining <strong>why you need this specific firearm</strong>.
                    </p>
                    <p className="text-[#8A8E99] text-sm">
                      <strong className="text-[#F0EDE8]">For self-defence:</strong> Explain your security situation, crime in your area, work hours, travel patterns, why you feel at risk.
                    </p>
                    <p className="text-[#8A8E99] text-sm mt-1">
                      <strong className="text-[#F0EDE8]">For hunting/sport:</strong> Include hunting invitations, club membership, competition results, photos of past hunts.
                    </p>
                    <p className="text-[#8A8E99] text-sm mt-2">
                      <strong>Pro Tip:</strong> Many people hire professional motivation services (R800-R1,500) to ensure quality.
                    </p>
                  </div>

                  <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm p-3">
                    <h4 className="text-[#F0EDE8] font-semibold mb-2">💡 Application Tips:</h4>
                    <ul className="list-disc list-inside text-[#8A8E99] space-y-1 text-sm">
                      <li>Use black ink only on all forms</li>
                      <li>Do NOT ring-bind your documents (SAPS rejects this)</li>
                      <li>Number your pages (e.g., 1/25, 2/25)</li>
                      <li>Keep a complete copy before submitting</li>
                      <li>Be polite to your DFO - they are your gatekeeper</li>
                      <li>One missing signature can delay you by months</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#C9922A] font-bold">SAPS Fee:</span>
                    <span className="text-[#F0EDE8]">R183</span>
                    <span className="text-[#8A8E99] text-sm">(cash or bank-guaranteed cheque only)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C9922A] font-bold">Processing Time:</span>
                    <span className="text-[#F0EDE8]">3-6 months typically (can be longer)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C9922A] font-bold">What Happens:</span>
                    <span className="text-[#8A8E99] text-sm">DFO inspects your safe, processes application, CFR approves, licence printed</span>
                  </div>
                </div>
              </div>

              {/* Collection */}
              <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-md p-6">
                <h3 className="text-xl font-bold text-[#F0EDE8] mb-3">✅ Collecting Your Firearm</h3>
                <p className="text-[#8A8E99] mb-3">
                  Once approved, you'll receive notification to collect your licence at the DFC. You then have <strong className="text-[#F0EDE8]">90 days</strong> to collect your firearm from the dealer.
                </p>
                <p className="text-[#8A8E99]">
                  The dealer will complete the Section 60 transfer process with you at SAPS before handing over the firearm.
                </p>
              </div>
            </div>
          </section>

          {/* Licence Types Table */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-6">
              Licence Categories (FCA Sections)
            </h2>

            <div className="bg-[#191C23] border border-white/5 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#0D0F13]">
                      <th className="text-left p-4 text-[#C9922A] font-bold border-b border-white/10">Section</th>
                      <th className="text-left p-4 text-[#C9922A] font-bold border-b border-white/10">Type</th>
                      <th className="text-left p-4 text-[#C9922A] font-bold border-b border-white/10">Purpose</th>
                      <th className="text-left p-4 text-[#C9922A] font-bold border-b border-white/10">Limit</th>
                      <th className="text-left p-4 text-[#C9922A] font-bold border-b border-white/10">Validity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="p-4 text-[#F0EDE8] font-semibold">13</td>
                      <td className="p-4 text-[#F0EDE8]">Self-Defence</td>
                      <td className="p-4 text-[#8A8E99]">Personal protection</td>
                      <td className="p-4 text-[#8A8E99]">1 handgun or non-auto shotgun</td>
                      <td className="p-4 text-[#F0EDE8]">5 years</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-4 text-[#F0EDE8] font-semibold">14</td>
                      <td className="p-4 text-[#F0EDE8]">Restricted Self-Defence</td>
                      <td className="p-4 text-[#8A8E99]">Semi-auto rifles/shotguns (requires high proof of need)</td>
                      <td className="p-4 text-[#8A8E99]">Limited</td>
                      <td className="p-4 text-[#F0EDE8]">2 years</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="p-4 text-[#F0EDE8] font-semibold">15</td>
                      <td className="p-4 text-[#F0EDE8]">Occasional Hunting/Sport</td>
                      <td className="p-4 text-[#8A8E99]">Hobby hunters and sport shooters</td>
                      <td className="p-4 text-[#8A8E99]">4 firearms total (including Sec 13)</td>
                      <td className="p-4 text-[#F0EDE8]">10 years</td>
                    </tr>
                    <tr>
                      <td className="p-4 text-[#F0EDE8] font-semibold">16</td>
                      <td className="p-4 text-[#F0EDE8]">Dedicated Hunting/Sport</td>
                      <td className="p-4 text-[#8A8E99]">Serious shooters (accredited club membership required)</td>
                      <td className="p-4 text-[#C9922A] font-semibold">No limit</td>
                      <td className="p-4 text-[#F0EDE8]">10 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Cost Breakdown */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-6">
              Complete Cost Breakdown (2025/2026)
            </h2>

            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <p className="text-[#8A8E99] mb-4">
                While SAPS fees are low, the total cost adds up significantly:
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-[#F0EDE8]">Training & Proficiency (per module)</span>
                  <span className="text-[#C9922A] font-semibold">R2,000 - R2,500</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-[#F0EDE8]">SAPS Competency Fee</span>
                  <span className="text-[#C9922A] font-semibold">R92</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-[#F0EDE8]">SAPS Licence Fee</span>
                  <span className="text-[#C9922A] font-semibold">R183</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-[#F0EDE8]">The Firearm</span>
                  <span className="text-[#C9922A] font-semibold">R6,000 - R25,000+</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-[#F0EDE8]">SABS-Approved Safe</span>
                  <span className="text-[#C9922A] font-semibold">R1,500 - R3,500</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-[#F0EDE8]">Professional Motivation (optional)</span>
                  <span className="text-[#C9922A] font-semibold">R800 - R1,500</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-[#C9922A]/10 rounded-sm px-3 mt-3">
                  <span className="text-[#F0EDE8] font-bold text-lg">Estimated Total</span>
                  <span className="text-[#C9922A] font-bold text-lg">R10,500 - R33,000+</span>
                </div>
              </div>
            </div>
          </section>

          {/* Renewals */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-6">
              Licence Renewals
            </h2>

            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 space-y-4">
              <p className="text-[#F0EDE8]">
                You must renew your firearm licence <strong className="text-[#C9922A]">at least 90 days before expiry</strong>. Late renewals can result in criminal charges.
              </p>

              <div className="bg-[#0D0F13] rounded-sm p-4 space-y-3">
                <h3 className="text-[#F0EDE8] font-semibold mb-2">Renewal Fees (2025/2026):</h3>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>Firearm Licence Renewal: <strong className="text-[#C9922A]">R92 per firearm</strong></li>
                  <li>Competency Certificate Renewal: <strong className="text-[#C9922A]">R92</strong> (if required)</li>
                </ul>
              </div>

              <div className="bg-[#0D0F13] rounded-sm p-4 space-y-3">
                <h3 className="text-[#F0EDE8] font-semibold mb-2">Required Documents:</h3>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>Original firearm licence</li>
                  <li>South African ID</li>
                  <li>Training certificate (if renewing competency)</li>
                  <li>Four passport-sized color photos (not older than 3 months)</li>
                  <li>Proof of address (not older than 3 months)</li>
                  <li>Updated motivation (for Section 15/16)</li>
                  <li>Proof of continued membership (for Section 16)</li>
                </ul>
              </div>

              <div className="bg-[#0D0F13] rounded-sm p-4 space-y-3">
                <h3 className="text-[#F0EDE8] font-semibold mb-2">Forms to Complete:</h3>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>SAPS 518(a) - Renewal of Firearm Licence</li>
                  <li>SAPS 517(g) - Renewal of Competency (if applicable)</li>
                  <li>All forms in <strong>black ink only</strong></li>
                </ul>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4">
                <p className="text-red-400 font-semibold">⚠️ Critical Renewal Rule:</p>
                <p className="text-[#8A8E99] mt-2">
                  If you apply <strong>before 90 days of expiry</strong>, your existing licence remains valid until SAPS processes your renewal - no matter how long that takes. 
                  Always carry a copy of your payment receipt (Z263) with your licence as proof you've applied on time.
                </p>
              </div>
            </div>
          </section>

          {/* Pro Tips */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-6">
              Pro Tips for Success
            </h2>

            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="text-[#C9922A] text-xl flex-shrink-0">💡</span>
                  <div>
                    <h3 className="text-[#F0EDE8] font-semibold mb-1">Do All Competencies at Once</h3>
                    <p className="text-[#8A8E99]">
                      Even if you only want a handgun now, do the training for rifle and shotgun at the same time. 
                      It costs about the same per module and saves you from redoing the entire background check process later.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-[#C9922A] text-xl flex-shrink-0">💡</span>
                  <div>
                    <h3 className="text-[#F0EDE8] font-semibold mb-1">The DFO is Your Gatekeeper</h3>
                    <p className="text-[#8A8E99]">
                      Be polite, professional, and ensure your paperwork is 100% tidy. One missing signature or incorrectly filled form can set you back months.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-[#C9922A] text-xl flex-shrink-0">💡</span>
                  <div>
                    <h3 className="text-[#F0EDE8] font-semibold mb-1">Follow Up Regularly</h3>
                    <p className="text-[#8A8E99]">
                      Contact your DFO one month after submission to check status. After that, follow up twice weekly. 
                      Applications can get lost in the system.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-[#C9922A] text-xl flex-shrink-0">💡</span>
                  <div>
                    <h3 className="text-[#F0EDE8] font-semibold mb-1">Keep Complete Copies</h3>
                    <p className="text-[#8A8E99]">
                      Make a full photocopy of your entire application pack before submitting. Applications do get lost. 
                      Your receipt proves you submitted on time.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-[#C9922A] text-xl flex-shrink-0">💡</span>
                  <div>
                    <h3 className="text-[#F0EDE8] font-semibold mb-1">Invest in a Quality Motivation</h3>
                    <p className="text-[#8A8E99]">
                      If you're not a strong writer, consider hiring a professional motivation service (R800-R1,500). 
                      A weak motivation is the #1 reason applications are denied.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-[#C9922A] text-xl flex-shrink-0">💡</span>
                  <div>
                    <h3 className="text-[#F0EDE8] font-semibold mb-1">Start Renewal Early</h3>
                    <p className="text-[#8A8E99]">
                      Don't wait until the last minute. Start your renewal process 4-6 months before expiry to account for any delays.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Legal Disclaimer */}
          <section>
            <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-md p-6">
              <h3 className="text-xl font-bold text-[#F0EDE8] mb-3">⚖️ Legal Disclaimer</h3>
              <p className="text-[#8A8E99]">
                This guide provides general information about firearm ownership in South Africa based on the Firearms Control Act No. 60 of 2000. 
                It is <strong>not legal advice</strong>. Firearm laws are complex and subject to change. Requirements may vary between different 
                SAPS stations and DFOs. Always consult with your local Designated Firearm Centre and legal professionals for specific guidance 
                on your individual situation.
              </p>
              <p className="text-[#8A8E99] mt-3">
                Information current as of April 2026. SAPS fees and processes are subject to annual adjustments.
              </p>
            </div>
          </section>

          {/* Back to Home */}
          <div className="text-center pt-8">
            <Link 
              href="/" 
              className="inline-block bg-[#C9922A] text-black font-bold px-8 py-4 rounded-sm text-[14px] uppercase hover:brightness-110 transition-all"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
