'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeNextPath } from '@/lib/navigation'

type Mode = 'login' | 'signup'

export default function AuthForm({ next }: { next: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  function safeNext() {
    return safeNextPath(next)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    setIsError(false)

    if (mode === 'signup' && password !== confirmPassword) {
      setIsError(true)
      setMessage('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setIsError(true)
      setMessage('Password must contain at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim()
            },
            emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(safeNext())}`
          }
        })
        if (error) throw error

        // If email confirmation is disabled, Supabase returns a session and
        // the customer can continue immediately. Otherwise ask them to confirm.
        if (data.session) {
          router.replace(safeNext())
          router.refresh()
        } else {
          setMessage('Account created. Please check your email to confirm your account, then log in.')
          setMode('login')
          setPassword('')
          setConfirmPassword('')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        })
        if (error) throw error
        router.replace(safeNext())
        router.refresh()
      }
    } catch (err: any) {
      setIsError(true)
      setMessage(err?.message || 'Unable to continue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function oauth(provider: 'google' | 'apple' | 'github') {
    setMessage('')
    setIsError(false)
    setLoading(true)
    try {
    const redirectTo = `${location.origin}/auth/callback?next=${encodeURIComponent(safeNext())}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    })
    if (error) {
      setIsError(true)
      setMessage(error.message)
    }
    } catch {
      setIsError(true)
      setMessage('Unable to connect. Please try again.')
    } finally { setLoading(false) }
  }

  async function forgotPassword() {
    if (!email.trim()) {
      setIsError(true)
      setMessage('Enter your email address first.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${location.origin}/auth/callback?next=/auth/update-password`
    })
    setLoading(false)
    if (error) {
      setIsError(true)
      setMessage(error.message)
    } else {
      setIsError(false)
      setMessage('Password reset link sent to your email.')
    }
    } catch {
      setIsError(true)
      setMessage('Unable to send the reset link. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="auth-tabs">
        <button type="button" className={mode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('login'); setMessage('') }}>
          Login
        </button>
        <button type="button" className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('signup'); setMessage('') }}>
          Create account
        </button>
      </div>

      <form className="form" onSubmit={submit}>
        {mode === 'signup' && (
          <>
            <div className="field">
              <label>Full name</label>
              <input className="input" required autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="field">
              <label>Phone number</label>
              <input className="input" required type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
            </div>
          </>
        )}

        <div className="field">
          <label>Email</label>
          <input className="input" required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" required type="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
        </div>

        {mode === 'signup' && (
          <div className="field">
            <label>Confirm password</label>
            <input className="input" required type="password" minLength={6} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Enter password again" />
          </div>
        )}

        {message && <div className={isError ? 'notice auth-error' : 'notice auth-success'}>{message}</div>}

        <button className="btn btn-dark" disabled={loading} type="submit">
          {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>

        {mode === 'login' && (
          <button className="auth-link" disabled={loading} type="button" onClick={forgotPassword}>
            Forgot password?
          </button>
        )}
      </form>

      <div className="auth-divider"><span>OR</span></div>
      <div className="oauth">
        <button type="button" className="btn btn-ghost" onClick={() => oauth('google')}>Continue with Google</button>
        <button type="button" className="btn btn-dark" onClick={() => oauth('apple')}>Continue with Apple</button>
        <button type="button" className="btn btn-ghost" onClick={() => oauth('github')}>Continue with GitHub</button>
      </div>
    </div>
  )
}
