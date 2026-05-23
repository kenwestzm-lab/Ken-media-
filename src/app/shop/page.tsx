'use client'
// src/app/shop/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Star, ShoppingCart } from 'lucide-react'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import WhatsAppButton from '@/components/ui/WhatsAppButton'

const PRODUCTS = [
  { id: '1', name: 'Motion Poster Pack',         price: 250, original: 400, icon: '🎨', bg: 'from-purple-900 to-purple-950', category: 'motion',   rating: 4.9, sales: 47 },
  { id: '2', name: 'Branding Kit Pro',            price: 180, original: 300, icon: '🏢', bg: 'from-green-900 to-green-950',  category: 'branding', rating: 5.0, sales: 32 },
  { id: '3', name: 'Church Graphics Bundle',      price: 120, original: 200, icon: '⛪', bg: 'from-red-900 to-red-950',      category: 'church',   rating: 4.8, sales: 28 },
  { id: '4', name: 'Video Ad Templates',          price: 350, original: 500, icon: '🎬', bg: 'from-blue-900 to-blue-950',    category: 'motion',   rating: 4.9, sales: 53 },
  { id: '5', name: 'Social Media Templates 30pk', price: 200, original: 350, icon: '📊', bg: 'from-amber-900 to-amber-950',  category: 'social',   rating: 4.7, sales: 41 },
  { id: '6', name: 'PSD Flyer Mega Pack',         price: 300, original: 480, icon: '📦', bg: 'from-indigo-900 to-indigo-950',category: 'template', rating: 4.8, sales: 36 },
  { id: '7', name: 'Canva Business Pack',         price: 150, original: 250, icon: '🖼', bg: 'from-pink-900 to-pink-950',    category: 'template', rating: 4.6, sales: 29 },
  { id: '8', name: 'Complete Branding System',    price: 550, original: 900, icon: '✨', bg: 'from-yellow-900 to-yellow-950',category: 'branding', rating: 5.0, sales: 18 },
]

const FILTERS = [
  { key: 'all',      label: 'All Products' },
  { key: 'template', label: '📄 Templates'  },
  { key: 'branding', label: '🏢 Branding'   },
  { key: 'motion',   label: '🎬 Motion'     },
  { key: 'church',   label: '⛪ Church'      },
  { key: 'social',   label: '📱 Social'     },
]

export default function ShopPage() {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = activeFilter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeFilter)

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <div className="px-4 pt-8 pb-4 bg-[radial-gradient(ellipse_100%_40%_at_50%_0%,rgba(212,160,23,0.08),transparent)]">
        <h1 className="font-bebas text-5xl tracking-wider mb-1">
          DIGITAL <span className="text-gold-gradient">STORE</span>
        </h1>
        <p className="text-sm text-[#88887f]">Ready-made templates & design packs — download unlocks after payment approval</p>
      </div>

      {/* Notice banner */}
      <div className="mx-4 mt-3 bg-[rgba(212,160,23,0.06)] border border-[rgba(212,160,23,0.2)] rounded-xl px-4 py-3 flex items-center gap-3">
        <Lock size={16} className="text-[#D4A017] flex-shrink-0" />
        <p className="text-xs text-[#D4A017] leading-relaxed">
          All downloads are <strong>locked</strong> until your payment is verified and approved by admin. No auto-release.
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-medium border transition-all ${
              activeFilter === f.key
                ? 'bg-gold-gradient text-black border-transparent font-bold'
                : 'border-white/[0.08] text-[#88887f] hover:border-[rgba(212,160,23,0.3)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4 pb-28">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link href={`/shop/${p.id}`} className="block bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-[rgba(212,160,23,0.3)] transition-all hover:-translate-y-1">
              {/* Thumb */}
              <div className={`relative h-40 bg-gradient-to-br ${p.bg} flex items-center justify-center`}>
                <span className="text-5xl z-10">{p.icon}</span>
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="font-bebas text-xl tracking-[5px] text-[rgba(212,160,23,0.2)] rotate-[-20deg] select-none whitespace-nowrap">
                    KEN MEDIA
                  </span>
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-end justify-end p-2">
                  <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                    <Lock size={12} className="text-[#D4A017]" />
                  </div>
                </div>
                {/* Discount badge */}
                {p.original > p.price && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    -{Math.round((1 - p.price / p.original) * 100)}%
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-[12px] font-semibold leading-tight mb-1.5">{p.name}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[15px] font-bold text-[#D4A017]">K{p.price}</span>
                    {p.original > p.price && (
                      <span className="text-[10px] text-[#88887f] line-through ml-1.5">K{p.original}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 text-[10px] text-[#88887f]">
                    <Star size={9} fill="currentColor" className="text-[#D4A017]" />
                    {p.rating}
                  </div>
                </div>
                <p className="text-[10px] text-[#88887f] mt-1">{p.sales} sold</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
