'use client'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
export default function CartLink() {
  const count = useCart().reduce((total, item) => total + item.qty, 0)
  return <Link href="/cart" aria-label={`Shopping bag, ${count} items`}>Bag <span className="cart-count">{count}</span></Link>
}
