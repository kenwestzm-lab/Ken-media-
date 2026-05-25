'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Heart, Share2, Lock, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore'

const Navbar         = dynamic(() => import('@/components/ui/Navbar'),         { ssr: false })
const BottomNav      = dynamic(() => import('@/components/ui/BottomNav'),      { ssr: false })
const WhatsAppButton = dynamic(() => import('@/components/ui/WhatsAppButton'), { ssr: false })
const CEOCard        = dynamic(() => import('@/components/ui/CEOCard'),        { ssr: false })
const Footer         = dynamic(() => import('@/components/ui/Footer'),         { ssr: false })

const SERVICES_STATIC = [
  { icon: '🎯', name: 'Logo Design',   from: 'K150' },
  { icon: '📰', name: 'Flyer Design',  from: 'K80'  },
  { icon: '🎬', name: 'Motion Poster', from: 'K250' },
  { icon: '📱', name: 'Social Media',  from: 'K200' },
  { icon: '🌐', name: 'Website',       from: 'K800' },
]

export default function HomePage() {
  const [posts, setPosts]     = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [liked, setLiked]     = useState<Record<string,boolean>>({})
  const [likes, setLikes]     = useState<Record<string,number>>({})

  // Real-time posts from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'posts'), orderBy('createdAt','desc'), limit(10)),
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPosts(data)
        const l: Record<string,number> = {}
        data.forEach((p: any) => { l[p.id] = p.likesCount || 0 })
        setLikes(l)
      },
      () => {}
    )
    return () => unsub()
  }, [])

  // Real-time products from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'products'), orderBy('createdAt','desc'), limit(8)),
      snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [])

  // Real-time services from Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'services'), orderBy('createdAt','desc')),
      snap => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    )
    return () => unsub()
  }, [])

  const handleLike = (id: string) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }))
    setLikes(prev => ({ ...prev, [id]: prev[id] + (liked[id] ? -1 : 1) }))
  }

  const handleShare = (post: any) => {
    if (navigator.share) navigator.share({ title: post.caption, url: window.location.href })
    else { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6' }}>
      <Navbar />
      <main style={{ paddingBottom: 80 }}>

        {/* Hero */}
        <section style={{ padding: '40px 16px 28px', textAlign: 'center', background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(212,160,23,0.13), transparent)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 50, padding: '6px 14px', fontSize: 11, color: '#D4A017', marginBottom: 16, letterSpacing: 1 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4A017', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            🇿🇲 Zambia's #1 Creative Studio
          </div>
          <h1 style={{ fontFamily: 'serif', fontSize: 60, lineHeight: 0.95, letterSpacing: 2, marginBottom: 10 }}>
            DESIGN <span style={{ background: 'linear-gradient(135deg,#D4A017,#F5C842)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>THAT</span><br />
            <span style={{ background: 'linear-gradient(135deg,#D4A017,#F5C842)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MOVES</span> YOU
          </h1>
          <p style={{ color: '#888', fontSize: 14, maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Premium logos, motion graphics, branding & digital services for African businesses.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/services" style={{ background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', fontWeight: 700, padding: '13px 28px', borderRadius: 50, fontSize: 14, textDecoration: 'none' }}>Browse Services</Link>
            <Link href="/shop" style={{ background: 'transparent', border: '1px solid rgba(212,160,23,0.25)', color: '#D4A017', padding: '13px 28px', borderRadius: 50, fontSize: 14, textDecoration: 'none' }}>View Store</Link>
          </div>
        </section>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid rgba(212,160,23,0.15)', borderBottom: '1px solid rgba(212,160,23,0.15)', marginBottom: 24 }}>
          {[['500+','Designs Done'],['200+','Happy Clients'],['98%','Satisfaction']].map(([n,l]) => (
            <div key={l} style={{ textAlign: 'center', padding: '18px 10px', borderRight: '1px solid rgba(212,160,23,0.1)' }}>
              <div style={{ fontFamily: 'serif', fontSize: 30, color: '#D4A017', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* CEO Card */}
        <div style={{ padding: '0 16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'serif', fontSize: 16, fontWeight: 800 }}>Meet the Creator</h2>
          </div>
          <CEOCard />
        </div>

        {/* LIVE POSTS FEED — Real-time from Firebase */}
        {posts.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
              <h2 style={{ fontFamily: 'serif', fontSize: 16, fontWeight: 800 }}>🔥 Latest Posts</h2>
              <Link href="/explore" style={{ fontSize: 11, color: '#D4A017', textDecoration: 'none', letterSpacing: 1 }}>SEE ALL →</Link>
            </div>
            <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ flexShrink: 0, width: 180, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
                  <Link href="/explore" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ height: 200, background: '#111', position: 'relative', overflow: 'hidden' }}>
                      {post.fileType === 'image' && post.fileUrl && (
                        <img src={post.fileUrl} alt={post.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      {post.fileType === 'video' && post.fileUrl && (
                        <video src={post.fileUrl} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      {post.fileType === 'audio' && (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1a0533,#080808)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎵</div>
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.7),transparent)' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <span style={{ fontFamily: 'serif', fontSize: 18, letterSpacing: 4, color: 'rgba(212,160,23,0.2)', transform: 'rotate(-20deg)' }}>KEN MEDIA</span>
                      </div>
                      {post.price > 0 && (
                        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '3px 8px', fontSize: 11, color: '#D4A017', fontWeight: 700 }}>K{post.price}</div>
                      )}
                    </div>
                  </Link>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.caption}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleLike(post.id)} style={{ flex: 1, background: liked[post.id] ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${liked[post.id] ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '6px 4px', fontSize: 10, color: liked[post.id] ? '#E74C3C' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <Heart size={11} fill={liked[post.id] ? 'currentColor' : 'none'} /> {likes[post.id] || 0}
                      </button>
                      <button onClick={() => handleShare(post)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 4px', fontSize: 10, color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <Share2 size={11} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* REAL PRODUCTS from Firestore — with fallback to static */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'serif', fontSize: 16, fontWeight: 800 }}>🛍 Digital Store</h2>
            <Link href="/shop" style={{ fontSize: 11, color: '#D4A017', textDecoration: 'none', letterSpacing: 1 }}>SEE ALL →</Link>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {(products.length > 0 ? products : [
              { id: '1', name: 'Motion Poster Pack',   price: 250, fileType: 'image', category: 'motion'   },
              { id: '2', name: 'Branding Kit Pro',      price: 180, fileType: 'image', category: 'branding' },
              { id: '3', name: 'Church Graphics',       price: 120, fileType: 'image', category: 'church'   },
              { id: '4', name: 'Video Ad Templates',    price: 350, fileType: 'video', category: 'motion'   },
            ]).map((p: any, i) => (
              <Link key={p.id} href="/shop" style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: 160, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', display: 'block' }}>
                <div style={{ height: 140, background: '#111', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.thumbnailUrl || p.fileUrl
                    ? <img src={p.thumbnailUrl || p.fileUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 44 }}>{['🎨','🏢','⛪','🎬','📊','📦'][i % 6]}</span>
                  }
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontFamily: 'serif', fontSize: 14, letterSpacing: 4, color: 'rgba(212,160,23,0.2)', transform: 'rotate(-20deg)' }}>KEN MEDIA</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={11} color="#D4A017" />
                  </div>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#D4A017' }}>K{p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* REAL SERVICES from Firestore — with fallback */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'serif', fontSize: 16, fontWeight: 800 }}>⚡ Our Services</h2>
            <Link href="/services" style={{ fontSize: 11, color: '#D4A017', textDecoration: 'none', letterSpacing: 1 }}>ALL →</Link>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {(services.length > 0 ? services : SERVICES_STATIC).map((s: any, i) => (
              <Link key={s.id || i} href="/services"
                style={{ flexShrink: 0, width: 140, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon || '⚡'}</div>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{s.name || s.serviceName}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#D4A017' }}>From {s.from || `K${s.startingPrice}`}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '0 16px 16px' }}>
          <h2 style={{ fontFamily: 'serif', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>💬 What Clients Say</h2>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {[
              { name: 'Chanda M.',   service: 'Logo Design',   quote: 'Ken delivered beyond expectations! My brand looks world-class.' },
              { name: 'Bupe K.',     service: 'Motion Poster', quote: 'Incredible quality and so fast. Got my poster in 24 hours!' },
              { name: 'Mwamba J.',   service: 'Full Branding', quote: 'Professional, creative and very responsive. Highly recommend!' },
            ].map(t => (
              <div key={t.name} style={{ flexShrink: 0, width: 240, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14 }}>
                <div style={{ color: '#D4A017', fontSize: 13, marginBottom: 8 }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontSize: 12, color: '#888', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 10 }}>"{t.quote}"</p>
                <p style={{ fontSize: 12, fontWeight: 600 }}>{t.name}</p>
                <p style={{ fontSize: 10, color: '#D4A017' }}>{t.service}</p>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </main>
      <BottomNav />
      <WhatsAppButton />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
