export const ORDER_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'] as const
export function orderStatusError(current: string, next: string, payment: string) {
  if (!(ORDER_STATUSES as readonly string[]).includes(next)) return 'Choose a valid order status.'
  if (current === next) return null
  if (['cancelled','delivered'].includes(current)) return 'Completed or cancelled orders cannot be changed here.'
  if (['confirmed','processing','shipped','delivered'].includes(next) && payment !== 'paid') return 'Payment must be confirmed before fulfilment.'
  if (next === 'cancelled' && (payment === 'paid' || current === 'shipped')) return 'Paid orders require a refund review. Contact the payment provider before cancelling.'
  const transitions:Record<string,string[]>={pending:['confirmed','cancelled'],confirmed:['processing'],processing:['shipped'],shipped:['delivered']}
  if (!transitions[current]?.includes(next)) return 'Move the order to the next fulfilment stage.'
  return null
}
