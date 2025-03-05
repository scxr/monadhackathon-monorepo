import * as chainSocialFuncs from './utils/chainSocialViewFuncs';

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

async function testFunction(name: string, fn: () => Promise<any>) {
  console.log(`\n📝 Testing ${name}...`);
  try {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    console.log(`✅ ${name} succeeded in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('Result:', JSON.stringify(result, jsonReplacer, 2));
    return result;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

async function runTests() {
  console.log('🧪 Running ChainSocial contract tests...');
  
  try {
    // Test getUser
    await testFunction('getUser', async () => {
      return await chainSocialFuncs.getUser(TEST_ADDRESS);
    });
    
    // Test simulateCreateUser
    await testFunction('simulateCreateUser', async () => {
      return await chainSocialFuncs.simulateCreateUser(
        TEST_ADDRESS,
        'testuser',
        'This is a test bio',
        'https://example.com/pfp.jpg'
      );
    });
    
    // Test getPost
    await testFunction('getPost', async () => {
      return await chainSocialFuncs.getPost(TEST_POST_ID);
    });
    
    // Test getPostComments
    await testFunction('getPostComments', async () => {
      return await chainSocialFuncs.getPostComments(TEST_POST_ID);
    });
    
    // Test getUserPosts
    await testFunction('getUserPosts', async () => {
      return await chainSocialFuncs.getUserPosts(TEST_ADDRESS, 0, 5);
    });
    
    // Test getFollowing
    await testFunction('getFollowing', async () => {
      return await chainSocialFuncs.getFollowing(TEST_ADDRESS);
    });
    
    // Test isFollowing
    await testFunction('isFollowing', async () => {
      return await chainSocialFuncs.isFollowing(TEST_ADDRESS, TEST_ADDRESS);
    });
    
    // Test hasLiked
    await testFunction('hasLiked', async () => {
      return await chainSocialFuncs.hasLiked(TEST_POST_ID, TEST_ADDRESS);
    });
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run the tests
console.log('Starting tests...');
runTests().catch(error => {
  console.error('Unhandled error in test suite:', error);
}); 