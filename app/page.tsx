'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="text-center max-w-2xl">
        <div className="mb-6 inline-block">
          <div className="text-6xl mb-4">📔</div>
        </div>
        <h1 className="text-5xl font-semibold mb-4 text-gray-900">
          FHE Diary
        </h1>
        <p className="text-lg mb-8 text-gray-600">Your private notes secured on blockchain with Fully Homomorphic Encryption</p>
        <button
          onClick={() => router.push('/home')}
          className="px-6 py-3 bg-gray-900 text-white rounded-md font-medium text-base hover:bg-gray-800 transition-colors shadow-sm"
        >
          Get Started →
        </button>
      </div>
    </div>
  )
}

