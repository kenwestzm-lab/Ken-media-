'use client'
// src/app/track/page.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, CheckCircle, Circle, Loader2, Package, Truck, Star } from 'lucide-react'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { subscribeToOrder } from '@/lib/firestore'
import { Order } from '@/types'
import toast from 'react-hot-toast'

const STATUS_STEPS = [
  { key: 'pending',           label: 'Order Placed',       desc: 'Your order was received',            icon: '📋' },
  { key: 'payment_reviewing', label: 'Payment Reviewing',  desc: 'Admin is verifying your payment',    icon: '🔍' },
  { key: 'approved',          label: 'Payment Approved',   desc: 'Payment confirmed, work starting',   icon: '✅' },
  { key: 'in_progress',       label: 'In Progress',        desc: 'Ken Media is working on your order', icon: '⚡' },
  { key: 'ready',             label: 'Ready for Delivery', desc: 'Your files are ready to download',   icon: '📦' },
  { key: 'delivered',         label: 'Delivered',          desc: 'Files delivered — enjoy!',           icon: '🎉' },
]

// Demo order data
const DEMO_ORDER: Order = {
  id: 'KM-104200',
  orderNumber: 'KM-1042',
  userId: 'demo',
  userName: 'Chanda Mutale',
  userEmail: 'chanda@example.com',
  userPhone: '0971234567',
  serviceName: 'Logo Design',
  amount: 250,
  status: 'in_progress',
  description: 'Modern logo for a clothing brand called Lusaka Threads',
  deadline: '2-3d',
  createdAt: { toDate: () => new Date(Date.now() - 86400000 * 2) },
  updatedAt: { toDate: () => new Date(Date.now() - 3600000) },
}

export default function TrackPage() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!orderId.trim()) { toast.error('Enter an order number'); return }
    setLoading(true)
    // In production: query Firestore. Here: demo data
    setTimeout(() => {
      if (orderId.trim().toUpperCase().includes('KM') || orderId === '1042') {
        setOrder(DEMO_ORDER)
        toast.success('Order found!')
      } else {
        toast.error('Order not found. Check your order number.')
        setOrder(null)
      }
      setLoading(false)
    }, 1200)
  }

  const getStepStatus = (stepKey: string) => {
    if (!order) return 'pending'
    const statusOrder = STATUS_STEPS.map((s) => s.key)
    const currentIdx = statusOrder.indexOf(order.status)
    const stepIdx = statusOrder.indexOf(stepKey)
    if (stepIdx < currentIdx) return 'done'
    if (stepIdx === currentIdx) return 'current'
    return 'upcoming'
  }

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      payment_reviewing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      approved: 'text-green-400 bg-green-400/10 border-green-400/20',
      in_progress: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      ready: 'text-[#D4A017] bg-[#D4A017]/10 border-[#D4A017]/20',
      delivered: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
    }
    return map[status] || map.pending
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <div className="px-4 pt-8 pb-4 bg-[radial-gradient(ellipse_100%_40%_at_50%_0%,rgba(212,160,23,0.08),transparent)]">
        <h1 className="font-bebas text-5xl tracking-wider mb-1">
          ORDER <span className="text-gold-gradient">TRACKING</span>
        </h1>
        <p className="text-sm text-[#88887f]">Enter your order number to track progress</p>
      </div>

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#88887f]" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter order number (e.g. KM-1042)"
              className="input-dark pl-11 pr-4 py-3.5 text-sm"
            />
          </div>
          <button onClick={handleSearch} disabled={loading} className="btn-gold px-5 rounded-xl text-sm font-bold flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Track'}
          </button>
        </div>
        <p className="text-[10px] text-[#88887f] mt-2 text-center">
          💡 Try: KM-1042 for a demo order
        </p>
      </div>

      {/* Order Details */}
      {order && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mt-5 pb-28"
        >
          {/* Order header */}
          <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-[#88887f] uppercase tracking-wider mb-1">Order Number</p>
                <h2 className="font-bebas text-2xl text-[#D4A017] tracking-wider">{order.orderNumber}</h2>
              </div>
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border capitalize ${statusColor(order.status)}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-[#88887f]">Client:</span> <span className="ml-1 font-medium">{order.userName}</span></div>
              <div><span className="text-[#88887f]">Service:</span> <span className="ml-1 font-medium">{order.serviceName}</span></div>
              <div><span className="text-[#88887f]">Amount:</span> <span className="ml-1 font-bold text-[#D4A017]">K{order.amount}</span></div>
            </div>
          </div>

          {/* Timeline */}
          <h3 className="font-syne text-sm font-bold mb-4">Progress Timeline</h3>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const stepStatus = getStepStatus(step.key)
              const isLast = i === STATUS_STEPS.length - 1
              return (
                <div key={step.key} className="flex gap-4">
                  {/* Indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2 transition-all ${
                      stepStatus === 'done'
                        ? 'border-[#D4A017] bg-[rgba(212,160,23,0.1)]'
                        : stepStatus === 'current'
                        ? 'border-[#D4A017] bg-[#D4A017] pulse-ring'
                        : 'border-white/[0.15] bg-transparent opacity-40'
                    }`}>
                      {stepStatus === 'done' ? '✓' : step.icon}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 min-h-[24px] transition-colors ${
                        stepStatus === 'done' ? 'bg-[#D4A017]' : 'bg-white/[0.08]'
                      }`} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-6 pt-1.5 flex-1 ${stepStatus === 'upcoming' ? 'opacity-40' : ''}`}>
                    <p className={`text-sm font-semibold mb-0.5 ${stepStatus === 'current' ? 'text-[#D4A017]' : ''}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-[#88887f]">{step.desc}</p>
                    {stepStatus === 'current' && (
                      <p className="text-[11px] text-[#D4A017] mt-1">← Currently here</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Download area */}
          {order.status === 'delivered' && (
            <div className="bg-green-400/5 border border-green-400/20 rounded-2xl p-4 mt-2">
              <h4 className="text-sm font-semibold text-green-400 mb-2">🎉 Your files are ready!</h4>
              <button className="btn-gold w-full py-3 rounded-xl text-sm font-bold">
                ⬇️ Download Files
              </button>
            </div>
          )}
        </motion.div>
      )}

      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
