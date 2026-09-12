'use client'
import Link from 'next/link'
import { saveCart, useCart } from '@/lib/cart'
export default function CartClient(){
 const items = useCart()
 const save = saveCart
 if(!items.length)return <div className="notice">Your cart is empty.</div>
 return <div className="card" style={{padding:22}}>
  {items.map(i=><div key={i.id} style={{display:'flex',justifyContent:'space-between',gap:18,padding:'14px 0',borderBottom:'1px solid #e5e7e9'}}>
    <div><strong>{i.name}</strong><div className="muted">{i.weight_grams} g · Qty {i.qty}</div></div>
    <div className="actions"><button className="btn btn-ghost small" onClick={()=>save(items.map(x=>x.id===i.id?{...x,qty:Math.max(1,x.qty-1)}:x))}>−</button><button className="btn btn-ghost small" onClick={()=>save(items.map(x=>x.id===i.id?{...x,qty:x.qty+1}:x))}>+</button><button className="btn danger small" onClick={()=>save(items.filter(x=>x.id!==i.id))}>Remove</button></div>
  </div>)}
  <div style={{marginTop:22,textAlign:'right'}}><Link className="btn btn-dark" href="/checkout">Proceed to checkout</Link></div>
 </div>
}
