'use client'

import { useMemo, useSyncExternalStore } from 'react'

export type CartItem = { id: string; name: string; image_url: string | null; weight_grams: number; qty: number }
const CART_KEY = 'silver-cart'
const CART_EVENT = 'silver-cart-change'

function snapshot() {
  try { return localStorage.getItem(CART_KEY) || '[]' } catch { return '[]' }
}

function parseCart(value: string): CartItem[] {
  try {
    const items: unknown = JSON.parse(value)
    if (!Array.isArray(items)) return []
    return items.filter((item): item is CartItem => item && typeof item.id === 'string' && typeof item.name === 'string' && Number.isInteger(item.qty) && item.qty > 0)
  } catch { return [] }
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === CART_KEY || event.key === null) onChange() }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CART_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CART_EVENT, onChange)
  }
}

export function getCart() { return parseCart(snapshot()) }

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_EVENT))
}

export function clearCart() {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event(CART_EVENT))
}

export function useCart() {
  const value = useSyncExternalStore(subscribe, snapshot, () => '[]')
  return useMemo(() => parseCart(value), [value])
}
