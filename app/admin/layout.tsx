import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import AdminMotion from './motion'
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const {user}=await requireAdmin()
 return <div className="admin-shell">
  <aside className="admin-side"><Link href="/admin" className="brand">Sankareshwari<span>Admin</span></Link>
   <nav className="admin-nav">
    <Link href="/admin">Dashboard</Link>
    <Link href="/admin/categories">Product categories</Link>
    <Link href="/admin/products">Products</Link>
    <Link href="/admin/products/new">Add product</Link>
    <Link href="/admin/rates">Silver rates</Link>
    <Link href="/admin/orders">Orders</Link>
    <Link href="/">View store</Link>
   </nav>
  </aside>
  <main className="admin-main"><div className="admin-top"><div><div className="eyebrow">Administration</div><strong>{user.email}</strong></div></div><AdminMotion>{children}</AdminMotion></main>
 </div>
}
