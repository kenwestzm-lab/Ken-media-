'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Lock, ShoppingCart, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, setDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { auth } from '@/lib/firebase'

const BottomNav = dynamic(() => import('@/components/ui/BottomNav'), { ssr: false })
const WhatsAppButton = dynamic(() => import('@/components/ui/WhatsAppButton'), { ssr: false })

export default function ExplorePage() {
  const [posts, setPosts]         = useState<any[]>([])
  const [liked, setLiked]         = useState<Record<string,boolean>>({})
  const [likes, setLikes]         = useState<Record<string,number>>({})
  const [muted, setMuted]         = useState(true)
  const [currentIndex, setIndex]  = useState(0)
  const [loading, setLoading]     = useState(true)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const user = auth.currentUser

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setPosts(data)
      const l: Record<string,number> = {}
      data.forEach((p: any) => { l[p.id] = p.likesCount || 0 })
      setLikes(l)
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  // Auto-play video/audio when slide comes into view
  useEffect(() => {
    if (posts[currentIndex]) {
      const post = posts[currentIndex]
      // Pause all others
      Object.values(videoRefs.current).forEach(v => v?.pause())
      Object.values(audioRefs.current).forEach(a => a?.pause())
      // Play current
      if (post.fileType === 'video') videoRefs.current[post.id]?.play().catch(()=>{})
      if (post.musicUrl) audioRefs.current[post.id]?.play().catch(()=>{})
    }
  }, [currentIndex, posts])

  const handleScroll = () => {
    if (!containerRef.current) return
    const scrollTop = containerRef.current.scrollTop
    const height = containerRef.current.clientHeight
    setIndex(Math.round(scrollTop / height))
  }

  const handleLike = async (id: string) => {
    const uid = user?.uid || 'guest'
    const newLiked = !liked[id]
    setLiked(prev => ({ ...prev, [id]: newLiked }))
    setLikes(prev => ({ ...prev, [id]: prev[id] + (newLiked ? 1 : -1) }))
    try {
      const likeRef = doc(db, 'likes', `${id}_${uid}`)
      if (newLiked) {
        await setDoc(likeRef, { postId: id, userId: uid, createdAt: new Date() })
        await updateDoc(doc(db, 'posts', id), { likesCount: increment(1) })
      } else {
        await deleteDoc(likeRef)
        await updateDoc(doc(db, 'posts', id), { likesCount: increment(-1) })
      }
    } catch {}
  }

  const handleShare = async (post: any) => {
    const url = `${window.location.origin}/shop/${post.id}`
    if (navigator.share) {
      navigator.share({ title: post.caption, text: post.caption, url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  if (loading) return (
    <div style={{ height: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(212,160,23,0.2)', borderTop: '3px solid #D4A017', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#888', fontSize: 13 }}>Loading feed...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (posts.length === 0) return (
    <div style={{ height: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 60 }}>📤</div>
      <h2 style={{ fontFamily: 'serif', fontSize: 22, color: '#D4A017' }}>No posts yet</h2>
      <p style={{ color: '#888', fontSize: 13 }}>Admin needs to upload content first</p>
      <Link href="/admin/upload" style={{ background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', padding: '12px 24px', borderRadius: 50, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
        + Upload First Post
      </Link>
      <BottomNav />
    </div>
  )

  return (
    <div style={{ background: '#080808', height: '100vh', width: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 16px', background: 'linear-gradient(to bottom,rgba(8,8,8,0.9),transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'serif', fontSize: 20, letterSpacing: 3, color: '#D4A017', fontWeight: 700 }}>KEN MEDIA</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMuted(!muted)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <Link href="/shop" style={{ background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', fontSize: 11, fontWeight: 700, padding: '8px 16px', borderRadius: 50, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>SHOP</Link>
        </div>
      </div>

      {/* TikTok Feed */}
      <div ref={containerRef} onScroll={handleScroll}
        style={{ height: '100vh', overflowY: 'scroll', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}>
        {posts.map((post, i) => (
          <div key={post.id}
            style={{ height: '100vh', scrollSnapAlign: 'start', position: 'relative', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

            {/* Media */}
            {post.fileType === 'image' && (
              <img src={post.fileUrl} alt={post.caption}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            )}
            {post.fileType === 'video' && (
              <video
                ref={el => { videoRefs.current[post.id] = el }}
                src={post.fileUrl}
                loop playsInline muted={muted}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            )}
            {post.fileType === 'audio' && (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#1a0533,#080808)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 80, animation: 'pulse 2s ease-in-out infinite' }}>🎵</div>
              </div>
            )}

            {/* Background music */}
            {post.musicUrl && (
              <audio ref={el => { audioRefs.current[post.id] = el }} src={post.musicUrl} loop muted={muted} />
            )}

            {/* Dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)' }} />

            {/* Watermark */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: 'serif', fontSize: 28, letterSpacing: 8, color: 'rgba(212,160,23,0.15)', transform: 'rotate(-20deg)', userSelect: 'none', whiteSpace: 'nowrap' }}>KEN MEDIA</span>
            </div>

            {/* Bottom info */}
            <div style={{ position: 'absolute', bottom: 80, left: 16, right: 72 }}>
              {post.category && (
                <div style={{ fontSize: 10, color: '#D4A017', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
                  {post.category}
                </div>
              )}
              <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>{post.caption}</p>
              {post.musicName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 50, padding: '5px 12px', width: 'fit-content', fontSize: 11 }}>
                  <span style={{ animation: 'spin 3s linear infinite', display: 'inline-block' }}>🎵</span>
                  {post.musicName} — {post.musicArtist}
                </div>
              )}
              {post.price > 0 && (
                <div style={{ marginTop: 10 }}>
                  <Link href={`/shop/${post.id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 50, textDecoration: 'none' }}>
                    <ShoppingCart size={14} /> K{post.price} — Buy Now
                  </Link>
                </div>
              )}
            </div>

            {/* Right actions */}
            <div style={{ position: 'absolute', right: 12, bottom: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <button onClick={() => handleLike(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: liked[post.id] ? '1px solid #E74C3C' : '1px solid transparent' }}>
                  <Heart size={22} fill={liked[post.id] ? '#E74C3C' : 'none'} color={liked[post.id] ? '#E74C3C' : '#fff'} />
                </div>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{likes[post.id] || 0}</span>
              </button>

              <Link href="/messages" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={22} color="#fff" />
                </div>
                <span style={{ fontSize: 12, color: '#fff' }}>Chat</span>
              </Link>

              <button onClick={() => handleShare(post)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Share2 size={22} color="#fff" />
                </div>
                <span style={{ fontSize: 12, color: '#fff' }}>Share</span>
              </button>

              {post.price > 0 && (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(212,160,23,0.5)' }}>
                  <Lock size={18} color="#D4A017" />
                </div>
              )}
            </div>

            {/* Slide counter */}
            <div style={{ position: 'absolute', top: 60, right: 16, background: 'rgba(0,0,0,0.5)', borderRadius: 50, padding: '4px 10px', fontSize: 11, color: '#888' }}>
              {i + 1}/{posts.length}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
      <WhatsAppButton />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }`}</style>
    </div>
  )
}
