'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Fill in all fields'); return }
    setLoading(true)
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase')
      const { getUserProfile } = await import('@/lib/firestore')
      const result = await signInWithEmailAndPassword(auth, email, password)
      const profile = await getUserProfile(result.user.uid)
      toast.success('Welcome back! 👋')
      router.push((profile as any)?.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: any) {
      console.error(err)
      if (err.code === 'auth/user-not-found') toast.error('Account not found')
      else if (err.code === 'auth/wrong-password') toast.error('Wrong password')
      else if (err.code === 'auth/invalid-credential') toast.error('Wrong email or password')
      else if (err.code === 'auth/invalid-email') toast.error('Invalid email')
      else toast.error('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase')
      const { getUserProfile, createUserProfile } = await import('@/lib/firestore')
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      let profile = await getUserProfile(result.user.uid)
      if (!profile) {
        await createUserProfile(result.user.uid, {
          uid: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName || 'User',
          role: 'customer',
        })
        profile = await getUserProfile(result.user.uid)
      }
      toast.success('Signed in! 🎉')
      router.push((profile as any)?.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err: any) {
      toast.error('Google error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ fontFamily: 'serif', fontSize: 28, letterSpacing: 4, color: '#D4A017', marginBottom: 4 }}>KEN MEDIA</div>
      <div style={{ fontSize: 10, letterSpacing: 4, color: '#888', marginBottom: 32 }}>CREATIVE STUDIO</div>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Welcome Back 👋</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Sign in to your Ken Media account</p>
        <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px', fontSize: 14, color: '#fff', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div style={{ textAlign: 'center', color: '#555', fontSize: 12, marginBottom: 16 }}>or sign in with email</div>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
        <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} type="password" placeholder="Password" style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 14, marginBottom: 20, outline: 'none', boxSizing: 'border-box' }} />
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', border: 'none', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 16 }}>
          Don't have an account? <Link href="/auth/register" style={{ color: '#D4A017' }}>Create Account</Link>
        </p>
      </div>
    </div>
  )
}
