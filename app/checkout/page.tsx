import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import CheckoutClient from './CheckoutClient'
import { createClient } from '@/lib/supabase/server'
export default async function Checkout(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser()
 if(!user) redirect('/login?next=/checkout')
 return <><Header/><main className="container section"><div className="eyebrow">Secure checkout</div><h2>Delivery & payment</h2><CheckoutClient email={user.email||''}/></main></>
}
