import { createPublicClient, createWalletClient, http, parseEther, getContract } from "viem";
import {monadTestnet} from "viem/chains";
import { privateKeyToAccount } from 'viem/accounts'
import fs from 'fs';
import ChainSocialABI from "../abis/ChainSocial.json";
const CHAIN_SOCIAL_ADDRESS = '0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95'

const client = createWalletClient({
    chain: monadTestnet,
    transport: http("https://few-lingering-surf.monad-testnet.quiknode.pro/d817ed51ec7bbb02b6ebbe877aa3f2fdb40f51e6/")
  });
  
  // Create a public client for checking balances
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http("https://few-lingering-surf.monad-testnet.quiknode.pro/d817ed51ec7bbb02b6ebbe877aa3f2fdb40f51e6/")
});
async function createPost(wallet) {
    if (wallet.private_key.startsWith("0x")) {
        wallet.private_key = wallet.private_key.slice(2);
    }
    let acc = privateKeyToAccount("0x" + wallet.private_key);
    try {
        let simulate = await publicClient.estimateContractGas({
            address: CHAIN_SOCIAL_ADDRESS,
            abi: ChainSocialABI,
            functionName: "updateProfile",
            args: ["Monad social test account", "https://nemo.mypinata.cloud/ipfs/QmdSKHqp44oucbe8kGDsYAafVvq1fLab6mypEmz2S4xAN3"],
            account: acc,
            gasPrice: 52000000000
        })
        // console.log(simulate);
        // return;
        let simulationGas = simulate.gas;
        const hash = await client.writeContract({
            address: CHAIN_SOCIAL_ADDRESS,
            abi: ChainSocialABI,
            functionName: "updateProfile",
            args: ["Monad social test account", "https://nemo.mypinata.cloud/ipfs/QmdSKHqp44oucbe8kGDsYAafVvq1fLab6mypEmz2S4xAN3"],
            account: acc,
            gas: simulate

        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
            console.log(`Post created for ${wallet.address} || txn: https://testnet.monadexplorer.com/tx/${hash}`);
 
        } else {
            console.error(`Failed to create post for ${wallet.address}`);
            console.error(receipt);
        }
    } catch (error) {
        console.error(`Error creating post for ${wallet.address}: ${error}`);
    }
}
async function main() {
    const wallets = require('./config.json').wallets;
    // let tweetsFile = fs.readFileSync('./scripts/filtered_tweets_two.txt', 'utf8');
    // const tweets = tweetsFile.split('\n');
    // let j = 0
    let needsUpdate = ["0x9A54a612e01303aC16fe3573Def52bf1A6132D3d", "0xb45186bFaA28179Ea3987D365E26324297beA815", "0x93055922A1Ec2e39178062A48400Bd85a0a3DF47", "0x51B3245B3Bc82772BC2Fa38318Ce4724C54D2e85", "0x4e6274427C06986003E4835038189633FD018C43", "0x3cb258743f377D915c253A179063D8f79a80cB56"]
    for (let wallet of wallets) {
        if (needsUpdate.includes(wallet.address)) {
            await createPost(wallet);
        }
    }
    // while (true) {
    //     for (let i = 0; i < wallets.length; i++) {
    //         const wallet = wallets[i];
    //         const tweet = tweets[j];

            // console.log(`Creating post for ${wallet.address} with tweet: ${tweet}`);
            // await createPost(tweet, wallet);
            // console.log(`Waiting 5 seconds...`);
            // await new Promise(resolve => setTimeout(resolve, 2000));
            
            // console.log(`--------------------------------`);
            // console.log(`${j} / ${tweets.length}`);
            // j++;
            // if (j >= tweets.length) {
            //     break;
            // }

    //     }
    // }
}

main();