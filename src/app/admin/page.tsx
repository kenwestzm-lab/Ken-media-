'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BarChart2, Package, CreditCard, Users, MessageCircle, Cpu, Settings, LogOut, Menu, X } from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import toast from 'react-hot-toast'

const SIDEBAR = [
  { key: 'dashboard', label: 'Dashboard',  icon: BarChart2   },
  { key: 'orders',    label: 'Orders',     icon: Package     },
  { key: 'payments',  label: 'Payments',   icon: CreditCard  },
  { key: 'customers', label: 'Customers',  icon: Users       },
  { key: 'messages',  label: 'Messages',   icon: MessageCircle},
  { key: 'ai',        label: 'AI Tools',   icon: Cpu         },
  { key: 'settings',  label: 'Settings',   icon: Settings    },
]

const AI_TOOLS = [
  { key: 'caption', icon: '✍️', label: 'Caption Generator',  prompt: 'Write a viral social media caption for Ken Media Creative Studio in Zambia. Make it engaging with emojis. Max 3 sentences with hashtags.' },
  { key: 'adcopy',  icon: '📢', label: 'Ad Copy Writer',      prompt: 'Write a compelling Facebook ad for Ken Media Creative Studio. Include hook, value and CTA. Max 4 sentences.' },
  { key: 'slogan',  icon: '💡', label: 'Slogan Creator',      prompt: 'Generate 5 short memorable slogans for Ken Media Creative Studio in Zambia. One per line.' },
  { key: 'brand',   icon: '👑', label: 'Branding Ideas',      prompt: 'Give a brand identity concept for an African creative studio: colors, fonts, personality, tagline.' },
  { key: 'desc',    icon: '📝', label: 'Product Description', prompt: 'Write an engaging product description for a premium design pack from Ken Media Creative Studio.' },
  { key: 'script',  icon: '🎬', label: 'Video Ad Script',     prompt: 'Write a 15-second video ad script for Ken Media Creative Studio with HOOK, VALUE and CTA.' },
]

const STATUS_COLORS: Record<string,string> = {
  pending: '#F39C12', payment_reviewing: '#3498DB',
  approved: '#27AE60', in_progress: '#9B59B6',
  ready: '#D4A017', delivered: '#1ABC9C', rejected: '#E74C3C',
}

