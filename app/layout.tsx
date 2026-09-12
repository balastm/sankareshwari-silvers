import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sankareshwari Silvers',
  description: 'Elegant silver jewellery with live silver-rate pricing.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>
}
