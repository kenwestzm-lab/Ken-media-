'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Phone, Video, MoreVertical, ArrowLeft, Check, CheckCheck } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { db, auth } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'

const BottomNav = dynamic(() => import('@/components/ui/BottomNav'), { ssr: false })

const CONV_ID = 'support'
const ADMIN_UID = 'admin'

const WELCOME = {
  id: 'welcome',
  senderId: ADMIN_UID,
  text: '👋 Hello! Welcome to Ken Media Creative Studio. How can we help you today?\n\nServices: Logo Design, Flyers, Branding, Motion Posters, Websites & more.',
  createdAt: { toDate: () => new Date(Date.now() - 3600000) },
  read: true,
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([WELCOME])
  const [text, setText]         = useState('')
  const [typing, setTyping]     = useState(false)
  const [sending, setSending]   = useState(false)
  const [file, setFile]         = useState<File | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const user = auth.currentUser
  const wa = process.env.NEXT_PUBLIC_WHATSAPP || '0772799672'

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'messages', CONV_ID, 'chats'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(msgs.length > 0 ? msgs : [WELCOME])
    }, () => {})
    return () => unsub()
  }, [user])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const handleSend = async () => {
    const msg = text.trim()
    if (!msg && !file) return
    if (!user) { toast.error('Sign in to send messages'); return }

    const optimistic = {
      id: 'opt-' + Date.now(),
      senderId: user.uid,
      text: msg,
      createdAt: { toDate: () => new Date() },
      read: false,
      pending: true,
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    setSending(true)

    try {
      await addDoc(collection(db, 'messages', CONV_ID, 'chats'), {
        senderId: user.uid,
        receiverId: ADMIN_UID,
        senderName: user.displayName || 'Customer',
        text: msg,
        read: false,
        createdAt: serverTimestamp(),
      })

      // Auto-reply after 2-4 seconds
      setTimeout(() => setTyping(true), 1500)
      const replies = [
        `Thanks for reaching out! 😊 We'll respond shortly.\n\nOr chat us on WhatsApp: ${wa}`,
        '✅ Got it! Our team will get back to you within the hour.',
        `Great! For faster response, WhatsApp us directly: 0${wa}`,
        '🎨 We love hearing from clients! Preparing a response...',
        `Perfect! You can also reach us on WhatsApp: ${wa} for immediate help.`,
      ]
      setTimeout(() => {
        setTyping(false)
        setMessages(prev => [...prev, {
          id: 'auto-' + Date.now(),
          senderId: ADMIN_UID,
          text: replies[Math.floor(Math.random() * replies.length)],
          createdAt: { toDate: () => new Date() },
          read: true,
        }])
      }, 3000 + Math.random() * 2000)
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatTime = (ts: any) => {
    try { return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
  }

  const isMe = (msg: any) => user && msg.senderId === user.uid

  return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* WhatsApp-style header */}
      <div style={{ background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: 14 }}>KM</div>
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, background: '#25D366', borderRadius: '50%', border: '2px solid #1a1a1a' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700 }}>Ken Media Studio 👑</p>
          <p style={{ fontSize: 11, color: '#25D366' }}>Online • Usually replies in minutes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`tel:+260${wa.replace(/^0/,'')}`} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A017', textDecoration: 'none' }}>
            <Phone size={16} />
          </a>
          <a href={`https://wa.me/260${wa.replace(/^0/,'')}?text=${encodeURIComponent("Hello Ken Media! I'd like to inquire about your services.")}`} target="_blank" rel="noreferrer"
            style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
        </div>
      </div>

      {/* WhatsApp background pattern */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', background: '#0d1117', backgroundImage: 'radial-gradient(rgba(212,160,23,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        {!user && (
          <div style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#D4A017', textAlign: 'center' }}>
            <a href="/auth/login" style={{ color: '#D4A017', fontWeight: 700 }}>Sign in</a> to send messages & get personalized support
          </div>
        )}

        {/* Date divider */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 50, padding: '3px 10px', fontSize: 11, color: '#888' }}>Today</span>
        </div>

        {messages.map((msg, i) => {
          const mine = isMe(msg)
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  padding: '8px 12px',
                  borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: mine ? 'linear-gradient(135deg,#D4A017,#c49015)' : '#1e2128',
                  color: mine ? '#000' : '#F0EDE6',
                  fontSize: 14,
                  lineHeight: 1.5,
                  fontWeight: mine ? 500 : 400,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  whiteSpace: 'pre-line',
                }}>
                  {msg.text}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, justifyContent: mine ? 'flex-end' : 'flex-start', paddingRight: mine ? 4 : 0, paddingLeft: mine ? 0 : 4 }}>
                  <span style={{ fontSize: 10, color: '#555' }}>{formatTime(msg.createdAt)}</span>
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

        {typing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
            <div style={{ background: '#1e2128', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input bar — WhatsApp style */}
      <div style={{ background: '#1a1a1a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', flexShrink: 0, paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <label style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Paperclip size={18} color="#888" />
            <input type="file" accept="image/*,video/*,audio/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={user ? 'Type a message...' : 'Sign in to chat...'}
            disabled={!user}
            rows={1}
            style={{ flex: 1, background: '#2a2a2a', border: 'none', borderRadius: 24, padding: '10px 16px', color: '#F0EDE6', fontSize: 14, outline: 'none', resize: 'none', maxHeight: 100, fontFamily: 'inherit', lineHeight: 1.4 }}
          />
          <button onClick={handleSend} disabled={!text.trim() || !user || sending}
            style={{ width: 42, height: 42, borderRadius: '50%', background: text.trim() && user ? '#25D366' : 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
            <Send size={18} color={text.trim() && user ? '#fff' : '#555'} />
          </button>
        </div>

        {file && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, background: '#2a2a2a', borderRadius: 8, padding: '6px 10px' }}>
            <span style={{ fontSize: 18 }}>📎</span>
            <span style={{ fontSize: 11, color: '#D4A017', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
        )}

        <p style={{ fontSize: 10, color: '#444', textAlign: 'center', marginTop: 4 }}>
          WhatsApp: {wa} • 
          <a href={`https://wa.me/260${wa.replace(/^0/,'')}?text=Hello Ken Media!`} target="_blank" rel="noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}> Chat directly →</a>
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
