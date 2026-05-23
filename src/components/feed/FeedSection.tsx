'use client'
// src/components/feed/FeedSection.tsx
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import useStore from '@/store/useStore'

const FEATURED = [
  { id: '1', name: 'Motion Poster Pack',       price: 250, original: 400, icon: '🎨', badge: 'HOT',  bg: 'linear-gradient(135deg,#1a0533,#2d1566)', likes: 124, comments: 18, category: 'motion'   },
  { id: '2', name: 'Branding Kit Pro',          price: 180, original: 300, icon: '🏢', badge: 'NEW',  bg: 'linear-gradient(135deg,#0a1a00,#1a3d00)', likes: 89,  comments: 12, category: 'branding' },
  { id: '3', name: 'Church Graphics Bundle',    price: 120, original: 200, icon: '⛪', badge: 'SALE', bg: 'linear-gradient(135deg,#1a0000,#3d0000)', likes: 67,  comments: 9,  category: 'church'   },
  { id: '4', name: 'Video Ad Templates',        price: 350, original: 500, icon: '🎬', badge: 'PRO',  bg: 'linear-gradient(135deg,#00101a,#00253d)', likes: 203, comments: 31, category: 'motion'   },
  { id: '5', name: 'Social Media 30pk',         price: 200, original: 350, icon: '📊', badge: 'TOP',  bg: 'linear-gradient(135deg,#1a1100,#3d2800)', likes: 156, comments: 22, category: 'social'   },
]

export default function FeedSection() {
  const { user } = useStore()
  const [likes, setLikes] = useState<Record<string, number>>(
    Object.fromEntries(FEATURED.map((p) => [p.id, p.likes]))
  )
  const [liked, setLiked] = useState<Record<string, boolean>>({})

  const handleLike = (id: string) => {
    if (!user) { toast.error('Sign in to like designs'); return }
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }))
    setLikes((prev) => ({ ...prev, [id]: prev[id] + (liked[id] ? -1 : 1) }))
  }

  const handleShare = (name: string) => {
    if (navigator.share) {
      navigator.share({ title: name, text: `Check out this design from Ken Media Creative Studio!`, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="font-syne text-base font-bold">🔥 Trending Designs</h2>
        <Link href="/shop" className="text-[11px] text-[#D4A017] tracking-wider">SEE ALL →</Link>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-2">
        {FEATURED.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex-shrink-0 w-48 bg-[#1a1a1a] border border-white/[0.08] rounded-2xl overflow-hidden feed-card cursor-pointer"
          >
            {/* Thumb */}
            <Link href={`/shop/${item.id}`}>
              <div className="relative h-56" style={{ background: item.bg }}>
                <div className="absolute inset-0 flex items-center justify-center text-6xl z-10">
                  {item.icon}
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-20" />
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                  <span className="font-bebas text-2xl tracking-[6px] text-[rgba(212,160,23,0.22)] rotate-[-20deg] select-none">
                    KEN MEDIA
                  </span>
                </div>
                {/* Lock */}
                <div className="absolute bottom-10 right-3 z-30">
                  <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Lock size={13} className="text-[#D4A017]" />
                  </div>
                </div>
                {/* Badge */}
                <span className="absolute top-2.5 left-2.5 z-30 bg-gold-gradient text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider">
                  {item.badge}
                </span>
              </div>
            </Link>

            {/* Info */}
            <div className="p-3">
              <p className="text-[12px] font-medium mb-1 leading-tight">{item.name}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold text-[#D4A017]">K{item.price}</span>
                <span className="text-[10px] text-[#88887f] line-through">K{item.original}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5 px-3 pb-3">
              <button
                onClick={() => handleLike(item.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border text-[10px] transition-all ${
                  liked[item.id]
                    ? 'text-red-400 border-red-400/30 bg-red-400/5'
                    : 'text-[#88887f] border-white/[0.08] hover:border-[rgba(212,160,23,0.3)]'
                }`}
              >
                <Heart size={11} fill={liked[item.id] ? 'currentColor' : 'none'} />
                {likes[item.id]}
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-white/[0.08] text-[10px] text-[#88887f] hover:border-[rgba(212,160,23,0.3)] transition-all">
                <MessageCircle size={11} /> {item.comments}
              </button>
              <button
                onClick={() => handleShare(item.name)}
                className="flex-1 flex items-center justify-center py-1.5 rounded-lg border border-white/[0.08] text-[10px] text-[#88887f] hover:border-[rgba(212,160,23,0.3)] transition-all"
              >
                <Share2 size={11} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
