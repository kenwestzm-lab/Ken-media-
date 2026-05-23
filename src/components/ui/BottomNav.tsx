'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Zap, Play, ShoppingBag, MessageCircle } from 'lucide-react'
import useStore from '@/store/useStore'

const navItems = [
  { href: '/',        icon: Home,          label: 'Home'    },
  { href: '/services',icon: Zap,           label: 'Services'},
  { href: '/explore', icon: Play,          label: 'Explore' },
  { href: '/shop',    icon: ShoppingBag,   label: 'Shop'    },
  { href: '/messages',icon: MessageCircle, label: 'Chat'    },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { unreadCount } = useStore()
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(8,8,8,0.98)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 60, padding: '0 8px' }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          const hasUnread = label === 'Chat' && unreadCount > 0
          return (
            <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 4px', textDecoration: 'none', WebkitTapHighlightColor: 'transparent', position: 'relative' }}>
              {isActive && <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', height: 2, width: 24, background: 'linear-gradient(90deg,#D4A017,#F5C842)', borderRadius: 2 }} />}
              <span style={{ position: 'relative' }}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? '#D4A017' : '#555'} />
                {hasUnread && <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#D4A017', borderRadius: '50%', fontSize: 8, fontWeight: 700, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
              </span>
              <span style={{ fontSize: 10, color: isActive ? '#D4A017' : '#555', fontWeight: isActive ? 600 : 400 }}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
