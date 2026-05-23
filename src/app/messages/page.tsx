'use client'
// src/app/messages/page.tsx
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Phone } from 'lucide-react'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import { subscribeToMessages, sendMessage } from '@/lib/firestore'
import useStore from '@/store/useStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const ADMIN_UID = 'admin'
const ADMIN_CONV_ID = 'support'

const INITIAL_MESSAGES = [
  { id: 'w1', senderId: ADMIN_UID, text: '👋 Hello! Welcome to Ken Media Creative Studio. How can we help you today?', createdAt: { toDate: () => new Date(Date.now() - 3600000) }, read: true },
]

export default function MessagesPage() {
  const { user } = useStore()
  const [messages, setMessages] = useState<any[]>(INITIAL_MESSAGES)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToMessages(ADMIN_CONV_ID, (msgs) => {
      if (msgs.length > 0) setMessages([...INITIAL_MESSAGES, ...msgs])
    })
    return () => unsub()
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const handleSend = async () => {
    if (!text.trim()) return
    if (!user) { toast.error('Sign in to send messages'); return }

    const msgText = text.trim()
    setText('')
    setSending(true)

    // Optimistic UI
    const optimistic = {
      id: 'opt-' + Date.now(),
      senderId: user.uid,
      text: msgText,
      createdAt: { toDate: () => new Date() },
      read: false,
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      await sendMessage(ADMIN_CONV_ID, {
        senderId: user.uid,
        receiverId: ADMIN_UID,
        senderName: user.displayName,
        text: msgText,
        read: false,
      })
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }

    // Simulate admin typing & reply (demo mode)
    setTimeout(() => setTyping(true), 1000)
    const replies = [
      '✅ Got it! We\'ll get back to you shortly.',
      '🎨 Thanks for reaching out! Our team will assist you soon.',
      '⚡ Message received! Expect a response within 1-2 hours.',
      '👑 Great question! Let me check that for you.',
      'Perfect! We love working with new clients. Let\'s create something amazing 🚀',
    ]
    setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, {
        id: 'reply-' + Date.now(),
        senderId: ADMIN_UID,
        text: replies[Math.floor(Math.random() * replies.length)],
        createdAt: { toDate: () => new Date() },
        read: true,
      }])
    }, 2500 + Math.random() * 1500)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatTime = (ts: any) => {
    try {
      return format(ts.toDate(), 'HH:mm')
    } catch { return '' }
  }

  return (
    <div className="h-screen bg-dark flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-[#111] flex-shrink-0">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center font-bold text-black text-sm">KM</div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#111]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold">Ken Media Studio 👑</h3>
          <p className="text-[11px] text-green-400">Online · Usually replies in minutes</p>
        </div>
        <a href={`tel:+260${(process.env.NEXT_PUBLIC_WHATSAPP || '0772799672').replace(/^0/,'')}`} className="p-2 rounded-full bg-white/[0.06] text-[#D4A017]">
          <Phone size={16} />
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ overflowAnchor: 'auto' }}>
        {!user && (
          <div className="text-center py-4">
            <div className="bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] rounded-xl px-4 py-3 text-xs text-[#D4A017]">
              Sign in to send messages and get personalized support
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = user && msg.senderId === user.uid
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-gold-gradient text-black font-medium rounded-br-sm'
                    : 'bg-[#1a1a1a] border border-white/[0.08] rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className={`text-[10px] text-[#88887f] mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </motion.div>
          )
        })}

        {/* Typing indicator */}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.08] bg-dark flex-shrink-0 pb-safe-bottom" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2 items-end">
          <button className="p-2.5 rounded-full bg-white/[0.06] text-[#88887f] flex-shrink-0">
            <Paperclip size={17} />
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={user ? 'Type a message...' : 'Sign in to chat...'}
            disabled={!user}
            rows={1}
            className="flex-1 bg-[#1a1a1a] border border-white/[0.08] focus:border-[rgba(212,160,23,0.4)] rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-[#88887f] outline-none resize-none max-h-28 disabled:opacity-50 transition-colors"
            style={{ minHeight: 42 }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || !user || sending}
            className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-black flex-shrink-0 disabled:opacity-40 transition-all active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-[#88887f] text-center mt-2">
          WhatsApp: {process.env.NEXT_PUBLIC_WHATSAPP || '0772799672'}
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
