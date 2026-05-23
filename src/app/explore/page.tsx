'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Lock, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, onSnapshot, doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore'

const BottomNav = dynamic(() => import('@/components/ui/BottomNav'), { ssr: false })
const WhatsAppButton = dynamic(() => import('@/components/ui/WhatsAppButton'), { ssr: false })

const FALLBACK = [
  { id: '1', name: 'Motion Poster Pack',      price: 250, icon: '🎨', bg: '#1a0533', category: 'motion',   likesCount: 124 },
  { id: '2', name: 'Branding Kit Pro',         price: 180, icon: '🏢', bg: '#0a1a00', category: 'branding', likesCount: 89  },
  { id: '3', name: 'Church Graphics Bundle',   price: 120, icon: '⛪', bg: '#1a0000', category: 'church',   likesCount: 67  },
  { id: '4', name: 'Video Ad Templates',       price: 350, icon: '🎬', bg: '#00101a', category: 'motion',   likesCount: 203 },
  { id: '5', name: 'Social Media 30pk',        price: 200, icon: '📊', bg: '#1a1100', category: 'social',   likesCount: 156 },
  { id: '6', name: 'PSD Flyer Mega Pack',      price: 300, icon: '📦', bg: '#0a001a', category: 'template', likesCount: 98  },
]

export default function ExplorePage() {
  const [products, setProducts] = useState<any[]>([])
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [likes, setLikes] = useState<Record<string, number>>({})
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (data.length > 0) {
        setProducts(data)
        const l: Record<string,number> = {}
        data.forEach((p: any) => { l[p.id] = p.likesCount || 0 })
        setLikes(l)
      } else {
        setProducts(FALLBACK)
        const l: Record<string,number> = {}
        FALLBACK.forEach(p => { l[p.id] = p.likesCount })
        setLikes(l)
      }
    }, () => {
      setProducts(FALLBACK)
      const l: Record<string,number> = {}
      FALLBACK.forEach(p => { l[p.id] = p.likesCount })
      setLikes(l)
    })
    return () => unsub()
  }, [])

  const handleLike = async (id: string) => {
    const newLiked = !liked[id]
    setLiked(prev => ({ ...prev, [id]: newLiked }))
    setLikes(prev => ({ ...prev, [id]: prev[id] + (newLiked ? 1 : -1) }))
    try {
      const likeRef = doc(db, 'likes', `${id}_guest`)
      const productRef = doc(db, 'products', id)
      if (newLiked) {
        await setDoc(likeRef, { productId: id, createdAt: new Date() })
        await updateDoc(productRef, { likesCount: increment(1) })
      } else {
        await deleteDoc(likeRef)
        await updateDoc(productRef, { likesCount: increment(-1) })
      }
    } catch {}
  }

  const handleShare = (name: string) => {
    if (navigator.share) {
      navigator.share({ title: name, text: `Check out ${name} on Ken Media Creative Studio!`, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  return (
    <div style={{ background: '#080808', height: '100vh', width: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 16px', background: 'linear-gradient(to bottom, rgba(8,8,8,0.9), transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'serif', fontSize: 18, letterSpacing: 3, color: '#D4A017', fontWeight: 700 }}>KEN MEDIA</div>
        <Link href="/shop" style={{ background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 50, textDecoration: 'none' }}>SHOP</Link>
      </div>

      {/* TikTok Feed */}
      <div className="tiktok-feed" style={{ paddingTop: 0, paddingBottom: 80 }}>
        {products.map((p: any, i) => (
          <div
            key={p.id}
            ref={el => { slideRefs.current[i] = el }}
            className="tiktok-slide"
            style={{ background: `linear-gradient(135deg, ${p.bg || '#1a1a1a'} 0%, #080808 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          >
            {/* Big icon */}
            <div style={{ fontSize: 120, filter: 'drop-shadow(0 0 40px rgba(212,160,23,0.3))' }}>
              {p.icon || '🎨'}
            </div>

            {/* Watermark */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: 'serif', fontSize: 32, letterSpacing: 8, color: 'rgba(212,160,23,0.15)', transform: 'rotate(-20deg)', userSelect: 'none', whiteSpace: 'nowrap' }}>KEN MEDIA</span>
            </div>

            {/* Lock badge */}
            <div style={{ position: 'absolute', top: 60, right: 16, background: 'rgba(0,0,0,0.6)', borderRadius: 50, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={12} color="#D4A017" />
              <span style={{ fontSize: 10, color: '#D4A017', fontWeight: 700 }}>LOCKED</span>
            </div>

            {/* Bottom info */}
            <div style={{ position: 'absolute', bottom: 100, left: 16, right: 80 }}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div style={{ fontSize: 11, color: '#D4A017', fontWeight: 700, marginBottom: 4, letterSpacing: 2, textTransform: 'uppercase' }}>{p.category}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: '#F0EDE6', lineHeight: 1.2 }}>{p.name}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#D4A017' }}>K{p.price}</div>
              </motion.div>
              <Link href={`/shop/${p.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 50, textDecoration: 'none', marginTop: 12 }}>
                <ShoppingCart size={14} /> Buy Now
              </Link>
            </div>

            {/* Right actions */}
            <div style={{ position: 'absolute', right: 16, bottom: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <button onClick={() => handleLike(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={22} fill={liked[p.id] ? '#E74C3C' : 'none'} color={liked[p.id] ? '#E74C3C' : '#fff'} />
                </div>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{likes[p.id] || 0}</span>
              </button>
              <button onClick={() => handleShare(p.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Share2 size={22} color="#fff" />
                </div>
                <span style={{ fontSize: 12, color: '#fff' }}>Share</span>
              </button>
              <Link href="/messages" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={22} color="#fff" />
                </div>
                <span style={{ fontSize: 12, color: '#fff' }}>Chat</span>
              </Link>
            </div>

            {/* Scroll hint on first slide */}
            {i === 0 && (
              <div style={{ position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: 'fadeIn 1s ease 2s both' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Scroll for more</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>↓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
      <WhatsAppButton />
    </div>
  )
}
