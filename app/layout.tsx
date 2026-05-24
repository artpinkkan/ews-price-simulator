import type { Metadata } from 'next'
import { Sora, DM_Mono } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'eWS Pricing Simulator — Kalbe Group',
  description: 'AMC-based per-scale pricing model for the Electronic Weighing System rollout across Kalbe Group sites.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
