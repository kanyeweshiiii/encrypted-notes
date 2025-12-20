'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import NoteCard from '@/components/NoteCard'
import { useRouter } from 'next/navigation'

const NOTES_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_NOTES_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const NOTES_ABI = [
  'function getUserNotes(address user) external view returns (tuple(address owner, string title, bytes32 encryptedContent, string tags, bool isFavourite, uint256 createdAt, uint256 updatedAt, bool exists)[])',
]

interface Note {
  owner: string
  title: string
  encryptedContent: string
  tags: string
  isFavourite: boolean
  createdAt: number
  updatedAt: number
  exists: boolean
}

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [relayerInstance, setRelayerInstance] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (typeof global === 'undefined') {
        (window as any).global = globalThis
      }
      initRelayer()
    }
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      loadNotes()
    }
  }, [isConnected, address])

  // initialize relayer for encryption/decryption
  const initRelayer = async () => {
    try {
      const relayerModule = await import('@zama-fhe/relayer-sdk/web')
      const sdkInitialized = await relayerModule.initSDK()
      if (!sdkInitialized) {
        throw new Error('SDK init failed')
      }
      const instance = await relayerModule.createInstance(relayerModule.SepoliaConfig)
      setRelayerInstance(instance)
    } catch (err) {
      console.log('Failed to init relayer')
    }
  }

  // load all user notes from blockchain
  const loadNotes = async () => {
    if (!address) return

    setLoading(true)
    try {
      const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org')
      const contract = new ethers.Contract(NOTES_CONTRACT_ADDRESS, NOTES_ABI, provider)
      
      // get all user notes
      const userNotes = await contract.getUserNotes(address)
      const notesList: Note[] = userNotes
        .map((note: any) => ({
          owner: note.owner,
          title: note.title,
          encryptedContent: note.encryptedContent,
          tags: note.tags,
          isFavourite: note.isFavourite,
          createdAt: Number(note.createdAt),
          updatedAt: Number(note.updatedAt),
          exists: note.exists,
        }))
        .filter((note: Note) => note.exists) // filter deleted ones
        .sort((a: Note, b: Note) => b.updatedAt - a.updatedAt) // sort by update date

      setNotes(notesList)
    } catch (err) {
      console.error('Failed to load notes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (noteId: number) => {
    router.push(`/create?id=${noteId}`)
  }

  const handleDelete = () => {
    loadNotes()
  }

  const handleToggleFavourite = () => {
    loadNotes()
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">Connect your wallet to see your notes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-gray-900">
          All Notes
        </h1>

        {loading ? (
          <div className="text-center p-8">
            <p className="text-gray-600">Loading notes...</p>
          </div>
        ) : (
          <>
            {notes.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-4">No notes yet. Create your first note!</p>
                <button
                  onClick={() => router.push('/create')}
                  className="px-6 py-3 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Create Note
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note, idx) => (
                  <NoteCard
                    key={idx}
                    note={note}
                    noteId={idx}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleFavourite={handleToggleFavourite}
                    relayerInstance={relayerInstance}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

