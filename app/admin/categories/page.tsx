import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import ProductImage from '@/components/admin/ProductImage'
import {deleteCategory} from '../actions'
export default async function Categories(){
 const {data}=await createAdminClient().from('categories').select('*').order('name')
 return <div className="fade-page">
  <div className="section-head"><div><h2>Product categories</h2><p className="muted">View, add, edit and delete product categories.</p></div><Link className="btn btn-dark" href="/admin/categories/new">Add category</Link></div>
  <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Image</th><th>Status</th><th>Actions</th></tr></thead><tbody>{(data||[]).map((x:any)=><tr key={x.id}><td>{x.name}</td><td><ProductImage src={x.image_url} name={x.name} className="product-thumbnail"/></td><td>{x.is_active?'Active':'Hidden'}</td><td><div className="actions"><Link className="btn btn-ghost small" href={`/admin/products?category=${x.id}`}>View products</Link><Link className="btn btn-ghost small" href={`/admin/categories/${x.id}/edit`}>Edit</Link><form action={deleteCategory}><input type="hidden" name="id" value={x.id}/><button className="btn danger small">Delete</button></form></div></td></tr>)}</tbody></table></div>
 </div>
}

