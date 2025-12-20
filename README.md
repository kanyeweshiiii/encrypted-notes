# 📔 FHE Diary

> Your private diary on blockchain with FHE encryption

A notes app where all your entries are encrypted using Zama FHE tech. Only you can decrypt and read your notes - complete privacy on blockchain.

## 🎯 What is this?

It's a diary, but on blockchain. Your notes are encrypted so even blockchain nodes can't read them. Only you with your wallet can decrypt your entries.

## ✨ Features

- 🔐 **Encrypted Notes**: All content is encrypted through FHE before sending to blockchain
- 👤 **Encryption for You**: Notes are encrypted for your specific wallet address
- ✏️ **Create, Edit, Delete**: Full CRUD for your notes
- 🏷️ **Tags**: Organize notes with tags
- ⭐ **Favorites**: Mark notes with star for quick access
- 📅 **Auto Dates**: Creation and update dates are added automatically
- 🔒 **Private Decryption**: Only you can decrypt your notes through wallet signature

## 🚀 Quick Start

1. **Get test ETH** - Need Sepolia testnet ETH. Get some [here](https://sepoliafaucet.com/)
2. **Connect wallet** - MetaMask or any other Web3 wallet
3. **Switch to Sepolia** - Make sure you're on testnet
4. **Start writing** - Create your first encrypted note!

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables (see below)

# Run dev server
npm run dev

# Open http://localhost:3000
```

## ⚙️ Environment Variables

Create `.env.local` file in project root:

```env
# Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.drpc.org

# Private key for contract deployment (optional, only for deployment)
PRIVATE_KEY=your_private_key

# Notes contract address (after deployment)
NEXT_PUBLIC_NOTES_CONTRACT_ADDRESS=0x...

# WalletConnect Project ID (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🏗️ Smart Contract Deployment

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:notes
```

After deployment, update `NEXT_PUBLIC_NOTES_CONTRACT_ADDRESS` in `.env.local`.

## 📱 Pages

- **Home** (`/home`): All your notes
- **Create** (`/create`): Create new note or edit existing one
- **Favourites** (`/favourites`): Your favorite notes

## 🔐 How It Works

1. **Encryption**: When you create a note, content is encrypted through Zama FHE relayer for your address
2. **Storage**: Encrypted content (handle) is saved on blockchain
3. **Decryption**: When you want to read a note, you sign EIP712 message with wallet to authorize decryption
4. **Privacy**: Only you can decrypt your notes - even blockchain nodes can't see content

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Ethereum Sepolia Testnet
- **Wallet**: Wagmi, RainbowKit
- **Encryption**: Zama FHE Relayer SDK
- **Smart Contracts**: Hardhat, Solidity

## 📄 Smart Contract

**NotesApp Contract**
- Stores encrypted notes on blockchain
- Manages user notes with CRUD operations
- Tracks favorites and tags
- Emits events for all operations

## 🔒 Security

- Notes are encrypted through FHE before sending to blockchain
- Only note owner can decrypt their notes
- EIP712 signature required for decryption authorization
- All operations require wallet connection

## ⚠️ Important Notes

- This is on **Sepolia testnet** - use test ETH only!
- Each operation costs gas (obviously)
- FHE mode needs Zama relayer to work
- This is a demo project - don't use for something super important

## 📝 License

MIT - Do whatever you want with this code.

## 🙏 Acknowledgments

- [Zama](https://www.zama.ai/) for FHE technology
- [RainbowKit](https://www.rainbowkit.com/) for wallet connection
- [Wagmi](https://wagmi.sh/) for Ethereum interactions

---

Made with ❤️ (and lots of coffee ☕) using Zama FHEVM

*P.S. - Your notes are secret. Only you see them. That's the magic of FHE. 🎯*
