'use client'
// src/app/auth/register/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerWithEmail, loginWithGoogle } from '@/lib/auth'

const schema = z.object({
  displayName: z.string().min(2, 'Enter your full name'),
  email:       z.string().email('Enter a valid email'),
  phone:       z.string().min(10, 'Enter a valid Zambian phone number').optional(),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  confirm:     z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await registerWithEmail(data.email, data.password, data.displayName, data.phone)
      toast.success('Account created! Welcome to Ken Media 🎉')
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use' ? 'This email is already registered'
                : 'Registration failed. Please try again.'
      toast.error(msg)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      toast.success('Welcome to Ken Media! 🎉')
      router.push('/dashboard')
    } catch {
      toast.error('Google sign-in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <div className="px-5 pt-12 pb-6 text-center bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,160,23,0.1),transparent)]">
        <div className="font-bebas text-3xl tracking-[3px] text-gold-gradient mb-1">KEN MEDIA</div>
        <div className="text-[10px] tracking-[4px] text-[#88887f] uppercase mb-6">Creative Studio</div>
        <h1 className="font-syne text-2xl font-extrabold mb-1">Join Ken Media ✨</h1>
        <p className="text-xs text-[#88887f]">Create your free account to get started</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 px-5 pb-10 max-w-md mx-auto w-full"
      >
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#1a1a1a] border border-white/[0.12] rounded-2xl py-3.5 text-sm font-medium mb-4 hover:border-[rgba(212,160,23,0.3)] transition-all disabled:opacity-60"
        >
          {googleLoading
            ? <span className="w-5 h-5 border-2 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin" />
            : <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
          }
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-xs text-[#88887f]">or create with email</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88887f]" />
              <input {...register('displayName')} type="text" placeholder="Full name" className="input-dark pl-11 pr-4 py-3.5 text-sm" />
            </div>
            {errors.displayName && <p className="text-xs text-red-400 mt-1 pl-1">{errors.displayName.message}</p>}
          </div>
          <div>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88887f]" />
              <input {...register('email')} type="email" placeholder="Email address" className="input-dark pl-11 pr-4 py-3.5 text-sm" />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1 pl-1">{errors.email.message}</p>}
          </div>
          <div>
            <div className="relative">
              <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88887f]" />
              <input {...register('phone')} type="tel" placeholder="Phone number (0XXXXXXXXX)" className="input-dark pl-11 pr-4 py-3.5 text-sm" />
            </div>
            {errors.phone && <p className="text-xs text-red-400 mt-1 pl-1">{errors.phone.message}</p>}
          </div>
          <div>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88887f]" />
              <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Create password (8+ chars)" className="input-dark pl-11 pr-12 py-3.5 text-sm" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#88887f]">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1 pl-1">{errors.password.message}</p>}
          </div>
          <div>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88887f]" />
              <input {...register('confirm')} type="password" placeholder="Confirm password" className="input-dark pl-11 pr-4 py-3.5 text-sm" />
            </div>
            {errors.confirm && <p className="text-xs text-red-400 mt-1 pl-1">{errors.confirm.message}</p>}
          </div>

          <p className="text-[10px] text-[#88887f] text-center">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-[#D4A017]">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-[#D4A017]">Privacy Policy</Link>.
          </p>

          <button type="submit" disabled={isSubmitting} className="btn-gold w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            {isSubmitting ? <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : null}
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-[#88887f] mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#D4A017] font-semibold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  )
}
