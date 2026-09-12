import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './SignOutButton'

export default async function Account(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) redirect('/login?next=/account')
  return <><Header/><main className="container section"><div className="card" style={{padding:26,maxWidth:620}}>
    <div className="eyebrow">Account</div><h2>{user.user_metadata?.full_name || user.email}</h2>
    <p className="muted">{user.email}</p><SignOutButton/>
  </div></main></>
}
