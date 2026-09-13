import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { todayInIndia } from '@/lib/dates'
import { PRODUCT_COLUMNS, type ProductListItem } from '@/lib/products'

export const getStorefront = cache(async () => {
  const supabase = await createClient()
  const [products, categories, rate] = await Promise.all([
    supabase.from('products').select(`${PRODUCT_COLUMNS},category:categories(name)`).eq('is_active', true).order('created_at', { ascending: false }).returns<ProductListItem[]>(),
    supabase.from('categories').select('id,name,image_url').eq('is_active', true).order('name'),
    supabase.from('silver_rates').select('rate_per_gram,effective_date').lte('effective_date', todayInIndia()).order('effective_date', { ascending: false }).limit(1).maybeSingle(),
  ])
  return {
    products: (products.data || []).filter(p => categories.data?.some(c => c.id === p.category_id)),
    categories: categories.data || [],
    rate: rate.error ? 0 : Number(rate.data?.rate_per_gram || 0),
    error: !!(products.error || categories.error),
  }
})
