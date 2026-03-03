import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import ListingCard from '@/components/listings/ListingCard'

// Placeholder listings until Supabase is connected
const DEMO_LISTINGS = [
  { id:'1', title:'CZ P-10 C 9mm Luger', make:'CZ', price:12500, province:'Gauteng', condition:'Brand New', category:'pistols', listingType:'dealer' as const, sellerName:'Gunstore Centurion', featured:true, calibre:'9mm Luger' },
  { id:'2', title:'Tikka T3x Lite .308 Win', make:'Tikka', price:18000, province:'Western Cape', condition:'Good', category:'rifles', listingType:'private' as const, sellerName:'Stellenbosch', calibre:'.308 Win' },
  { id:'3', title:'Beretta A400 Xcel Sporting 12ga', make:'Beretta', price:34900, province:'KZN', condition:'Brand New', category:'shotguns', listingType:'dealer' as const, sellerName:'Firearm World DBN', calibre:'12 Gauge' },
  { id:'4', title:'Vortex Viper PST Gen II 5-25x50', make:'Vortex', price:14000, province:'Gauteng', condition:'Like New', category:'accessories', listingType:'private' as const, sellerName:'Pretoria East', calibre:'34mm Tube' },
]

const CATEGORIES = [
  { slug:'pistols', label:'Pistols', icon:'🔫', count:'1,240' },
  { slug:'rifles', label:'Rifles', icon:'🎯', count:'1,820' },
  { slug:'shotguns', label:'Shotguns', icon:'💥', count:'540' },
  { slug:'revolvers', label:'Revolvers', icon:'🌀', count:'310' },
  { slug:'air-guns', label:'Air Guns', icon:'💨', count:'420' },
  { slug:'accessories', label:'Accessories', icon:'🎒', count:'2,100' },
]

