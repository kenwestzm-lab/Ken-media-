'use client'
import { motion } from 'framer-motion'

export default function CEOCard() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP || '0772799672'
  const fb = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/DjTizzyBeats'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ background: '#1a1a1a', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 20, overflow: 'hidden' }}>

      {/* Full CEO photo as banner */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: '#111' }}>
        <img
          src="/ken-west-ceo.png"
          alt="Ken West – CEO & Founder of Ken Media Creative Studio"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          onError={e => {
            const t = e.target as HTMLImageElement
            t.style.display = 'none'
            t.parentElement!.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:80px;background:linear-gradient(135deg,#1a1200,#2d1f00)">👑</div>'
          }}
        />
        {/* Gold gradient overlay at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(8,8,8,0.95), transparent)' }} />
        {/* Crown badge */}
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', borderRadius: 50, padding: '4px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          👑 <span style={{ fontSize: 10, color: '#D4A017', fontWeight: 700, letterSpacing: 1 }}>CEO</span>
        </div>
        {/* Name over photo */}
        <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
          <h3 style={{ fontFamily: 'serif', fontSize: 28, letterSpacing: 3, color: '#fff', lineHeight: 1, marginBottom: 2 }}>KEN WEST</h3>
          <p style={{ fontSize: 11, color: '#D4A017', letterSpacing: 3, textTransform: 'uppercase' }}>Founder & Creative Director</p>
        </div>
      </div>

      {/* Info section */}
      <div style={{ padding: '16px 16px 20px' }}>
        <p style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>Ken Media Creative Studio · Lusaka, Zambia 🇿🇲</p>
        <p style={{ fontSize: 13, color: '#88887f', lineHeight: 1.7, marginBottom: 16 }}>
          Passionate creative professional transforming African businesses through world-class design,
          motion graphics & digital innovation. Based in Zambia, serving clients across Africa.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={`https://wa.me/260${wa.replace(/^0/,'')}?text=${encodeURIComponent("Hello Ken! I'd love to work with you.")}`}
            target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, background: '#25D366', color: '#fff', fontWeight: 700, padding: '11px 0', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a href={fb} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, background: '#1877F2', color: '#fff', fontWeight: 700, padding: '11px 0', borderRadius: 12, textAlign: 'center', textDecoration: 'none', fontSize: 13 }}>
            📘 Facebook
          </a>
        </div>
      </div>
    </motion.div>
  )
}
