import { createAdminClient } from '@/lib/supabase/server'
import { todayInIndia } from '@/lib/dates'
export default async function Admin(){
 const a=createAdminClient()
 const [p,c,o,r]=await Promise.all([
  a.from('products').select('*',{count:'exact',head:true}),
  a.from('categories').select('*',{count:'exact',head:true}),
  a.from('orders').select('*',{count:'exact',head:true}),
  a.from('silver_rates').select('rate_per_gram,effective_date').lte('effective_date',todayInIndia()).order('effective_date',{ascending:false}).limit(1).maybeSingle()
 ])
 return <div className="fade-page"><h2>Dashboard</h2><p className="muted">Fast overview. Each management task has its own page.</p><div className="admin-grid">
  <div className="card stat"><span className="muted">Products</span><strong>{p.count||0}</strong></div>
  <div className="card stat"><span className="muted">Categories</span><strong>{c.count||0}</strong></div>
  <div className="card stat"><span className="muted">Orders</span><strong>{o.count||0}</strong></div>
  <div className="card stat"><span className="muted">Today’s rate</span><strong>₹{Number(r.data?.rate_per_gram||0).toLocaleString('en-IN')}</strong></div>
 </div></div>
}
