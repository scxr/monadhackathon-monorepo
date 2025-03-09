import { publicClient } from '../index';
import { decodeFunctionData, encodeFunctionData, getContract, decodeEventLog } from 'viem';
import ChainSocialABI from '../abis/ChainSocial.json';
import { decodeChainSocialEvents } from './chainSocialViewFuncs';
import type { Post } from '../models/types';
import { createPostInDb } from '../models/Posts';
const CHAIN_SOCIAL_ADDRESS = '0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95' as `0x${string}`;

const getChainSocialContract = () => {
  return getContract({
    address: CHAIN_SOCIAL_ADDRESS,
    abi: ChainSocialABI,
    client: publicClient,
  });
};

interface CreatePostResponse {
  success: boolean;
  transactionHash: string;
  postId: string;
  postContent: string;
  postAuthor: string;
}

export async function simulateCreateUser(userAddress: string, username: string, bio: string, pfpLink: string) {
  try {
    const chainSocialContract = getChainSocialContract();

    // Get the current timestamp (in seconds)
    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    // Simulate what the user data would look like after creation
    const simulatedUser = {
      username,
      bio,
      pfpLink,
      joinedAt: timestamp.toString(),
      exists: true
    };

    // Generate the transaction data that would be sent
    const txData = encodeFunctionData({
      abi: ChainSocialABI,
      functionName: 'createUser',
      args: [username, bio, pfpLink]
    });

    //simulate
    

    return {
      user: simulatedUser,
      transactionData: txData,
      estimatedGas: '0', // You could add gas estimation here if needed
      contractAddress: CHAIN_SOCIAL_ADDRESS,
      from: userAddress
    };
  } catch (error) {
    console.error('Error simulating user creation:', error);
    throw error;
  }
}

export async function likePost(postId: number) {
  try {
    const chainSocialContract = getChainSocialContract();

    // Get the current timestamp (in seconds)
    const timestamp = BigInt(Math.floor(Date.now() / 1000));

    const txData = encodeFunctionData({
      abi: ChainSocialABI,
      functionName: 'likePost',
      args: [postId]
    }); 

    return {
      transactionData: txData,
      estimatedGas: '0', 
      contractAddress: CHAIN_SOCIAL_ADDRESS,
    };

  } catch (error) {
    console.error('Error simulating post creation:', error);
    throw error;
  }
}

export async function createPost(content: string) {
  // This is a placeholder function - in a real implementation, 
  // you would send the transaction to the blockchain
  return {
    success: true,
    transactionHash: '0x' + Math.random().toString(16).substring(2, 42)
  };
}

export async function confirmCreatePost(transactionHash: string) {
  try {
    // Get transaction receipt
    
     

    let receipt 
    let tx
    let attempts = 0
    while (receipt === undefined) {
      try {
        receipt = await publicClient.getTransactionReceipt({
          hash: transactionHash as `0x${string}`
        });
        tx = await publicClient.getTransaction({
          hash: transactionHash as `0x${string}`
        });
      } catch (error) {
        console.log('Transaction not yet mined');
      }
      attempts++;
      if (attempts > 10) {
        throw new Error('Transaction failed');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (tx === undefined) {
      throw new Error('Transaction not found');
    }

    if (receipt === undefined) {
      throw new Error('Transaction failed');
    }

    // console.log(receipt);
    // console.log(tx);
    let decodedData = decodeFunctionData({
      abi: ChainSocialABI,
      data: tx?.input || '0x'
    });

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed');
    }

    if (decodedData.functionName !== 'createPost') {
      throw new Error('Invalid transaction data');
    }

    let decodedReceipt = decodeEventLog({
      abi: ChainSocialABI,
      data: receipt.logs[0].data,
      topics: receipt.logs[0].topics
    });

    console.log(decodedData);

    let postId = (decodedReceipt?.args as any)?.postId?.toString() || 'unknown';
    let postContent = (decodedData as any).args[0] || 'unknown';
    let postAuthor = (decodedReceipt?.args as any)?.author || 'unknown';
    let postTimestamp = (decodedReceipt?.args as any)?.timestamp?.toString() || 'unknown';

    let resp: CreatePostResponse = {
      success: true,
      transactionHash: transactionHash,
      postId: postId,
      postContent: postContent,
      postAuthor: postAuthor,
    }

    





    console.log(decodedReceipt);
    let post: Post = {
      postId: parseInt(postId),
      poster: postAuthor,
      content: postContent,
      transactionHash: transactionHash
    }

    await createPostInDb(post);

    return resp;
  } catch (error) {
    console.error('Error confirming post creation:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

export async function addComment(postId: number, content: string) {
  try {
    // const chainSocialContract = getChainSocialContract();

    // Get the current timestamp (in seconds)

    const txData = encodeFunctionData({
      abi: ChainSocialABI,
      functionName: 'commentOnPost',
      args: [postId, content]
    }); 

    return {
      transactionData: txData,
      estimatedGas: '0',
      contractAddress: CHAIN_SOCIAL_ADDRESS,
    };
  } catch (error) { 
    console.error('Error adding comment:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

export async function updateUser(bio: string, pfpLink: string) {
  try {
    // const chainSocialContract = getChainSocialContract();

    const txData = encodeFunctionData({
      abi: ChainSocialABI,
      functionName: 'updateProfile',
      args: [bio, pfpLink]
    });

    return {
      transactionData: txData,
      estimatedGas: '0',
      contractAddress: CHAIN_SOCIAL_ADDRESS,
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}
