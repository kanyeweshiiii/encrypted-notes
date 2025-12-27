╔════════════════════════════════════════════════════════════╗
║                                                            ║
║                     F H E   D I A R Y                      ║
║                                                            ║
║        Private notes. Encrypted forever. On-chain.         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

> Your personal diary on blockchain — readable only by you

**FHE Diary** is a minimal, privacy-first notes application where every entry is encrypted *before* it ever reaches the blockchain.  
No servers. No admins. No trust assumptions.

Just **you**, your wallet, and your notes.

---

## 🧠 What is FHE Diary?

FHE Diary is a blockchain-based diary where:

- The blockchain is public  
- Your notes are **not**
- Even the app itself cannot read your content

All notes are encrypted using **Fully Homomorphic Encryption (FHE)** and can only be decrypted by the wallet that created them.

---

## ✨ Core Features

- **Encrypted by default**  
  Notes are encrypted locally via FHE before being stored on-chain

- **Wallet-bound privacy**  
  Each note is encrypted specifically for your wallet address

- **Full CRUD**  
  Create, edit, and delete your notes at any time

- **Tags & favorites**  
  Organize notes without exposing metadata

- **Automatic timestamps**  
  Creation and update dates handled automatically

- **Private decryption**  
  Reading a note requires an EIP-712 wallet signature

---

## 🚀 Getting Started

1. Get **Sepolia testnet ETH**
2. Connect a Web3 wallet (MetaMask, etc.)
3. Switch network to **Sepolia**
4. Start writing — encryption happens automatically

---

## 📦 Local Setup

```bash
npm install
npm run dev

Open: http://localhost:3000

⸻

⚙️ Environment Variables

Create a .env.local file in the project root:

SEPOLIA_RPC_URL=https://sepolia.drpc.org

# Optional, only for contract deployment
PRIVATE_KEY=your_private_key

# Set after contract deployment
NEXT_PUBLIC_NOTES_CONTRACT_ADDRESS=0x...

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id


⸻

🏗️ Smart Contract Deployment

npm run compile
npm run deploy:notes

After deployment, update:

NEXT_PUBLIC_NOTES_CONTRACT_ADDRESS=0x...


⸻

📱 App Pages
	•	/home — all notes
	•	/create — create or edit a note
	•	/favourites — starred notes

Minimal UI. Black & white. No distractions.

⸻

🔐 How Privacy Works
	1.	You write a note
	2.	Content is encrypted via FHE for your wallet address
	3.	Blockchain stores only encrypted data
	4.	To read a note, you sign an EIP-712 message
	5.	Only your wallet can decrypt the content

Blockchain nodes, indexers, and apps see only ciphertext.

⸻

🛠️ Tech Stack
	•	Frontend: Next.js 14, React, TypeScript
	•	Styling: Tailwind CSS (black & white, minimal)
	•	Blockchain: Ethereum Sepolia Testnet
	•	Wallet: Wagmi, RainbowKit
	•	Encryption: Zama FHE Relayer SDK
	•	Smart Contracts: Solidity, Hardhat

⸻

🔒 Security Notes
	•	No plaintext ever stored on-chain
	•	Only the note owner can decrypt content
	•	Decryption requires wallet ownership
	•	No backend with access to user data

The system is designed so it cannot read your notes, even if compromised.

⸻

⚠️ Disclaimer
	•	Testnet only (Sepolia)
	•	Gas fees apply
	•	Experimental / demo project
	•	Do not store sensitive real-world secrets

⸻

📄 License

MIT — free to use, modify, and distribute.

⸻


Silence is privacy.
Privacy is power.
Your diary is finally yours.

Built with cryptography, focus, and coffee.

