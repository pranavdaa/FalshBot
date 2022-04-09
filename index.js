import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import prompt from 'prompt-sync';
import 'dotenv/config';

const addresses = {
  "tokenAddress": "0xab...",
  "claimContract": "0xab..."
};

const erc20ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
];

const CHAIN_ID = 1;
const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/nijvYQzHc4Fej8kvRvdesJXT5CqZEXSo");

const compromised_wallet = new ethers.Wallet(process.env.COMPROMISED_WALLET, provider)
const new_wallet = new ethers.Wallet(process.env.NEW_WALLET, provider)

console.log(`compomised wallet : ${compromised_wallet.address}`)
console.log(`new wallet : ${new_wallet.address}`)

recover();
//const run = prompt("run bot? y/n");

//if(run === 'y') {
//}

async function recover() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(provider, ethers.Wallet.createRandom())
  provider.on('block', async (blockNumber) => {
    console.log(blockNumber)

      const bundle = [
        // transaction to fund
        {
          transaction: {
            chainId: CHAIN_ID,
            to:compromised_wallet.address,
            value: ethers.utils.parseEther("0.0400"),
            type: 2,
            gasLimit: 21000,
            maxFeePerGas: ethers.utils.parseUnits("75", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("65", "gwei"),
          },
          signer: new_wallet 
        },

        // transaction to claim
        {
          transaction: {
            chainId: CHAIN_ID,
            to: addresses.claimContract,
            data: "0x704fc04e000000000000000000000000bc79c7139c87df965f0f4c24747f326d1864c5af",
            type: 2,
            gasLimit: 91170,
            maxFeePerGas: ethers.utils.parseUnits("75", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("65", "gwei"),
          },
          signer: compromised_wallet
        },

        // transaction to withdraw
        {
          transaction: {
            chainId: CHAIN_ID,
            to: addresses.tokenAddress,
            data: "0xa9059cbb000000000000000000000000acf6418cefd7254f5e34b2b2e9a8f081e0e150d1000000000000000000000000000000000000000000000845e16a00dd60f00000",
            type: 2,
            gasLimit: 78000,
            maxFeePerGas: ethers.utils.parseUnits("75", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("65", "gwei"),
          },
          signer: compromised_wallet
        },
      ]

		const signedTransactions = await flashbotsProvider.signBundle(bundle)
  	const simulation = await flashbotsProvider.simulate(signedTransactions, blockNumber+1)
    console.log(JSON.stringify(simulation, null, 2))

		// const flashbotsTransactionResponse = await flashbotsProvider.sendBundle(
    // 		bundle,
    // 		blockNumber + 1,
    // 	);
    
    // By exiting this function (via return) when the type is detected as a "RelayResponseError", TypeScript recognizes bundleSubmitResponse must be a success type object (FlashbotsTransactionResponse) after the if block.
    //if ('error' in bundleSubmitResponse) {
    //  console.warn(bundleSubmitResponse.error.message)
    //  return
    //}

    //console.log(await bundleSubmitResponse.simulate())
  })
}

