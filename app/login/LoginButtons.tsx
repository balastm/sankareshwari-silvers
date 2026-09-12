'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginButtons({next}:{next:string}) {
  const supabase=createClient()
  async function login(provider:'google'|'apple'|'github'){
    const redirectTo=`${location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo}})
    if(error) alert(error.message)
  }
  return <div className="oauth">
    <button className="btn btn-ghost" onClick={()=>login('google')}>Continue with Google</button>
    <button className="btn btn-dark" onClick={()=>login('apple')}>Continue with Apple</button>
    <button className="btn btn-ghost" onClick={()=>login('github')}>Continue with GitHub</button>
  </div>
}
