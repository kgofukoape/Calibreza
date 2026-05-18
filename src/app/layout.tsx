import type { Metadata } from 'next'
import './globals.css'
import { Suspense } from 'react'
import FloatingAdvisor from '@/components/FloatingAdvisor'

export const metadata: Metadata = {
  title: "GUN X – South Africa's Premier Firearms Classifieds",
  description: 'The cleanest classified portal for licensed firearms in South Africa.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-x-hidden">
        {children}
        <Suspense fallback={null}>
          <FloatingAdvisor />
        </Suspense>
      </body>
    </html>
  )
}
