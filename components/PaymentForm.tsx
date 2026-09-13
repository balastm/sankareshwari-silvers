'use client'
import { useRef, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { clearCart, useCart } from '@/lib/cart'
import { availableStock, type ProductListItem } from '@/lib/products'

type PaymentResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
type RazorpayOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string
  prefill: { email: string; contact: string; name: string }
  handler: (response: PaymentResponse) => Promise<void>
  modal: { ondismiss: () => void }
}
type Gateway = new (options: RazorpayOptions) => { open: () => void; on: (event: string, handler: () => void) => void }

export default function PaymentForm({ email, name, phone, products, rate, unavailable }: { email: string; name: string; phone: string; products: ProductListItem[]; rate: number; unavailable: boolean }) {
  const cart = useCart()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [confirmationPending, setConfirmationPending] = useState(false)
  const inFlight = useRef(false)
  const blocked = unavailable || !cart.length || cart.some(item => {
    const p = products.find(p => p.id === item.id)
    return !p || availableStock(p) < item.qty || (p.pricing_mode !== 'piece' && rate <= 0)
  })
  function release() { inFlight.current = false; setBusy(false) }
  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || blocked || confirmationPending) return
    const Gateway = (window as Window & { Razorpay?: Gateway }).Razorpay
    if (!Gateway) { setMessage('The payment gateway is still loading. Please try again shortly.'); return }
    inFlight.current = true
    setBusy(true)
    setMessage('')
    const fd = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/checkout/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: cart.map(item => ({ product_id: item.id, qty: item.qty })), delivery: Object.fromEntries(['name','phone','address','city','pincode'].map(key => [key, fd.get(key)])) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to prepare payment. Please try again.')
      let verifying = false
      const gateway = new Gateway({ key: data.keyId, amount: data.amount, currency: 'INR', name: 'Sankareshwari Silvers', description: 'Your silver collection', order_id: data.razorpayOrderId, prefill: { email, contact: String(fd.get('phone') || ''), name: String(fd.get('name') || '') },
        modal: { ondismiss: () => { if (!verifying) { setMessage('Payment window closed. You can try again when you’re ready.'); release() } } },
        handler: async payment => {
          verifying = true
          setConfirmationPending(true)
          setMessage('Confirming your payment…')
          try {
            const verified = await fetch('/api/checkout/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...payment, orderId: data.orderId }) })
            if (!verified.ok) throw new Error('Confirmation pending')
            try { clearCart() } catch { /* A successful payment must still lead to order history. */ }
            router.replace('/orders?paid=1')
            router.refresh()
          } catch { setMessage(`Payment confirmation is pending. Do not pay again. Check your orders or contact us with reference ${payment.razorpay_payment_id}.`) }
          finally { release() }
        },
      })
      gateway.on('payment.failed', () => { if (!verifying) { setMessage('The payment attempt failed. Close the payment window before trying again. If your account was debited, contact the store first.') } })
      gateway.open()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The connection was interrupted. Please try again.'); release() }
  }
  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setReady(true)} onError={() => { setReady(false); setMessage('The payment gateway could not load. Refresh this page to try again.') }}/>
    <form onSubmit={pay} className="account-card card form"><div><div className="eyebrow">Where shall we send it?</div><h2>Delivery details</h2></div><fieldset disabled={busy || confirmationPending} className="checkout-fields"><div className="form-grid"><div className="field"><label htmlFor="delivery-name">Full name</label><input id="delivery-name" name="name" className="input" autoComplete="name" defaultValue={name} required maxLength={120}/></div><div className="field"><label htmlFor="delivery-phone">Phone</label><input id="delivery-phone" name="phone" type="tel" className="input" autoComplete="tel" defaultValue={phone} required maxLength={20}/></div><div className="field span2"><label htmlFor="delivery-address">Street address</label><textarea id="delivery-address" name="address" className="input" autoComplete="street-address" placeholder="House number, street and area" required maxLength={1000}/></div><div className="field"><label htmlFor="delivery-city">City</label><input id="delivery-city" name="city" className="input" autoComplete="address-level2" required maxLength={120}/></div><div className="field"><label htmlFor="delivery-pincode">Indian pincode</label><input id="delivery-pincode" name="pincode" className="input" autoComplete="postal-code" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required/></div></div></fieldset><p className="detail-note">You’ll review the final payment amount in Razorpay. Contact the store before ordering to confirm delivery arrangements.</p>{message && <div className="notice" role="status">{message}</div>}{confirmationPending && <Link className="text-link" href="/orders">Check your order status ↗</Link>}<button disabled={busy || blocked || !ready || confirmationPending} className="btn btn-dark">{busy ? 'Payment in progress…' : confirmationPending ? 'Check payment status in your orders' : blocked ? 'Review your bag before payment' : !ready ? 'Loading secure payment…' : 'Continue to secure payment ↗'}</button></form>
  </>
}
