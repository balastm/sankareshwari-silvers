export type CategoryOption = { id: string; name: string; image_url?: string | null; is_active?: boolean }

export type Product = {
  id: string
  category_id: string
  name: string
  code: string
  weight_grams: number
  making_charge: number
  pricing_mode?: 'weight' | 'piece'
  piece_rate?: number
  image_url: string | null
  stock_pcs: number
  stock_grams: number
  is_active: boolean
}

export type ProductListItem = Product & { category: { name: string } | null }
export type ProductValues = Omit<Product, 'id' | 'image_url'>
export type ProductField = keyof ProductValues | 'image'
export type ProductActionState = {
  error?: string
  fieldErrors?: Partial<Record<ProductField, string>>
  success?: boolean
}

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
export const PRODUCT_COLUMNS = 'id,category_id,name,code,weight_grams,making_charge,pricing_mode,piece_rate,image_url,stock_pcs,stock_grams,is_active'
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function availableStock(product: Pick<Product, 'stock_pcs' | 'stock_grams' | 'weight_grams' | 'pricing_mode'>) {
  const weight = Math.round(Number(product.weight_grams) * 1000)
  const grams = Math.round(Number(product.stock_grams) * 1000)
  const pieces = Number(product.stock_pcs)
  if (product.pricing_mode === 'piece' && weight === 0) return Number.isFinite(pieces) ? Math.max(0, Math.floor(pieces)) : 0
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(grams) || !Number.isFinite(pieces)) return 0
  return Math.max(0, Math.min(Math.floor(pieces), Math.floor(grams / weight)))
}

export function isOutOfStock(product: Pick<Product, 'stock_pcs' | 'stock_grams'> & Partial<Pick<Product, 'weight_grams' | 'pricing_mode'>>) {
  return product.weight_grams === undefined
    ? Number(product.stock_pcs) <= 0 || Number(product.stock_grams) <= 0
    : availableStock({ ...product, weight_grams: product.weight_grams }) === 0
}

export function productPrice(weight: number, makingCharge: number, rate: number) {
  return Math.round((Number(weight) * Number(rate) + Number(makingCharge) + Number.EPSILON) * 100) / 100
}

export function sellingPrice(product: Pick<Product, 'weight_grams' | 'making_charge' | 'pricing_mode' | 'piece_rate'>, rate: number) {
  return product.pricing_mode === 'piece'
    ? Math.round((Number(product.piece_rate || 0) + Number(product.making_charge) + Number.EPSILON) * 100) / 100
    : productPrice(product.weight_grams, product.making_charge, rate)
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value)
}

export function validateProduct(formData: FormData) {
  const fieldErrors: NonNullable<ProductActionState['fieldErrors']> = {}
  const text = (name: string) => {
    const value = formData.get(name)
    return typeof value === 'string' ? value.trim() : ''
  }
  const number = (name: ProductField, label: string, min: number, max: number, decimals: number) => {
    const raw = text(name)
    const value = Number(raw)
    const scaled = value * 10 ** decimals
    if (!raw || !Number.isFinite(value) || value < min || value > max || Math.abs(scaled - Math.round(scaled)) > 0.0001) {
      fieldErrors[name] = decimals === 0
        ? `Enter a whole number between ${min} and ${max.toLocaleString('en-IN')}.`
        : `Enter ${label} between ${min} and ${max.toLocaleString('en-IN')} with up to ${decimals} decimal places.`
    }
    return value
  }
  const mode = text('pricing_mode') || 'weight'
  const values: ProductValues = {
    category_id: text('category_id'),
    name: text('name'),
    code: text('code'),
    pricing_mode: mode === 'piece' ? 'piece' : 'weight',
    piece_rate: mode === 'piece' ? number('piece_rate', 'piece rate', 0.01, 9999999999.99, 2) : 0,
    weight_grams: mode === 'piece' ? 0 : number('weight_grams', 'weight', 0.001, 999999999.999, 3),
    making_charge: number('making_charge', 'a making charge', 0, 9999999999.99, 2),
    stock_pcs: number('stock_pcs', 'stock', 0, 2147483647, 0),
    stock_grams: number('stock_grams', 'stock', 0, 999999999.999, 3),
    is_active: formData.get('is_active') === 'on',
  }
  if (!['weight', 'piece'].includes(mode)) fieldErrors.pricing_mode = 'Choose weight × rate or single piece rate.'
  if (!UUID_PATTERN.test(values.category_id)) fieldErrors.category_id = 'Choose a product category.'
  if (!values.name) fieldErrors.name = 'Enter a product name.'
  if (!values.code) fieldErrors.code = 'Enter a unique product code.'
  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith('image/')) fieldErrors.image = 'Choose an image file.'
    else if (image.size > MAX_PRODUCT_IMAGE_BYTES) fieldErrors.image = 'Choose a photo smaller than 5 MB.'
  } else if (typeof image === 'string' && image) {
    fieldErrors.image = 'Choose an image file.'
  }
  return { values, fieldErrors, valid: Object.keys(fieldErrors).length === 0 }
}