export default function HomePage() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <Navbar />

      {/* Trust bar */}
      <div style={{background:'#1F2330', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'10px 32px'}}>
        <div style={{maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', gap:48, flexWrap:'wrap'}}>
          {[['🛡','Verified Seller Profiles'],['⚖️','FCA Compliant Platform'],['🔔','Instant Listing Alerts'],['📍','Province-Based Search'],['🏪','Licensed Dealer Directory']].map(([icon, text]) => (
            <div key={text} style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#8A8E99', fontWeight:500}}>
              <span style={{width:26, height:26, background:'rgba(201,146,42,0.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13}}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section style={{minHeight:'90vh', display:'flex', flexDirection:'column', justifyContent:'center', padding:'80px 32px 60px', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(201,146,42,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(201,146,42,0.04) 0%, transparent 60%)'}} />
        <div style={{position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'60px 60px'}} />

        <div style={{maxWidth:1280, margin:'0 auto', width:'100%', position:'relative', zIndex:1}}>

          {/* Tag */}
          <div style={{display:'inline-flex', alignItems:'center', gap:8, background:'rgba(201,146,42,0.1)', border:'1px solid rgba(201,146,42,0.2)', color:'#C9922A', fontSize:11, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', padding:'6px 14px', borderRadius:2, marginBottom:28}}>
            <span style={{width:6, height:6, background:'#C9922A', borderRadius:'50%'}} />
            South Africa&apos;s Freshest Firearms Classifieds
          </div>

          {/* H1 */}
          <h1 style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:'clamp(56px, 8vw, 100px)', lineHeight:0.93, letterSpacing:'-0.01em', textTransform:'uppercase', marginBottom:24, color:'#F0EDE8'}}>
            Buy &amp; Sell<br/>
            <span style={{color:'#C9922A'}}>Legally.</span>{' '}
            Confidently.
          </h1>

          <p style={{fontSize:17, color:'#8A8E99', lineHeight:1.6, maxWidth:520, marginBottom:40, fontWeight:300}}>
            The cleanest classified portal for licensed firearms in South Africa.
            Connect directly with verified dealers and private sellers — no middlemen, no direct sales.
          </p>

          {/* Search */}
          <div style={{display:'flex', maxWidth:780, background:'#191C23', border:'1px solid rgba(201,146,42,0.15)', borderRadius:4, overflow:'hidden', marginBottom:40}}>
            <select style={{background:'#1F2330', border:'none', borderRight:'1px solid rgba(255,255,255,0.07)', color:'#F0EDE8', fontFamily:"'Barlow', sans-serif", fontSize:13, fontWeight:500, padding:'0 20px', minWidth:160, cursor:'pointer', outline:'none'}}>
              <option>All Categories</option>
              <option>Pistols</option>
              <option>Rifles</option>
              <option>Shotguns</option>
              <option>Revolvers</option>
              <option>Air Guns</option>
              <option>Ammunition</option>
              <option>Accessories</option>
              <option>Reloading</option>
              <option>Knives</option>
              <option>Wanted</option>
            </select>
            <input
              type="text"
              placeholder="Search by make, model, calibre..."
              style={{flex:1, background:'transparent', border:'none', outline:'none', color:'#F0EDE8', fontFamily:"'Barlow', sans-serif", fontSize:15, padding:'18px 20px'}}
            />
            <select style={{background:'#1F2330', border:'none', borderLeft:'1px solid rgba(255,255,255,0.07)', color:'#8A8E99', fontFamily:"'Barlow', sans-serif", fontSize:13, padding:'0 20px', minWidth:140, cursor:'pointer', outline:'none'}}>
              <option value="">All Provinces</option>
              {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(p => <option key={p}>{p}</option>)}
            </select>
            <button style={{background:'#C9922A', border:'none', color:'#000', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:14, letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 28px', cursor:'pointer'}}>
              Search
            </button>
          </div>

          {/* Stats */}
          <div style={{display:'flex', gap:40, alignItems:'center'}}>
            {[['4,200+','Active Listings'],['180+','Verified Dealers'],['9','Provinces Covered'],['100%','FCA Compliant']].map(([num, label], i) => (
              <div key={label} style={{display:'flex', alignItems:'center', gap:40}}>
                {i > 0 && <div style={{width:1, height:40, background:'rgba(255,255,255,0.07)'}} />}
                <div style={{display:'flex', flexDirection:'column', gap:2}}>
                  <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:28, color:'#F0EDE8'}}>{num}</span>
                  <span style={{fontSize:12, color:'#8A8E99', letterSpacing:'0.05em', textTransform:'uppercase'}}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{padding:'80px 32px', background:'#191C23', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:1280, margin:'0 auto'}}>
          <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32}}>
            <div>
              <span style={{display:'block', fontSize:11, color:'#C9922A', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:4}}>Browse by type</span>
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:32, textTransform:'uppercase', letterSpacing:'0.05em', color:'#F0EDE8'}}>Categories</h2>
            </div>
            <Link href="/listings" style={{color:'#C9922A', textDecoration:'none', fontSize:13, fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase'}}>All categories →</Link>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:12}}>
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/listings?cat=${cat.slug}`} style={{background:'#111318', border:'1px solid rgba(255,255,255,0.06)', borderRadius:4, padding:'20px 16px', textDecoration:'none', display:'flex', flexDirection:'column', gap:10, transition:'all 0.2s'}}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background='#1F2330'; el.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background='#111318'; el.style.transform='translateY(0)'; }}
              >
                <span style={{fontSize:24}}>{cat.icon}</span>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:600, fontSize:15, letterSpacing:'0.05em', color:'#F0EDE8', textTransform:'uppercase'}}>{cat.label}</span>
                <span style={{fontSize:12, color:'#8A8E99'}}>{cat.count} listings</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS */}
      <section style={{padding:'80px 32px', background:'#191C23', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:1280, margin:'0 auto'}}>
          <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32}}>
            <div>
              <span style={{display:'block', fontSize:11, color:'#C9922A', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:4}}>Just posted</span>
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:32, textTransform:'uppercase', letterSpacing:'0.05em', color:'#F0EDE8'}}>Recent Listings</h2>
            </div>
            <Link href="/listings" style={{color:'#C9922A', textDecoration:'none', fontSize:13, fontWeight:500, letterSpacing:'0.05em', textTransform:'uppercase'}}>View all →</Link>
          </div>

          {/* Tabs */}
          <div style={{display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', marginBottom:32}}>
            {['All','🏪 Dealer Stock','👤 Private','🔔 Wanted'].map((tab, i) => (
              <button key={tab} style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:600, fontSize:14, letterSpacing:'0.1em', textTransform:'uppercase', padding:'12px 24px', border:'none', background:'transparent', color: i===0 ? '#C9922A' : '#8A8E99', borderBottom: i===0 ? '2px solid #C9922A' : '2px solid transparent', cursor:'pointer', marginBottom:-1}}>
                {tab}
              </button>
            ))}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16}}>
            {DEMO_LISTINGS.map(listing => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding:'80px 32px', background:'#111318', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:1280, margin:'0 auto'}}>
          <div style={{marginBottom:40}}>
            <span style={{display:'block', fontSize:11, color:'#C9922A', fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:4}}>Simple &amp; Safe</span>
            <h2 style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:32, textTransform:'uppercase', letterSpacing:'0.05em', color:'#F0EDE8'}}>How it Works</h2>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden'}}>
            {[
              ['01','🔍','Browse Listings','Search by category, calibre, province, price and condition. Filter by dealer stock or private listings. Save searches and get email alerts.'],
              ['02','💬','Contact the Seller','Reach out through secure messaging. View verified seller profiles and licence confirmations before making contact.'],
              ['03','🤝','Transact Legally','All transactions happen between buyer and seller in full compliance with the Firearms Control Act. We connect people — the legal transfer is yours to complete.'],
            ].map(([num, icon, title, desc], i) => (
              <div key={num} style={{padding:'40px 32px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', position:'relative'}}>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:80, color:'rgba(201,146,42,0.07)', lineHeight:1, position:'absolute', top:20, right:24}}>{num}</div>
                <div style={{width:48, height:48, background:'rgba(201,146,42,0.1)', border:'1px solid rgba(201,146,42,0.15)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:20}}>{icon}</div>
                <div style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:22, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:12, color:'#F0EDE8'}}>{title}</div>
                <p style={{fontSize:14, color:'#8A8E99', lineHeight:1.7}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEALER CTA */}
      <section style={{padding:'80px 32px', background:'#191C23', borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{maxWidth:1280, margin:'0 auto'}}>
          <div style={{background:'linear-gradient(135deg, rgba(201,146,42,0.08) 0%, rgba(201,146,42,0.03) 100%)', border:'1px solid rgba(201,146,42,0.15)', borderRadius:4, padding:48, display:'flex', alignItems:'center', justifyContent:'space-between', gap:32}}>
            <div>
              <h2 style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:40, textTransform:'uppercase', lineHeight:1, marginBottom:12, color:'#F0EDE8'}}>
                Grow Your <span style={{color:'#C9922A'}}>Dealership</span><br/>Online.
              </h2>
              <p style={{fontSize:15, color:'#8A8E99', maxWidth:480, lineHeight:1.6, marginBottom:20}}>
                List your full inventory on Calibre.ZA and reach thousands of active buyers across South Africa every month.
              </p>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {['Dedicated dealer storefront with your branding','Unlimited listings with bulk upload tools','Priority search placement and featured badges','Lead analytics and enquiry tracking dashboard'].map(f => (
                  <div key={f} style={{display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#F0EDE8'}}>
                    <span style={{width:16, height:16, background:'rgba(42,156,110,0.1)', border:'1px solid rgba(42,156,110,0.4)', borderRadius:'50%', display:'inline-block', flexShrink:0}} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:12, flexShrink:0}}>
              <Link href="/dealers/apply" style={{background:'#C9922A', color:'#000', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:14, letterSpacing:'0.1em', textTransform:'uppercase', padding:'16px 28px', borderRadius:3, textDecoration:'none', textAlign:'center', minWidth:220, display:'block'}}>
                Apply for Dealer Account
              </Link>
              <Link href="/pricing" style={{background:'transparent', border:'1px solid rgba(201,146,42,0.4)', color:'#C9922A', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:14, letterSpacing:'0.1em', textTransform:'uppercase', padding:'16px 28px', borderRadius:3, textDecoration:'none', textAlign:'center', display:'block'}}>
                View Pricing Plans
              </Link>
              <p style={{fontSize:12, color:'#8A8E99', textAlign:'center', lineHeight:1.5}}>Free 30-day trial for licensed dealers.<br/>Cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:'#0D0F13', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'60px 32px 32px'}}>
        <div style={{maxWidth:1280, margin:'0 auto'}}>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:48}}>
            <div>
              <div style={{marginBottom:16}}>
                <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:22, letterSpacing:'0.15em', color:'#F0EDE8', textTransform:'uppercase'}}>CALIBRE<span style={{color:'#C9922A'}}>.</span>ZA</span>
              </div>
              <p style={{fontSize:13, color:'#8A8E99', lineHeight:1.7, maxWidth:280}}>South Africa&apos;s cleanest classified portal for legal firearms. Connecting licensed dealers and private sellers with buyers across all nine provinces.</p>
              <div style={{marginTop:20, display:'inline-flex', alignItems:'center', gap:8, background:'rgba(201,146,42,0.06)', border:'1px solid rgba(201,146,42,0.15)', padding:'8px 14px', borderRadius:3, fontSize:11, color:'#8A8E99'}}>
                <span style={{color:'#C9922A', fontWeight:600}}>FCA</span> Compliant · POPI Act Registered
              </div>
            </div>
            {[
              ['Browse', ['Pistols','Rifles','Shotguns','Revolvers','Air Guns','Accessories','Ammunition']],
              ['Platform', ['How it Works','Dealer Directory','Post a Listing','Dealer Plans','Price Guide']],
              ['Company', ['About Us','Contact','FAQs','Blog','Report a Listing']],
            ].map(([heading, links]) => (
              <div key={heading}>
                <h4 style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:13, letterSpacing:'0.15em', textTransform:'uppercase', color:'#F0EDE8', marginBottom:16}}>{heading}</h4>
                <ul style={{listStyle:'none', display:'flex', flexDirection:'column', gap:10}}>
                  {(links as string[]).map(link => (
                    <li key={link}><Link href="#" style={{fontSize:13, color:'#8A8E99', textDecoration:'none'}}>{link}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:24, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, color:'#8A8E99'}}>
            <div>© 2026 Calibre.ZA — All rights reserved</div>
            <div style={{display:'flex', gap:20}}>
              {['Terms of Use','Privacy Policy','POPI Act','Legal Disclaimer'].map(l => (
                <Link key={l} href="#" style={{color:'#8A8E99', textDecoration:'none'}}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
