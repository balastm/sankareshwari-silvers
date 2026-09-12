import Header from '@/components/Header'
import UpdatePasswordForm from './UpdatePasswordForm'

export default function UpdatePasswordPage() {
  return <><Header/><main className="auth-shell"><div className="card auth-card">
    <div className="eyebrow">Account security</div><h2>Set new password</h2>
    <UpdatePasswordForm/>
  </div></main></>
}
