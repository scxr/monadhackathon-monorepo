import { createPublicClient, createWalletClient, http, parseEther, getContract } from "viem";
import {monadTestnet} from "viem/chains";
import config from "./config.json";
import ChainSocialABI from "../abis/ChainSocial.json";
const CHAIN_SOCIAL_ADDRESS = '0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95'
import { privateKeyToAccount } from 'viem/accounts'

const wallets = config.wallets;

const client = createWalletClient({
    chain: monadTestnet,
    transport: http("https://few-lingering-surf.monad-testnet.quiknode.pro/d817ed51ec7bbb02b6ebbe877aa3f2fdb40f51e6/")
  });
  
  // Create a public client for checking balances
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http("https://few-lingering-surf.monad-testnet.quiknode.pro/d817ed51ec7bbb02b6ebbe877aa3f2fdb40f51e6/")
});
const getChainSocialContract = () => {
    return getContract({
      address: CHAIN_SOCIAL_ADDRESS,
      abi: ChainSocialABI,
      client: publicClient,
    });
  };
async function getValidWallets(wallets) {
    const validWallets = [];
    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const balance = await publicClient.getBalance({
            address: wallet.address,
        });
        if (balance > 0) {
            validWallets.push(wallet);
        }
    }
    return validWallets;
}  

async function createAccount(wallet, username) {
    const chainSocialContract = getChainSocialContract();
    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    if (wallet.private_key.startsWith("0x")) {
        wallet.private_key = wallet.private_key.slice(2);
    }
    let acc = privateKeyToAccount("0x" + wallet.private_key);
    try {
        const hash = await client.writeContract({
            address: CHAIN_SOCIAL_ADDRESS,
            abi: ChainSocialABI,
            functionName: "createUser",
            args: [username, "test account", "https://placeholder.com"],
            account: acc,
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
            console.log(`Account created for ${username} at ${wallet.address}`);
        } else {
            console.error(`Failed to create account for ${username} at ${wallet.address}`);
            console.error(receipt);
        }
    } catch (error) {
        console.error(`Error creating account for ${username} at ${wallet.address}: ${error}`);
    }
    
}

async function main() {
    const validWallets = await getValidWallets(wallets);
    for (let i = 0; i < validWallets.length; i++) {
        const wallet = validWallets[i];
        const username = `user_${i}`;
        await createAccount(wallet, username);
    }
}

main();




