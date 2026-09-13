'use client'
import {useActionState,useState,useEffect} from 'react'
import {saveCategory} from '@/app/admin/actions'
import ProductImage from './ProductImage'
export default function CategoryForm({category}:{category?:{id:string;name:string;image_url?:string|null;feature_kicker?:string|null;feature_title?:string|null;feature_font?:'serif'|'sans'|null;feature_order?:number|null;feature_enabled?:boolean}}){
 const [name,setName]=useState(category?.name||'')
 const [photo,setPhoto]=useState<File|null>(null)
 const [preview,setPreview]=useState(category?.image_url||'')
 const [featureEnabled,setFeatureEnabled]=useState(category?.feature_enabled??false)
 useEffect(()=>()=>{if(preview.startsWith('blob:'))URL.revokeObjectURL(preview)},[preview])
 function selectPhoto(file:File|null){setPhoto(file);setPreview(file?URL.createObjectURL(file):category?.image_url||'')}
 const [state,action,pending]=useActionState(async(previous:{error?:string},form:FormData)=>{if(photo)form.set('image',photo);return saveCategory(previous,form)},{})
 return <form action={action} className="admin-form form" aria-busy={pending}>
  {state.error && <div className="notice auth-error" role="alert">{state.error} Your entries have been kept below.</div>}
  {category&&<input type="hidden" name="id" value={category.id}/>}
  <div className="field"><label htmlFor="category-name">Category name</label><input id="category-name" required name="name" className="input" value={name} onChange={e=>setName(e.target.value)}/></div>
  <div className="field"><label htmlFor="category-image">Upload category image</label><input id="category-image" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>selectPhoto(e.target.files?.[0]||null)}/><span className="field-help">JPG, PNG, WebP or AVIF, up to 5 MB. This image appears in Current collection.</span>{photo&&<span className="field-help">Selected: {photo.name}</span>}</div>
  <ProductImage src={preview} name={name||'Category image'} className="category-photo-preview"/>
  <fieldset className="product-panel category-feature-panel"><legend>Scroll tile display</legend><p className="field-help">Show this category inside the opening gift box and edit its text and font.</p><label className="product-visibility"><input name="feature_enabled" type="checkbox" checked={featureEnabled} onChange={e=>setFeatureEnabled(e.target.checked)}/><span><strong>Show in scroll animation</strong><span className="field-help">Use order 1 or 2 to choose its position.</span></span></label><div className="form-grid"><div className="field"><label htmlFor="feature-kicker">Small label</label><input id="feature-kicker" name="feature_kicker" className="input" maxLength={80} defaultValue={category?.feature_kicker||'Sacred traditions'}/></div><div className="field"><label htmlFor="feature-title">Tile title</label><input id="feature-title" name="feature_title" className="input" maxLength={100} defaultValue={category?.feature_title||category?.name||''}/></div><div className="field"><label htmlFor="feature-font">Font style</label><select id="feature-font" name="feature_font" className="input" defaultValue={category?.feature_font||'serif'}><option value="serif">Elegant serif</option><option value="sans">Clean sans</option></select></div><div className="field"><label htmlFor="feature-order">Display order</label><input id="feature-order" name="feature_order" className="input" type="number" min="0" max="99" step="1" defaultValue={category?.feature_order||0}/></div></div></fieldset>
  <button disabled={pending} className="btn btn-dark">{pending?'Saving…':'Save category'}</button>
 </form>
}
