import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
export default async function Orders(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next=/orders')
 const {data:orders}=await supabase.from('orders').select('id,status,payment_status,total_amount,created_at,order_items(product_name,qty,weight_grams,unit_price)').eq('user_id',user.id).order('created_at',{ascending:false})
 return <><Header/><main className="container section"><div className="eyebrow">Account</div><h2>My orders</h2>
  <div style={{display:'grid',gap:16}}>{(orders||[]).map((o:any)=><div className="card" style={{padding:22}} key={o.id}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>Order {o.id.slice(0,8)}</strong><span>{o.status}</span></div><p className="muted">{new Date(o.created_at).toLocaleString('en-IN')} · ₹{Number(o.total_amount).toLocaleString('en-IN')}</p>{o.order_items?.map((i:any)=><div key={i.product_name}>{i.product_name} · {i.weight_grams} g × {i.qty}</div>)}</div>)}</div>
 </main></>
}
