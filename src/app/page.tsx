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
          {[['🛡','Verified Seller Profiles'],['⚖️','FCA Compliant Platform'],['🔔','Instant Listing Alerts'],['📍','Province-Based Search'],['🏪','Licensed Dealer Directory']].map(([icon, text], index) => (
            <div key={index} style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#8A8E99', fontWeight:500}}>
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
      <section style={{padding:'80px 32px', background:'#191C23', borderTop:'1px solid rgba(255,255,255,0
