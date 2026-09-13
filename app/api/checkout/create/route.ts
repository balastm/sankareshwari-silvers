import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { CheckoutError, priceCheckout, validateCheckout } from '@/lib/checkout-validation'
import { assertPaymentFulfillment, razorpayCredentials, razorpayRequest } from '@/lib/payments'
import { todayInIndia } from '@/lib/dates'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
    const { items, delivery } = validateCheckout(await request.json())
    const { keyId } = razorpayCredentials()
    const admin = createAdminClient()
    await assertPaymentFulfillment(admin)
    const [products, rate] = await Promise.all([
      admin.from('products').select('id,name,weight_grams,making_charge,pricing_mode,piece_rate,stock_pcs,stock_grams,is_active').in('id', items.map(item => item.product_id)),
      admin.from('silver_rates').select('rate_per_gram').lte('effective_date', todayInIndia()).order('effective_date', { ascending: false }).limit(1).maybeSingle(),
    ])
    if (products.error || rate.error) throw new CheckoutError('Unable to load current prices and stock. Please try again.', 503)
    const { lines, amount, total } = priceCheckout(items, products.data ?? [], Number(rate.data?.rate_per_gram))
    const { data: order, error } = await admin.from('orders').insert({ user_id: user.id, status: 'pending', payment_status: 'pending', total_amount: total, delivery_address: delivery }).select('id').single()
    if (error || !order) throw new CheckoutError('Unable to save your order. Please try again.', 503)
    try {
      const { error: itemsError } = await admin.from('order_items').insert(lines.map(line => ({ ...line, order_id: order.id })))
      if (itemsError) throw new CheckoutError('Unable to save the order items. Please try again.', 503)
      const providerOrder = await razorpayRequest('orders', { method: 'POST', body: JSON.stringify({ amount, currency: 'INR', receipt: order.id }) })
      if (typeof providerOrder.id !== 'string' || !/^order_[a-zA-Z0-9]+$/.test(providerOrder.id)) throw new CheckoutError('The payment provider returned an invalid order.', 502)
      const { error: updateError } = await admin.from('orders').update({ razorpay_order_id: providerOrder.id }).eq('id', order.id)
      if (updateError) throw new CheckoutError('Unable to link the payment to your order. Please try again.', 503)
      return NextResponse.json({ orderId: order.id, razorpayOrderId: providerOrder.id, amount, keyId })
    } catch (error) {
      await admin.from('orders').update({ status: 'cancelled', payment_status: 'failed' }).eq('id', order.id).eq('payment_status', 'pending')
      throw error
    }
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 })
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : 'Checkout is unavailable. Please try again shortly.' }, { status: error instanceof CheckoutError ? error.status : 503 })
  }
}
