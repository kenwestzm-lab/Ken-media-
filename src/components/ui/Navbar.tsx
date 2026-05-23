'use client'
// src/components/ui/Navbar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, MessageCircle, User, Menu, X, Crown } from 'lucide-react'
import useStore from '@/store/useStore'
import { logout } from '@/lib/auth'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, unreadCount, isMenuOpen, setMenuOpen } = useStore()
  const pathname = usePathname()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    setShowUserMenu(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-dark/95 backdrop-blur-md border-b border-white/[0.08]">
      <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-bebas text-xl tracking-[3px] text-gold-gradient">
            KEN MEDIA
          </span>
          <span className="text-[8px] tracking-[4px] text-[#88887f] uppercase">
            Creative Studio · ZM
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-full px-2 py-1.5">
          {[
            { href: '/', label: 'Home' },
            { href: '/explore', label: 'Explore' },
            { href: '/services', label: 'Services' },
            { href: '/shop', label: 'Shop' },
            { href: '/portfolio', label: 'Portfolio' },
            { href: '/about', label: 'About' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? 'bg-gold-gradient text-black font-bold'
                  : 'text-[#88887f] hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/messages" className="relative p-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#D4A017]">
                <MessageCircle size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full text-black text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-black font-bold text-sm"
                >
                  {user.displayName?.[0]?.toUpperCase() || 'U'}
                </button>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-10 w-44 bg-[#1a1a1a] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl"
                  >
                    <div className="px-4 py-3 border-b border-white/[0.08]">
                      <p className="text-sm font-semibold truncate">{user.displayName}</p>
                      <p className="text-xs text-[#88887f] truncate">{user.email}</p>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors" onClick={() => setShowUserMenu(false)}>
                      <User size={14} /> My Dashboard
                    </Link>
                    <Link href="/track" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors" onClick={() => setShowUserMenu(false)}>
                      📍 Track Order
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#D4A017] hover:bg-gold/10 transition-colors" onClick={() => setShowUserMenu(false)}>
                        <Crown size={14} /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.05] transition-colors border-t border-white/[0.08]">
                      🚪 Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="btn-gold px-4 py-2 rounded-full text-sm font-bold"
            >
              Sign In
            </Link>
          )}
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-[#88887f]"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.nav
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="md:hidden border-t border-white/[0.08] bg-[#111]"
        >
          {[
            { href: '/', label: '🏠 Home' },
            { href: '/explore', label: '🔍 Explore' },
            { href: '/services', label: '⚡ Services' },
            { href: '/shop', label: '🛍 Shop' },
            { href: '/portfolio', label: '🎨 Portfolio' },
            { href: '/about', label: '👑 About' },
            { href: '/contact', label: '💬 Contact' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center px-6 py-3.5 text-sm border-b border-white/[0.05] transition-colors ${
                pathname === link.href ? 'text-[#D4A017] font-semibold' : 'text-[#88887f]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </motion.nav>
      )}
    </header>
  )
}
