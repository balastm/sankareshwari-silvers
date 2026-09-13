import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { todayInIndia } from '@/lib/dates'
import CartLink from './CartLink'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rate } = await supabase.from('silver_rates').select('rate_per_gram,effective_date').lte('effective_date',todayInIndia()).order('effective_date',{ascending:false}).limit(1).maybeSingle()
  return <header className="header"><div className="rate-strip"><div className="container"><span className="daily-rate"><i aria-hidden="true"/>Daily silver rate <strong>{rate ? `₹${Number(rate.rate_per_gram).toLocaleString('en-IN')}/g` : 'Awaiting update'}</strong>{rate && <small>As of {rate.effective_date}</small>}</span><span className="strip-note">A gift today. An heirloom tomorrow.</span></div></div><div className="container header-inner">
    <Link href="/" className="brand">Sankareshwari<span>Silvers</span></Link>
    <nav className="nav" aria-label="Main navigation">
      <Link href="/">Home</Link>
      <Link href="/#products">Products</Link>
      <Link href="/#contact">Contact Us</Link>
      <CartLink/>
      {user ? <><Link href="/orders">My Orders</Link><Link className="btn btn-dark" href="/account">Account</Link></>
      : <Link className="btn btn-dark" href="/login">Login</Link>}
    </nav>
  </div></header>
}
