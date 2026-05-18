import type { Metadata } from 'next'
import './globals.css'
import PageTracker from '@/components/PageTracker'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: "GUN X – South Africa's Premier Firearms Classifieds",
  description: 'The cleanest classified portal for licensed firearms in South Africa.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden flex flex-col min-h-screen">
        <PageTracker />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}