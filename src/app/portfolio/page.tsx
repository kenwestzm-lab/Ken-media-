'use client'
// src/app/portfolio/page.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Footer from '@/components/ui/Footer'

const PORTFOLIO = [
  { id: 1, title: 'Lusaka Threads',     type: 'Logo & Branding',   icon: '👕', bg: 'from-amber-900 to-amber-950',  cat: 'branding', year: '2024' },
  { id: 2, title: 'Grace Church',        type: 'Church Graphics',   icon: '⛪', bg: 'from-blue-900 to-blue-950',    cat: 'church',   year: '2024' },
  { id: 3, title: 'Zambia Fresh',        type: 'Motion Poster',     icon: '🥬', bg: 'from-green-900 to-green-950',  cat: 'motion',   year: '2024' },
  { id: 4, title: 'Copperbelt FC',       type: 'Sports Branding',   icon: '⚽', bg: 'from-red-900 to-red-950',      cat: 'branding', year: '2025' },
  { id: 5, title: 'MapaTech Solutions',  type: 'Full Branding',     icon: '💻', bg: 'from-purple-900 to-purple-950',cat: 'branding', year: '2025' },
  { id: 6, title: 'Ndola Events',        type: 'Event Flyers',      icon: '🎪', bg: 'from-pink-900 to-pink-950',    cat: 'flyer',    year: '2025' },
  { id: 7, title: 'Kafue Beats Studio',  type: 'Music Branding',    icon: '🎵', bg: 'from-indigo-900 to-indigo-950',cat: 'branding', year: '2025' },
  { id: 8, title: 'ShopZM',             type: 'E-Commerce Design',  icon: '🛒', bg: 'from-yellow-900 to-yellow-950',cat: 'website',  year: '2025' },
  { id: 9, title: 'Lusaka Gospel Choir', type: 'Church Media Pack', icon: '🎤', bg: 'from-teal-900 to-teal-950',    cat: 'church',   year: '2025' },
]
const CATS = ['all', 'branding', 'church', 'motion', 'flyer', 'website']

export default function PortfolioPage() {
  const [active, setActive] = useState('all')
  const filtered = active === 'all' ? PORTFOLIO : PORTFOLIO.filter(p => p.cat === active)

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="px-4 pt-8 pb-4 bg-[radial-gradient(ellipse_100%_40%_at_50%_0%,rgba(212,160,23,0.08),transparent)]">
        <h1 className="font-bebas text-5xl tracking-wider mb-1">OUR <span className="text-gold-gradient">PORTFOLIO</span></h1>
        <p className="text-sm text-[#88887f]">Selected work from Ken Media Creative Studio</p>
      </div>
      <div className="flex gap-2 px-4 mt-3 mb-5 overflow-x-auto no-scrollbar">
        {CATS.map(c => (
          <button key={c} onClick={() => setActive(c)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-medium border transition-all capitalize ${active === c ? 'bg-gold-gradient text-black border-transparent font-bold' : 'border-white/[0.08] text-[#88887f]'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-28">
        {filtered.map((p, i) => (
          <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
            className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-[rgba(212,160,23,0.3)] hover:-translate-y-1 transition-all cursor-pointer group">
            <div className={`relative h-36 bg-gradient-to-br ${p.bg} flex items-center justify-center`}>
              <span className="text-5xl z-10">{p.icon}</span>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-gold-gradient text-black text-xs font-bold px-3 py-1.5 rounded-full">View Project</span>
              </div>
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[9px] text-[#D4A017] px-2 py-0.5 rounded-full">{p.year}</div>
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="text-[11px] text-[#88887f] mt-0.5">{p.type}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <Footer />
      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
