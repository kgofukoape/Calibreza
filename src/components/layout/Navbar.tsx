'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div style={{background:'rgba(201,146,42,0.08)', borderBottom:'1px solid rgba(201,146,42,0.2)', padding:'8px 32px', textAlign:'center', fontSize:'12px', color:'#8A8E99'}}>
        🔒 All firearm listings require verified licence information —{' '}
        <Link href="/how-it-works" style={{color:'#C9922A', fontWeight:600}}>Learn how it works</Link>
      </div>
      <nav style={{position:'sticky', top:0, zIndex:50, background:'rgba(17,19,24,0.92)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,0.06)', height:64, display:'flex', alignItems:'center', padding:'0 32px'}}>
        <div style={{maxWidth:1280, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <Link href="/" style={{textDecoration:'none', display:'flex', flexDirection:'column', gap:2}}>
            <span style={{fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:22, letterSpacing:'0.15em', color:'#F0EDE8', textTransform:'uppercase', lineHeight:1}}>
              CALIBRE<span style={{color:'#C9922A'}}>.</span>ZA
            </span>
            <span style={{fontSize:9, letterSpacing:'0.3em', color:'#8A8E99', textTransform:'uppercase', fontWeight:500}}>Firearms Classifieds</span>
          </Link>

          <div style={{display:'flex', gap:28, alignItems:'center'}}>
            {[['/',  'Browse'], ['/dealers', 'Dealers'], ['/listings', 'Listings'], ['/services', 'Services']].map(([href, label]) => (
              <Link key={href} href={href} style={{color:'#8A8E99', textDecoration:'none', fontSize:12, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', transition:'color 0.2s'}}
                onMouseEnter={e => (e.currentTarget.style.color='#F0EDE8')}
                onMouseLeave={e => (e.currentTarget.style.color='#8A8E99')}
              >{label}</Link>
            ))}
          </div>

          <div style={{display:'flex', gap:12}}>
            <Link href="/auth/login" style={{background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#F0EDE8', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:600, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', padding:'8px 16px', borderRadius:3, textDecoration:'none'}}>
              Sign in
            </Link>
            <Link href="/post" style={{background:'#C9922A', color:'#000', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:12, letterSpacing:'0.1em', textTransform:'uppercase', padding:'8px 16px', borderRadius:3, textDecoration:'none'}}>
              + Post Ad
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}
