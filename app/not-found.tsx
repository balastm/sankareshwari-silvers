import Link from 'next/link'
export default function NotFound() { return <main className="container section empty-state"><div className="eyebrow">404 · A missing piece</div><h1>This page has moved on.</h1><p className="muted">The piece may no longer be available, or the link may be incorrect.</p><Link href="/#products" className="btn btn-dark">Explore the collection</Link></main> }
