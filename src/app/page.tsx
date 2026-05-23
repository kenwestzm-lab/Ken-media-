'use client'
// src/app/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import WhatsAppButton from '@/components/ui/WhatsAppButton'
import FeedSection from '@/components/feed/FeedSection'
import CEOCard from '@/components/ui/CEOCard'
import Footer from '@/components/ui/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="pb-20 md:pb-0">

        {/* ===== HERO ===== */}
        <section className="relative px-5 pt-10 pb-8 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(212,160,23,0.13),transparent)] pointer-events-none" />
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 bg-[rgba(212,160,23,0.10)] border border-[rgba(212,160,23,0.25)] rounded-full px-4 py-1.5 text-xs text-[#D4A017] mb-5 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse-gold" />
            🇿🇲 Zambia's #1 Creative Studio
          </div>
          <h1 className="font-bebas text-[64px] md:text-[90px] leading-[0.92] tracking-wide mb-3">
            DESIGN <span className="text-gold-gradient">THAT</span><br />
            <span className="text-gold-gradient">MOVES</span> YOU
          </h1>
          <p className="text-[#88887f] text-sm md:text-base max-w-xs md:max-w-md mx-auto mb-7 leading-relaxed">
            Premium logos, motion graphics, branding & digital services crafted for African businesses. Based in Lusaka, Zambia.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/services" className="btn-gold px-7 py-3.5 rounded-full text-sm font-bold">
              Browse Services
            </Link>
            <Link href="/shop" className="btn-ghost-gold px-7 py-3.5 rounded-full text-sm font-medium border border-[rgba(212,160,23,0.25)]">
              View Store
            </Link>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-3 border-y border-[rgba(212,160,23,0.15)] mx-0 mb-7">
          {[
            { n: '500+', l: 'Designs Done' },
            { n: '200+', l: 'Happy Clients' },
            { n: '98%',  l: 'Satisfaction' },
          ].map((s) => (
            <div key={s.l} className="text-center py-5 border-r last:border-r-0 border-[rgba(212,160,23,0.1)]">
              <div className="font-bebas text-3xl text-[#D4A017] leading-none">{s.n}</div>
              <div className="text-[10px] text-[#88887f] mt-1 tracking-wider uppercase">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ===== CEO CARD ===== */}
        <section className="px-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-syne text-base font-bold">Meet the Creator</h2>
          </div>
          <CEOCard />
        </section>

        {/* ===== TRENDING FEED ===== */}
        <Suspense fallback={<div className="h-48 skeleton mx-4 rounded-2xl" />}>
          <FeedSection />
        </Suspense>

        {/* ===== QUICK SERVICES ===== */}
        <section className="mt-4 mb-8">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-syne text-base font-bold">⚡ Quick Services</h2>
            <Link href="/services" className="text-[11px] text-[#D4A017] tracking-wider">ALL →</Link>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2">
            {[
              { icon: '🎯', name: 'Logo Design',    from: 'K150' },
              { icon: '📰', name: 'Flyer Design',   from: 'K80'  },
              { icon: '🎬', name: 'Motion Poster',  from: 'K250' },
              { icon: '📱', name: 'Social Media',   from: 'K200' },
              { icon: '🌐', name: 'Website',        from: 'K800' },
            ].map((s) => (
              <Link
                key={s.name}
                href="/services"
                className="flex-shrink-0 w-36 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 hover:border-[rgba(212,160,23,0.3)] transition-all"
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-xs font-semibold mb-1">{s.name}</div>
                <div className="text-sm font-bold text-[#D4A017]">From {s.from}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="px-4 mb-8">
          <h2 className="font-syne text-base font-bold mb-4">💬 What Clients Say</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {[
              { name: 'Chanda M.', service: 'Logo Design', quote: 'Ken delivered beyond expectations! My brand looks world-class.', stars: 5 },
              { name: 'Bupe K.',   service: 'Motion Poster', quote: 'Incredible quality and so fast. Got my poster in 24 hours!', stars: 5 },
              { name: 'Mwamba J.', service: 'Full Branding', quote: 'Professional, creative and very responsive. Highly recommend!', stars: 5 },
            ].map((t) => (
              <div key={t.name} className="flex-shrink-0 w-64 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4">
                <div className="text-[#D4A017] text-sm mb-2">{'⭐'.repeat(t.stars)}</div>
                <p className="text-xs text-[#88887f] italic leading-relaxed mb-3">"{t.quote}"</p>
                <div className="text-xs font-semibold">{t.name}</div>
                <div className="text-[10px] text-[#D4A017]">{t.service}</div>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </main>

      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
