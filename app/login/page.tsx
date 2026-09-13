import Header from '@/components/Header'
import AuthForm from './AuthForm'
import { safeNextPath } from '@/lib/navigation'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = '/', error } = await searchParams
  return (
    <>
      <Header />
      <main className="auth-shell">
        <div className="card auth-card">
          <div className="eyebrow">Secure account</div>
          <h2 style={{ fontSize: '2.5rem' }}>Welcome</h2>
          <p className="muted">Login with your email and password, or create a customer account. Admin access is available only to approved store accounts.</p>
          {error === 'auth_callback' && <div className="notice auth-error" role="alert">This sign-in link is invalid or has expired. Please sign in again or request a new link.</div>}
          {error === 'admin_required' && <div className="notice auth-error" role="alert">This account is signed in, but it does not have admin access. Use the approved store account or ask the owner to add this account as an admin.</div>}
          <AuthForm next={safeNextPath(next)} />
        </div>
      </main>
    </>
  )
}
