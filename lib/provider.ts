import { BrowserProvider, JsonRpcProvider, Signer } from 'ethers'

// get provider from browser (needs MetaMask or other wallet)
export async function getBrowserProvider(address?: string): Promise<BrowserProvider> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Install MetaMask, dude!')
  }
  const provider = new BrowserProvider(window.ethereum, 'any')
  if (address) {
    await provider.getSigner(address)
  }
  return provider
}

// get signer for signing transactions
export async function getSigner(): Promise<Signer> {
  const provider = await getBrowserProvider()
  return provider.getSigner()
}

// get read-only provider (for reading data without signing)
export function getReadOnlyProvider(): BrowserProvider | JsonRpcProvider {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new BrowserProvider(window.ethereum, 'any')
  }
  // if no wallet - use public RPC
  return new JsonRpcProvider('https://sepolia.drpc.org')
}

