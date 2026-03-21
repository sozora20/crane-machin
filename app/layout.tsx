import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grab-a-Prize | Claw Machine',
  description: 'Управляй краном и выигрывай призы!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  )
}
