import { availableStock, sellingPrice, UUID_PATTERN } from './products'

export class CheckoutError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

export type CheckoutItem = { product_id: string; qty: number }
export type CheckoutProduct = {
  id: string; name: string; weight_grams: number; making_charge: number
  stock_pcs: number; stock_grams: number; is_active: boolean
  pricing_mode?: 'weight' | 'piece'; piece_rate?: number
}

export function validateCheckout(body: unknown) {
  if (!body || typeof body !== 'object') throw new CheckoutError('Invalid checkout request.')
  const input = body as Record<string, unknown>
  if (!Array.isArray(input.items) || !input.items.length) throw new CheckoutError('Your cart is empty.')
  if (input.items.length > 100) throw new CheckoutError('Your cart has too many items.')
  const quantities = new Map<string, number>()
  for (const item of input.items) {
    if (!item || typeof item.product_id !== 'string' || !UUID_PATTERN.test(item.product_id) || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 999) {
      throw new CheckoutError('Each item must have a valid product and a whole quantity from 1 to 999.')
    }
    const id = item.product_id.toLowerCase()
    const qty = (quantities.get(id) ?? 0) + item.qty
    if (qty > 999) throw new CheckoutError('A product quantity cannot exceed 999.')
    quantities.set(id, qty)
  }
  if (!input.delivery || typeof input.delivery !== 'object') throw new CheckoutError('Enter your delivery details.')
  const source = input.delivery as Record<string, unknown>
  const delivery = Object.fromEntries(['name', 'phone', 'address', 'city', 'pincode'].map(key => [key, typeof source[key] === 'string' ? source[key].trim() : '']))
  if (!delivery.name || !delivery.address || !delivery.city || delivery.name.length > 120 || delivery.address.length > 1000 || delivery.city.length > 120) throw new CheckoutError('Enter a valid name, address and city.')
  if (!/^\+?[\d\s()-]{10,20}$/.test(delivery.phone) || delivery.phone.replace(/\D/g, '').length < 10) throw new CheckoutError('Enter a valid phone number.')
  if (!/^[1-9]\d{5}$/.test(delivery.pincode)) throw new CheckoutError('Enter a valid six-digit Indian pincode.')
  return { items: Array.from(quantities, ([product_id, qty]) => ({ product_id, qty })), delivery }
}

export function priceCheckout(items: CheckoutItem[], products: CheckoutProduct[], rate: number) {
  const productMap = new Map(products.map(product => [product.id, product]))
  let amount = 0
  const lines = items.map(item => {
    const product = productMap.get(item.product_id)
    if (!product || !product.is_active) throw new CheckoutError('A product is no longer available.')
    if (availableStock(product) < item.qty) throw new CheckoutError(`${product.name} does not have enough stock. Please update your cart.`, 409)
    if (product.pricing_mode !== 'piece' && (!Number.isFinite(rate) || rate <= 0)) throw new CheckoutError('The silver rate is not available yet.')
    const unit = sellingPrice(product, rate)
    const paise = Math.round(unit * 100) * item.qty
    if (!Number.isSafeInteger(paise) || paise <= 0) throw new CheckoutError('A product price is invalid.')
    amount += paise
    return { product_id: product.id, product_name: product.name, weight_grams: product.weight_grams, rate_per_gram: product.pricing_mode === 'piece' ? 0 : rate, making_charge: product.making_charge, unit_price: unit, qty: item.qty, line_total: paise / 100 }
  })
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 999999999999) throw new CheckoutError('The order total is outside the supported range.')
  return { lines, amount, total: amount / 100 }
}
