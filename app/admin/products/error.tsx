'use client'

import Link from 'next/link'

export default function ProductError({ reset }: { reset: () => void }) {
  return <section className="product-panel product-empty" role="alert"><h2>Products are unavailable</h2>
    <p className="muted">We couldn’t load the collection. Check the store connection and try again.</p>
    <div className="actions"><button className="btn btn-dark" onClick={reset}>Try again</button><Link className="btn btn-ghost" href="/admin">Back to dashboard</Link></div>
  </section>
}
