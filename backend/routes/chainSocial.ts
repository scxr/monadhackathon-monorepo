import { Elysia } from 'elysia';
import * as chainSocialFuncs from '../utils/chainSocialViewFuncs';
import * as chainSocialWriteFuncs from '../utils/chainSocialWriteFuncs';

// Create ChainSocial-related routes
export const chainSocialRoutes = new Elysia({ prefix: '/chain-social' })

.get('/user/:address', async ({ params }) => {
    try {
      const user = await chainSocialFuncs.getUser(params.address);
      return { user };
    } catch (error) {
      return { error: 'Failed to get user', message: (error as Error).message };
    }
  })
  

  .post('/simulate/create-user', async ({ body }) => {
    try {
      // Extract parameters from request body
      const { userAddress, username, bio, pfpLink } = body as {
        userAddress: string;
        username: string;
        bio: string;
        pfpLink: string;
      };
      
      // Validate required parameters
      if (!userAddress || !username) {
        return { 
          error: 'Missing required parameters', 
          message: 'userAddress and username are required' 
        };
      }
      
      // Simulate user creation
      const result = await chainSocialFuncs.simulateCreateUser(
        userAddress,
        username,
        bio || '',
        pfpLink || ''
      );
      
      return result;
    } catch (error) {
      return { error: 'Failed to simulate user creation', message: (error as Error).message };
    }
  })
  
  // Get a post by ID
  .get('/post/:id', async ({ params }) => {
    try {
      const postId = parseInt(params.id);
      const post = await chainSocialFuncs.getPost(postId);
      return { post };
    } catch (error) {
      return { error: 'Failed to get post', message: (error as Error).message };
    }
  })
  
  // Get comments for a post
  .get('/post/:id/comments', async ({ params }) => {
    try {
      const postId = parseInt(params.id);
      const comments = await chainSocialFuncs.getPostComments(postId);
      return { comments };
    } catch (error) {
      return { error: 'Failed to get comments', message: (error as Error).message };
    }
  })
  
  // Get user posts with pagination
  .get('/user/:address/posts', async ({ params, query }) => {
    try {
      const offset = query?.offset ? parseInt(query.offset as string) : 0;
      const limit = query?.limit ? parseInt(query.limit as string) : 10;
      
      const posts = await chainSocialFuncs.getUserPosts(params.address, offset, limit);
      
      return { 
        posts,
        pagination: { offset, limit }
      };
    } catch (error) {
      return { error: 'Failed to get user posts', message: (error as Error).message };
    }
  })
  
  // Get following list
  .get('/user/:address/following', async ({ params }) => {
    try {
      const following = await chainSocialFuncs.getFollowing(params.address);
      return { following };
    } catch (error) {
      return { error: 'Failed to get following list', message: (error as Error).message };
    }
  })
  
  // Check if user is following another user
  .get('/does-follow/:follower/:followed', async ({ params }) => {
    try {
      const isFollowing = await chainSocialFuncs.isFollowing(
        params.follower,
        params.followed
      );
      return { isFollowing };
    } catch (error) {
      return { error: 'Failed to check following status', message: (error as Error).message };
    }
  })
  
  // Simulate post creation
  .post('/simulate/create-post', async ({ body }) => {
    try {
      console.log('Creating post...');  
      const { content, userAddress } = body as { content: string; userAddress: string };
      
      if (!content) {
        return { 
          error: 'Missing required parameters', 
          message: 'content is required' 
        };
      }
      
      const result = await chainSocialFuncs.simulateCreatePost(userAddress || '0x0', content);
      return result;
    } catch (error) {
      return { error: 'Failed to simulate post creation', message: (error as Error).message };
    }
  })

  .post('/simulate/like-post', async ({ body }) => {
    console.log("hi")
    console.log("body: ", body)
    try {
      console.log("hi")
      const { postId } = body as { postId: number };
      console.log("Post id: ", postId);
      if (!postId) {
        return { 
          error: 'Missing required parameters', 
          message: 'postId is required' 
        };
      }
      
      const result = await chainSocialWriteFuncs.likePost(postId);
      return result;
    } catch (error) {
      console.error(error);
      return { error: 'Failed to simulate like post', message: (error as Error).message };
    }
  })

  .post('/simulate/add-comment', async ({ body }) => {
    try {
      const { postId, content } = body as { postId: number; content: string };
      if (!postId || !content) {
        return { 
          error: 'Missing required parameters', 
          message: 'postId and content are required' 
        };
      }
      
      const result = await chainSocialWriteFuncs.addComment(postId, content);
      return result;
    } catch (error) {
      console.error(error);
      return { error: 'Failed to simulate add comment', message: (error as Error).message };
    }
  })
  
  

  // Confirm post creation and decode events
  .post("/confirm/create-post", async ({ body }) => {
    try {
      // Check if body exists and is an object
      if (!body || typeof body !== 'object') {
        return { 
          error: 'Invalid request body', 
          message: 'Request body must be a valid JSON object' 
        };
      }
      
      // Type the body object properly
      const requestBody = body as Record<string, unknown>;
      const transactionHash = requestBody.transactionHash as string;
      
      if (!transactionHash) {
        return { 
          error: 'Missing required parameters', 
          message: 'transactionHash is required' 
        };
      }
      
      const result = await chainSocialWriteFuncs.confirmCreatePost(transactionHash);
      return result;
    } catch (error) {
      console.error(error);
      return { error: 'Failed to confirm post creation', message: (error as Error).message };
    }
  })
  
  // Decode all events from a transaction
  .get('/events/:txHash', async ({ params }) => {
    try {
      const events = await chainSocialFuncs.decodeChainSocialEvents(params.txHash);
      return events;
    } catch (error) {
      return { error: 'Failed to decode events', message: (error as Error).message };
    }
  })
  
  // Get events of a specific type from a transaction
  .get('/events/:txHash/:eventName', async ({ params }) => {
    try {
      const events = await chainSocialFuncs.getChainSocialEventsByType(
        params.txHash,
        params.eventName
      );
      return events;
    } catch (error) {
      return { error: 'Failed to get events by type', message: (error as Error).message };
    }
  })
  
  // Check if user has liked a post
  .get('/user/:address/liked/:postId', async ({ params }) => {
    try {
      const postId = parseInt(params.postId);
      const hasLiked = await chainSocialFuncs.hasLiked(postId, params.address);
      return { hasLiked };
    } catch (error) {
      return { error: 'Failed to check like status', message: (error as Error).message };
    }
  });
