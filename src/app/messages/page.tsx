'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Phone, Check, CheckCheck, ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { db, auth } from '@/lib/firebase'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, limit
} from 'firebase/firestore'

const BottomNav = dynamic(() => import('@/components/ui/BottomNav'), { ssr: false })

const CONV_ID  = 'support'
const ADMIN_ID = 'admin_ken_media'
const WA       = process.env.NEXT_PUBLIC_WHATSAPP || '0772799672'

const WELCOME = {
  id: 'w0', senderId: ADMIN_ID,
  text: '👋 Hello! Welcome to *Ken Media Creative Studio*.\n\nWe offer:\n🎨 Logo Design from K150\n📰 Flyers from K80\n🎬 Motion Posters from K250\n🌐 Websites from K800\n\nHow can we help you today?',
  createdAt: { toDate: () => new Date(Date.now() - 7200000) }, read: true, pending: false,
}

const AUTO_REPLIES = [
  `Great question! 😊 Our team will respond within 1 hour.\n\nFor urgent help: WhatsApp ${WA}`,
  `Thanks for reaching out! 🔥 We love working with new clients. Checking your message now...`,
  `Understood! We'll prepare something amazing for you. ✨\n\nYou can also reach us directly: ${WA}`,
  `Perfect timing! Ken is available right now. Preparing a detailed response...`,
  `Noted! 📝 Our creative team is reviewing your request. We'll follow up shortly on WhatsApp too.`,
]

export default function MessagesPage() {
  const user = auth.currentUser
  const [messages, setMessages] = useState<any[]>([WELCOME])
  const [text, setText]         = useState('')
  const [typing, setTyping]     = useState(false)
  const [sending, setSending]   = useState(false)
  const [file, setFile]         = useState<File | null>(null)
  const endRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Real-time messages
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'messages', CONV_ID, 'chats'),
      orderBy('createdAt', 'asc'),
      limit(100)
    )
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data(), pending: false }))
      setMessages(msgs.length > 0 ? msgs : [WELCOME])
    }, () => {})
    return () => unsub()
  }, [user])

  useEffect(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [messages, typing])

  const handleSend = async () => {
    const msg = text.trim()
    if (!msg && !file) return
    if (!user) { toast.error('Sign in to send messages'); return }

    const optimistic = {
      id: `opt_${Date.now()}`, senderId: user.uid,
      text: msg, createdAt: { toDate: () => new Date() },
      read: false, pending: true,
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    setFile(null)
    setSending(true)
    inputRef.current?.focus()

    try {
      await addDoc(collection(db, 'messages', CONV_ID, 'chats'), {
        senderId:   user.uid,
        receiverId: ADMIN_ID,
        senderName: user.displayName || 'Customer',
        text:       msg,
        read:       false,
        createdAt:  serverTimestamp(),
      })

      // Auto-reply simulation
      setTimeout(() => setTyping(true), 1200)
      setTimeout(() => {
        setTyping(false)
        const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)]
        setMessages(prev => [...prev, {
          id: `ar_${Date.now()}`, senderId: ADMIN_ID,
          text: reply, createdAt: { toDate: () => new Date() },
          read: true, pending: false,
        }])
      }, 3000 + Math.random() * 2000)
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const fmt = (ts: any) => {
    try { return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
  }

  const isMe = (msg: any) => user && msg.senderId === user.uid

  return (
    <div style={{ height: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '100dvh' }}>

      {/* Header */}
      <div style={{ background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, WebkitUserSelect: 'none' }}>
        <Link href="/" style={{ color: '#D4A017', textDecoration: 'none', display: 'flex', alignItems: 'center', padding: 4 }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: 15 }}>K</div>
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, background: '#25D366', borderRadius: '50%', border: '2px solid #1a1a1a' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>Ken Media Studio 👑</p>
          <p style={{ fontSize: 11, color: '#25D366' }}>Online • Replies in minutes</p>
        </div>
        <a href={`https://wa.me/260${WA.replace(/^0/,'')}?text=${encodeURIComponent("Hello Ken Media! I'd like to inquire.")}`}
          target="_blank" rel="noreferrer"
          style={{ width: 38, height: 38, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px', WebkitOverflowScrolling: 'touch', background: '#0d1117', backgroundImage: 'radial-gradient(rgba(212,160,23,0.025) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>

        {!user && (
          <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#D4A017' }}>
              <a href="/auth/login" style={{ color: '#D4A017', fontWeight: 700 }}>Sign in</a> to send messages · or <a href={`https://wa.me/260${WA.replace(/^0/,'')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', fontWeight: 700 }}>WhatsApp us directly</a>
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: '3px 12px', fontSize: 11, color: '#888' }}>Today</span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const mine = isMe(msg)
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
                <div style={{ maxWidth: '80%' }}>
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: mine ? 'linear-gradient(135deg,#D4A017,#c49015)' : '#1e2430',
                    color: mine ? '#000' : '#F0EDE6',
                    fontSize: 14, lineHeight: 1.55,
                    fontWeight: mine ? 500 : 400,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, justifyContent: mine ? 'flex-end' : 'flex-start', padding: mine ? '0 4px 0 0' : '0 0 0 4px' }}>
                    <span style={{ fontSize: 10, color: '#555' }}>{fmt(msg.createdAt)}</span>
                    {mine && (
                      msg.pending
                        ? <Check size={12} color="#555" />
                        : <CheckCheck size={12} color="#D4A017" />
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
              <div style={{ background: '#1e2430', borderRadius: '18px 18px 18px 4px', padding: '10px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, background: '#D4A017', borderRadius: '50%', animation: 'bounce 1.4s infinite', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>

      {/* Input — fixed at bottom, above keyboard */}
      <div style={{ background: '#1a1a1a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', flexShrink: 0, paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {file && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2a2a2a', borderRadius: 8, padding: '6px 10px', marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>📎</span>
            <span style={{ fontSize: 11, color: '#D4A017', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            <button type="button" onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16, padding: 2 }}>✕</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <label style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Paperclip size={18} color="#888" />
            <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>

          <textarea
            ref={inputRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKey}
            placeholder={user ? 'Type a message...' : 'Sign in to chat...'}
            disabled={!user}
            rows={1}
            style={{ flex: 1, background: '#2a2a2a', border: 'none', borderRadius: 22, padding: '10px 16px', color: '#F0EDE6', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, maxHeight: 120, WebkitAppearance: 'none', overflowY: 'auto' }}
          />

          <button onClick={handleSend} disabled={(!text.trim() && !file) || !user || sending}
            style={{ width: 42, height: 42, borderRadius: '50%', background: (text.trim() || file) && user ? '#25D366' : 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
            <Send size={18} color={(text.trim() || file) && user ? '#fff' : '#444'} />
          </button>
        </div>
        <p style={{ fontSize: 10, color: '#333', textAlign: 'center', marginTop: 5 }}>
          Direct WhatsApp: <a href={`https://wa.me/260${WA.replace(/^0/,'')}`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>{WA}</a>
        </p>
      </div>

      <BottomNav />
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-6px);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
