// src/lib/auth.ts
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserProfile, getUserProfile } from './firestore'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const loginWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  phone?: string
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName })
  await createUserProfile(result.user.uid, {
    uid: result.user.uid,
    email,
    displayName,
    phone: phone || '',
    role: email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'customer',
  })
  return result.user
}

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider)
  const existing = await getUserProfile(result.user.uid)
  if (!existing) {
    await createUserProfile(result.user.uid, {
      uid: result.user.uid,
      email: result.user.email!,
      displayName: result.user.displayName || 'User',
      photoURL: result.user.photoURL || '',
      role: result.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'customer',
    })
  }
  return result.user
}

export const logout = () => signOut(auth)

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email)

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback)
