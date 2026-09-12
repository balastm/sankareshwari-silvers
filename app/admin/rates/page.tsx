import Link from 'next/link'
import {createAdminClient} from '@/lib/supabase/server'
import {deleteRate} from '../actions'
export default async function Rates(){
 const {data}=await createAdminClient().from('silver_rates').select('*').order('effective_date',{ascending:false}).limit(200)
 return <div className="fade-page">
 <div className="section-head"><div><h2>Silver rates</h2><p className="muted">View current and old silver rates.</p></div><Link href="/admin/rates/new" className="btn btn-dark">Add rate</Link></div>
 <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Rate/g</th><th>Actions</th></tr></thead><tbody>{(data||[]).map((r:any)=><tr key={r.id}><td>{r.effective_date}</td><td>₹{Number(r.rate_per_gram).toLocaleString('en-IN')}</td><td><div className="actions"><Link href={`/admin/rates/${r.id}/edit`} className="btn btn-ghost small">Edit</Link><form action={deleteRate}><input type="hidden" name="id" value={r.id}/><button className="btn danger small">Delete</button></form></div></td></tr>)}</tbody></table></div></div>
}
