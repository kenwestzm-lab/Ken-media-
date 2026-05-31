'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import dynamic from 'next/dynamic'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { logout } from '@/lib/auth'
import useStore from '@/store/useStore'
import toast from 'react-hot-toast'

const Navbar         = dynamic(() => import('@/components/ui/Navbar'),         { ssr: false })
const BottomNav      = dynamic(() => import('@/components/ui/BottomNav'),      { ssr: false })
const WhatsAppButton = dynamic(() => import('@/components/ui/WhatsAppButton'), { ssr: false })

export default function DashboardPage() {
  const { user } = useStore()
  const router = useRouter()
  const [orders, setOrders]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      if (!u) router.push('/auth/login')
    })
    return () => unsub()
  }, [router])

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q,
      snap => { setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      () => { setOrders([]); setLoading(false) }
    )
    return () => unsub()
  }, [user?.uid])

  const handleLogout = async () => {
    await logout(); toast.success('Logged out'); router.push('/')
  }

  if (!user) return null

  const delivered  = orders.filter(o => o.status === 'delivered').length
  const totalSpent = orders.filter(o => !['rejected','pending'].includes(o.status)).reduce((s,o) => s + (o.amount||0), 0)

  const statusBg: Record<string,string> = {
    pending:'rgba(243,156,18,0.15)', payment_reviewing:'rgba(52,152,219,0.15)',
    approved:'rgba(39,174,96,0.15)', in_progress:'rgba(155,89,182,0.15)',
    ready:'rgba(212,160,23,0.15)', delivered:'rgba(26,188,156,0.15)', rejected:'rgba(231,76,60,0.15)'
  }
  const statusFg: Record<string,string> = {
    pending:'#F39C12', payment_reviewing:'#3498DB', approved:'#27AE60',
    in_progress:'#9B59B6', ready:'#D4A017', delivered:'#1ABC9C', rejected:'#E74C3C'
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080808', color:'#F0EDE6' }}>
      <Navbar />

      <section style={{ padding:'24px 16px 20px', background:'radial-gradient(ellipse 80% 50% at 50% 0%,rgba(212,160,23,0.1),transparent)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#D4A017,#F5C842)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'serif', fontSize:22, color:'#000', fontWeight:700, flexShrink:0 }}>
            {user.displayName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontFamily:'serif', fontSize:20, fontWeight:800 }}>{user.displayName}</h1>
            <p style={{ fontSize:12, color:'#888', marginTop:2 }}>{user.email}</p>
          </div>
          <button onClick={handleLogout} style={{ padding:8, background:'rgba(255,255,255,0.06)', border:'none', borderRadius:'50%', cursor:'pointer', color:'#888', display:'flex', alignItems:'center' }}>
            <LogOut size={16} />
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[{ l:'Total Orders', v:orders.length },{ l:'Delivered', v:delivered },{ l:'Total Spent', v:`K${totalSpent}` }].map(s => (
            <div key={s.l} style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 8px', textAlign:'center' }}>
              <p style={{ fontFamily:'serif', fontSize:22, color:'#D4A017', lineHeight:1 }}>{s.v}</p>
              <p style={{ fontSize:10, color:'#888', marginTop:4, textTransform:'uppercase' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding:'0 16px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { icon:'⚡', label:'New Service Request', href:'/services',  gold:true  },
            { icon:'💬', label:'Message Us',          href:'/messages',  gold:false },
            { icon:'📍', label:'Track Order',         href:'/track',     gold:false },
            { icon:'🛍', label:'Browse Shop',         href:'/shop',      gold:false },
          ].map(a => (
            <Link key={a.label} href={a.href} style={{ background:a.gold?'linear-gradient(135deg,#D4A017,#F5C842)':'#1a1a1a', border:a.gold?'none':'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'14px 12px', display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:a.gold?'#000':'#F0EDE6', fontWeight:600, fontSize:13 }}>
              <span style={{ fontSize:18 }}>{a.icon}</span> {a.label}
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding:'0 16px 100px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h2 style={{ fontFamily:'serif', fontSize:16, fontWeight:800 }}>My Orders</h2>
          <Link href="/track" style={{ fontSize:12, color:'#D4A017', textDecoration:'none' }}>Track →</Link>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2].map(i => <div key={i} style={{ height:80, background:'#1a1a1a', borderRadius:16, animation:'pulse 1.5s infinite' }} />)}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', paddingTop:48, paddingBottom:48 }}>
            <div style={{ fontSize:64, marginBottom:14 }}>📋</div>
            <h3 style={{ fontFamily:'serif', fontSize:20, fontWeight:800, marginBottom:8 }}>No orders yet</h3>
            <p style={{ fontSize:13, color:'#888', lineHeight:1.7, marginBottom:24, maxWidth:260, margin:'0 auto 24px' }}>
              You haven't placed any orders yet. Browse our services and request your first design!
            </p>
            <Link href="/services" style={{ background:'linear-gradient(135deg,#D4A017,#F5C842)', color:'#000', fontWeight:700, padding:'13px 28px', borderRadius:50, fontSize:14, textDecoration:'none', display:'inline-block' }}>
              Browse Services →
            </Link>
          </div>
        ) : orders.map((order, i) => (
          <motion.div key={order.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
            style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'14px 16px', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <p style={{ fontFamily:'monospace', fontSize:11, color:'#D4A017', marginBottom:3 }}>{order.orderNumber || order.id?.slice(0,8).toUpperCase()}</p>
                <p style={{ fontSize:15, fontWeight:600 }}>{order.serviceName || order.productName || 'Custom Order'}</p>
              </div>
              <span style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:50, background:statusBg[order.status]||statusBg.pending, color:statusFg[order.status]||statusFg.pending, textTransform:'capitalize', whiteSpace:'nowrap', marginLeft:8 }}>
                {(order.status||'pending').replace(/_/g,' ')}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:18, fontWeight:700, color:'#D4A017' }}>K{order.amount}</span>
              <div style={{ display:'flex', gap:8 }}>
                {order.status === 'pending' && (
                  <Link href={`/checkout?orderId=${order.orderNumber||order.id}&amount=${order.amount}&service=${encodeURIComponent(order.serviceName||'')}`}
                    style={{ background:'linear-gradient(135deg,#D4A017,#F5C842)', color:'#000', fontSize:12, fontWeight:700, padding:'8px 14px', borderRadius:10, textDecoration:'none' }}>
                    💳 Pay Now
                  </Link>
                )}
                {order.status === 'delivered' && (
                  <button onClick={() => order.downloadUrl ? window.open(order.downloadUrl) : toast('Contact Ken on WhatsApp for your files: 0772799672')}
                    style={{ background:'rgba(26,188,156,0.15)', border:'1px solid rgba(26,188,156,0.3)', color:'#1ABC9C', fontSize:12, fontWeight:700, padding:'8px 14px', borderRadius:10, cursor:'pointer' }}>
                    ⬇️ Download
                  </button>
                )}
                <Link href="/track" style={{ background:'#222', border:'1px solid rgba(255,255,255,0.08)', color:'#888', fontSize:12, padding:'8px 12px', borderRadius:10, textDecoration:'none' }}>
                  Track
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      <BottomNav />
      <WhatsAppButton />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
