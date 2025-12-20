'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getSigner } from '@/lib/provider'

const NOTES_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_NOTES_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const NOTES_ABI = [
  'function deleteNote(uint256 noteId) external',
  'function toggleFavourite(uint256 noteId) external',
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

interface NoteCardProps {
  note: Note
  noteId: number
  onEdit: (noteId: number) => void
  onDelete: () => void
  onToggleFavourite: () => void
  relayerInstance: any
}

export default function NoteCard({ note, noteId, onEdit, onDelete, onToggleFavourite, relayerInstance }: NoteCardProps) {
  const { address, isConnected } = useAccount()
  const [decrypting, setDecrypting] = useState(false)
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const tags = note.tags ? note.tags.split(',').filter(t => t.trim()) : []

  const handleDecrypt = async () => {
    // safety checks first
    if (!relayerInstance || !note.encryptedContent || decryptedContent) return
    
    // wallet connected? no? go connect it then
    if (!address || !isConnected) {
      alert('Connect wallet to decrypt note')
      return
    }
    
    // is this your note? if not - don't touch other people's stuff
    if (note.owner.toLowerCase() !== address.toLowerCase()) {
      alert('You can only decrypt your own notes')
      return
    }
    
    setDecrypting(true)
    try {
      // convert bytes32 to Uint8Array (relayer likes this format)
      const handleBytes = ethers.getBytes(note.encryptedContent)
      
      // try public decrypt first (for old notes)
      try {
        const decryptedResult = await relayerInstance.publicDecrypt([handleBytes])
        
        // extract decrypted value from result
        const clearValues = decryptedResult.clearValues
        const handleKey = Object.keys(clearValues)[0]
        const decryptedNumber = clearValues[handleKey as `0x${string}`]
        
        // convert number back to string (bitwise magic)
        const num = BigInt(decryptedNumber as bigint)
        const bytes: number[] = []
        for (let i = 0; i < 4; i++) {
          const byte = Number((num >> BigInt(i * 8)) & BigInt(0xff))
          if (byte > 0) {
            bytes.push(byte)
          } else {
            break
          }
        }
        const decrypted = new TextDecoder().decode(new Uint8Array(bytes))
        setDecryptedContent(decrypted)
        return
      } catch (publicErr: any) {
        // public decrypt didn't work? means note is encrypted for specific user
        // need to use userDecrypt with signature
        const noteOwnerAddress = note.owner.toLowerCase()
        const currentAddress = address?.toLowerCase()
        
        // double check it's your note
        if (noteOwnerAddress !== currentAddress) {
          throw new Error('This is not your note, dude')
        }
        
        // generate keypair for decryption
        const keypair = relayerInstance.generateKeypair()
        
        // create EIP712 structure for signature (it's like permission to decrypt)
        const startTimestamp = Math.floor(Date.now() / 1000)
        const durationDays = 365  // permission lasts a year
        const eip712 = relayerInstance.createEIP712(
          keypair.publicKey,
          [NOTES_CONTRACT_ADDRESS],
          startTimestamp,
          durationDays
        )
        
        // check wallet exists
        if (!window.ethereum) {
          throw new Error('Wallet not found, install MetaMask')
        }
        
        // ask user to sign message (it's safe, just permission to decrypt)
        const signature = await window.ethereum.request({
          method: 'eth_signTypedData_v4',
          params: [address, JSON.stringify({
            domain: eip712.domain,
            primaryType: eip712.primaryType,
            types: eip712.types,
            message: eip712.message
          })]
        })
        
        // now decrypt using userDecrypt (only you can do this)
        const decryptedResult = await relayerInstance.userDecrypt(
          [{ handle: handleBytes, contractAddress: NOTES_CONTRACT_ADDRESS }],
          keypair.privateKey,
          keypair.publicKey,
          signature,
          [NOTES_CONTRACT_ADDRESS],
          address, // your address
          startTimestamp,
          durationDays
        )
        
        // extract decrypted value
        const handleKey = Object.keys(decryptedResult)[0]
        const decryptedNumber = decryptedResult[handleKey as `0x${string}`]
        
        // bitwise magic again - convert number to string
        const num = BigInt(decryptedNumber as bigint)
        const bytes: number[] = []
        for (let i = 0; i < 4; i++) {
          const byte = Number((num >> BigInt(i * 8)) & BigInt(0xff))
          if (byte > 0) {
            bytes.push(byte)
          } else {
            break
          }
        }
        const decrypted = new TextDecoder().decode(new Uint8Array(bytes))
        setDecryptedContent(decrypted)
      }
    } catch (err: any) {
      console.error('Decryption failed:', err)
      alert(`Failed to decrypt: ${err.message || 'Unknown error'}`)
    } finally {
      setDecrypting(false)
    }
  }

  const handleDelete = async () => {
    if (!isConnected || !address || !confirm('Are you sure you want to delete this note?')) return

    setDeleting(true)
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        if (chainId !== '0xaa36a7') {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      const signer = await getSigner()
      const contract = new ethers.Contract(NOTES_CONTRACT_ADDRESS, NOTES_ABI, signer)
      await contract.deleteNote(noteId)
      onDelete()
    } catch (err: any) {
      alert(err.message || 'Failed to delete note')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleFavourite = async () => {
    if (!isConnected || !address) return

    setToggling(true)
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        if (chainId !== '0xaa36a7') {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          })
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      const signer = await getSigner()
      const contract = new ethers.Contract(NOTES_CONTRACT_ADDRESS, NOTES_ABI, signer)
      await contract.toggleFavourite(noteId)
      onToggleFavourite()
    } catch (err: any) {
      alert(err.message || 'Failed to toggle favourite')
    } finally {
      setToggling(false)
    }
  }

  if (!note.exists) return null

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{note.title}</h3>
          <p className="text-xs text-gray-500 mb-2">
            Created: {new Date(note.createdAt * 1000).toLocaleString()}
            {note.updatedAt !== note.createdAt && (
              <span className="ml-2">• Updated: {new Date(note.updatedAt * 1000).toLocaleString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleToggleFavourite}
          disabled={toggling}
          className={`text-2xl ${note.isFavourite ? 'text-yellow-500' : 'text-gray-300'} hover:scale-110 transition-all`}
          title={note.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
        >
          {note.isFavourite ? '⭐' : '☆'}
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium border border-gray-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="mb-4">
        {decryptedContent ? (
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{decryptedContent}</p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <p className="text-gray-500 text-sm italic mb-3">🔒 Encrypted content</p>
            <button
              onClick={handleDecrypt}
              disabled={decrypting || !relayerInstance}
              className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {decrypting ? 'Decrypting...' : 'Decrypt'}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(noteId)}
          className="flex-1 px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 px-4 py-2 bg-white text-gray-700 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors border border-gray-300"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  )
}

