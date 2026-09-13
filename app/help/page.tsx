import Header from '@/components/Header'
import StoreFooter from '@/components/StoreFooter'
const answers = [
  ['How are prices calculated?', 'Weight-priced pieces use the latest published silver rate multiplied by the product weight, plus the making charge. Piece-priced products have a fixed piece price plus the making charge. You can see the breakdown on each product page. Prices and stock are checked again before payment.'],
  ['How do I place an order?', 'Choose a piece, add it to your bag, and sign in to checkout. Enter your delivery details and complete payment through Razorpay. Your order history shows the recorded payment and fulfilment status.'],
  ['Can I check delivery timing or arrange a gift?', 'Please contact our Eral store before placing an order to confirm delivery availability, timing and any gift packaging requirements for your destination.'],
  ['What if I need to cancel, return or change an order?', 'Contact the store with your order number as soon as possible. The team can confirm which options are available for your specific item and order stage.'],
  ['My payment went through but my order is pending. What should I do?', 'Do not pay again. Check your order history and contact the store with your order number and payment reference so the team can reconcile the payment.'],
  ['How should I care for silver?', 'Keep silver away from moisture, perfume and household chemicals. Use a soft cloth after wearing or handling it, and store each piece separately in a dry pouch. Ask us for care guidance for pieces with stones or decorative finishes.'],
]
export const metadata = { title: 'Shopping & silver care | Sankareshwari Silvers' }
export default function Help() {
  return <><Header /><main className="container section help-page"><div className="eyebrow">A little guidance</div><h1>Here to help you<br /><em>choose with care.</em></h1><p className="muted">Shopping, pricing and looking after your favourite pieces.</p>{answers.map(([question, answer]) => <details className="shop-disclosure" key={question}><summary>{question}</summary><p>{answer}</p></details>)}<div className="help-contact"><h3>Prefer a conversation?</h3><p>Talk to the people behind your piece.</p><a className="btn btn-dark" href="https://wa.me/919655570730">Chat with our store ↗</a></div></main><StoreFooter /></>
}
