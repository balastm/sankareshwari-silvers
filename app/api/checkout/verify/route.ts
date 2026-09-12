import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { UUID_PATTERN } from '@/lib/products'
import { CheckoutError } from '@/lib/checkout-validation'
import { fulfillOrder, razorpayCredentials, razorpayRequest } from '@/lib/payments'
import { validSignature } from '@/lib/payment-signature'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 })
    const body = await request.json()
    if (!body || typeof body.orderId !== 'string' || !UUID_PATTERN.test(body.orderId) || typeof body.razorpay_payment_id !== 'string' || !/^pay_[a-zA-Z0-9]+$/.test(body.razorpay_payment_id)) throw new CheckoutError('Invalid payment response.')
    const admin = createAdminClient()
    const { data: order, error } = await admin.from('orders').select('id,user_id,payment_status,razorpay_order_id,razorpay_payment_id,total_amount').eq('id', body.orderId).eq('user_id', user.id).maybeSingle()
    if (error) throw new CheckoutError('Unable to load your order. Please try again.', 503)
    if (!order) throw new CheckoutError('Order not found.', 404)
    if (!order.razorpay_order_id || body.razorpay_order_id !== order.razorpay_order_id) throw new CheckoutError('Payment does not match this order.')
    const { secret } = razorpayCredentials()
    if (!validSignature(order.razorpay_order_id + '|' + body.razorpay_payment_id, body.razorpay_signature, secret)) throw new CheckoutError('Invalid payment signature.')
    if (order.payment_status === 'paid') {
      if (order.razorpay_payment_id !== body.razorpay_payment_id) throw new CheckoutError('Payment does not match this order.')
      return NextResponse.json({ ok: true })
    }
    const payment = await razorpayRequest('payments/' + body.razorpay_payment_id)
    const amount = Math.round(Number(order.total_amount) * 100)
    if (payment.id !== body.razorpay_payment_id || payment.order_id !== order.razorpay_order_id || payment.currency !== 'INR' || payment.amount !== amount) throw new CheckoutError('The payment details do not match this order.')
    if (payment.status !== 'captured') return NextResponse.json({ ok: false, pending: true, message: 'Your payment is awaiting confirmation. Check My Orders shortly; do not pay again.' }, { status: 202 })
    await fulfillOrder(admin, order.id, order.razorpay_order_id, payment.id, amount)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid payment response.' }, { status: 400 })
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : 'Payment confirmation is pending. Please contact the store; do not pay again.' }, { status: error instanceof CheckoutError ? error.status : 503 })
  }
}
