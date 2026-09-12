import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validSignature } from '@/lib/payment-signature'
import { fulfillOrder } from '@/lib/payments'

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 })
  const raw = await request.text()
  if (!validSignature(raw, request.headers.get('x-razorpay-signature'), secret)) return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  try {
    const event = JSON.parse(raw)
    if (!event || typeof event.event !== 'string') return NextResponse.json({ error: 'Invalid webhook event.' }, { status: 400 })
    if (!['order.paid', 'payment.captured', 'payment.failed'].includes(event.event)) return NextResponse.json({ ok: true })
    const admin = createAdminClient()
    const payment = event.payload?.payment?.entity
    if (!payment || typeof payment.order_id !== 'string') return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 })
    if (event.event === 'payment.failed') {
      // A late failure for an earlier attempt must never overwrite a paid order.
      const { error } = await admin.from('orders').update({ payment_status: 'failed' }).eq('razorpay_order_id', payment.order_id).eq('payment_status', 'pending')
      if (error) throw error
    } else {
      if (payment.status !== 'captured' || payment.currency !== 'INR' || typeof payment.id !== 'string' || !Number.isSafeInteger(payment.amount) || payment.amount <= 0) return NextResponse.json({ error: 'Invalid captured payment.' }, { status: 400 })
      const { data: order, error } = await admin.from('orders').select('id').eq('razorpay_order_id', payment.order_id).maybeSingle()
      if (error) throw error
      // Orders from other integrations in the same Razorpay account are ignored.
      if (!order) return NextResponse.json({ ok: true, ignored: true })
      await fulfillOrder(admin, order.id, payment.order_id, payment.id, payment.amount)
    }
    // Log only after fulfillment succeeds so failed deliveries can be retried.
    const eventId = request.headers.get('x-razorpay-event-id') || createHash('sha256').update(raw).digest('hex')
    const { error } = await admin.from('payment_webhook_events').upsert({ event_id: eventId, event_type: event.event }, { onConflict: 'event_id', ignoreDuplicates: true })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof SyntaxError ? 'Invalid webhook JSON.' : 'Webhook processing failed. Retry this delivery.' }, { status: error instanceof SyntaxError ? 400 : 503 })
  }
}
