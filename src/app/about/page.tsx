'use client'
// src/app/about/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import Footer from '@/components/ui/Footer'

const VALUES = [
  { icon: '🏆', title: 'Premium Quality',      desc: 'Every design is crafted with precision, attention to detail, and a deep understanding of African culture and aesthetics.' },
  { icon: '⚡', title: 'Fast Turnaround',       desc: 'We respect your deadlines. Most projects are delivered within 24–72 hours without compromising quality.' },
  { icon: '🤝', title: 'Local & Global',        desc: 'Rooted in Zambia, thinking globally. We understand what works for African markets while meeting international standards.' },
  { icon: '💳', title: 'Mobile Money Ready',   desc: 'Pay easily via Airtel Money, MTN Money, or Access Bank — no international cards needed.' },
  { icon: '🔒', title: 'Secure & Transparent', desc: 'Your files are watermark-protected until payment is approved. We never release work without confirmation.' },
  { icon: '🚀', title: 'AI-Powered Studio',    desc: 'We use cutting-edge AI tools internally to accelerate design work and deliver better results faster.' },
]

export default function AboutPage() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP || '0772799672'
  const fbUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/DjTizzyBeats'

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      {/* CEO Hero */}
      <section className="relative px-5 pt-10 pb-6 text-center bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(212,160,23,0.1),transparent)]">
        <div className="text-3xl mb-2">👑</div>

        {/* CEO Photo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="relative w-32 h-32 mx-auto mb-4"
        >
          <div className="w-32 h-32 rounded-full border-[3px] border-[#D4A017] overflow-hidden bg-[#222] shadow-2xl shadow-[rgba(212,160,23,0.25)] gold-glow-lg">
            <Image
              src="/ken-west-ceo.png"
              alt="Ken West – CEO & Founder, Ken Media Creative Studio"
              width={128}
              height={128}
              className="w-full h-full object-cover"
              priority
              onError={(e) => {
                const t = e.target as HTMLImageElement
                t.style.display = 'none'
                t.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-[#D4A017] to-[#F5C842]">👑</div>'
              }}
            />
          </div>
          {/* Verified badge */}
          <div className="absolute bottom-0 right-0 w-9 h-9 bg-[#D4A017] rounded-full flex items-center justify-center text-sm shadow-lg">
            ✓
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h1 className="font-bebas text-4xl tracking-[4px] leading-none mb-1">KEN WEST</h1>
          <p className="text-xs text-[#D4A017] tracking-[4px] uppercase mb-1">CEO & Creative Director</p>
          <p className="text-xs text-[#88887f] mb-4">Ken Media Creative Studio · Lusaka, Zambia 🇿🇲</p>

          <blockquote className="text-sm text-[#88887f] italic leading-relaxed max-w-xs mx-auto mb-6">
            "Transforming African businesses through world-class design, one brand at a time.
            Excellence is not just a goal — it's our standard."
          </blockquote>

          <div className="flex gap-3 justify-center">
            <a
              href={`https://wa.me/260${waNumber.replace(/^0/, '')}?text=${encodeURIComponent("Hello Ken! I'd love to work with you.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold px-6 py-2.5 rounded-full text-xs font-bold"
            >
              📱 WhatsApp
            </a>
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost-gold px-6 py-2.5 rounded-full text-xs font-medium border border-[rgba(212,160,23,0.25)]"
            >
              📘 Facebook
            </a>
          </div>
        </motion.div>
      </section>

      {/* Contact Cards */}
      <section className="px-4 py-6">
        <h2 className="font-syne text-base font-bold mb-4">📞 Contact & Payment</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📱', name: 'WhatsApp',    value: waNumber,                          href: `https://wa.me/260${waNumber.replace(/^0/,'')}` },
            { icon: '📘', name: 'Facebook',    value: 'DjTizzyBeats',                    href: fbUrl },
            { icon: '📶', name: 'Airtel Money',value: process.env.NEXT_PUBLIC_AIRTEL_NUMBER || '0570109056', href: '#' },
            { icon: '📡', name: 'MTN Money',   value: process.env.NEXT_PUBLIC_MTN_NUMBER || '0761468402',   href: '#' },
            { icon: '🏦', name: 'Access Bank', value: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0136496126029', href: '#' },
          ].map((c) => (
            <a
              key={c.name}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 text-center hover:border-[rgba(212,160,23,0.3)] transition-all"
            >
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-xs font-semibold mb-1">{c.name}</div>
              <div className="text-[11px] text-[#D4A017] font-medium">{c.value}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="px-4 pb-28">
        <h2 className="font-syne text-base font-bold mb-4">🌟 Why Choose Ken Media?</h2>
        <div className="space-y-3">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-4 items-start bg-[#1a1a1a] border border-white/[0.06] rounded-2xl p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.2)] flex items-center justify-center text-xl flex-shrink-0">
                {v.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">{v.title}</h4>
                <p className="text-[11px] text-[#88887f] leading-relaxed">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
