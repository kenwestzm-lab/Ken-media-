'use client'
// src/app/admin/page.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Package, CreditCard, Users, MessageCircle, Cpu, Settings, TrendingUp, AlertCircle, Crown, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logout } from '@/lib/auth'
import { getAdminStats, getPendingPayments, getAllOrders, approvePayment, rejectPayment } from '@/lib/firestore'
import useStore from '@/store/useStore'
import toast from 'react-hot-toast'

const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard',   icon: BarChart2   },
  { key: 'orders',    label: 'Orders',      icon: Package     },
  { key: 'payments',  label: 'Payments',    icon: CreditCard  },
  { key: 'customers', label: 'Customers',   icon: Users       },
  { key: 'messages',  label: 'Messages',    icon: MessageCircle },
  { key: 'ai',        label: 'AI Tools',    icon: Cpu         },
  { key: 'settings',  label: 'Settings',    icon: Settings    },
]

const REVENUE_DATA = [
  { day: 'Mon', value: 1200 },
  { day: 'Tue', value: 1850 },
  { day: 'Wed', value: 980  },
  { day: 'Thu', value: 2100 },
  { day: 'Fri', value: 1650 },
  { day: 'Sat', value: 2800 },
  { day: 'Sun', value: 1400 },
]

const DEMO_ORDERS = [
  { id: '#1042', client: 'Chanda M.',  service: 'Logo Design',   amount: 250,  status: 'approved'  },
  { id: '#1041', client: 'Bupe K.',    service: 'Flyer Design',  amount: 120,  status: 'payment_reviewing' },
  { id: '#1040', client: 'Mwamba J.', service: 'Full Branding', amount: 1800, status: 'pending'   },
  { id: '#1039', client: 'Lombe T.',  service: 'Motion Poster', amount: 400,  status: 'delivered' },
  { id: '#1038', client: 'Tembo A.',  service: 'Video Ad',      amount: 850,  status: 'in_progress' },
]

const AI_TOOLS = [
  { key: 'caption', icon: '✍️',  label: 'Caption Generator',  desc: 'Viral social media captions' },
  { key: 'adcopy',  icon: '📢',  label: 'Ad Copy Writer',      desc: 'Compelling ad campaigns'    },
  { key: 'slogan',  icon: '💡',  label: 'Slogan Creator',      desc: 'Memorable brand slogans'    },
  { key: 'brand',   icon: '👑',  label: 'Branding Ideas',      desc: 'Creative brand concepts'    },
  { key: 'desc',    icon: '📝',  label: 'Product Description', desc: 'Engaging product copy'      },
  { key: 'script',  icon: '🎬',  label: 'Video Ad Script',     desc: 'Social media video scripts' },
]

const AI_MOCK: Record<string, string> = {
  caption: "🔥 Your brand deserves to be seen. At Ken Media Creative Studio, we don't just design — we create experiences that stop the scroll and start conversations. Premium design, Zambian excellence. 🇿🇲✨ #KenMedia #ZambiaDesign",
  adcopy: "Tired of blending in? Ken Media Creative Studio crafts premium logos, motion posters, and branding that makes YOUR business unforgettable. Starting at K150. Message us today!",
  slogan: "\"Design That Moves, Brands That Speak.\" | \"Africa's Vision, Global Standard.\" | \"Where Zambian Creativity Meets World-Class Design.\"",
  brand: "Brand Identity Concept:\n🎨 Colors: Royal Gold + Deep Black + Pure White\n✍️ Fonts: Geometric display + Modern sans-serif\n🏷 Personality: Innovative, trustworthy, forward-thinking\n💡 Tagline: 'Built for Africa, Designed for the World'",
  desc: "Elevate your brand with our premium design pack — crafted with pixel-perfect precision for Zambian businesses ready to stand out. Includes 15 editable templates, style guide, and print-ready files.",
  script: "HOOK (0-3s): [Flash of a bland logo → transforms into stunning Ken Media design]\nVOICE: 'Your brand is talking. Is it saying the right things?'\nVALUE (4-12s): Show 3 before/after brand transformations\nCTA (13-15s): 'Ken Media Creative Studio. DM us NOW.' [WhatsApp icon pulse]",
}

