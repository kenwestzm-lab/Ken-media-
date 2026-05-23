'use client'
// src/app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, MessageCircle, Bell, LogOut, Crown, MapPin } from 'lucide-react'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import { getOrdersByUser } from '@/lib/firestore'
import { logout } from '@/lib/auth'
import useStore from '@/store/useStore'
import toast from 'react-hot-toast'
import { Order } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  pending:           'status-pending',
  payment_reviewing: 'status-reviewing',
  approved:          'status-approved',
  in_progress:       'status-progress',
  ready:             'status-ready',
  delivered:         'status-delivered',
  rejected:          'status-rejected',
}

const DEMO_ORDERS: Order[] = [
  { id: '1042', orderNumber: 'KM-1042', userId: 'u1', userName: 'Demo', userEmail: '', serviceName: 'Logo Design',   amount: 250,  status: 'in_progress',       createdAt: { toDate: () => new Date(Date.now() - 86400000 * 2) } },
  { id: '1039', orderNumber: 'KM-1039', userId: 'u1', userName: 'Demo', userEmail: '', serviceName: 'Motion Poster', amount: 400,  status: 'delivered',          createdAt: { toDate: () => new Date(Date.now() - 86400000 * 7) } },
  { id: '1036', orderNumber: 'KM-1036', userId: 'u1', userName: 'Demo', userEmail: '', serviceName: 'Flyer Design',  amount: 120,  status: 'payment_reviewing',  createdAt: { toDate: () => new Date(Date.now() - 86400000 * 1) } },
]

export default function DashboardPage() {
  const { user, notifications } = useStore()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    const load = async () => {
      try {
        const userOrders = await getOrdersByUser(user.uid)
        setOrders(userOrders.length > 0 ? userOrders : DEMO_ORDERS)
      } catch {
        setOrders(DEMO_ORDERS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, router])

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (!user) return null

  const totalSpent = orders.filter(o => o.status !== 'rejected').reduce((s, o) => s + o.amount, 0)
  const delivered = orders.filter(o => o.status === 'delivered').length

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      {/* Profile header */}
      <section className="px-4 pt-8 pb-6 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,160,23,0.1),transparent)]">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center font-bebas text-2xl text-black flex-shrink-0">
            {user.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="font-syne text-xl font-extrabold leading-tight">{user.displayName}</h1>
            <p className="text-xs text-[#88887f] mt-0.5">{user.email}</p>
            {user.phone && <p className="text-xs text-[#88887f]">{user.phone}</p>}
          </div>
          <button onClick={handleLogout} className="p-2 rounded-full bg-white/[0.06] text-[#88887f] hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Total Orders', value: orders.length },
            { label: 'Delivered',    value: delivered      },
            { label: 'Total Spent',  value: `K${totalSpent}` },
          ].map((s) => (
            <div key={s.label} className="bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-3 py-3 text-center">
              <p className="font-bebas text-2xl text-[#D4A017] leading-none">{s.value}</p>
              <p className="text-[9px] text-[#88887f] mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-4 mb-5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Package size={18} />,       label: 'New Service Request', href: '/services',  color: 'bg-gold-gradient text-black' },
            { icon: <MessageCircle size={18} />, label: 'Message Us',          href: '/messages',  color: 'bg-[#1a1a1a] border border-white/[0.08] text-white' },
            { icon: <MapPin size={18} />,         label: 'Track Order',        href: '/track',     color: 'bg-[#1a1a1a] border border-white/[0.08] text-white' },
            { icon: <Crown size={18} />,          label: 'Browse Shop',        href: '/shop',      color: 'bg-[#1a1a1a] border border-white/[0.08] text-white' },
          ].map((a) => (
            <Link key={a.label} href={a.href} className={`${a.color} rounded-2xl p-4 flex items-center gap-3 font-medium text-sm transition-all hover:opacity-90 active:scale-95`}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Notifications */}
      {notifications.length > 0 && (
        <section className="px-4 mb-5">
          <h2 className="font-syne text-sm font-bold mb-3 flex items-center gap-2">
            <Bell size={15} className="text-[#D4A017]" /> Notifications
          </h2>
          {notifications.slice(0, 3).map((n) => (
            <div key={n.id} className="bg-[rgba(212,160,23,0.06)] border border-[rgba(212,160,23,0.2)] rounded-xl p-3 mb-2">
              <p className="text-xs font-semibold">{n.title}</p>
              <p className="text-xs text-[#88887f] mt-0.5">{n.message}</p>
            </div>
          ))}
        </section>
      )}

      {/* Orders */}
      <section className="px-4 pb-28">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-syne text-sm font-bold">My Orders</h2>
          <Link href="/track" className="text-xs text-[#D4A017]">Track →</Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-semibold text-[#88887f]">No orders yet</p>
            <Link href="/services" className="btn-gold mt-3 px-6 py-2.5 rounded-full text-xs font-bold inline-block">
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 hover:border-[rgba(212,160,23,0.2)] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-xs text-[#D4A017] mb-0.5">{order.orderNumber}</p>
                    <p className="text-sm font-semibold">{order.serviceName}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full border capitalize ${STATUS_COLORS[order.status] || 'status-pending'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#D4A017]">K{order.amount}</span>
                  <div className="flex gap-2">
                    {order.status === 'delivered' && (
                      <button className="text-xs bg-green-400/10 border border-green-400/20 text-green-400 px-3 py-1.5 rounded-lg font-semibold">
                        ⬇️ Download
                      </button>
                    )}
                    <Link href="/track" className="text-xs bg-[#222] border border-white/[0.08] text-[#88887f] px-3 py-1.5 rounded-lg">
                      Track
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
