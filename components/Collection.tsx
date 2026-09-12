'use client'
import {useState} from 'react'
import ProductCard from './ProductCard'
import Reveal from './Reveal'
import ProductImage from './admin/ProductImage'
import type {CategoryOption,ProductListItem} from '@/lib/products'
export default function Collection({categories,products,rate}:{categories:CategoryOption[];products:ProductListItem[];rate:number}){
 const [selected,setSelected]=useState('')
 const visible=products.filter(p=>categories.some(c=>c.id===p.category_id) && (!selected||p.category_id===selected))
 return <>
  <div className="category-grid" aria-label="Browse product categories">
   {categories.map(category=><button key={category.id} type="button" className={`category-card${selected===category.id?' selected':''}`} aria-pressed={selected===category.id} onClick={()=>setSelected(category.id)}><ProductImage src={category.image_url||null} name={category.name} className="category-cover"/><span>{category.name}<span aria-hidden="true">↗</span></span></button>)}
  </div>
  <div className="collection-toolbar"><h3>{categories.find(c=>c.id===selected)?.name||'All products'}</h3><button type="button" className="btn btn-ghost small" onClick={()=>setSelected('')} aria-pressed={!selected}>View all products</button></div>
  <div className="grid collection-grid" key={selected}>{visible.map((p,i)=><Reveal key={p.id} delay={(i%3)*.12}><ProductCard p={p} rate={rate}/></Reveal>)}</div>
  {!visible.length&&<div className="notice" role="status">{selected?'Products in this category are coming soon.':'Our collection is coming soon. Please check back shortly.'}</div>}
 </>
}
