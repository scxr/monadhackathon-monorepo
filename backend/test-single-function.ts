import { publicClient } from './index';
import { getContract } from 'viem';
import ChainSocialABI from './abis/ChainSocial.json';

// Contract address for the ChainSocial contract
const CHAIN_SOCIAL_ADDRESS = '0xcCB869B793B231dB5a2aA7c1bbCB5297DC3F6288' as `0x${string}`;

// Test address - replace with a valid address that has data on the contract
const TEST_ADDRESS = '0xcCB869B793B231dB5a2aA7c1bbCB5297DC3F6288';
const TEST_POST_ID = 1;

// Custom replacer function for JSON.stringify to handle BigInt
const jsonReplacer = (key: string, value: any) => {
  // Convert BigInt to string
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

async function main() {
  console.log('🔍 Testing a single contract function');
  console.log('Contract address:', CHAIN_SOCIAL_ADDRESS);
  
  try {
    // Create contract instance
    const contract = getContract({
      address: CHAIN_SOCIAL_ADDRESS,
      abi: ChainSocialABI,
      client: publicClient,
    });
    
    console.log('Contract instance created successfully');
    
    // Test a specific function - uncomment the one you want to test
    
    // Test users mapping
    console.log('\nTesting users mapping...');
    const user = await contract.read.users([TEST_ADDRESS]);
    console.log('User result:', JSON.stringify(user, jsonReplacer, 2));
    
    // Test posts mapping
    // console.log('\nTesting posts mapping...');
    // const post = await contract.read.posts([BigInt(TEST_POST_ID)]);
    // console.log('Post result:', JSON.stringify(post, jsonReplacer, 2));
    
    // Test getPostComments function
    // console.log('\nTesting getPostComments function...');
    // const comments = await contract.read.getPostComments([BigInt(TEST_POST_ID)]);
    // console.log('Comments result:', JSON.stringify(comments, jsonReplacer, 2));
    
    // Test getUserPosts function
    // console.log('\nTesting getUserPosts function...');
    // const posts = await contract.read.getUserPosts([TEST_ADDRESS, BigInt(0), BigInt(5)]);
    // console.log('Posts result:', JSON.stringify(posts, jsonReplacer, 2));
    
    // Test getFollowing function
    // console.log('\nTesting getFollowing function...');
    // const following = await contract.read.getFollowing([TEST_ADDRESS]);
    // console.log('Following result:', JSON.stringify(following, jsonReplacer, 2));
    
    // Test isFollowing function
    // console.log('\nTesting isFollowing function...');
    // const isFollowing = await contract.read.isFollowing([TEST_ADDRESS, TEST_ADDRESS]);
    // console.log('Is following result:', isFollowing);
    
    // Test hasLiked function
    // console.log('\nTesting hasLiked function...');
    // const hasLiked = await contract.read.hasLiked([BigInt(TEST_POST_ID), TEST_ADDRESS]);
    // console.log('Has liked result:', hasLiked);
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the test
main().catch(error => {
  console.error('Unhandled error:', error);
}); 