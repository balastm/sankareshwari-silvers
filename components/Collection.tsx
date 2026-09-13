'use client'
import {useDeferredValue,useEffect,useRef,useState} from 'react'
import ProductCard from './ProductCard'
import ProductImage from './admin/ProductImage'
import {availableStock,sellingPrice,type CategoryOption,type ProductListItem} from '@/lib/products'
export default function Collection({categories,products,rate}:{categories:CategoryOption[];products:ProductListItem[];rate:number}){
 const [selected,setSelected]=useState('')
 const [query,setQuery]=useState('')
 const [sort,setSort]=useState('newest')
 const [inStock,setInStock]=useState(false)
 const productsRef=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  function applyHash(){
   const match=window.location.hash.match(/^#category(?:-products)?-(.+)$/)
   if(!match || !categories.some(category=>category.id===match[1])) return
   setSelected(match[1]);setQuery('');setSort('newest');setInStock(false)
   window.setTimeout(()=>productsRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),180)
  }
  applyHash();window.addEventListener('hashchange',applyHash)
  return ()=>window.removeEventListener('hashchange',applyHash)
 },[categories])
 const search=useDeferredValue(query.trim().toLowerCase())
 const visible=products.filter(p=>categories.some(c=>c.id===p.category_id) && (!selected||p.category_id===selected) && (!inStock||availableStock(p)>0) && `${p.name} ${p.code} ${p.category?.name||''}`.toLowerCase().includes(search))
 if(sort==='name') visible.sort((a,b)=>a.name.localeCompare(b.name))
 if(sort==='low'||sort==='high') visible.sort((a,b)=>{
  const ap=a.pricing_mode==='piece'||rate>0,bp=b.pricing_mode==='piece'||rate>0
  return ap!==bp ? (ap?-1:1) : (sellingPrice(a,rate)-sellingPrice(b,rate))*(sort==='low'?1:-1)
 })
 function reset(){setSelected('');setQuery('');setSort('newest');setInStock(false)}
 function openCategory(id:string){
  setSelected(id);setQuery('');setSort('newest');setInStock(false)
  window.requestAnimationFrame(()=>productsRef.current?.scrollIntoView({behavior:'smooth',block:'start'}))
 }
 return <>
  <div className="category-grid" aria-label="Browse product categories">
   {categories.map(category=><button id={`category-${category.id}`} key={category.id} type="button" className={`category-card${selected===category.id?' selected':''}`} aria-pressed={selected===category.id} onClick={()=>openCategory(category.id)}><ProductImage src={category.image_url||null} name={category.name} className="category-cover"/><span>{category.name}<span aria-hidden="true">View products ↗</span></span></button>)}
  </div>
  <div className="shop-filters"><div className="field"><label htmlFor="product-search">Find something special</label><input className="input" id="product-search" type="search" placeholder="Search pieces, categories or codes" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="field"><label htmlFor="product-sort">Sort by</label><select className="input" id="product-sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest arrivals</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="name">Name: A–Z</option></select></div><label className="stock-filter"><input type="checkbox" checked={inStock} onChange={e=>setInStock(e.target.checked)}/> In stock only</label></div>
  <div className="category-jump-targets" aria-hidden="true">{categories.map(category=><span id={`category-products-${category.id}`} key={category.id}/>)}</div>
  <div ref={productsRef} id="category-products" className="collection-toolbar"><div><div className="eyebrow">{selected ? 'Subcategory products' : 'All products'}</div><h3>{categories.find(c=>c.id===selected)?.name||'All pieces'}</h3><p className="muted" role="status">{visible.length} {visible.length===1?'product':'products'} in this category</p></div><button type="button" className="btn btn-ghost small" onClick={reset}>Clear filters</button></div>
  <div className="grid collection-grid">{visible.map(p=><ProductCard key={p.id} p={p} rate={rate}/>)}</div>
  {!visible.length&&<div className="empty-state"><span className="eyebrow">A little more exploring</span><h3>{products.length?'No pieces match just yet.':'New treasures are on their way.'}</h3><p className="muted">{products.length?'Try another search or clear your filters.':'Ask our Eral store about the current collection.'}</p>{products.length?<button className="btn btn-dark" onClick={reset}>Explore all pieces</button>:<a className="btn btn-dark" href="https://wa.me/919655570730">Enquire on WhatsApp ↗</a>}</div>}
 </>
}
