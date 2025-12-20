'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { getSigner, getBrowserProvider } from '@/lib/provider'
import { useRouter } from 'next/navigation'

const NOTES_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_NOTES_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000').trim()

const NOTES_ABI = [
  'function createNote(string memory title, bytes32 encryptedContent, string memory tags, bytes calldata attestation) external',
  'function updateNote(uint256 noteId, string memory title, bytes32 encryptedContent, string memory tags, bytes calldata attestation) external',
  'function getUserNotes(address user) external view returns (tuple(address owner, string title, bytes32 encryptedContent, string tags, bool isFavourite, uint256 createdAt, uint256 updatedAt, bool exists)[])',
]

function CreatePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const noteId = searchParams?.get('id') ? parseInt(searchParams.get('id')!) : null
  const { address, isConnected } = useAccount()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [relayerInstance, setRelayerInstance] = useState<any>(null)
  const [loadingNote, setLoadingNote] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (typeof global === 'undefined') {
        (window as any).global = globalThis
      }
      initRelayer()
    }
  }, [])

  useEffect(() => {
    if (noteId !== null && isConnected && address && relayerInstance) {
      loadNote()
    }
  }, [noteId, isConnected, address, relayerInstance])

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
      console.log('Relayer init failed')
    }
  }

  const loadNote = async () => {
    if (noteId === null || !address) return

    setLoadingNote(true)
    try {
      const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org')
      const contract = new ethers.Contract(NOTES_CONTRACT_ADDRESS, NOTES_ABI, provider)
      
      const userNotes = await contract.getUserNotes(address)
      if (noteId < userNotes.length && userNotes[noteId].exists) {
        const note = userNotes[noteId]
        setTitle(note.title)
        setTags(note.tags)
        
        // try to decrypt content when loading note for editing
        if (relayerInstance && note.encryptedContent) {
          try {
            const handleBytes = ethers.getBytes(note.encryptedContent)
            
            // try public decrypt first (for old notes)
            try {
              const decryptedResult = await relayerInstance.publicDecrypt([handleBytes])
              const clearValues = decryptedResult.clearValues
              const handleKey = Object.keys(clearValues)[0]
              const decryptedNumber = clearValues[handleKey as `0x${string}`]
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
              setContent(decrypted)
            } catch (publicErr: any) {
              // public didn't work? try userDecrypt (for user-encrypted notes)
              try {
                // generate keypair
                const keypair = relayerInstance.generateKeypair()
                
                // create EIP712 structure for signature
                const startTimestamp = Math.floor(Date.now() / 1000)
                const durationDays = 365
                const eip712 = relayerInstance.createEIP712(
                  keypair.publicKey,
                  [NOTES_CONTRACT_ADDRESS],
                  startTimestamp,
                  durationDays
                )
                
                // check wallet
                if (!window.ethereum) {
                  throw new Error('Wallet not found')
                }
                
                // ask to sign
                const signature = await window.ethereum.request({
                  method: 'eth_signTypedData_v4',
                  params: [address, JSON.stringify({
                    domain: eip712.domain,
                    primaryType: eip712.primaryType,
                    types: eip712.types,
                    message: eip712.message
                  })]
                })
                
                // decrypt through userDecrypt
                const decryptedResult = await relayerInstance.userDecrypt(
                  [{ handle: handleBytes, contractAddress: NOTES_CONTRACT_ADDRESS }],
                  keypair.privateKey,
                  keypair.publicKey,
                  signature,
                  [NOTES_CONTRACT_ADDRESS],
                  address,
                  startTimestamp,
                  durationDays
                )
                
                // extract decrypted value
                const handleKey = Object.keys(decryptedResult)[0]
                const decryptedNumber = decryptedResult[handleKey as `0x${string}`]
                
                // convert number to string
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
                setContent(decrypted)
              } catch (userDecryptErr: any) {
                // if both methods failed - leave empty
                console.error('Failed to decrypt:', userDecryptErr)
                setContent('')
              }
            }
          } catch {
            setContent('')
          }
        }
      }
    } catch (err) {
      console.error('Failed to load note:', err)
    } finally {
      setLoadingNote(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected || !address || !title.trim() || !content.trim() || !relayerInstance) {
      setError('Fill all fields and ensure relayer is ready')
      return
    }

    setLoading(true)
    setError(null)

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

      // encrypt content through relayer
      // convert string to number for encryption (simplified approach)
      // for longer strings we'd need to split into chunks, but we limited to 32 chars
      const messageBytes = new TextEncoder().encode(content.slice(0, 32))
      let encodedValue = BigInt(0)
      for (let i = 0; i < Math.min(messageBytes.length, 4); i++) {
        encodedValue |= BigInt(messageBytes[i]) << BigInt(i * 8)
      }
      
      // encrypt for specific user address (only they can decrypt)
      const inputBuilder = relayerInstance.createEncryptedInput(NOTES_CONTRACT_ADDRESS, address)
      inputBuilder.add32(encodedValue)
      const encryptedInput = await Promise.race([
        inputBuilder.encrypt(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Encryption timeout')), 30000)
        )
      ]) as any

      if (!encryptedInput?.handles || encryptedInput.handles.length === 0) {
        throw new Error('Encryption failed: no handles returned')
      }
      
      if (!encryptedInput.inputProof) {
        throw new Error('Encryption failed: no proof returned')
      }

      const encryptedHandle = encryptedInput.handles[0]
      const attestation = encryptedInput.inputProof

      if (noteId !== null) {
        // Update existing note
        await contract.updateNote(noteId, title.trim(), encryptedHandle, tags.trim() || '', attestation)
      } else {
        // Create new note
        await contract.createNote(title.trim(), encryptedHandle, tags.trim() || '', attestation)
      }

      router.push('/home')
    } catch (err: any) {
      setError(err.message || 'Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">Connect your wallet to create notes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-gray-900">
          {noteId !== null ? 'Edit Note' : 'Create Note'}
        </h1>

        {loadingNote ? (
          <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">Loading note...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Your note content..."
                  required
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="work, personal, ideas"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/home')}
                  className="flex-1 px-6 py-2 bg-white text-gray-700 rounded text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !relayerInstance}
                  className="flex-1 px-6 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : noteId !== null ? 'Update Note' : 'Create Note'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  )
}

