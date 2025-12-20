import hre from 'hardhat'
const { ethers } = hre

// deploy contract to Sepolia (need private key in .env.local)
async function main() {
  const signers = await ethers.getSigners()
  if (signers.length === 0) {
    throw new Error('No signers available. Check PRIVATE_KEY in .env.local')
  }
  const deployer = signers[0]

  console.log('Deploying NotesApp...')
  console.log('Deployer:', deployer.address)

  // get contract factory and deploy
  const NotesApp = await ethers.getContractFactory('NotesApp')
  const notesApp = await NotesApp.deploy()
  await notesApp.waitForDeployment()

  const address = await notesApp.getAddress()
  console.log('Deployed to:', address)
  console.log('Copy this address to NEXT_PUBLIC_NOTES_CONTRACT_ADDRESS!')

  console.log('Done!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

