'use client'
import { useState } from 'react'
import Link from 'next/link'
import { saveCart, useCart } from '@/lib/cart'
import { availableStock, formatPrice, sellingPrice, type ProductListItem } from '@/lib/products'
import ProductImage from './admin/ProductImage'

export default function ShoppingBag({ products, rate, error = false, checkout = false }: { products: ProductListItem[]; rate: number; error?: boolean; checkout?: boolean }) {
  const items = useCart()
  const [message, setMessage] = useState('')
  if (!items.length) return <div className="empty-state"><div className="eyebrow">Room for something lovely</div><h3>Your bag is waiting.</h3><p className="muted">Discover a piece for yourself or someone special.</p><Link className="btn btn-dark" href="/#products">Explore the collection ↗</Link></div>
  const lines = items.map(item => {
    const product = products.find(p => p.id === item.id)
    const priced = product && (product.pricing_mode === 'piece' ? Number(product.piece_rate) > 0 : rate > 0)
    const stock = product ? availableStock(product) : 0
    return { item, product, stock, priced, total: product && priced ? sellingPrice(product, rate) * item.qty : 0 }
  })
  const blocked = error || lines.some(line => !line.priced || line.stock < line.item.qty)
  function update(id: string, qty: number) {
    try { saveCart(qty === 0 ? items.filter(i => i.id !== id) : items.map(i => i.id === id ? { ...i, qty } : i)); setMessage('') }
    catch { setMessage('Your bag could not be saved. Please enable browser storage and try again.') }
  }
  return <div className={checkout ? 'checkout-bag' : 'bag-layout'}><div className="bag-items">{lines.map(({item, product, stock, priced, total}) => <article className="bag-row" key={item.id}><ProductImage src={product?.image_url || item.image_url} name={product?.name || item.name} className="bag-image"/><div className="bag-description"><Link href={`/products/${item.id}`} className="product-title">{product?.name || item.name}</Link><p className="muted">{product?.pricing_mode === 'piece' ? 'Per piece' : `${Number(product?.weight_grams || item.weight_grams).toFixed(2)} g`}</p>{!error && (!product || stock < item.qty || !priced) && <p className="field-error">{!product ? 'No longer available. Please remove this piece.' : !priced ? 'Price awaiting update.' : stock === 0 ? 'Currently sold out.' : `Only ${stock} available. Reduce your quantity.`}</p>}<div className="quantity-control"><button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.qty <= 1} onClick={() => update(item.id, item.qty - 1)}>−</button><span aria-label="Quantity">{item.qty}</span><button type="button" aria-label={`Increase ${item.name} quantity`} disabled={item.qty >= Math.min(stock,999) || error} onClick={() => update(item.id, item.qty + 1)}>+</button><button type="button" className="remove-item" onClick={() => update(item.id, 0)}>Remove</button></div></div><strong>{priced ? formatPrice(total) : '—'}</strong></article>)}</div><aside className="bag-summary"><div className="eyebrow">Your selection</div><h3>{checkout ? 'Order summary' : 'A little closer to yours.'}</h3><div className="summary-line"><span>{items.reduce((n, i) => n + i.qty, 0)} pieces</span><strong>{blocked ? 'Review your bag' : formatPrice(lines.reduce((n, line) => n + line.total, 0))}</strong></div><p className="detail-note">Making charges included. Current prices and stock are checked again before payment. Contact the store to confirm delivery arrangements.</p>{error && <p className="notice" role="alert">Prices could not be loaded. Refresh this page to try again.</p>}{message && <p className="notice auth-error" role="alert">{message}</p>}{!checkout && (blocked ? <button className="btn btn-dark" disabled>Update your bag to continue</button> : <Link className="btn btn-dark" href="/checkout">Continue to checkout ↗</Link>)}<Link href="/#products" className="product-enquiry">Continue exploring</Link></aside></div>
}
