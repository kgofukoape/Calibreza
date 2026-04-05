'use client';

import React from 'react';
import Link from 'next/link';

export default function FirearmOwnershipGuidePage() {
  return (
    <div className="min-h-screen bg-[#0D0F13]">
      {/* Hero Section */}
      <div className="bg-[#191C23] border-b border-white/5 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-5xl font-extrabold uppercase text-[#F0EDE8] mb-4">
            Firearm Ownership in South Africa
          </h1>
          <p className="text-lg text-[#8A8E99]">
            A comprehensive guide to legally owning firearms under the Firearms Control Act (Act 60 of 2000)
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Legal Framework */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-4">
              Legal Framework
            </h2>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 space-y-4">
              <p className="text-[#F0EDE8]">
                Firearm ownership in South Africa is governed by the <strong>Firearms Control Act (Act 60 of 2000)</strong> and 
                its regulations. The Act aims to regulate the possession, use, and transfer of firearms and ammunition.
              </p>
              <p className="text-[#F0EDE8]">
                All firearm owners must comply with strict legal requirements, including competency certification, 
                safe storage, and regular licence renewals. Non-compliance can result in criminal charges and confiscation.
              </p>
            </div>
          </section>

          {/* Types of Licences */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-4">
              Types of Firearm Licences
            </h2>
            <div className="space-y-4">
              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <h3 className="text-xl font-bold text-[#F0EDE8] mb-2">Section 13 - Self-Defence</h3>
                <p className="text-[#8A8E99] mb-3">
                  Allows ownership of one handgun for personal protection. You must demonstrate a need for self-defence 
                  and complete firearm training.
                </p>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>Maximum: 1 handgun</li>
                  <li>Requires competency certificate</li>
                  <li>Must prove need for self-defence</li>
                  <li>Licence valid for 5 years</li>
                </ul>
              </div>

              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <h3 className="text-xl font-bold text-[#F0EDE8] mb-2">Section 15 - Dedicated Sport Shooting</h3>
                <p className="text-[#8A8E99] mb-3">
                  For sport shooters who are active members of accredited shooting associations. Allows multiple firearms 
                  for competitive shooting disciplines.
                </p>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>Must be active member of accredited association</li>
                  <li>Requires participation in minimum 4 competitions per year</li>
                  <li>Can own up to 4 firearms per discipline</li>
                  <li>Dedicated status required for more than 4 firearms</li>
                </ul>
              </div>

              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <h3 className="text-xl font-bold text-[#F0EDE8] mb-2">Section 16 - Occasional Hunting & Sport</h3>
                <p className="text-[#8A8E99] mb-3">
                  Allows ownership of firearms for hunting and occasional sport shooting activities.
                </p>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>Maximum: 4 firearms total</li>
                  <li>Can include rifles, shotguns, and handguns</li>
                  <li>Must provide motivation for each firearm</li>
                  <li>Licence valid for 5 years</li>
                </ul>
              </div>

              <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
                <h3 className="text-xl font-bold text-[#F0EDE8] mb-2">Section 17 - Dedicated Hunter</h3>
                <p className="text-[#8A8E99] mb-3">
                  For serious hunters who regularly participate in hunting activities. Allows ownership of multiple firearms 
                  suitable for different game species.
                </p>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>Must demonstrate regular hunting activity</li>
                  <li>Requires proof of hunting (permits, photos, etc.)</li>
                  <li>Can own multiple rifles and shotguns</li>
                  <li>Dedicated status available for collectors</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Application Process */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-4">
              Application Process
            </h2>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold">1</div>
                    <h3 className="text-lg font-bold text-[#F0EDE8]">Obtain Competency Certificate</h3>
                  </div>
                  <p className="text-[#8A8E99] ml-11">
                    Complete an accredited firearm training course and pass both theoretical and practical assessments. 
                    The competency certificate is valid for life but must be presented when applying for licences.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold">2</div>
                    <h3 className="text-lg font-bold text-[#F0EDE8]">Gather Required Documents</h3>
                  </div>
                  <ul className="list-disc list-inside text-[#8A8E99] ml-11 space-y-1">
                    <li>Certified copy of ID</li>
                    <li>Proof of residential address (not older than 3 months)</li>
                    <li>Competency certificate</li>
                    <li>Motivation for licence application</li>
                    <li>Safe storage affidavit (affidavit from spouse if married)</li>
                    <li>Proof of membership (for Section 15/17)</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold">3</div>
                    <h3 className="text-lg font-bold text-[#F0EDE8]">Submit Application at SAPS DFC</h3>
                  </div>
                  <p className="text-[#8A8E99] ml-11">
                    Visit your nearest Designated Firearm Centre (DFC) at a SAPS station. Submit all documents and 
                    complete the SAPS 271 application form. You'll be fingerprinted and photographed.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold">4</div>
                    <h3 className="text-lg font-bold text-[#F0EDE8]">Police Verification & Waiting Period</h3>
                  </div>
                  <p className="text-[#8A8E99] ml-11">
                    SAPS will conduct background checks, verify your safe storage, and assess your suitability. 
                    Processing times vary from 3 months to over 1 year depending on your DFC and application type.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#C9922A] flex items-center justify-center text-black font-bold">5</div>
                    <h3 className="text-lg font-bold text-[#F0EDE8]">Collect Your Licence</h3>
                  </div>
                  <p className="text-[#8A8E99] ml-11">
                    Once approved, you'll receive notification to collect your licence at the DFC. You can then purchase 
                    your firearm and must take possession within 90 days of licence approval.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Competency Requirements */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-4">
              Competency Certificate Requirements
            </h2>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 space-y-4">
              <p className="text-[#F0EDE8]">
                Before applying for any firearm licence, you must obtain a competency certificate. Training covers:
              </p>
              <ul className="list-disc list-inside text-[#8A8E99] space-y-2">
                <li>Firearm safety rules and handling</li>
                <li>South African firearm legislation</li>
                <li>Safe storage requirements</li>
                <li>Practical shooting assessment</li>
                <li>Written examination (minimum 70% pass rate)</li>
              </ul>
              <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-sm p-4 mt-4">
                <p className="text-[#F0EDE8] font-medium">
                  <strong>Important:</strong> Competency certificates are issued per firearm type (handgun, rifle, shotgun). 
                  You need a separate competency for each type you wish to own.
                </p>
              </div>
            </div>
          </section>

          {/* Licence Renewals */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-4">
              Licence Renewals
            </h2>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 space-y-4">
              <p className="text-[#F0EDE8]">
                Firearm licences are valid for 5 years from the date of issue. Renewal applications must be submitted 
                <strong> 90 days before expiry</strong>.
              </p>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#F0EDE8]">Renewal Requirements:</h3>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>Certified copy of ID</li>
                  <li>Proof of address (not older than 3 months)</li>
                  <li>Current firearm licence</li>
                  <li>Competency certificate</li>
                  <li>Updated motivation (for Section 15/17)</li>
                  <li>Proof of continued membership (for Section 15/17)</li>
                  <li>Safe storage affidavit</li>
                </ul>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mt-4">
                <p className="text-red-400 font-medium">
                  <strong>Warning:</strong> Possession of a firearm with an expired licence is a criminal offence. 
                  You must hand in your firearm at SAPS if your licence expires before renewal is approved.
                </p>
              </div>
            </div>
          </section>

          {/* Storage Requirements */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-4">
              Safe Storage Requirements
            </h2>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 space-y-4">
              <p className="text-[#F0EDE8]">
                All firearms must be stored in SAPS-approved safes that meet specific standards:
              </p>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#F0EDE8]">Minimum Requirements:</h3>
                <ul className="list-disc list-inside text-[#8A8E99] space-y-1">
                  <li>Safe must be made of steel with minimum 2mm body thickness</li>
                  <li>Door thickness minimum 4mm</li>
                  <li>Locking mechanism with at least 3 locking points</li>
                  <li>Safe must be bolted to floor or wall</li>
                  <li>Firearms and ammunition must be stored separately</li>
                </ul>
              </div>
              <p className="text-[#F0EDE8]">
                SAPS may inspect your safe storage during the application process and renewal. Inadequate storage 
                can result in licence denial or revocation.
              </p>
            </div>
          </section>

          {/* Buying & Selling */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-4">
              Buying & Selling Firearms
            </h2>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-[#F0EDE8]">Legal Purchase Process:</h3>
                <ol className="list-decimal list-inside text-[#8A8E99] space-y-2">
                  <li>Obtain firearm licence from SAPS (application approved)</li>
                  <li>Identify firearm from licensed dealer or private seller</li>
                  <li>Complete Section 60 transfer at DFC with seller present</li>
                  <li>SAPS verifies both parties' documentation</li>
                  <li>Transfer approved and recorded on Central Firearms Register</li>
                  <li>Take possession of firearm (must occur within 90 days of licence approval)</li>
                </ol>
              </div>

              <div className="space-y-3 mt-6">
                <h3 className="text-lg font-bold text-[#F0EDE8]">Legal Sale Process:</h3>
                <ol className="list-decimal list-inside text-[#8A8E99] space-y-2">
                  <li>Verify buyer has valid firearm licence for that firearm type</li>
                  <li>Both parties visit DFC together with ID and licences</li>
                  <li>Complete SAPS 259 (transfer) form</li>
                  <li>SAPS verifies buyer's licence is valid and matches firearm type</li>
                  <li>Transfer recorded and seller's licence cancelled</li>
                </ol>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mt-4">
                <p className="text-red-400 font-medium">
                  <strong>Illegal Transfers:</strong> Selling or transferring a firearm without proper SAPS Section 60 
                  documentation is a criminal offence carrying severe penalties including imprisonment.
                </p>
              </div>
            </div>
          </section>

          {/* Common Mistakes */}
          <section>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-3xl font-bold uppercase text-[#C9922A] mb-4">
              Common Mistakes to Avoid
            </h2>
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-red-400 flex-shrink-0">❌</span>
                  <div>
                    <strong className="text-[#F0EDE8]">Not renewing on time:</strong>
                    <p className="text-[#8A8E99]">Submit renewal 90 days before expiry. Late renewals can result in criminal charges.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400 flex-shrink-0">❌</span>
                  <div>
                    <strong className="text-[#F0EDE8]">Inadequate safe storage:</strong>
                    <p className="text-[#8A8E99]">Ensure your safe meets SAPS specifications before applying. Inspections are mandatory.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400 flex-shrink-0">❌</span>
                  <div>
                    <strong className="text-[#F0EDE8]">Incomplete applications:</strong>
                    <p className="text-[#8A8E99]">Missing documents cause significant delays. Verify all requirements before submitting.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400 flex-shrink-0">❌</span>
                  <div>
                    <strong className="text-[#F0EDE8]">Not updating address changes:</strong>
                    <p className="text-[#8A8E99]">Notify SAPS DFC within 30 days of moving. Failure to do so is an offence.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400 flex-shrink-0">❌</span>
                  <div>
                    <strong className="text-[#F0EDE8]">Transporting without proper documentation:</strong>
                    <p className="text-[#8A8E99]">Always carry your licence when transporting firearms. Keep ammunition separate.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Important Notice */}
          <section>
            <div className="bg-[#C9922A]/10 border border-[#C9922A]/30 rounded-md p-6">
              <h3 className="text-xl font-bold text-[#F0EDE8] mb-3">Important Legal Disclaimer</h3>
              <p className="text-[#8A8E99]">
                This guide provides general information about firearm ownership in South Africa. It is not legal advice. 
                Firearm laws are complex and subject to change. Always consult with SAPS Designated Firearm Centres 
                and legal professionals for specific guidance on your situation.
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
