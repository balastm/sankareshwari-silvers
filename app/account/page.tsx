import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'
import ProfileForm from './ProfileForm'
import Link from 'next/link'
import StoreFooter from '@/components/StoreFooter'

export default async function Account(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) redirect('/login?next=/account')
  const {data:profile,error}=await supabase.from('profiles').select('full_name,phone').eq('id',user.id).maybeSingle()
  return <><Header/><main className="container section"><div className="eyebrow">Your corner of the store</div><h1 className="page-title">A little more personal.</h1><div className="account-grid"><section className="card account-card"><h2>Your details</h2><p className="muted">{user.email}</p><p className="muted">These details help you check out a little faster.</p>{error?<p className="notice" role="alert">Your saved details could not be loaded. Refresh before editing.</p>:<ProfileForm name={profile?.full_name||user.user_metadata?.full_name||''} phone={profile?.phone||user.user_metadata?.phone||''}/>}</section><aside className="card account-card"><div className="eyebrow">Good to see you</div><h2>Every piece has a story.</h2><p className="muted">Follow your orders or find your next favourite.</p><div className="form"><Link className="btn btn-dark" href="/orders">View your orders ↗</Link><Link className="btn btn-ghost" href="/#products">Explore the collection</Link><Link className="text-link" href="/help">Need a hand with an order?</Link><SignOutButton/></div></aside></div></main><StoreFooter/></>
}
