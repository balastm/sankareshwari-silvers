'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()
  return <button className="btn btn-dark" onClick={async () => {
    await createClient().auth.signOut()
    router.replace('/')
    router.refresh()
  }}>Sign out</button>
}