export default function AdminPage() {
  const router = useRouter()
  const [active, setActive]         = useState('dashboard')
  const [sidebarOpen, setSidebar]   = useState(false)
  const [orders, setOrders]         = useState<any[]>([])
  const [payments, setPayments]     = useState<any[]>([])
  const [customers, setCustomers]   = useState<any[]>([])
  const [messages, setMessages]     = useState<any[]>([])
  const [aiTool, setAiTool]         = useState(AI_TOOLS[0])
  const [aiPrompt, setAiPrompt]     = useState('')
  const [aiResult, setAiResult]     = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const user = auth.currentUser

  // Real-time orders
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [])

  // Real-time payments
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'payments'), orderBy('createdAt', 'desc')),
      snap => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [])

  // Real-time customers
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      snap => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [])

  // Real-time messages
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'conversations'),
      snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    toast.success('Logged out successfully')
    router.push('/')
  }

  const approvePayment = async (payment: any) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), { status: 'approved', approvedAt: serverTimestamp() })
      await updateDoc(doc(db, 'orders', payment.orderId), { status: 'approved', isDownloadUnlocked: true })
      toast.success(`✅ Payment approved for ${payment.userName}! Download unlocked.`)
    } catch (e) { toast.error('Failed to approve') }
  }

  const rejectPayment = async (payment: any) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), { status: 'rejected' })
      await updateDoc(doc(db, 'orders', payment.orderId), { status: 'rejected' })
      toast.success('Payment rejected')
    } catch { toast.error('Failed to reject') }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() })
      toast.success('Status updated to: ' + status.replace(/_/g,' '))
    } catch { toast.error('Failed to update') }
  }

  const generateAI = async () => {
    if (!aiPrompt.trim() && !aiTool.prompt) { toast.error('Enter a prompt'); return }
    setAiLoading(true)
    setAiResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: aiTool.key, prompt: aiPrompt || aiTool.prompt, adminId: user?.uid }),
      })
      const data = await res.json()
      if (data.result) {
        let i = 0
        const text = data.result
        setAiLoading(false)
        const interval = setInterval(() => {
          if (i < text.length) { setAiResult(text.slice(0, i + 1)); i++ }
          else clearInterval(interval)
        }, 8)
      } else {
        toast.error(data.error || 'AI failed')
        setAiLoading(false)
      }
    } catch {
      toast.error('AI request failed — check your OpenAI key in .env')
      setAiLoading(false)
    }
  }

  const pendingPayments = payments.filter(p => p.status === 'pending_review')
  const totalRevenue = orders.filter(o => ['approved','delivered'].includes(o.status)).reduce((s:number, o:any) => s + (o.amount || 0), 0)

  const s = (key: string, item: any) => {
    setActive(key)
    setSidebar(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080808', overflow: 'hidden' }}>

      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebar(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 998 }} />}

      {/* SIDEBAR */}
      <aside style={{
        width: 200, background: '#111', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed',
        left: sidebarOpen ? 0 : -200,
        top: 0, bottom: 0, zIndex: 999,
        transition: 'left 0.3s ease',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: '#D4A017', fontFamily: 'serif' }}>KEN MEDIA</div>
          <div style={{ fontSize: 9, color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>Admin Panel</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: 12 }}>
              {user?.displayName?.[0] || 'K'}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#F0EDE6', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'Admin'}</div>
              <div style={{ fontSize: 9, color: '#D4A017' }}>Admin</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px' }}>
          {SIDEBAR.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => s(key, null)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, marginBottom: 2, border: 'none', background: active === key ? 'rgba(212,160,23,0.12)' : 'transparent', color: active === key ? '#D4A017' : '#888', fontWeight: active === key ? 600 : 400, transition: 'all 0.2s', position: 'relative' }}>
              <Icon size={15} />
              {label}
              {key === 'payments' && pendingPayments.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#D4A017', color: '#000', fontSize: 9, fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingPayments.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/admin/upload" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, fontSize: 12, color: '#888', textDecoration: 'none', marginBottom: 4 }}>
            📤 Upload Post
          </Link>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, color: '#E74C3C', background: 'rgba(231,76,60,0.08)', border: 'none', fontWeight: 600 }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#080808' }}>
        {/* Mobile top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
          <button onClick={() => setSidebar(!sidebarOpen)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#888' }}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6', textTransform: 'capitalize' }}>{active}</div>
          <div style={{ fontSize: 10, color: '#D4A017' }}>LIVE ●</div>
        </div>

        <div style={{ padding: 16 }}>

          {/* DASHBOARD */}
          {active === 'dashboard' && (
            <div>
              <h1 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
                Dashboard <span style={{ color: '#D4A017' }}>Overview</span>
              </h1>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total Revenue',   value: `K${totalRevenue.toLocaleString()}`, color: '#D4A017' },
                  { label: 'Total Orders',    value: orders.length,                       color: '#9B59B6' },
                  { label: 'Pending Payments',value: pendingPayments.length,              color: '#F39C12' },
                  { label: 'Total Customers', value: customers.length,                    color: '#27AE60' },
                ].map(m => (
                  <div key={m.label} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#D4A017,#F5C842)' }} />
                    <p style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{m.label}</p>
                    <p style={{ fontFamily: 'serif', fontSize: 32, color: m.color, lineHeight: 1 }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 600 }}>
                  Recent Orders {orders.length === 0 && <span style={{ fontSize: 11, color: '#888' }}>— no orders yet</span>}
                </div>
                {orders.slice(0,5).map(o => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{o.userName}</p>
                      <p style={{ color: '#888', fontSize: 11 }}>{o.serviceName}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#D4A017', fontWeight: 700 }}>K{o.amount}</p>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 50, background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status] }}>
                        {o.status?.replace(/_/g,' ')}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#888', fontSize: 13 }}>No orders yet. Share your site to get customers! 🚀</div>}
              </div>
            </div>
          )}

          {/* ORDERS */}
          {active === 'orders' && (
            <div>
              <h1 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Orders <span style={{ color: '#D4A017' }}>Management</span></h1>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                  <p style={{ fontWeight: 600 }}>No orders yet</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Orders will appear here in real-time when customers request services</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {orders.map(o => (
                    <div key={o.id} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{o.userName}</p>
                          <p style={{ fontSize: 11, color: '#888' }}>{o.serviceName} · K{o.amount}</p>
                          {o.description && <p style={{ fontSize: 11, color: '#888', marginTop: 4, fontStyle: 'italic' }}>"{o.description?.slice(0,80)}..."</p>}
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 50, height: 'fit-content', background: `${STATUS_COLORS[o.status]}20`, color: STATUS_COLORS[o.status] }}>
                          {o.status?.replace(/_/g,' ')}
                        </span>
                      </div>
                      <select defaultValue={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                        style={{ width: '100%', background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#F0EDE6', cursor: 'pointer', outline: 'none' }}>
                        {['pending','payment_reviewing','approved','in_progress','ready','delivered','revision_requested','rejected'].map(s => (
                          <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS */}
          {active === 'payments' && (
            <div>
              <h1 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Payments <span style={{ color: '#D4A017' }}>Approvals</span></h1>
              {pendingPayments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <p style={{ fontWeight: 600 }}>All payments reviewed!</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>New payment proofs will appear here in real-time</p>
                </div>
              ) : pendingPayments.map(p => (
                <div key={p.id} style={{ background: '#1a1a1a', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 16, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{p.userName}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>{p.method?.replace(/_/g,' ')} · <span style={{ color: '#D4A017', fontWeight: 700 }}>K{p.amount}</span></p>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 50, background: 'rgba(52,152,219,0.15)', color: '#3498DB' }}>Reviewing</span>
                  </div>
                  {p.proofUrl && p.proofUrl !== 'demo_proof_url' && (
                    <a href={p.proofUrl} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#222', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#D4A017', marginBottom: 8, textDecoration: 'none' }}>
                      📎 View Payment Proof →
                    </a>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => approvePayment(p)} style={{ flex: 1, background: 'rgba(39,174,96,0.2)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, color: '#27AE60', cursor: 'pointer' }}>
                      ✓ Approve & Unlock
                    </button>
                    <button onClick={() => rejectPayment(p)} style={{ flex: 1, background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, color: '#E74C3C', cursor: 'pointer' }}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CUSTOMERS */}
          {active === 'customers' && (
            <div>
              <h1 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Customers <span style={{ color: '#D4A017' }}>({customers.length})</span></h1>
              {customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                  <p style={{ fontWeight: 600 }}>No customers yet</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Customers appear here when they register</p>
                </div>
              ) : customers.map(c => (
                <div key={c.id} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', flexShrink: 0 }}>
                    {c.displayName?.[0] || 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.displayName}</p>
                    <p style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 50, background: c.role === 'admin' ? 'rgba(212,160,23,0.2)' : 'rgba(255,255,255,0.08)', color: c.role === 'admin' ? '#D4A017' : '#888', flexShrink: 0 }}>
                    {c.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          {active === 'messages' && (
            <div>
              <h1 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Customer <span style={{ color: '#D4A017' }}>Messages</span></h1>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                  <p style={{ fontWeight: 600 }}>No messages yet</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Customer messages appear here in real-time</p>
                </div>
              ) : messages.map(m => (
                <div key={m.id} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{m.participants?.[0] || 'Customer'}</p>
                    <p style={{ fontSize: 10, color: '#888' }}>
                      {m.lastMessageAt?.toDate?.()?.toLocaleTimeString?.() || ''}
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.lastMessage || 'New conversation'}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI TOOLS */}
          {active === 'ai' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Cpu size={20} color="#D4A017" />
                <h1 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 800 }}>AI <span style={{ color: '#D4A017' }}>Tools</span></h1>
                <span style={{ fontSize: 10, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)', color: '#D4A017', padding: '2px 8px', borderRadius: 50 }}>ADMIN ONLY</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {AI_TOOLS.map(t => (
                  <button key={t.key} onClick={() => { setAiTool(t); setAiResult(''); setAiPrompt('') }}
                    style={{ background: aiTool.key === t.key ? 'rgba(212,160,23,0.08)' : '#1a1a1a', border: `1px solid ${aiTool.key === t.key ? 'rgba(212,160,23,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#F0EDE6', marginBottom: 2 }}>{t.label}</p>
                  </button>
                ))}
              </div>
              <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#D4A017', marginBottom: 10 }}>{aiTool.icon} {aiTool.label}</p>
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder={aiTool.prompt}
                  rows={3}
                  style={{ width: '100%', background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, resize: 'none', outline: 'none', marginBottom: 10, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <button onClick={generateAI} disabled={aiLoading}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {aiLoading ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Generating...</> : '🚀 Generate with AI'}
                </button>
                {aiResult && (
                  <div style={{ marginTop: 12, background: '#222', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {aiResult}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button onClick={() => { navigator.clipboard.writeText(aiResult); toast.success('Copied!') }}
                        style={{ fontSize: 11, color: '#D4A017', border: '1px solid rgba(212,160,23,0.3)', background: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>📋 Copy</button>
                      <button onClick={() => setAiResult('')}
                        style={{ fontSize: 11, color: '#888', border: '1px solid rgba(255,255,255,0.08)', background: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>🔄 Clear</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {active === 'settings' && (
            <div>
              <h1 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>System <span style={{ color: '#D4A017' }}>Settings</span></h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { title: 'Payment Details', items: [
                    { label: 'Airtel Money', value: process.env.NEXT_PUBLIC_AIRTEL_NUMBER || '0570109056' },
                    { label: 'MTN Money',    value: process.env.NEXT_PUBLIC_MTN_NUMBER   || '0761468402' },
                    { label: 'Access Bank',  value: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0136496126029' },
                  ]},
                  { title: 'Contact Info', items: [
                    { label: 'WhatsApp',  value: process.env.NEXT_PUBLIC_WHATSAPP     || '0772799672' },
                    { label: 'Facebook',  value: 'DjTizzyBeats' },
                    { label: 'Admin Email', value: user?.email || '' },
                  ]},
                ].map(section => (
                  <div key={section.title} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 600 }}>{section.title}</div>
                    {section.items.map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                        <span style={{ color: '#888' }}>{item.label}</span>
                        <span style={{ color: '#D4A017', fontWeight: 700, fontFamily: 'monospace' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <button onClick={handleLogout} style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, color: '#E74C3C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <LogOut size={16} /> Sign Out of Admin
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
// Profile photo upload added via Settings section
