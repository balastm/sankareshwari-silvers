'use client'

import { useMemo, useSyncExternalStore } from 'react'

export type CartItem = { id: string; name: string; image_url: string | null; weight_grams: number; qty: number }
const CART_KEY = 'silver-cart'
const CART_EVENT = 'silver-cart-change'
let activeUserId: string | null = null
function storageKey() { return activeUserId ? `${CART_KEY}:${activeUserId}` : CART_KEY }

function snapshot() {
  try { return localStorage.getItem(storageKey()) || '[]' } catch { return '[]' }
}

function parseCart(value: string): CartItem[] {
  try {
    const items: unknown = JSON.parse(value)
    if (!Array.isArray(items)) return []
    return items.filter((item): item is CartItem => item && typeof item.id === 'string' && typeof item.name === 'string' && Number.isInteger(item.qty) && item.qty > 0)
  } catch { return [] }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === CART_KEY || event.key === storageKey() || event.key === null) onChange() }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CART_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CART_EVENT, onChange)
  }
}

export function getCart() { return parseCart(snapshot()) }

export function setCartUser(userId: string | null) {
  if (activeUserId === userId) return
  try {
    const nextKey = userId ? `${CART_KEY}:${userId}` : CART_KEY
    if (userId) {
      const anonymous = parseCart(localStorage.getItem(CART_KEY) || '[]')
      const saved = parseCart(localStorage.getItem(nextKey) || '[]')
      const merged = [...saved]
      for (const item of anonymous) {
        const existing = merged.find(line => line.id === item.id)
        if (existing) existing.qty += item.qty
        else merged.push(item)
      }
      localStorage.setItem(nextKey, JSON.stringify(merged))
      localStorage.removeItem(CART_KEY)
    }
    activeUserId = userId
  } catch { activeUserId = userId }
  window.dispatchEvent(new Event(CART_EVENT))
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(storageKey(), JSON.stringify(items))
  window.dispatchEvent(new Event(CART_EVENT))
}

export function clearCart() {
  localStorage.removeItem(storageKey())
  window.dispatchEvent(new Event(CART_EVENT))
}

export function useCart() {
  const value = useSyncExternalStore(subscribe, snapshot, () => '[]')
  return useMemo(() => parseCart(value), [value])
}
