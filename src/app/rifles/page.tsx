import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ListingCard from '@/components/listings/ListingCard';

// Temporary Mock Data for Rifles
const DEMO_LISTINGS = [
  { id:'2', title:'Tikka T3x Lite .308 Win', make:'Tikka', price:18000, province:'Western Cape', condition:'Good', category:'rifles', listingType:'private' as const, sellerName:'Stellenbosch', featured:true, calibre:'.308 Win' },
  { id:'6', title:'Howa 1500 6.5 Creedmoor', make:'Howa', price:11000, province:'Eastern Cape', condition:'Like New', category:'rifles', listingType:'dealer' as const, sellerName:'PE Firearms', calibre:'6.5 Creedmoor' },
  { id:'7', title:'Sako 85 Hunter .30-06', make:'Sako', price:38500, province:'Gauteng', condition:'Brand New', category:'rifles', listingType:'dealer' as const, sellerName:'Safari Outdoor', calibre:'.30-06 Sprg' },
  { id:'8', title:'Musgrave RSA .308 Target', make:'Musgrave', price:14500, province:'Free State', condition:'Fair', category:'rifles', listingType:'private' as const, sellerName:'Bloemfontein', calibre:'.308 Win' },
  { id:'9', title:'Ruger Precision Rifle .338 Lapua', make:'Ruger', price:45000, province:'KZN', condition:'Like New', category:'rifles', listingType:'private' as const, sellerName:'Durban North', calibre:'.338 LM' },
  { id:'10', title:'CZ 457 Varmint .22 LR', make:'CZ', price:13200, province:'Western Cape', condition:'Brand New', category:'rifles', listingType:'dealer' as const, sellerName:'Cape Gunsmiths', calibre:'.22 LR' },
  { id:'14', title:'DM-4 AR-15 5.56mm', make:'DM-4', price:22000, province:'Gauteng', condition:'Brand New', category:'rifles', listingType:'dealer' as const, sellerName:'Centurion Arms', calibre:'5.56x45mm' },
  { id:'15', title:'BRNO ZKK 600 .30-06', make:'BRNO', price:9500, province:'Limpopo', condition:'Good', category:'rifles', listingType:'private' as const, sellerName:'Polokwane', calibre:'.30-06 Sprg' },
];

