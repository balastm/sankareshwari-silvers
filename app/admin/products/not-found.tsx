import Link from 'next/link'

export default function ProductNotFound() {
  return <section className="product-panel product-empty"><h2>Product not found</h2><p className="muted">This piece may have been removed. You can find the rest of your collection below.</p><Link className="btn btn-dark" href="/admin/products">Back to products</Link></section>
}
