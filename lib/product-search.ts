import { UUID_PATTERN } from './products'

export type ProductFilters = { q: string; category: string; status: string; sort: string; page: number }

export function parseProductFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const value = (key: string) => typeof params[key] === 'string' ? params[key] : ''
  const page = Number(value('page'))
  return {
    q: value('q').trim().slice(0, 150),
    category: UUID_PATTERN.test(value('category')) ? value('category') : '',
    status: ['active', 'hidden', 'out'].includes(value('status')) ? value('status') : '',
    sort: ['name', 'stock'].includes(value('sort')) ? value('sort') : 'recent',
    page: Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1000000) : 1,
  }
}

export function productSearchPattern(query: string) {
  // Quote reserved PostgREST characters and treat wildcard characters as literal text.
  const literal = query.replace(/[\\%_*]/g, '\\$&').replace(/"/g, '\\"')
  return `"%${literal}%"`
}

export function productListUrl(filters: ProductFilters, page: number) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.status) params.set('status', filters.status)
  if (filters.sort !== 'recent') params.set('sort', filters.sort)
  if (page > 1) params.set('page', String(page))
  return `/admin/products${params.size ? `?${params}` : ''}`
}
