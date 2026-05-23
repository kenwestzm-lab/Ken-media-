// src/components/ui/Footer.tsx
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-5 pt-8 pb-6 mt-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-5">
          <div className="font-bebas text-2xl tracking-[3px] text-gold-gradient mb-1">KEN MEDIA</div>
          <div className="text-[10px] tracking-[4px] text-[#88887f] uppercase mb-3">Creative Studio · Lusaka, Zambia</div>
          <p className="text-xs text-[#666] leading-relaxed max-w-xs">
            Transforming African businesses through world-class design, motion graphics & digital innovation.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
          <div>
            <h4 className="font-semibold text-[#D4A017] mb-2 tracking-wider uppercase text-[10px]">Services</h4>
            {['Logo Design', 'Flyer Design', 'Motion Poster', 'Branding', 'Website Design', 'Video Ads'].map(s => (
              <Link key={s} href="/services" className="block text-[#88887f] hover:text-[#D4A017] py-0.5 transition-colors">{s}</Link>
            ))}
          </div>
          <div>
            <h4 className="font-semibold text-[#D4A017] mb-2 tracking-wider uppercase text-[10px]">Company</h4>
            {[
              { label: 'About Us', href: '/about' },
              { label: 'Portfolio', href: '/portfolio' },
              { label: 'Shop', href: '/shop' },
              { label: 'Contact', href: '/contact' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="block text-[#88887f] hover:text-[#D4A017] py-0.5 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <div className="text-[10px] text-[#88887f] mb-2 uppercase tracking-wider">Payment Methods</div>
          <div className="flex flex-wrap gap-2 text-[10px] text-[#D4A017] mb-4">
            <span className="bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] px-2 py-1 rounded-md">📶 Airtel Money</span>
            <span className="bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] px-2 py-1 rounded-md">📡 MTN Money</span>
            <span className="bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] px-2 py-1 rounded-md">🏦 Access Bank</span>
          </div>
          <p className="text-[10px] text-[#555] text-center">
            © {new Date().getFullYear()} Ken Media Creative Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
