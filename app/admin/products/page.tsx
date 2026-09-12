import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { PRODUCT_COLUMNS, type ProductListItem } from '@/lib/products'
import { parseProductFilters, productListUrl, productSearchPattern } from '@/lib/product-search'
import ProductCatalog from '@/components/admin/ProductCatalog'

const PAGE_SIZE = 12

export default async function Products({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin()
  const params = await searchParams
  const filters = parseProductFilters(params)
  const admin = createAdminClient()
  let query = admin.from('products').select(`${PRODUCT_COLUMNS},category:categories(name)`, { count: 'exact' })
  if (filters.q) {
    const pattern = productSearchPattern(filters.q)
    query = query.or(`name.ilike.${pattern},code.ilike.${pattern}`)
  }
  if (filters.category) query = query.eq('category_id', filters.category)
  if (filters.status === 'active') query = query.eq('is_active', true)
  if (filters.status === 'hidden') query = query.eq('is_active', false)
  if (filters.status === 'out') query = query.or('stock_pcs.lte.0,stock_grams.lte.0')
  const sort = filters.sort === 'name' ? 'name' : filters.sort === 'stock' ? 'stock_pcs' : 'created_at'
  query = query.order(sort, { ascending: filters.sort !== 'recent' }).order('id')

  const [products, categories, rate, total, active, out] = await Promise.all([
    query.range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE - 1).returns<ProductListItem[]>(),
    admin.from('categories').select('id,name').order('name'),
    admin.from('silver_rates').select('rate_per_gram').order('effective_date', { ascending: false }).limit(1).maybeSingle(),
    admin.from('products').select('id', { count: 'exact', head: true }),
    admin.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('products').select('id', { count: 'exact', head: true }).or('stock_pcs.lte.0,stock_grams.lte.0'),
  ])
  for (const result of [products, categories, total, active, out]) {
    if (result.error) throw new Error('Unable to load the product collection.', { cause: result.error })
  }
  const count = products.count ?? 0
  const lastPage = Math.max(1, Math.ceil(count / PAGE_SIZE))
  if (filters.page > lastPage) redirect(productListUrl(filters, lastPage))

  return <ProductCatalog products={products.data ?? []} categories={categories.data ?? []} filters={filters}
    rate={rate.error || !rate.data ? null : Number(rate.data.rate_per_gram)} count={count} pageSize={PAGE_SIZE}
    saved={params.saved === '1'} summary={{ total: total.count ?? 0, active: active.count ?? 0, out: out.count ?? 0 }} />
}
