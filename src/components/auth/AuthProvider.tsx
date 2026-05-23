'use client'
import { useEffect } from 'react'
import useStore from '@/store/useStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading } = useStore()

  useEffect(() => {
    try {
      const { onAuthChange } = require('@/lib/auth')
      const { getUserProfile } = require('@/lib/firestore')
      const { subscribeToNotifications } = require('@/lib/firestore')

      const unsub = onAuthChange(async (firebaseUser: any) => {
        if (firebaseUser) {
          const profile = await getUserProfile(firebaseUser.uid)
          useStore.getState().setUser(profile as any)
          const unsubNotifs = subscribeToNotifications(
            firebaseUser.uid,
            useStore.getState().setNotifications
          )
          return () => unsubNotifs()
        } else {
          useStore.getState().setUser(null)
        }
        setLoading(false)
      })
      return () => unsub()
    } catch (e) {
      console.error('Firebase init error:', e)
      setLoading(false)
    }
  }, [setLoading])

  return <>{children}</>
}
