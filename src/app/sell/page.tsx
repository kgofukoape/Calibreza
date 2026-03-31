import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

async function getListing(id: string) {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      makes:make_id(name),
      calibres:calibre_id(name),
      provinces:province_id(name),
      conditions:condition_id(name),
      users:seller_id(full_name, email, phone, avatar_url, created_at)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-[#191C23] border-b border-white/5 py-4 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${listing.category_id}`} className="hover:text-[#C9922A] transition-colors capitalize">
              {listing.category_id}
            </Link>
            <span>/</span>
            <span className="text-[#F0EDE8]">{listing.title}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Image Gallery */}
            <div className="bg-[#191C23] rounded-md overflow-hidden border border-white/5">
              {listing.images && listing.images.length > 0 ? (
                <>
                  <div className="aspect-[4/3] relative bg-[#0D0F13]">
                    <img 
                      src={listing.images[0]} 
                      alt={listing.title}
                      className="w-full h-full object-contain"
                    />
                    {listing.images.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        1 / {listing.images.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Row */}
                  {listing.images.length > 1 && (
                    <div className="grid grid-cols-5 gap-2 p-4 bg-[#0D0F13]">
                      {listing.images.slice(0, 5).map((img: string, idx: number) => (
                        <div 
                          key={idx} 
                          className={`aspect-square bg-[#191C23] rounded-sm overflow-hidden cursor-pointer transition-all ${
                            idx === 0 ? 'border-2 border-[#C9922A]' : 'border border-white/10 hover:border-[#C9922A]'
                          }`}
                        >
                          <img src={img} alt={`${listing.title} ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-[4/3] bg-[#0D0F13] flex items-center justify-center">
                  <div className="text-center text-[#8A8E99]">
                    <div className="text-6xl mb-4">📷</div>
                    <div className="text-sm">No images available</div>
                  </div>
                </div>
              )}
            </div>

            {/* Title & Price */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-3xl md:text-4xl uppercase text-[#F0EDE8] mb-3">
                    {listing.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#8A8E99]">
                    <span className="flex items-center gap-1">
                      📍 {listing.city}, {listing.provinces?.name}
                    </span>
                    <span>•</span>
                    <span>Listed {new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-4xl md:text-5xl font-bold text-[#C9922A]">
                    R {listing.price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="bg-[#C9922A]/20 border border-[#C9922A]/30 text-[#C9922A] text-[11px] font-bold uppercase px-3 py-1.5 rounded-sm">
                  {listing.conditions?.name}
                </span>
                {listing.listing_type === 'dealer' && (
                  <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[11px] font-bold uppercase px-3 py-1.5 rounded-sm">
                    🏪 Dealer Stock
                  </span>
                )}
                {listing.listing_type === 'private' && (
                  <span className="bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[11px] font-bold uppercase px-3 py-1.5 rounded-sm">
                    👤 Private Licence
                  </span>
                )}
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-5 border-b border-white/5 pb-3">
                Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] mb-1">Make</div>
                  <div className="text-[15px] font-bold text-[#F0EDE8]">{listing.makes?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] mb-1">Model</div>
                  <div className="text-[15px] font-bold text-[#F0EDE8]">{listing.model || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] mb-1">Calibre</div>
                  <div className="text-[15px] font-bold text-[#F0EDE8]">{listing.calibres?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] mb-1">Condition</div>
                  <div className="text-[15px] font-bold text-[#F0EDE8]">{listing.conditions?.name || 'N/A'}</div>
                </div>
                {listing.action_type && (
                  <div>
                    <div className="text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] mb-1">Action</div>
                    <div className="text-[15px] font-bold text-[#F0EDE8]">{listing.action_type}</div>
                  </div>
                )}
                {listing.capacity && (
                  <div>
                    <div className="text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] mb-1">Capacity</div>
                    <div className="text-[15px] font-bold text-[#F0EDE8]">{listing.capacity}</div>
                  </div>
                )}
                {listing.barrel_length && (
                  <div>
                    <div className="text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] mb-1">Barrel Length</div>
                    <div className="text-[15px] font-bold text-[#F0EDE8]">{listing.barrel_length}</div>
                  </div>
                )}
                {listing.overall_length && (
                  <div>
                    <div className="text-[11px] font-bold tracking-widest uppercase text-[#8A8E99] mb-1">Overall Length</div>
                    <div className="text-[15px] font-bold text-[#F0EDE8]">{listing.overall_length}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-2xl uppercase text-[#F0EDE8] mb-5 border-b border-white/5 pb-3">
                Description
              </h2>
              <p className="text-[14px] text-[#F0EDE8] leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Legal Notice */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <div>
                  <div className="text-[13px] font-bold text-red-400 mb-1">Legal Compliance Required</div>
                  <p className="text-[12px] text-red-300/80">
                    The purchase and transfer of firearms in South Africa is regulated by the Firearms Control Act 60 of 2000. 
                    A valid firearm licence and adherence to SAPS procedures are mandatory.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Seller & Actions */}
          <div className="flex flex-col gap-6">
            
            {/* Contact Seller */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <button
                style={{fontFamily:"'Barlow Condensed', sans-serif"}}
                className="w-full bg-[#C9922A] text-black font-bold text-[16px] tracking-[0.1em] uppercase py-4 rounded-[3px] hover:brightness-110 transition-all shadow-[0_0_20px_rgba(201,146,42,0.3)] mb-4"
              >
                Contact Seller
              </button>
              <div className="flex gap-2">
                <button className="flex-1 bg-transparent border border-white/20 text-[#F0EDE8] text-[13px] font-bold uppercase py-3 rounded-sm hover:bg-white/5 transition-all">
                  💾 Save
                </button>
                <button className="flex-1 bg-transparent border border-white/20 text-[#F0EDE8] text-[13px] font-bold uppercase py-3 rounded-sm hover:bg-white/5 transition-all">
                  📤 Share
                </button>
                <button className="flex-1 bg-transparent border border-white/20 text-[#F0EDE8] text-[13px] font-bold uppercase py-3 rounded-sm hover:bg-white/5 transition-all">
                  🚩 Report
                </button>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl uppercase text-[#F0EDE8] mb-5 border-b border-white/5 pb-3">
                Seller Information
              </h3>
              
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-[#C9922A] flex items-center justify-center overflow-hidden">
                  {listing.users?.avatar_url?.startsWith('preset:') ? (
                    <span className="text-3xl">{listing.users.avatar_url.replace('preset:', '')}</span>
                  ) : listing.users?.avatar_url ? (
                    <img src={listing.users.avatar_url} alt="Seller" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="text-2xl font-bold text-black">
                      {listing.users?.full_name?.charAt(0) || 'S'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-[16px] text-[#F0EDE8] mb-1">{listing.users?.full_name}</div>
                  <div className="text-[12px] text-[#8A8E99]">
                    {listing.listing_type === 'dealer' ? 'Dealer' : 'Private Seller'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-green-400 text-sm">✓</span>
                <span className="text-[13px] text-[#8A8E99]">Responsive (avg. 24 hours)</span>
              </div>

              <div className="space-y-3 border-t border-white/5 pt-4">
                <div className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99] mb-3">Seller Stats</div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#8A8E99]">Active Listings</span>
                  <span className="text-[#F0EDE8] font-bold">1</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#8A8E99]">Successful Sales</span>
                  <span className="text-[#F0EDE8] font-bold">0</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#8A8E99]">Member Since</span>
                  <span className="text-[#F0EDE8] font-bold">
                    {new Date(listing.users?.created_at).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-[#191C23] border border-white/5 rounded-md p-6">
              <h3 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-xl uppercase text-[#F0EDE8] mb-4">
                Safety Tips
              </h3>
              <ul className="space-y-3 text-[13px] text-[#8A8E99]">
                <li className="flex items-start gap-2">
                  <span className="text-[#C9922A]">•</span>
                  <span>Meet in a safe, public location</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C9922A]">•</span>
                  <span>Verify the seller&apos;s licence and documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C9922A]">•</span>
                  <span>Inspect the firearm thoroughly before purchase</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C9922A]">•</span>
                  <span>Complete all SAPS transfer procedures</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
