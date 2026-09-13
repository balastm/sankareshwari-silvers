'use client'
import { useActionState } from 'react'
import { saveProfile } from './actions'
export default function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState(saveProfile, {})
  return <form className="form" action={action}><div className="field"><label htmlFor="profile-name">Full name</label><input className="input" id="profile-name" name="full_name" autoComplete="name" defaultValue={name} required maxLength={120}/></div><div className="field"><label htmlFor="profile-phone">Phone number</label><input className="input" id="profile-phone" name="phone" type="tel" autoComplete="tel" defaultValue={phone} maxLength={20}/></div>{state.error && <p className="notice auth-error" role="alert">{state.error}</p>}{state.success && <p className="notice auth-success" role="status">Your details have been saved.</p>}<button className="btn btn-dark" disabled={pending}>{pending ? 'Saving…' : 'Save your details'}</button></form>
}