export default function AdminPage() {
  const { user } = useStore()
  const router = useRouter()
  const [active, setActive] = useState('dashboard')
  const [stats, setStats] = useState({ totalOrders: 28, totalClients: 214, pendingPayments: 7, totalRevenue: 14820 })
  const [aiTool, setAiTool] = useState('caption')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [pendingPayments, setPendingPayments] = useState([
    { id: 'p1', userName: 'Bupe K.', serviceName: 'Flyer Design', amount: 120, method: 'MTN Money', proofUrl: '#', orderId: 'o1' },
    { id: 'p2', userName: 'Tembo A.', serviceName: 'Video Ad Production', amount: 850, method: 'Airtel Money', proofUrl: '#', orderId: 'o2' },
  ])

  // Guard: only admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Admin access required')
      router.push('/')
    }
  }, [user, router])

  const handleApprove = async (payment: typeof pendingPayments[0]) => {
    try {
      // await approvePayment(payment.id, payment.orderId) // Real call
      setPendingPayments((prev) => prev.filter((p) => p.id !== payment.id))
      toast.success(`✅ Payment approved for ${payment.userName}! Download unlocked.`)
    } catch { toast.error('Failed to approve payment') }
  }

  const handleReject = async (payment: typeof pendingPayments[0]) => {
    setPendingPayments((prev) => prev.filter((p) => p.id !== payment.id))
    toast.success(`Payment rejected for ${payment.userName}`)
  }

  const generateAI = async () => {
    if (!aiPrompt.trim()) { toast.error('Enter a prompt first'); return }
    setAiLoading(true)
    setAiResult('')

    // In production: call /api/ai with OpenAI
    // For demo: use mock response with typewriter effect
    const response = AI_MOCK[aiTool] || 'AI response would appear here based on your OpenAI API key configuration.'
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000))

    let i = 0
    setAiLoading(false)
    const interval = setInterval(() => {
      if (i < response.length) { setAiResult(response.slice(0, i + 1)); i++ }
      else clearInterval(interval)
    }, 10)
  }

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: 'status-pending',
      payment_reviewing: 'status-reviewing',
      approved: 'status-approved',
      in_progress: 'status-progress',
      delivered: 'status-delivered',
    }
    return map[s] || 'status-pending'
  }

  const maxBar = Math.max(...REVENUE_DATA.map((d) => d.value))

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-52 bg-[#111] border-r border-white/[0.06] flex flex-col flex-shrink-0">
        <div className="px-4 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="font-bebas text-base tracking-[2px] text-gold-gradient">KEN MEDIA</div>
          <div className="text-[9px] tracking-[2px] text-[#88887f] uppercase mt-0.5">Admin Panel</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gold-gradient flex items-center justify-center text-black text-[10px] font-bold">K</div>
            <div>
              <div className="text-[11px] font-semibold truncate">{user?.displayName || 'Ken West'}</div>
              <div className="text-[9px] text-[#D4A017]">Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="text-[8px] text-[#88887f] uppercase tracking-[2px] px-2 mb-1.5">Overview</p>
          {SIDEBAR_ITEMS.slice(0, 5).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] transition-all mb-1 ${
                active === key
                  ? 'bg-[rgba(212,160,23,0.1)] text-[#D4A017] font-semibold'
                  : 'text-[#88887f] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon size={15} /> {label}
              {key === 'payments' && pendingPayments.length > 0 && (
                <span className="ml-auto bg-[#D4A017] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingPayments.length}
                </span>
              )}
            </button>
          ))}
          <p className="text-[8px] text-[#88887f] uppercase tracking-[2px] px-2 mt-3 mb-1.5">Tools</p>
          {SIDEBAR_ITEMS.slice(5).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] transition-all mb-1 ${
                active === key
                  ? 'bg-[rgba(212,160,23,0.1)] text-[#D4A017] font-semibold'
                  : 'text-[#88887f] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] text-[#88887f] hover:bg-white/[0.04] hover:text-white transition-all mb-1">
            🏠 View Site
          </Link>
          <button onClick={() => { logout(); router.push('/') }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all">
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto bg-dark">
        <div className="p-5">

          {/* ===== DASHBOARD ===== */}
          {active === 'dashboard' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="font-syne text-xl font-extrabold">Dashboard <span className="text-[#D4A017]">Overview</span></h1>
                  <p className="text-xs text-[#88887f] mt-0.5">Live · {new Date().toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total Revenue',     value: `K${stats.totalRevenue.toLocaleString()}`, change: '+23%', color: '#D4A017' },
                  { label: 'Active Orders',      value: stats.totalOrders,                         change: '+5 today', color: '#9B59B6' },
                  { label: 'Pending Payments',   value: stats.pendingPayments,                     change: 'Need review', color: '#F39C12' },
                  { label: 'Total Clients',      value: stats.totalClients,                        change: '+12 this week', color: '#27AE60' },
                ].map((m) => (
                  <div key={m.label} className="relative bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 overflow-hidden card-accent">
                    <p className="text-[10px] text-[#88887f] uppercase tracking-wider mb-2">{m.label}</p>
                    <p className="font-bebas text-3xl leading-none mb-1" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[10px] text-green-400">↑ {m.change}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 mb-4">
                <h3 className="text-sm font-semibold mb-4">📈 Revenue This Week (ZMW)</h3>
                <div className="flex items-end gap-2 h-20">
                  {REVENUE_DATA.map((d, i) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${(d.value / maxBar) * 100}%`,
                          background: i === 5 ? 'linear-gradient(to top,#D4A017,#F5C842)' : 'rgba(212,160,23,0.25)',
                          minHeight: 4,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {REVENUE_DATA.map((d) => (
                    <div key={d.day} className="flex-1 text-center text-[9px] text-[#88887f]">{d.day}</div>
                  ))}
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Recent Orders</h3>
                  <button onClick={() => setActive('orders')} className="text-xs text-[#D4A017]">View All →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-[#88887f] uppercase tracking-wider border-b border-white/[0.06]">
                      {['ID','Client','Service','Amount','Status'].map(h => <th key={h} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {DEMO_ORDERS.map((o) => (
                        <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-mono text-[#D4A017]">{o.id}</td>
                          <td className="px-4 py-3">{o.client}</td>
                          <td className="px-4 py-3 text-[#88887f]">{o.service}</td>
                          <td className="px-4 py-3 font-bold">K{o.amount}</td>
                          <td className="px-4 py-3">
                            <span className={`status-pill text-[9px] font-bold px-2 py-1 rounded-full ${statusColor(o.status)}`}>
                              {o.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== ORDERS ===== */}
          {active === 'orders' && (
            <div>
              <h1 className="font-syne text-xl font-extrabold mb-5">Orders <span className="text-[#D4A017]">Management</span></h1>
              <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-[#88887f] uppercase tracking-wider border-b border-white/[0.06]">
                      {['Order ID','Client','Service','Amount','Status','Action'].map(h => <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {DEMO_ORDERS.map((o) => (
                        <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-mono text-[#D4A017]">{o.id}</td>
                          <td className="px-4 py-3 font-medium">{o.client}</td>
                          <td className="px-4 py-3 text-[#88887f]">{o.service}</td>
                          <td className="px-4 py-3 font-bold">K{o.amount}</td>
                          <td className="px-4 py-3">
                            <span className={`status-pill text-[9px] font-bold px-2 py-1 rounded-full ${statusColor(o.status)}`}>
                              {o.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select className="bg-[#222] border border-white/[0.08] rounded-lg px-2 py-1 text-[10px] text-white cursor-pointer focus:outline-none focus:border-[rgba(212,160,23,0.4)]"
                              defaultValue={o.status}
                              onChange={(e) => toast.success(`Status updated to: ${e.target.value.replace(/_/g,' ')}`)}>
                              {['pending','payment_reviewing','approved','in_progress','ready','delivered','revision_requested'].map(s => (
                                <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== PAYMENTS ===== */}
          {active === 'payments' && (
            <div>
              <h1 className="font-syne text-xl font-extrabold mb-5">Payment <span className="text-[#D4A017]">Approvals</span></h1>
              {pendingPayments.length === 0 ? (
                <div className="text-center py-16 text-[#88887f]">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-semibold">All payments reviewed!</p>
                  <p className="text-xs mt-1">No pending payment proofs.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-[#1a1a1a] border border-yellow-400/20 rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-sm">{p.userName} — {p.serviceName}</p>
                          <p className="text-xs text-[#88887f] mt-0.5">{p.method} · <span className="text-[#D4A017] font-bold">K{p.amount}</span> · Proof uploaded</p>
                        </div>
                        <span className="status-pill status-reviewing text-[9px] font-bold px-2 py-1 rounded-full">Reviewing</span>
                      </div>
                      <div className="bg-[#222] border border-white/[0.08] rounded-xl p-3 text-xs text-[#88887f] mb-3 flex items-center gap-2">
                        📎 payment_proof_{p.userName.toLowerCase().replace(' ','_')}.jpg
                        <a href={p.proofUrl} className="text-[#D4A017] ml-auto" target="_blank" rel="noreferrer">View Proof →</a>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(p)} className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl py-2.5 text-xs font-bold hover:bg-green-500/30 transition-colors">
                          ✓ Approve & Unlock Download
                        </button>
                        <button onClick={() => handleReject(p)} className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl py-2.5 text-xs font-bold hover:bg-red-500/20 transition-colors">
                          ✕ Reject
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== AI TOOLS ===== */}
          {active === 'ai' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Cpu size={20} className="text-[#D4A017]" />
                <h1 className="font-syne text-xl font-extrabold">AI <span className="text-[#D4A017]">Tools</span></h1>
                <span className="text-[10px] bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.2)] text-[#D4A017] px-2 py-0.5 rounded-full">ADMIN ONLY</span>
              </div>

              {/* Tool grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                {AI_TOOLS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setAiTool(t.key); setAiResult(''); setAiPrompt('') }}
                    className={`bg-[#1a1a1a] border rounded-2xl p-4 text-left transition-all hover:-translate-y-1 ${
                      aiTool === t.key ? 'border-[rgba(212,160,23,0.5)] bg-[rgba(212,160,23,0.05)]' : 'border-white/[0.08]'
                    }`}
                  >
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <p className="text-sm font-semibold mb-1">{t.label}</p>
                    <p className="text-[11px] text-[#88887f]">{t.desc}</p>
                  </button>
                ))}
              </div>

              {/* Generator */}
              <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4">
                <h3 className="text-sm font-bold text-[#D4A017] mb-3">
                  {AI_TOOLS.find((t) => t.key === aiTool)?.icon} {AI_TOOLS.find((t) => t.key === aiTool)?.label}
                </h3>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the business, product, or service... e.g. 'A premium logo design for a Zambian clothing brand called Lusaka Threads targeting young professionals'"
                  rows={3}
                  className="input-dark px-4 py-3 text-sm mb-3 resize-none"
                />
                <button
                  onClick={generateAI}
                  disabled={aiLoading}
                  className="btn-gold w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Generating...</>
                  ) : (
                    '🚀 Generate with AI'
                  )}
                </button>

                {aiResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 bg-[#222] border border-[rgba(212,160,23,0.15)] rounded-xl p-4 text-sm text-[#F0EDE6] leading-relaxed whitespace-pre-line"
                  >
                    {aiResult}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { navigator.clipboard.writeText(aiResult); toast.success('Copied!') }} className="text-[11px] text-[#D4A017] border border-[rgba(212,160,23,0.3)] px-3 py-1.5 rounded-lg hover:bg-[rgba(212,160,23,0.1)] transition-colors">
                        📋 Copy
                      </button>
                      <button onClick={() => setAiResult('')} className="text-[11px] text-[#88887f] border border-white/[0.08] px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors">
                        🔄 Clear
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {active === 'settings' && (
            <div>
              <h1 className="font-syne text-xl font-extrabold mb-5">System <span className="text-[#D4A017]">Settings</span></h1>
              <div className="space-y-4 max-w-lg">
                {[
                  { title: 'Payment Details', items: [
                    { label: 'Airtel Money', value: process.env.NEXT_PUBLIC_AIRTEL_NUMBER || '0570109056' },
                    { label: 'MTN Money',    value: process.env.NEXT_PUBLIC_MTN_NUMBER || '0761468402' },
                    { label: 'Access Bank',  value: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0136496126029' },
                  ]},
                  { title: 'Contact Info', items: [
                    { label: 'WhatsApp',  value: process.env.NEXT_PUBLIC_WHATSAPP || '0772799672' },
                    { label: 'Facebook',  value: 'DjTizzyBeats' },
                  ]},
                ].map((section) => (
                  <div key={section.title} className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <h3 className="text-sm font-semibold">{section.title}</h3>
                    </div>
                    {section.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-white/[0.04] text-sm">
                        <span className="text-[#88887f]">{item.label}</span>
                        <span className="text-[#D4A017] font-semibold font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages admin placeholder */}
          {active === 'messages' && (
            <div>
              <h1 className="font-syne text-xl font-extrabold mb-5">Customer <span className="text-[#D4A017]">Messages</span></h1>
              {[
                { initials: 'BK', name: 'Bupe Kumwenda', preview: "Can I get a discount on the branding package?", time: '2m ago', unread: 2 },
                { initials: 'CM', name: 'Chanda Mutale',  preview: "When will my logo be ready? I need it urgently.", time: '1h ago', unread: 0 },
                { initials: 'MT', name: 'Mwamba Tembo',   preview: "The flyer looks amazing! Can we do a revision?", time: '3h ago', unread: 1 },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-3 p-4 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl mb-2 cursor-pointer hover:border-[rgba(212,160,23,0.3)] transition-all">
                  <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center font-bold text-black text-sm flex-shrink-0">{c.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-[10px] text-[#88887f]">{c.time}</p>
                    </div>
                    <p className="text-xs text-[#88887f] truncate">{c.preview}</p>
                  </div>
                  {c.unread > 0 && (
                    <div className="w-5 h-5 bg-[#D4A017] rounded-full flex items-center justify-center text-black text-[9px] font-bold flex-shrink-0">{c.unread}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Customers placeholder */}
          {active === 'customers' && (
            <div>
              <h1 className="font-syne text-xl font-extrabold mb-5">Customers <span className="text-[#D4A017]">List</span></h1>
              <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="text-[#88887f] uppercase tracking-wider border-b border-white/[0.06]">
                    {['Name','Email','Phone','Orders','Joined'].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {[
                      { name: 'Chanda Mutale', email: 'chanda@email.com',   phone: '0971234567', orders: 3, joined: 'Jan 2025' },
                      { name: 'Bupe Kumwenda', email: 'bupe@email.com',     phone: '0961234567', orders: 1, joined: 'Mar 2025' },
                      { name: 'Mwamba Tembo',  email: 'mwamba@email.com',   phone: '0951234567', orders: 5, joined: 'Feb 2025' },
                      { name: 'Lombe Phiri',   email: 'lombe@email.com',    phone: '0941234567', orders: 2, joined: 'Apr 2025' },
                    ].map((c) => (
                      <tr key={c.name} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-[#88887f]">{c.email}</td>
                        <td className="px-4 py-3 text-[#88887f]">{c.phone}</td>
                        <td className="px-4 py-3 text-[#D4A017] font-bold">{c.orders}</td>
                        <td className="px-4 py-3 text-[#88887f]">{c.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
