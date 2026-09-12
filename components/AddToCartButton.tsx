'use client'
import { useState } from 'react'
import { getCart, saveCart, type CartItem } from '@/lib/cart'

export default function AddToCartButton({product,disabled,maxQty,unavailableLabel='Out of stock'}:{product:CartItem;disabled?:boolean;maxQty:number;unavailableLabel?:string}) {
  const [added,setAdded]=useState(false)
  const [message,setMessage]=useState('')
  function add(){
    setMessage('')
    const items = getCart()
    const found=items.find(i=>i.id===product.id)
    if ((found?.qty ?? 0) >= maxQty) { setMessage('All available pieces are already in your cart.'); return }
    if(found) found.qty += 1
    else items.push({...product,qty:1})
    try { saveCart(items) } catch { setMessage('Your cart could not be saved. Please enable browser storage and try again.'); return }
    setAdded(true); setTimeout(()=>setAdded(false),1200)
  }
  return <div><button className="btn btn-silver" disabled={disabled} onClick={add}>
    {disabled?unavailableLabel:added?'Added ✓':'Add to cart'}
  </button>{message && <div className="field-error" role="status">{message}</div>}</div>
}
