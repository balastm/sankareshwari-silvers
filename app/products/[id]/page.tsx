import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import StoreFooter from '@/components/StoreFooter'
import ProductImage from '@/components/admin/ProductImage'
import ProductCard from '@/components/ProductCard'
import AddToCartButton from '@/components/AddToCartButton'
import { getStorefront } from '@/lib/storefront'
import { availableStock, formatPrice, sellingPrice, UUID_PATTERN } from '@/lib/products'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { products } = await getStorefront()
  const p = products.find(p => p.id === id)
  return { title: p ? `${p.name} | Sankareshwari Silvers` : 'Product | Sankareshwari Silvers' }
}
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_PATTERN.test(id)) notFound()
  const { products, rate, error } = await getStorefront()
  if (error) throw new Error('Unable to load the collection')
  const p = products.find(p => p.id === id)
  if (!p) notFound()
  const stock = availableStock(p)
  const priced = p.pricing_mode === 'piece' ? Number(p.piece_rate) > 0 : rate > 0
  const related = products.filter(item => item.category_id === p.category_id && item.id !== id).slice(0, 3)
  return <><Header /><main className="container section"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/#products">Collection</Link><span>/</span><span>{p.name}</span></nav><div className="product-detail"><ProductImage src={p.image_url} name={p.name} className="detail-image" /><div className="detail-copy"><div className="eyebrow">{p.category?.name}</div><h1>{p.name}</h1><p className="muted">Product code · {p.code}</p><div className="detail-price">{priced ? formatPrice(sellingPrice(p, rate)) : 'Price available soon'}</div><p className="muted">Per piece, including making charges.</p><span className={`availability${stock ? '' : ' sold'}`}>{stock ? '● In stock' : 'Currently sold out'}</span><dl className="price-breakdown">{p.pricing_mode === 'piece' ? <div><dt>Piece price</dt><dd>{formatPrice(Number(p.piece_rate))}</dd></div> : <><div><dt>Weight</dt><dd>{Number(p.weight_grams).toFixed(3)} g</dd></div><div><dt>Current silver rate</dt><dd>{rate > 0 ? `${formatPrice(rate)} / g` : 'Awaiting update'}</dd></div></>}<div><dt>Making charge</dt><dd>{formatPrice(Number(p.making_charge))}</dd></div></dl><AddToCartButton disabled={!stock || !priced} unavailableLabel={!stock ? 'Sold out' : 'Rate pending'} maxQty={stock} product={{ id: p.id, name: p.name, image_url: p.image_url, weight_grams: Number(p.weight_grams), qty: 1 }} /><a className="product-enquiry" href={`https://wa.me/919655570730?text=${encodeURIComponent(`Hello, I would like to know more about ${p.name} (${p.code}).`)}`} target="_blank" rel="noopener noreferrer">Ask us about this piece ↗</a><p className="detail-note">Prices and availability are checked again at checkout. For delivery timing, gifting options or product specifications, speak with our store before ordering.</p><details className="shop-disclosure"><summary>Caring for your silver</summary><p>Keep your piece dry and store it separately in a soft pouch. Wipe gently with a soft cloth after use. Avoid perfume, chlorine and abrasive cleaners.</p></details></div></div>{related.length > 0 && <section className="related-products"><div className="section-head"><h2>A few more to love.</h2><Link href="/#products" className="text-link">Explore the collection ↗</Link></div><div className="grid collection-grid">{related.map(item => <ProductCard key={item.id} p={item} rate={rate} />)}</div></section>}</main><StoreFooter /></>
}
