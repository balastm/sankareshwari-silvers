'use client'
import Link from 'next/link'
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="container section empty-state"><h1>Let’s try that again.</h1><p className="muted">We couldn’t load this page. Your saved bag is still in this browser.</p><div className="contact-actions"><button className="btn btn-dark" onClick={reset}>Try again</button><Link href="/" className="btn btn-ghost">Back to the store</Link></div></main> }
