import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FHE Diary | Private Notes on Blockchain',
  description: 'Create, edit, and manage your encrypted notes on blockchain with FHE technology.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof global === 'undefined') {
                window.global = globalThis;
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <Providers>
          <Navigation />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  )
}

