import AddToCartButton from './AddToCartButton'
import Image from 'next/image'
import { availableStock, formatPrice, sellingPrice, type ProductListItem } from '@/lib/products'

export default function ProductCard({p, rate}:{p:ProductListItem;rate:number}) {
  const stock = availableStock(p)
  const out = stock === 0
  const price = sellingPrice(p, rate)
  const priced = p.pricing_mode === 'piece' ? Number(p.piece_rate) > 0 : rate > 0
  return <article className="card">
    <div className="product-media">
      {p.image_url ? <Image src={p.image_url} alt={p.name} width={640} height={640} unoptimized /> : null}
      <span className={`badge ${out?'out':''}`}>{out?'Sold out':'Available'}</span>
    </div>
    <div className="card-body">
      <div className="product-title">{p.name}</div>
      <div className="meta"><span>{p.pricing_mode === 'piece' ? 'Per piece' : `${Number(p.weight_grams).toFixed(2)} g`}</span></div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
        <span className="price">{priced ? formatPrice(price) : 'Price available soon'}</span>
        <AddToCartButton disabled={out || !priced} unavailableLabel={out ? 'Sold out' : 'Rate pending'} maxQty={stock} product={{id:p.id,name:p.name,image_url:p.image_url,weight_grams:Number(p.weight_grams),qty:1}}/>
      </div>
    </div>
  </article>
}
