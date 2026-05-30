'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useStore from '@/store/useStore'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useStore()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoading) return
    setChecking(false)
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (user.role !== 'admin') {
      router.push('/')
    }
  }, [user, isLoading, router])

  if (isLoading || checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(212,160,23,0.2)', borderTop: '3px solid #D4A017', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#888', fontSize: 13 }}>Verifying admin access...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null
  return <>{children}</>
}
