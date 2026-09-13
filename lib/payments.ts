import { createAdminClient } from './supabase/server'
import { CheckoutError } from './checkout-validation'

export function razorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !secret) throw new CheckoutError('Payments are not configured. Please contact the store.', 503)
  return { keyId, secret }
}

export async function razorpayRequest(path: string, init: RequestInit = {}) {
  const { keyId, secret } = razorpayCredentials()
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`, 'content-type': 'application/json' },
  })
  if (!response.ok) throw new CheckoutError('The payment provider is unavailable. Please try again.', 502)
  return response.json()
}

export async function fulfillOrder(admin: ReturnType<typeof createAdminClient>, orderId: string, razorpayOrderId: string, paymentId: string, amount: number) {
  const { error } = await admin.rpc('fulfill_paid_order', {
    p_order_id: orderId, p_razorpay_order_id: razorpayOrderId, p_payment_id: paymentId, p_amount_paise: amount,
  })
  if (error) throw new CheckoutError('Payment confirmation is pending. Please contact the store with your payment ID; do not pay again.', 503)
}

export async function assertPaymentFulfillment(admin: ReturnType<typeof createAdminClient>) {
  // The function rejects these sentinel values before selecting or writing any row.
  // Verify deployment and service-role permissions before creating a payable order.
  const { error } = await admin.rpc('fulfill_paid_order', {
    p_order_id: '00000000-0000-0000-0000-000000000000',
    p_razorpay_order_id: '', p_payment_id: '', p_amount_paise: 0,
  })
  if (error?.code !== '22023' || !error.message.includes('Invalid payment details')) {
    throw new CheckoutError('Online payment is temporarily unavailable. Please contact the store to place your order.', 503)
  }
}