export default function RiflesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0D0F13] w-full">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#191C23] border-b border-white/5 pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-[11px] text-[#8A8E99] tracking-widest uppercase mb-3 flex items-center gap-2">
            <Link href="/" className="hover:text-[#C9922A] transition-colors">Home</Link> 
            <span>/</span> 
            <span className="text-[#F0EDE8]">Rifles</span>
          </div>
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-extrabold text-4xl md:text-5xl tracking-wide uppercase text-[#F0EDE8]">
            Browse <span className="text-[#C9922A]">Rifles</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-[1280px] mx-auto w-full px-6 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* SIDEBAR FILTERS */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
          
          <div className="bg-[#191C23] border border-white/5 rounded-md p-5 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span style={{fontFamily:"'Barlow Condensed', sans-serif"}} className="font-bold text-[18px] tracking-widest uppercase text-[#F0EDE8]">Filters</span>
              <button className="text-[11px] text-[#C9922A] uppercase tracking-wider hover:underline">Clear All</button>
            </div>

            {/* Action Type Filter */}
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Action Type</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Bolt-Action', 'Semi-Automatic', 'Lever-Action', 'Pump-Action', 
                  'Single-Shot', 'Break-Action', 'Straight-Pull Bolt', 'Falling Block', 
                  'Rolling Block', 'Martini Action', 'Other'
                ].map(action => (
                  <label key={action} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{action}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE RIFLE BRANDS (From PDF) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Brand</span>
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'Accuracy International', 'Adams Arms', 'Aero Precision', 'Akkar', 'Alex Henry', 'American Precision Arms', 'American Sharps', 'American Tactical', 'Anschütz', 'AR-15 Platform', 'Armalite', 'Armi Sport', 'Armscor', 'Army & Navy', 'Armsport', 'Ashbury Precision Ordnance', 'Atkin Grant & Lang', 'Auguste Francotte', 'Austin & Halleck', 'Australian Martini', 'Baikal', 'Ballard Rifle', 'Barrett', 'Bass Pro', 'BCM', 'Benelli', 'Bergara', 'Beretta', 'Big Horn Armory', 'Bland & Son', 'Blaser', 'Boss & Co', 'Bowen Classic Arms', 'BRNO', 'Browning', 'Bruchet', 'BSA', 'C Sharps Arms', 'Cabela\'s', 'Cadex Defence', 'Caesar Guerini', 'Caledonian', 'Century Arms', 'Chaparral Arms', 'Chapuis', 'Charles Daly', 'Charles Lancaster', 'Cheytac', 'Chiappa', 'Christensen Arms', 'Churchill', 'Cimarron', 'Citadel', 'CMMG', 'Cogswell & Harrison', 'Colt', 'Connecticut Valley Arms', 'Cooper Firearms', 'Curtis Custom', 'CVA', 'CZ', 'Daniel Defense', 'Dashprod', 'Davide Pedersoli', 'Desert Tech', 'Dickinson', 'Dixie Gun Works', 'DM-4', 'Doug Turnbull', 'Dumoulin', 'EMF Company', 'Euroarms', 'Fabarm', 'Fair', 'Famars', 'Fausti', 'Feinwerkbau', 'FN Herstal', 'Franchi', 'Francotte', 'GA Precision', 'Gibbs', 'Greener', 'Gunwerks', 'Haenel', 'H&R', 'Hatsan', 'Heckler & Koch (HK)', 'Henry', 'Heym', 'High Standard', 'Holland & Holland', 'Howa', 'Huglu', 'IAB', 'Impact Precision', 'Inter Ordnance', 'Interarms', 'Investarm', 'IO Inc', 'Ithaca', 'IWI', 'Jeffery', 'Joseph Lang', 'JP Enterprises', 'Kalashnikov / AK', 'Kel-Tec', 'Kimber', 'Knight Rifles', 'Kolar', 'Krieghoff', 'Krico', 'Larue Tactical', 'Lazzeroni', 'Lebeau-Courally', 'Lee-Enfield', 'Legacy Sports', 'Les Baer', 'Log Cabin Shop', 'Lone Star Rifle', 'LWRC', 'Lyman', 'Magpul', 'Magnum Research', 'Marlin', 'Mauser', 'McMillan', 'Merkel', 'Miroku', 'Mitchell\'s Mausers', 'Montana Armory', 'Mossberg', 'Musgrave', 'Navy Arms', 'New England Firearms', 'New Zealand Carbine', 'Norinco', 'Nosler', 'Noveske', 'Palmetto State Armory', 'Parker Hale', 'Pedersoli', 'Perazzi', 'Pietta', 'POF USA', 'Pointer', 'Proof Research', 'Puma', 'Purdey', 'Remington', 'Rigby', 'Rizzini', 'Robinson Armament', 'Rock Island Armory', 'Rock River Arms', 'Rossi', 'Ruger', 'Sabatti', 'SAI', 'Sako', 'Sauer', 'Savage', 'Scottish Arms', 'Seekins Precision', 'Shilen', 'Shiloh Sharps', 'Sig Sauer', 'Smith & Wesson', 'Springfield Armory', 'Stag Arms', 'Stevens', 'Steyr', 'Stoeger', 'Strasser', 'Surgeon Rifles', 'Swiss Arms', 'Taurus', 'Taylor\'s & Co', 'Tennessee Valley Muzzleloading', 'Thompson Center', 'Tikka', 'Track of the Wolf', 'Traditions', 'Troy Industries', 'Uberti', 'Unique Alpine', 'Vektor', 'Verney-Carron', 'Victrix Armaments', 'Voere', 'Vz58', 'Watson Bros', 'Weatherby', 'Westley Richards', 'Wild West Guns', 'Wilson Combat', 'Winchester', 'Windham Weaponry', 'Wyoming Arms', 'Yildiz', 'Zanardini', 'Zastava', 'Zealot', 'Other'
                ].map(brand => (
                  <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* EXHAUSTIVE RIFLE CALIBRES (From PDF) */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Calibre</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  '.11mm Beaumont', '.11mm Grass', '.17 HMR', '.204 Ruger', '.218 Bee', '.22 Hornet', '.22 LR', '.22 WMR', '.22-250 Remington', '.223 Remington', '.224 Valkyrie', '.243 Winchester', '.25 Remington', '.25-20 Winchester', '.25-35 Winchester', '.257 Weatherby Magnum', '.260 Remington', '.270 Winchester', '.277 Fury', '.297/230 Morris', '.30 Carbine', '.30 Herrett', '.30 Remington', '.30 Remington AR', '.30-06 Springfield', '.30-30 Winchester', '.30-40 Krag', '.300 Blackout', '.300 H&H Magnum', '.300 Norma Magnum', '.300 PRC', '.300 Savage', '.300 Weatherby Magnum', '.300 Winchester Magnum', '.300 WSM', '.303 British', '.307 Winchester', '.308 Winchester', '.310 Cadet', '.315 BSA', '.32 Winchester Special', '.32-20 Winchester', '.32-40 Winchester', '.338 Federal', '.338 Lapua Magnum', '.338 Norma Magnum', '.338 Winchester Magnum', '.348 Winchester', '.35 Remington', '.350 Legend', '.350 Remington Magnum', '.356 Winchester', '.357 Magnum', '.357 Maximum', '.360 No.2', '.375 H&H Magnum', '.375 Winchester', '.38 Special', '.38-40 Winchester', '.38-55 Winchester', '.38-56 Winchester', '.38-72 Winchester', '.40 S&W', '.40-60 Winchester', '.40-65 Winchester', '.40-70 Sharps', '.40-82 Winchester', '.40-90 Sharps', '.401 Winchester', '.402 Martini', '.404 Jeffery', '.405 Winchester', '.41 Magnum', '.416 Barrett', '.416 Remington Magnum', '.416 Rigby', '.43 Egyptian', '.43 Spanish', '.44 Magnum', '.44-100 Sharps', '.44-105 Sharps', '.44-40 Winchester', '.44-77 Sharps', '.44-90 Sharps', '.444 Marlin', '.45 ACP', '.45 Colt', '.45-110 Winchester', '.45-120 Sharps', '.45-70 Government', '.45-75 Winchester', '.45-90 Winchester', '.450 Bushmaster', '.450 Marlin', '.450 Martini', '.450/400 Nitro Express', '.458 SOCOM', '.458 Winchester Magnum', '.461 Gibbs', '.465 H&H', '.470 Nitro Express', '.50 Beowulf', '.50 BMG', '.50-110 Winchester', '.50-140 Sharps', '.50-70 Government', '.50-90 Sharps', '.500 Jeffery', '.500 Nitro Express', '.500/450 Martini', '.577 Martini', '.577 Nitro Express', '.577/450 Martini-Henry', '.600 Nitro Express', '.600/577 Rewa', '.700 Nitro Express', '10mm Auto', '4.6x30mm', '5.45x39mm', '5.56x45mm NATO', '5.7x28mm', '6.5 Creedmoor', '6.5 Grendel', '6.5 PRC', '6.5x55 Swedish', '6.8 SPC', '6.8x51mm', '6mm ARC', '6mm Creedmoor', '7.62x39mm', '7.62x51mm NATO', '7.62x54mmR', '7mm Rem Mag', '7mm-08 Remington', '7x57mm Mauser', '7x64mm', '7x65mmR', '8.6 Blackout', '8x57mm IS', '8x57mm Mauser', '8x57mmR', '8x68mmS', '9.3x62mm', '9.3x74mmR', '9mm Luger', '9x39mm', 'Other'
                ].map(calibre => (
                  <label key={calibre} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors truncate">{calibre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Province Filter */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Location</span>
              <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'].map(prov => (
                  <label key={prov} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{prov}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Condition</span>
              <div className="flex flex-col gap-2.5">
                {['Brand New', 'Like New', 'Good', 'Fair'].map(cond => (
                  <label key={cond} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                    <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">{cond}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Price Range</span>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="Min (R)" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
                <span className="text-[#8A8E99]">-</span>
                <input type="number" placeholder="Max (R)" className="w-full bg-[#0D0F13] border border-white/10 rounded-sm px-3 py-2 text-[13px] text-[#F0EDE8] outline-none focus:border-[#C9922A]" />
              </div>
            </div>

            {/* Licence/Seller Type */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-5">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Seller Type</span>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Dealer Stock (🏪)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded-sm bg-[#0D0F13] border border-white/10 checked:bg-[#C9922A] checked:border-[#C9922A] appearance-none flex items-center justify-center relative after:content-['✓'] after:absolute after:text-black after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all flex-shrink-0" />
                  <span className="text-[14px] text-[#F0EDE8] group-hover:text-[#C9922A] transition-colors">Private Licence (👤)</span>
                </label>
              </div>
            </div>

          </div>
        </aside>

        {/* MAIN RESULTS AREA */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#191C23] border border-white/5 rounded-md p-4">
            <span className="text-[13px] text-[#8A8E99]">Showing <strong className="text-[#F0EDE8]">3,420</strong> results for Rifles</span>
            
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#8A8E99]">Sort by:</span>
              <select style={{fontFamily:"'Barlow', sans-serif"}} className="bg-[#0D0F13] border border-white/10 text-[#F0EDE8] text-[13px] font-medium px-4 py-2 rounded-sm cursor-pointer outline-none focus:border-[#C9922A] appearance-none min-w-[140px]">
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Condition: Best</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {DEMO_LISTINGS.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8">
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">&lt;</button>
            <button className="w-10 h-10 flex items-center justify-center border border-[#C9922A] bg-[#C9922A]/10 rounded-sm text-[#C9922A] font-bold transition-all">1</button>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">2</button>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">3</button>
            <span className="text-[#8A8E99] px-2">...</span>
            <button className="w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-[#8A8E99] hover:bg-white/5 hover:text-white transition-all">&gt;</button>
          </div>

        </div>
      </div>
    </div>
  );
}
