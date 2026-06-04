import type { Metadata, Viewport } from 'next'
import { Outfit, Bebas_Neue } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bebas',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Anikumo — Watch Anime Online Free',
  description: 'Stream anime, read manga, and discover anime music on Anikumo. Free HD streaming with sub and dub options.',
  keywords: ['anime', 'manga', 'streaming', 'watch anime', 'anime music', 'anikumo'],
}

export const viewport: Viewport = {
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${bebasNeue.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
