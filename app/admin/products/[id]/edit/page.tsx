import Link from 'next/link'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { PRODUCT_COLUMNS, UUID_PATTERN, type Product } from '@/lib/products'

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!UUID_PATTERN.test(id)) notFound()
  const admin = createAdminClient()
  const [product, categories, rate] = await Promise.all([
    admin.from('products').select(PRODUCT_COLUMNS).eq('id', id).maybeSingle<Product>(),
    admin.from('categories').select('id,name,is_active').order('name'),
    admin.from('silver_rates').select('rate_per_gram').order('effective_date', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (product.error || categories.error) throw new Error('Unable to load this product.', { cause: product.error || categories.error })
  if (!product.data) notFound()
  return <div className="fade-page product-page">
    <Link className="product-back" href="/admin/products">← All products</Link>
    <div className="product-page-heading"><div><div className="eyebrow">Refine the details</div><h2>Edit product</h2><p className="muted">{product.data.name} · {product.data.code}</p></div></div>
    <ProductForm key={id} product={product.data} categories={categories.data ?? []} rate={rate.error || !rate.data ? null : Number(rate.data.rate_per_gram)} />
  </div>
}
