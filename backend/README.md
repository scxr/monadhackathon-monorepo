# Elysia with Viem

This is an Elysia project with a global Viem PublicClient instance that can be used across files.

## Getting Started

To run the project:

```bash
bun install
bun run index.ts
```

## API Endpoints

### Basic Endpoints
- `GET /` - Hello message
- `GET /block-number` - Get the current block number

### Blockchain Endpoints
- `GET /blockchain/balance/:address` - Get the ETH balance of an address
- `GET /blockchain/gas-price` - Get the current gas price

### ChainSocial Contract Endpoints
- `GET /chain-social/user/:address` - Get user profile information
- `GET /chain-social/post/:id` - Get a specific post by ID
- `GET /chain-social/post/:id/comments` - Get comments for a specific post
- `GET /chain-social/user/:address/posts` - Get posts from a specific user (with optional `offset` and `limit` query parameters)
- `GET /chain-social/user/:address/following` - Get list of addresses a user is following
- `GET /chain-social/user/:follower/follows/:followed` - Check if one user is following another
- `GET /chain-social/user/:address/liked/:postId` - Check if a user has liked a post

## Project Structure

- `index.ts` - Main entry point with the Elysia app and global Viem PublicClient
- `utils/blockchain.ts` - Utility functions that use the PublicClient
- `utils/chainSocialViewFuncs.ts` - Functions to interact with the ChainSocial contract
- `routes/blockchain.ts` - API routes for blockchain-related endpoints
- `routes/chainSocial.ts` - API routes for ChainSocial contract endpoints
- `abis/ChainSocial.json` - ABI for the ChainSocial contract

## Using the PublicClient in Other Files

To use the PublicClient in other files, simply import it:

```typescript
import { publicClient } from './index';

// Now you can use publicClient
const blockNumber = await publicClient.getBlockNumber();
```

## Interacting with Smart Contracts

To interact with a smart contract, use the getContract function from viem:

```typescript
import { publicClient } from './index';
import { getContract } from 'viem';
import ContractABI from './abis/YourContract.json';

const contractAddress = '0xYourContractAddress' as `0x${string}`;

const contract = getContract({
  address: contractAddress,
  abi: ContractABI,
  client: publicClient,
});

// Now you can call contract functions
const result = await contract.read.yourViewFunction([param1, param2]);
```
