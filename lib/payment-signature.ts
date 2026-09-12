import { createHmac, timingSafeEqual } from 'node:crypto'

export function validSignature(payload: string, signature: unknown, secret: string) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(payload).digest()
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'))
}
