import ProductForm from '@/components/admin/ProductForm'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export default async function NewProduct() {
  await requireAdmin()
  const admin = createAdminClient()
  const [categories, rate] = await Promise.all([
    admin.from('categories').select('id,name,is_active').eq('is_active', true).order('name'),
    admin.from('silver_rates').select('rate_per_gram').order('effective_date', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (categories.error) throw new Error('Unable to load product categories.', { cause: categories.error })
  return <div className="fade-page product-page">
    <Link className="product-back" href="/admin/products">← All products</Link>
    <div className="product-page-heading"><div><div className="eyebrow">Grow your collection</div><h2>Add product</h2><p className="muted">The details that make every piece yours.</p></div></div>
    <ProductForm categories={categories.data ?? []} rate={rate.error || !rate.data ? null : Number(rate.data.rate_per_gram)} />
  </div>
}
