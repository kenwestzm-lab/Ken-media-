'use client'
// src/components/ui/CEOCard.tsx
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function CEOCard() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP || '0772799672'
  const fbUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/DjTizzyBeats'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#1a1a1a] border border-[rgba(212,160,23,0.2)] rounded-2xl overflow-hidden"
    >
      {/* Gold banner */}
      <div className="h-20 bg-gradient-to-r from-[#1a1200] via-[#2d1f00] to-[#1a1200] relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg,rgba(212,160,23,0.06) 0px,rgba(212,160,23,0.06) 1px,transparent 1px,transparent 22px)',
          }}
        />
        {/* Crown icon top-right */}
        <div className="absolute top-3 right-4 text-2xl opacity-40">👑</div>
      </div>

      {/* Avatar overlapping banner */}
      <div className="flex flex-col items-center -mt-10 pb-5 px-5">
        <div className="w-20 h-20 rounded-full border-[3px] border-[#D4A017] overflow-hidden bg-[#222] shadow-lg shadow-black/60 mb-3">
          <Image
            src="/ken-west-ceo.png"
            alt="Ken West – CEO & Founder of Ken Media Creative Studio"
            width={80}
            height={80}
            className="w-full h-full object-cover"
            priority
            onError={(e) => {
              // Fallback if image not available
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-[#D4A017] to-[#F5C842]">👑</div>'
            }}
          />
        </div>

        <h3 className="font-bebas text-2xl tracking-[3px] leading-none mb-0.5">KEN WEST</h3>
        <p className="text-[11px] text-[#D4A017] tracking-[3px] uppercase mb-1">
          Founder & Creative Director
        </p>
        <p className="text-[11px] text-[#88887f] mb-3">
          Ken Media Creative Studio · Lusaka, Zambia 🇿🇲
        </p>

        <p className="text-[12px] text-[#88887f] text-center leading-relaxed mb-4 max-w-xs">
          Passionate creative professional transforming African businesses through world-class design,
          motion graphics & digital innovation. Based in Zambia, serving clients across Africa.
        </p>

        <div className="flex gap-3 w-full">
          <a
            href={`https://wa.me/260${waNumber.replace(/^0/, '')}?text=${encodeURIComponent("Hello Ken! I'd love to work with you.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-gold py-2.5 rounded-xl text-xs font-bold text-center"
          >
            📱 WhatsApp
          </a>
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-ghost-gold py-2.5 rounded-xl text-xs font-medium text-center"
          >
            📘 Facebook
          </a>
        </div>
      </div>
    </motion.div>
  )
}
