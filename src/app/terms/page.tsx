// src/app/terms/page.tsx
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import Footer from '@/components/ui/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="px-4 pt-8 pb-28 max-w-2xl mx-auto">
        <h1 className="font-bebas text-5xl tracking-wider mb-2">TERMS OF <span className="text-gold-gradient">SERVICE</span></h1>
        <p className="text-xs text-[#88887f] mb-8">Last updated: January 2025</p>
        {[
          { title: '1. Services', body: 'Ken Media Creative Studio provides graphic design, branding, motion graphics, and digital services. All work is subject to review and approval before delivery.' },
          { title: '2. Payment Policy', body: 'All payments must be made via the approved methods (Airtel Money, MTN Money, or Access Bank). Downloads are locked until payment is verified by our admin team. We do not release files without confirmed payment.' },
          { title: '3. Refund Policy', body: 'Refunds are considered on a case-by-case basis. If work has not started, a full refund is available. Once work is in progress, partial refunds may apply at our discretion.' },
          { title: '4. Intellectual Property', body: 'Upon full payment, the client receives full rights to the delivered design files. Ken Media retains the right to display completed work in our portfolio unless otherwise agreed.' },
          { title: '5. Revisions', body: 'Each service includes a specified number of revisions. Additional revisions are charged separately. Revision requests must be submitted within 7 days of delivery.' },
          { title: '6. Watermarks & Previews', body: 'All preview images displayed on this platform are watermarked for protection. Full high-resolution files are only delivered after payment approval.' },
          { title: '7. Content Responsibility', body: 'Clients are responsible for ensuring all content provided (text, images, logos) does not infringe on copyright or other rights. Ken Media is not liable for client-supplied content.' },
          { title: '8. Contact', body: 'For questions about these terms, contact us via WhatsApp: 0772799672 or through our contact page.' },
        ].map(s => (
          <div key={s.title} className="mb-6">
            <h2 className="font-syne text-sm font-bold text-[#D4A017] mb-2">{s.title}</h2>
            <p className="text-sm text-[#88887f] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
      <Footer />
      <BottomNav />
    </div>
  )
}
