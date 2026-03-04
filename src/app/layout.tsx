import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "GUN X – South Africa's Premier Firearms Classifieds",
  description: 'The cleanest classified portal for licensed firearms in South Africa.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
