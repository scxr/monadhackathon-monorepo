import { publicClient } from '../index';
import { getContract, encodeFunctionData, decodeEventLog, type Log } from 'viem';
import ChainSocialABI from '../abis/ChainSocial.json';

// Contract address for the ChainSocial contract
const CHAIN_SOCIAL_ADDRESS = '0xB42497ACe9f353DADD5A8EF2f2Cb58176C465A95' as `0x${string}`;

// Function to decode events from transaction logs
export async function decodeChainSocialEvents(txHash: string) {
  try {
    // Get transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`
    });

    // Filter logs for events from our contract
    const contractLogs = receipt.logs.filter(log => 
      log.address.toLowerCase() === CHAIN_SOCIAL_ADDRESS.toLowerCase()
    );

    // Decode each log
    const decodedEvents = contractLogs.map(log => {
      try {
        const decoded = decodeEventLog({
          abi: ChainSocialABI,
          data: log.data,
          topics: log.topics,
        });

        // Return decoded event with additional metadata
        console.log(decoded.args);
        return {
          eventName: decoded.eventName,
          args: decoded.args,

        };
      } catch (error) {
        console.error('Failed to decode log:', error);
        return {
          eventName: 'UnknownEvent',
          args: {},
          rawLog: log,
          error: (error as Error).message
        };
      }
    });
    // console.log(JSON.stringify({
    //   transactionHash: txHash,
    //   events: decodedEvents
    // }, null, 2));
    return {
      transactionHash: txHash,
      events: decodedEvents
    };
  } catch (error) {
    console.error('Error decoding events:', error);
    throw error;
  }
}

// Function to get specific events by type
export async function getChainSocialEventsByType(txHash: string, eventName: string) {
  const allEvents = await decodeChainSocialEvents(txHash);
  return {
    transactionHash: txHash,
    events: allEvents.events.filter(event => event.eventName === eventName)
  };
}

// Simulate createUser without sending a transaction
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

// Simulate createPost without sending a transaction
export async function simulateCreatePost(userAddress: string, content: string) {
  try {
    // Get the current timestamp (in seconds)
    const timestamp = BigInt(Math.floor(Date.now() / 1000));
    
    // Generate a mock post ID (this would normally be determined by the contract)
    // In a real scenario, you might want to query the total posts count and add 1
    const mockPostId = BigInt(Date.now()); // Using timestamp as a mock ID
    
    // Simulate what the post data would look like after creation
    const simulatedPost = {
      id: mockPostId.toString(),
      author: userAddress,
      content,
      timestamp: timestamp.toString(),
      likes: '0'
    };
    
    // Generate the transaction data that would be sent
    const txData = encodeFunctionData({
      abi: ChainSocialABI,
      functionName: 'createPost',
      args: [content],
    });

    // simulate the post creation to get gas estimation
    const gasEstimation = await publicClient.estimateGas({
      to: CHAIN_SOCIAL_ADDRESS,
      data: txData,
      account: userAddress as `0x${string}`,
    });

    console.log('Gas estimation:', gasEstimation);
    
    
    return {
      post: simulatedPost,
      transactionData: txData,
      estimatedGas: Math.ceil(Number(gasEstimation) * 1.1).toString(),
      contractAddress: CHAIN_SOCIAL_ADDRESS,
      from: userAddress
    };
  } catch (error) {
    console.error('Error simulating post creation:', error);
    throw error;
  }
}

// Define types for contract return values
type UserResult = [string, string, string, bigint, boolean]; // [username, bio, pfpLink, joinedAt, exists]
type PostResult = [bigint, string, string, bigint, bigint]; // [id, author, content, timestamp, likes]
type CommentResult = [bigint, bigint, string, string, bigint]; // [id, postId, author, content, timestamp]

// Create a function to get the contract instance
const getChainSocialContract = () => {
  return getContract({
    address: CHAIN_SOCIAL_ADDRESS,
    abi: ChainSocialABI, // Use the original ABI
    client: publicClient,
  });
};

// Get user profile information
export async function getUser(userAddress: string) {
  try {
    const chainSocialContract = getChainSocialContract();
    // Use direct access to the users mapping
    const user = await chainSocialContract.read.users([userAddress as `0x${string}`]) as UserResult;
    return {
      username: user[0],
      bio: user[1],
      pfpLink: user[2],
      joinedAt: user[3].toString(), // Convert BigInt to string
      exists: user[4]
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Get a specific post by ID
export async function getPost(postId: number) {
  try {
    const chainSocialContract = getChainSocialContract();
    // Use direct access to the posts mapping
    const post = await chainSocialContract.read.posts([BigInt(postId)]) as PostResult;
    return {
      id: post[0].toString(), // Convert BigInt to string
      author: post[1],
      content: post[2],
      timestamp: post[3].toString(), // Convert BigInt to string
      likes: post[4].toString() // Convert BigInt to string
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
}

// Get comments for a specific post
export async function getPostComments(postId: number) {
  try {
    const chainSocialContract = getChainSocialContract();
    // Use getPostComments function
    const comments = await chainSocialContract.read.getPostComments([BigInt(postId)]) as CommentResult[];
    
    // If comments is an array, map it to a more usable format
    if (Array.isArray(comments)) {
      return comments.map(comment => ({
        id: comment[0].toString(), // Convert BigInt to string
        postId: comment[1].toString(), // Convert BigInt to string
        author: comment[2],
        content: comment[3],
        timestamp: comment[4].toString() // Convert BigInt to string
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching post comments:', error);
    // Return empty array on error
    return [];
  }
}

// Get posts from a specific user with pagination
export async function getUserPosts(userAddress: string, offset: number = 0, limit: number = 10) {
  try {
    const chainSocialContract = getChainSocialContract();
    const posts = await chainSocialContract.read.getUserPosts([
      userAddress as `0x${string}`,
      BigInt(offset),
      BigInt(limit)
    ]) as PostResult[];
    
    // If posts is an array, map it to a more usable format
    if (Array.isArray(posts)) {
      return posts.map(post => ({
        id: post[0].toString(), // Convert BigInt to string
        author: post[1],
        content: post[2],
        timestamp: post[3].toString(), // Convert BigInt to string
        likes: post[4].toString() // Convert BigInt to string
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching user posts:', error);
    // Return empty array on error
    return [];
  }
}

// Get list of addresses a user is following
export async function getFollowing(userAddress: string) {
  try {
    const chainSocialContract = getChainSocialContract();
    const following = await chainSocialContract.read.getFollowing([userAddress as `0x${string}`]) as string[];
    return following || [];
  } catch (error) {
    console.error('Error fetching following list:', error);
    return [];
  }
}

// Check if one user is following another
export async function isFollowing(followerAddress: string, followedAddress: string) {
  try {
    const chainSocialContract = getChainSocialContract();
    const following = await chainSocialContract.read.isFollowing([
      followerAddress as `0x${string}`,
      followedAddress as `0x${string}`
    ]) as boolean;
    return !!following;
  } catch (error) {
    console.error('Error checking following status:', error);
    return false;
  }
}

// Check if a user has liked a post
export async function hasLiked(postId: number, userAddress: string) {
  try {
    const chainSocialContract = getChainSocialContract();
    const liked = await chainSocialContract.read.hasLiked([
      BigInt(postId),
      userAddress as `0x${string}`
    ]) as boolean;
    return !!liked;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

