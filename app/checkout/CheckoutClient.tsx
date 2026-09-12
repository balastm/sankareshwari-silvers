'use client'
import {useState} from 'react'
import { useRouter } from 'next/navigation'
import { clearCart, useCart } from '@/lib/cart'
declare global{interface Window{Razorpay:any}}
export default function CheckoutClient({email}:{email:string}){
 const cart = useCart()
 const router = useRouter()
 const [busy,setBusy]=useState(false),[msg,setMsg]=useState('')
 async function pay(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault(); if(!cart.length){setMsg('Your cart is empty.');return}
  setBusy(true);setMsg('')
  const fd=new FormData(e.currentTarget)
  const res=await fetch('/api/checkout/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
   items:cart.map(x=>({product_id:x.id,qty:x.qty})),
   delivery:{name:fd.get('name'),phone:fd.get('phone'),address:fd.get('address'),city:fd.get('city'),pincode:fd.get('pincode')}
  })})
  const data=await res.json();setBusy(false)
  if(!res.ok){setMsg(data.error||'Unable to start checkout');return}
  const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js'
  script.onload=()=>{const rz=new window.Razorpay({
   key:data.keyId,amount:data.amount,currency:'INR',name:'Sankareshwari Silvers',description:'Silver jewellery order',
   order_id:data.razorpayOrderId,prefill:{email,contact:String(fd.get('phone')||'')},
   handler:async(resp:any)=>{
    const vr=await fetch('/api/checkout/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...resp,orderId:data.orderId})})
    if(vr.ok){clearCart();router.replace('/orders?paid=1');router.refresh()}else setMsg('Payment verification failed. Please contact support.')
   }
  });rz.open()}
  script.onerror=()=>setMsg('Could not load payment gateway.')
  document.body.appendChild(script)
 }
 return <form onSubmit={pay} className="admin-form form">
  <div className="form-grid">
   <div className="field"><label>Name</label><input required name="name" className="input"/></div>
   <div className="field"><label>Phone</label><input required name="phone" className="input"/></div>
   <div className="field span2"><label>Address</label><textarea required name="address" className="input"/></div>
   <div className="field"><label>City</label><input required name="city" className="input"/></div>
   <div className="field"><label>Pincode</label><input required name="pincode" className="input"/></div>
  </div>
  <div className="notice">{cart.length} cart item(s). Final prices and live stock are verified on the server before payment.</div>
  {msg&&<div className="notice">{msg}</div>}
  <button disabled={busy} className="btn btn-dark">{busy?'Preparing payment…':'Pay securely'}</button>
 </form>
}
