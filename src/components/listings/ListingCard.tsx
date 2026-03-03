import Link from 'next/link'

interface ListingCardProps {
  id: string
  title: string
  make: string
  price: number
  province: string
  condition: string
  category: string
  listingType: 'dealer' | 'private'
  sellerName: string
  imageUrl?: string
  featured?: boolean
  calibre?: string
}

const ListingCard = ({
  id, title, make, price, province, condition,
  listingType, sellerName, imageUrl, featured, calibre
}: ListingCardProps) => {
  return (
    <Link href={`/listings/${id}`} style={{background:'#191C23', border:'1px solid rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden', textDecoration:'none', display:'flex', flexDirection:'column', color:'#F0EDE8'}}>
      <div style={{position:'relative', aspectRatio:'4/3', background:'#1F2330', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <span style={{fontSize:48, opacity:0.1}}>🔫</span>
        <div style={{position:'absolute', top:10, left:10, background: listingType==='dealer' ? 'rgba(42,156,110,0.12)' : 'rgba(74,127,193,0.12)', border: listingType==='dealer' ? '1px solid rgba(42,156,110,0.3)' : '1px solid rgba(74,127,193,0.3)', color: listingType==='dealer' ? '#2A9C6E' : '#4A7FC1', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' as const, padding:'3px 8px', borderRadius:2}}>
          {listingType === 'dealer' ? 'Dealer' : 'Private'}
        </div>
        {featured && <div style={{position:'absolute', top:10, right:10, background:'#C9922A', color:'#000', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:2}}>Featured</div>}
        <div style={{position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,0.6)', color:'#8A8E99', fontSize:10, padding:'3px 8px', borderRadius:2}}>{condition}</div>
      </div>
      <div style={{padding:'14px 16px', flex:1, display:'flex', flexDirection:'column', gap:6}}>
        <div style={{fontSize:11, color:'#C9922A', fontWeight:600, textTransform:'uppercase' as const}}>{make}</div>
        <div style={{fontWeight:600, fontSize:17, color:'#F0EDE8'}}>{title}</div>
        <div style={{display:'flex', gap:12, fontSize:12, color:'#8A8E99', marginTop:'auto', paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          {calibre && <span>📐 {calibre}</span>}
          <span>📍 {province}</span>
        </div>
      </div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.2)'}}>
        <div style={{fontWeight:700, fontSize:20, color:'#F0EDE8'}}>R {price.toLocaleString()}</div>
        <div style={{fontSize:12, color:'#8A8E99'}}>{sellerName}</div>
      </div>
    </Link>
  )
}

export default ListingCard
