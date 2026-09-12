'use client'
import {useActionState,useState,useEffect} from 'react'
import {saveCategory} from '@/app/admin/actions'
import ProductImage from './ProductImage'
export default function CategoryForm({category}:{category?:{id:string;name:string;image_url?:string|null}}){
 const [name,setName]=useState(category?.name||'')
 const [photo,setPhoto]=useState<File|null>(null)
 const [preview,setPreview]=useState(category?.image_url||'')
 useEffect(()=>{if(!photo)return;const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url)},[photo])
 const [state,action,pending]=useActionState(async(previous:{error?:string},form:FormData)=>{if(photo)form.set('image',photo);return saveCategory(previous,form)},{})
 return <form action={action} className="admin-form form" aria-busy={pending}>
  {state.error && <div className="notice auth-error" role="alert">{state.error} Your entries have been kept below.</div>}
  {category&&<input type="hidden" name="id" value={category.id}/>}
  <div className="field"><label htmlFor="category-name">Category name</label><input id="category-name" required name="name" className="input" value={name} onChange={e=>setName(e.target.value)}/></div>
  <div className="field"><label htmlFor="category-image">Upload category image</label><input id="category-image" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>setPhoto(e.target.files?.[0]||null)}/><span className="field-help">JPG, PNG, WebP or AVIF, up to 5 MB. This image appears in Current collection.</span>{photo&&<span className="field-help">Selected: {photo.name}</span>}</div>
  <ProductImage src={preview} name={name||'Category image'} className="category-photo-preview"/>
  <button disabled={pending} className="btn btn-dark">{pending?'Saving…':'Save category'}</button>
 </form>
}
