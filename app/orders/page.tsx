import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StoreFooter from '@/components/StoreFooter'
import { formatPrice } from '@/lib/products'
type Order = { id:string;status:string;payment_status:string;total_amount:number;created_at:string;order_items:{id:string;product_name:string;qty:number;weight_grams:number;unit_price:number}[] }
const steps=['confirmed','processing','shipped','delivered']
const labels:Record<string,string>={pending:'Awaiting confirmation',confirmed:'Confirmed',processing:'Preparing your pieces',shipped:'On its way',delivered:'Delivered',cancelled:'Cancelled'}
export default async function Orders(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next=/orders')
 const {data:orders,error}=await supabase.from('orders').select('id,status,payment_status,total_amount,created_at,order_items(id,product_name,qty,weight_grams,unit_price)').eq('user_id',user.id).order('created_at',{ascending:false}).returns<Order[]>()
 return <><Header/><main className="container section"><div className="eyebrow">Your collection, in the making</div><h1 className="page-title">Every order. Every moment.</h1><p className="muted">Follow your pieces from our store to you.</p>
  {error?<div className="notice" role="alert">Your orders couldn’t be loaded. Please refresh the page to try again.</div>:!orders?.length?<div className="empty-state"><h3>Your first story starts here.</h3><p className="muted">Once you place an order, you’ll find its details here.</p><Link className="btn btn-dark" href="/#products">Find your first piece ↗</Link></div>:<div className="order-list">{orders.map(o=><article className="card order-card" key={o.id}><div className="order-heading"><div><h2>Order {o.id.slice(0,8).toUpperCase()}</h2><p className="order-meta">{new Intl.DateTimeFormat('en-IN',{dateStyle:'long',timeZone:'Asia/Kolkata'}).format(new Date(o.created_at))}<br/>Payment: {o.payment_status==='paid'?'Received':o.payment_status==='failed'?'Failed':'Awaiting confirmation'}</p></div><span className="order-status">{labels[o.status]||'Store review'}</span></div>{o.payment_status==='paid'&&steps.includes(o.status)&&<ol className="order-progress" aria-label="Order progress">{steps.map((step,index)=><li key={step} className={index<=steps.indexOf(o.status)?'complete':''} aria-current={step===o.status?'step':undefined}>{step[0].toUpperCase()+step.slice(1)}</li>)}</ol>}{o.payment_status==='pending'&&<p className="notice">If you’ve already paid, please don’t pay again. Contact us with your payment reference so we can confirm your order.</p>}{o.order_items.map(i=><div className="order-line" key={i.id}><span>{i.product_name}<small className="order-meta"> · Qty {i.qty}{Number(i.weight_grams)>0?` · ${i.weight_grams} g each`:''}</small></span><strong>{formatPrice(Number(i.unit_price)*i.qty)}</strong></div>)}<div className="order-bottom"><a className="text-link" href={`https://wa.me/919655570730?text=${encodeURIComponent(`Hello, I need help with order ${o.id}.`)}`} target="_blank" rel="noopener noreferrer">Ask about this order ↗</a><strong>Total {formatPrice(Number(o.total_amount))}</strong></div></article>)}</div>}
 </main><StoreFooter/></>
}
