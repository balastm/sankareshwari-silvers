import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import PaymentForm from '@/components/PaymentForm'
import ShoppingBag from '@/components/ShoppingBag'
import StoreFooter from '@/components/StoreFooter'
import { getStorefront } from '@/lib/storefront'
import { createClient } from '@/lib/supabase/server'
export default async function Checkout(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser()
 if(!user) redirect('/login?next=/checkout')
 const [catalog,{data:profile}]=await Promise.all([getStorefront(),supabase.from('profiles').select('full_name,phone').eq('id',user.id).maybeSingle()])
 return <><Header/><main className="container section"><div className="eyebrow">Bag / Delivery / Payment</div><h1 className="page-title">Almost yours.</h1><div className="checkout-layout"><PaymentForm email={user.email||''} name={profile?.full_name||user.user_metadata?.full_name||''} phone={profile?.phone||user.user_metadata?.phone||''} products={catalog.products} rate={catalog.rate} unavailable={catalog.error}/><ShoppingBag {...catalog} checkout/></div></main><StoreFooter/></>
}
