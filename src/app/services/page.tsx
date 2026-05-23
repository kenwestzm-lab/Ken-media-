'use client'
// src/app/services/page.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Clock, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { createOrder } from '@/lib/firestore'
import useStore from '@/store/useStore'
import { v4 as uuidv4 } from 'uuid'

const SERVICES = [
  { icon: '🎯', name: 'Logo Design',          desc: 'Custom logos representing your brand identity professionally',            priceRange: 'K150 – K500',  startingPrice: 150, days: '2–4 days' },
  { icon: '📰', name: 'Flyer Design',          desc: 'Eye-catching flyers for events, businesses & promotions',                priceRange: 'K80 – K200',   startingPrice: 80,  days: '1–2 days' },
  { icon: '🎬', name: 'Motion Poster',         desc: 'Animated digital posters that stop the scroll on social media',         priceRange: 'K250 – K600',  startingPrice: 250, days: '3–5 days' },
  { icon: '⛪', name: 'Church Graphics',        desc: 'Professional graphics for churches — banners, bulletins & screens',     priceRange: 'K100 – K350',  startingPrice: 100, days: '2–3 days' },
  { icon: '📱', name: 'Social Media Mgmt',     desc: 'Monthly social media content, scheduling & growth strategy',            priceRange: 'K400 – K900/mo', startingPrice: 400, days: 'Monthly' },
  { icon: '🌐', name: 'Website Design',        desc: 'Modern, mobile-first websites that convert visitors to customers',      priceRange: 'K800 – K3000', startingPrice: 800, days: '7–14 days' },
  { icon: '🎥', name: 'Video Ad Production',   desc: 'Compelling short video ads for social media & TV campaigns',           priceRange: 'K600 – K2000', startingPrice: 600, days: '5–10 days' },
  { icon: '👑', name: 'Full Branding Package', desc: 'Complete brand identity: logo, colors, fonts, stationery & guide',      priceRange: 'K1200 – K4500', startingPrice: 1200, days: '10–21 days' },
]

const schema = z.object({
  name:        z.string().min(2, 'Enter your full name'),
  phone:       z.string().min(10, 'Enter a valid phone number'),
  description: z.string().min(20, 'Please describe your project in detail (min 20 chars)'),
  deadline:    z.string().min(1, 'Select a deadline'),
})
type FormData = z.infer<typeof schema>

export default function ServicesPage() {
  const { user } = useStore()
  const [selected, setSelected] = useState<typeof SERVICES[0] | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!selected) return
    setSubmitting(true)
    try {
      const orderNum = 'KM-' + Date.now().toString().slice(-6)
      await createOrder({
        orderNumber: orderNum,
        userId: user?.uid || 'guest',
        userName: data.name,
        userEmail: user?.email || '',
        userPhone: data.phone,
        serviceName: selected.name,
        description: data.description,
        amount: selected.startingPrice,
        status: 'pending',
        deadline: data.deadline,
      })
      toast.success(`Order #${orderNum} submitted! We'll contact you on WhatsApp shortly. 🎉`)
      reset()
      setSelected(null)
    } catch {
      toast.error('Failed to submit order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <div className="px-4 pt-8 pb-4 bg-[radial-gradient(ellipse_100%_40%_at_50%_0%,rgba(212,160,23,0.08),transparent)]">
        <h1 className="font-bebas text-5xl tracking-wider mb-1">
          OUR <span className="text-gold-gradient">SERVICES</span>
        </h1>
        <p className="text-sm text-[#88887f]">Professional creative services for Zambian businesses</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-28 mt-4">
        {SERVICES.map((svc, i) => (
          <motion.div
            key={svc.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 overflow-hidden card-accent cursor-pointer hover:border-[rgba(212,160,23,0.3)] hover:-translate-y-1 transition-all"
            onClick={() => setSelected(svc)}
          >
            <div className="text-3xl mb-3">{svc.icon}</div>
            <h3 className="font-syne text-[13px] font-bold mb-1.5 leading-tight">{svc.name}</h3>
            <p className="text-[11px] text-[#88887f] leading-relaxed mb-3">{svc.desc}</p>
            <div className="text-[15px] font-bold text-[#D4A017] mb-1">{svc.priceRange}</div>
            <div className="flex items-center gap-1 text-[10px] text-[#88887f]">
              <Clock size={9} /> {svc.days}
            </div>
            <button className="w-full btn-gold mt-3 py-2 rounded-xl text-[11px] font-bold">
              Request Now
            </button>
          </motion.div>
        ))}
      </div>

      {/* Order Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center"
            onClick={(e) => e.target === e.currentTarget && setSelected(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-[#111] border border-white/[0.08] rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-[#111] px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="font-syne text-lg font-bold">{selected.icon} {selected.name}</h2>
                  <p className="text-xs text-[#D4A017] mt-0.5">Starting from {selected.priceRange}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-[#88887f]">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
                <div>
                  <label className="text-xs text-[#88887f] mb-1.5 block">Full Name *</label>
                  <input {...register('name')} placeholder="Your full name" className="input-dark px-4 py-3 text-sm" />
                  {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-[#88887f] mb-1.5 block">WhatsApp Number *</label>
                  <input {...register('phone')} type="tel" placeholder="0XXXXXXXXX" className="input-dark px-4 py-3 text-sm" />
                  {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-[#88887f] mb-1.5 block">Project Description *</label>
                  <textarea {...register('description')} rows={4} placeholder="Describe what you need — style, colors, references, target audience..." className="input-dark px-4 py-3 text-sm resize-none" />
                  {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-[#88887f] mb-1.5 block">Deadline *</label>
                  <select {...register('deadline')} className="input-dark px-4 py-3 text-sm bg-[#1a1a1a] cursor-pointer">
                    <option value="">Select deadline</option>
                    <option value="24h">24 hours (Rush — +50%)</option>
                    <option value="2-3d">2–3 business days (Standard)</option>
                    <option value="1w">1 week (Relaxed)</option>
                    <option value="2w">2 weeks (Complex project)</option>
                  </select>
                  {errors.deadline && <p className="text-xs text-red-400 mt-1">{errors.deadline.message}</p>}
                </div>

                <div className="border border-dashed border-[rgba(212,160,23,0.25)] rounded-xl p-5 text-center cursor-pointer hover:border-[rgba(212,160,23,0.5)] transition-colors">
                  <Upload size={22} className="text-[#D4A017] mx-auto mb-2" />
                  <p className="text-xs text-[#88887f]">Tap to attach reference images (optional)</p>
                  <input type="file" className="hidden" accept="image/*,.pdf,.psd,.ai" multiple />
                </div>

                <button type="submit" disabled={submitting} className="btn-gold w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
                  {submitting ? <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : null}
                  {submitting ? 'Submitting...' : 'Submit Order Request 🚀'}
                </button>

                <p className="text-[10px] text-[#88887f] text-center">
                  We'll contact you via WhatsApp within 1–2 hours to confirm and discuss details.
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
