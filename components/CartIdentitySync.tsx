'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setCartUser } from '@/lib/cart'

export default function CartIdentitySync() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setCartUser(data.user?.id ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setCartUser(session?.user?.id ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])
  return null
}
