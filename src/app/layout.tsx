// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import AuthProvider from '@/components/auth/AuthProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: "Ken Media Creative Studio | Zambia's #1 Creative Agency",
  description: 'Premium logo design, motion posters, branding, video ads and digital services crafted for African businesses. Based in Lusaka, Zambia.',
  keywords: ['graphic design Zambia', 'logo design Lusaka', 'branding Zambia', 'motion graphics', 'Ken Media Creative Studio'],
  authors: [{ name: 'Ken West' }],
  creator: 'Ken Media Creative Studio',
  openGraph: {
    type: 'website',
    locale: 'en_ZM',
    siteName: 'Ken Media Creative Studio',
    title: "Ken Media Creative Studio | Zambia's #1 Creative Agency",
    description: 'Premium creative services for African businesses.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#D4A017',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-dark text-white antialiased overflow-x-hidden">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#1a1a1a', color: '#F0EDE6', border: '1px solid rgba(212,160,23,0.3)', borderRadius: '12px', fontFamily: "'DM Sans', sans-serif" },
              success: { iconTheme: { primary: '#D4A017', secondary: '#000' } },
              error:   { iconTheme: { primary: '#E74C3C', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
