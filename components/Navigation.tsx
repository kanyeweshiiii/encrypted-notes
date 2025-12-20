'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center text-xl font-semibold rounded bg-gray-100 border border-gray-300">
            📔
          </div>
          <span className="text-xl font-semibold text-gray-900">
            FHE Diary
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/home"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/home'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Home
          </Link>
          <Link
            href="/create"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/create'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Create
          </Link>
          <Link
            href="/favourites"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/favourites'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Favourites
          </Link>
        </nav>

        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}

