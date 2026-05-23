'use client'
// src/app/contact/page.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import WhatsAppButton from '@/components/ui/WhatsAppButton'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(4),
  message: z.string().min(20, 'Message too short'),
})
type F = z.infer<typeof schema>

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: F) => {
    await new Promise(r => setTimeout(r, 1000))
    toast.success('Message sent! We\'ll reply within 2 hours. 🎉')
    reset()
  }

  const wa = process.env.NEXT_PUBLIC_WHATSAPP || '0772799672'

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="px-4 pt-8 pb-4 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(212,160,23,0.08),transparent)]">
        <h1 className="font-bebas text-5xl tracking-wider mb-1">GET IN <span className="text-gold-gradient">TOUCH</span></h1>
        <p className="text-sm text-[#88887f]">We'd love to work with you</p>
      </div>
      <div className="px-4 pb-28 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
          {[
            { icon: '📱', label: 'WhatsApp',    val: wa,               href: `https://wa.me/260${wa.replace(/^0/,'')}` },
            { icon: '📘', label: 'Facebook',    val: 'DjTizzyBeats',   href: process.env.NEXT_PUBLIC_FACEBOOK_URL || '#' },
            { icon: '📶', label: 'Airtel Money',val: '0570109056',      href: '#' },
            { icon: '📡', label: 'MTN Money',   val: '0761468402',     href: '#' },
          ].map(c => (
            <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
              className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 text-center hover:border-[rgba(212,160,23,0.3)] transition-all">
              <div className="text-2xl mb-1">{c.icon}</div>
              <div className="text-xs font-semibold">{c.label}</div>
              <div className="text-[11px] text-[#D4A017] mt-0.5 font-mono">{c.val}</div>
            </a>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="font-syne text-base font-bold">Send a Message</h2>
          {[
            { name: 'name',    label: 'Full Name',    type: 'text',  ph: 'Your full name' },
            { name: 'email',   label: 'Email',        type: 'email', ph: 'your@email.com' },
            { name: 'phone',   label: 'Phone',        type: 'tel',   ph: '0XXXXXXXXX (optional)' },
            { name: 'subject', label: 'Subject',      type: 'text',  ph: 'What is this about?' },
          ].map(f => (
            <div key={f.name}>
              <label className="text-xs text-[#88887f] mb-1.5 block">{f.label}</label>
              <input {...register(f.name as any)} type={f.type} placeholder={f.ph} className="input-dark px-4 py-3 text-sm" />
              {(errors as any)[f.name] && <p className="text-xs text-red-400 mt-1">{(errors as any)[f.name]?.message}</p>}
            </div>
          ))}
          <div>
            <label className="text-xs text-[#88887f] mb-1.5 block">Message *</label>
            <textarea {...register('message')} rows={4} placeholder="Tell us about your project, questions, or anything..." className="input-dark px-4 py-3 text-sm resize-none" />
            {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-gold w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            {isSubmitting ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : null}
            {isSubmitting ? 'Sending...' : 'Send Message 🚀'}
          </button>
        </form>
      </div>
      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
