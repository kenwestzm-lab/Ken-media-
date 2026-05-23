'use client'
// src/components/ui/BottomNav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Zap, ShoppingBag, MessageCircle, Crown } from 'lucide-react'
import useStore from '@/store/useStore'

const navItems = [
  { href: '/',         icon: Home,          label: 'Home'     },
  { href: '/services', icon: Zap,           label: 'Services' },
  { href: '/shop',     icon: ShoppingBag,   label: 'Shop'     },
  { href: '/messages', icon: MessageCircle, label: 'Chat'     },
  { href: '/about',    icon: Crown,         label: 'About'    },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { unreadCount } = useStore()

  // Don't show on admin or auth pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-dark/98 backdrop-blur-md border-t border-white/[0.08] safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          const hasUnread = label === 'Chat' && unreadCount > 0

          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[52px] ${
                isActive ? 'text-[#D4A017]' : 'text-[#555550]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px h-0.5 w-6 bg-gold-gradient rounded-full" />
              )}
              <span className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {hasUnread && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#D4A017] rounded-full text-black text-[8px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-[#D4A017]' : 'text-[#555550]'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
