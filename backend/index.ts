import { Elysia } from 'elysia';
import { createPublicClient, http, type Chain } from 'viem';
// Import the blockchain routes
import { blockchainRoutes } from './routes/blockchain';
// Import the ChainSocial routes
import { chainSocialRoutes } from './routes/chainSocial';
import mongoose from 'mongoose';
import { indexerReqsRoutes } from './routes/indexerReqs';
  
try {
  mongoose.connect(process.env.MONGO_URI as string);
} catch (error) {
  console.error('Error connecting to MongoDB:', error);
}

// Define the Monad testnet chain
let monad: Chain = {
  id: 10143,
  name: "Monad",
  nativeCurrency: {
    name: "Monad",
    symbol: "MONAD",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://monad-testnet.g.alchemy.com/v2/JLv8UWVYg1PGGXx8yt7Q_Md4k7K0783T"],
      webSocket: ["wss://rpc.monad.xyz"]
    }
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com/"
    }
  },
  testnet: true
};

// Create a global Viem PublicClient instance
export const publicClient = createPublicClient({
  chain: monad,
  transport: http(monad.rpcUrls.default.http[0])
});

// Create an Elysia app
const app = new Elysia()
  .get('/', () => 'Hello from Elysia with Viem!')
  .get('/block-number', async () => {
    const blockNumber = await publicClient.getBlockNumber();
    return { blockNumber: blockNumber.toString() };
  })
  .use(blockchainRoutes)
  .use(chainSocialRoutes)
  .use(indexerReqsRoutes)
  .listen(3000);

console.log(`🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`);