'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordForm() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) return setMessage('Passwords do not match.')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setMessage(error.message)
    else {
      setMessage('Password updated successfully.')
      setTimeout(() => router.replace('/login'), 800)
    }
  }

  return <form className="form" onSubmit={submit}>
    <div className="field"><label>New password</label><input className="input" type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)}/></div>
    <div className="field"><label>Confirm password</label><input className="input" type="password" minLength={6} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>
    {message && <div className="notice">{message}</div>}
    <button className="btn btn-dark" disabled={loading}>{loading?'Updating...':'Update password'}</button>
  </form>
}
