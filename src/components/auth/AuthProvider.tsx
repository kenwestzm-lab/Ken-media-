'use client'
import { useEffect } from 'react'
import useStore from '@/store/useStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useStore()

  useEffect(() => {
    let unsubNotifs: (() => void) | null = null
    const init = async () => {
      try {
        const { onAuthChange }            = await import('@/lib/auth')
        const { getUserProfile }          = await import('@/lib/firestore')
        const { subscribeToNotifications } = await import('@/lib/firestore')

        const unsub = onAuthChange(async (firebaseUser: any) => {
          if (firebaseUser) {
            try {
              const profile = await getUserProfile(firebaseUser.uid)
              useStore.getState().setUser(profile as any)
              unsubNotifs = subscribeToNotifications(
                firebaseUser.uid,
                useStore.getState().setNotifications
              )
            } catch {
              useStore.getState().setUser({
                uid:         firebaseUser.uid,
                email:       firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'User',
                role:        'customer',
              } as any)
            }
          } else {
            useStore.getState().setUser(null)
            if (unsubNotifs) { unsubNotifs(); unsubNotifs = null }
          }
          setLoading(false)
        })
        return () => { unsub(); if (unsubNotifs) unsubNotifs() }
      } catch (e) {
        console.error('Auth init error:', e)
        setLoading(false)
      }
    }
    init()
  }, [setLoading])

  return <>{children}</>
}
