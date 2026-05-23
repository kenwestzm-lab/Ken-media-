// src/app/privacy/page.tsx
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import Footer from '@/components/ui/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <div className="px-4 pt-8 pb-28 max-w-2xl mx-auto">
        <h1 className="font-bebas text-5xl tracking-wider mb-2">PRIVACY <span className="text-gold-gradient">POLICY</span></h1>
        <p className="text-xs text-[#88887f] mb-8">Last updated: January 2025</p>
        {[
          { title: 'Information We Collect', body: 'We collect: name, email, phone number, payment references, and order details when you register or place an order. We also collect usage data to improve our platform.' },
          { title: 'How We Use Your Information', body: 'Your information is used to process orders, communicate about your projects, send notifications, and improve our services. We do not sell your personal data to third parties.' },
          { title: 'Payment Data', body: 'Payment proof images are stored securely and only accessible to our admin team for verification purposes. We do not store full payment account credentials.' },
          { title: 'Firebase & Third-Party Services', body: 'We use Firebase (Google) for authentication and data storage. Their privacy policies apply. We may also use analytics tools to understand platform usage.' },
          { title: 'Data Security', body: 'We implement security measures including Firebase security rules, encrypted connections, and access controls. However, no system is 100% secure, and we encourage strong passwords.' },
          { title: 'Your Rights', body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us. You can delete your account from your dashboard settings.' },
          { title: 'Contact', body: 'For privacy concerns, contact us at: WhatsApp 0772799672 or via our contact page.' },
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
