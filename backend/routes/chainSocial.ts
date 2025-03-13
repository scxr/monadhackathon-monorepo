import { Elysia, t } from 'elysia';
import * as chainSocialFuncs from '../utils/chainSocialViewFuncs';
import * as chainSocialWriteFuncs from '../utils/chainSocialWriteFuncs';
import { uploadBase64ToIPFS } from '../utils/ipfs';
import { cors } from '@elysiajs/cors';

// Social networking API routes for on-chain social interactions
export const chainSocialRoutes = new Elysia({ 
  prefix: '/chain-social',
})
  .use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }))
  // Fetch user profile data by wallet address
  // Returns username, bio, and profile picture if available
  .get('/user/:address', async ({ params }) => {
    try {
      const user = await chainSocialFuncs.getUser(params.address);
      return { user };
    } catch (error) {
      return { error: 'Failed to get user', message: (error as Error).message };
    }
  })

  // Update user profile information
  // Handles both text bio updates and profile picture uploads
  .put('/user/:address', async ({ params, body }) => {
    try {
      const { bio, pfpImage } = body as { bio: string; pfpImage?: string };
      console.log("bio: ", bio)
      console.log("pfpImage: ", pfpImage)
      // Check if we have a base64 image
      let pfpLink = '';
      if (pfpImage && pfpImage.includes('base64')) {
        // Generate a unique filename
        const fileName = `profile_${params.address}_${Date.now()}.jpg`;
        
        // Upload the image to IPFS
        const ipfsHash = await uploadBase64ToIPFS(pfpImage, fileName);
        
        // Create the IPFS link
        pfpLink = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        console.log(`Image uploaded to IPFS: ${pfpLink}`);
      } else if (body && (body as any).pfpLink) {
        // If pfpLink is directly provided, use it
        pfpLink = (body as any).pfpLink;
      }
      
      // Update the user with the new bio and pfpLink
      const result = await chainSocialWriteFuncs.updateUser(bio, pfpLink);
      return { ...result, pfpLink };
    } catch (error) {
      console.error('Error updating user:', error);
      return { error: 'Failed to update user', message: (error as Error).message };
    }
  })

  .post('/simulate/create-user', async ({ body }) => {
    try {
      // Extract parameters from request body
      const { userAddress, username, bio, pfpImage } = body as {
        userAddress: string;
        username: string;
        bio: string;
        pfpImage: string;
      };

      // console.log("pfpImage: ", pfpImage)

      let pfpLink = '';
      if (pfpImage && pfpImage.includes('base64')) {
        // Generate a unique filename
        const fileName = `profile_${userAddress}_${Date.now()}.jpg`;
        
        // Upload the image to IPFS
        const ipfsHash = await uploadBase64ToIPFS(pfpImage, fileName);
        pfpLink = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        console.log(`Image uploaded to IPFS: ${pfpLink}`);
        
      } 
      
      // Validate required parameters
      if (!userAddress || !username) {
        console.log("Missing required parameters")
        return { 
          error: 'Missing required parameters', 
          message: 'userAddress and username are required' 
        };
      }
      console.log("userAddress: ", userAddress)
      console.log("username: ", username)
      console.log(userAddress,
        username,
        bio || '',
        pfpLink || '')
      // Simulate user creation
      const result = await chainSocialFuncs.simulateCreateUser(
        userAddress,
        username,
        bio || '',
        pfpLink || ''
      );
      console.log("result: ", result)
      return result;
    } catch (error) {
      console.error("error: ", error)
      return { error: 'Failed to simulate user creation', message: (error as Error).message };
    }
  }, {
    // response: {
    //   200: t.Object({
    //     success: t.Optional(t.Boolean()),
    //     estimatedGas: t.Optional(t.String()),
    //     transactionData: t.Optional(t.String()),
    //     contractAddress: t.Optional(t.String()),
    //     error: t.Optional(t.String())
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // body: t.Object({
    //   userAddress: t.String(),
    //   username: t.String(),
    //   bio: t.String(),
    //   pfpImage: t.Optional(t.String())
    // })
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
  }, {
    // response: {
    //   200: t.Object({ 
    //     post: t.Object({
    //       id: t.String(),
    //       author: t.String(),
    //       content: t.String(),
    //       timestamp: t.String(),
    //       likes: t.String()
    //     })
    //   }),
    //   400: t.Object({
    //     error: t.Optional(t.String()),
    //     message: t.Optional(t.String())
    //   })
    // },
    // tags: ['ChainSocial'],
    // params: t.Object({
    //   id: t.String()
    // })
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
  }, {
    // response: {
    //   200: t.Object({
    //     comments: t.Array(t.Object({
    //       id: t.String(),
    //       content: t.String(),
    //       author: t.String(),
    //       timestamp: t.String()
    //     }))
    //   }),
    //   400: t.Object({
    //     error: t.Optional(t.String()),
    //     message: t.Optional(t.String())
    //   })
    // },
    // tags: ['ChainSocial'],
    // params: t.Object({
    //   id: t.String()
    // })
  })
  
  // Get user posts with pagination
  .get('/user/:address/posts', async ({ params, query }) => {
    try {
      const offset = query?.offset ? parseInt(query.offset as unknown as string) : 0;
      const limit = query?.limit ? parseInt(query.limit as unknown as string) : 10;
      
      const posts = await chainSocialFuncs.getUserPosts(params.address, offset, limit);
      
      return { 
        posts,
        pagination: { offset, limit }
      };
    } catch (error) {
      return { error: 'Failed to get user posts', message: (error as Error).message };
    }
  }, {
    // response: {
    //   200: t.Object({
    //     posts: t.Array(t.Object({
    //       id: t.String(),
    //       content: t.String(),
    //       author: t.String(),
    //       timestamp: t.String(),
    //       likes: t.String()
    //     })),
    //     pagination: t.Object({
    //       offset: t.Number(),
    //       limit: t.Number()
    //     })
    //   }),
    //   400: t.Object({
    //     error: t.Optional(t.String()),
    //     message: t.Optional(t.String())
    //   })
    // },
    // tags: ['ChainSocial'],
    // query: t.Object({
    //   offset: t.Number()  ,
    //   limit: t.Number()
    // }),
    // params: t.Object({
    //   address: t.String()
    // })
  })
  

  // Get following list
  .get('/user/:address/following', async ({ params }) => {
    try {
      const following = await chainSocialFuncs.getFollowing(params.address);
      return { following };
    } catch (error) {
      return { error: 'Failed to get following list', message: (error as Error).message };
    }
  }, {
    // response: {
    //   200: t.Object({
    //     following: t.Array(t.Object({
    //       address: t.String()
    //     }))
    //   }),
    //   400: t.Object({
    //     error: t.Optional(t.String()),
    //     message: t.Optional(t.String())
    //   })
    // },
    // tags: ['ChainSocial'],
    // params: t.Object({
    //   address: t.String()
    // })
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
  }, {
    // response: {
    //   200: t.Object({
    //     isFollowing: t.Boolean()
    //   }),
    //   400: t.Object({
    //     error: t.Optional(t.String()),
    //     message: t.Optional(t.String())
    //   })
    // },
    // tags: ['ChainSocial'],
    // params: t.Object({
    //   follower: t.String(),
    //   followed: t.String()
    // })
  })
  
  // Simulate post creation
  .post('/simulate/create-post', async ({ body }) => {
    try {
      console.log('Creating post...');  
      const { content, userAddress } = body as { content: string; userAddress: string };
      console.log("content: ", content)
      console.log("userAddress: ", userAddress)
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
  }, {
    // response: {
    //   200: t.Object({
    //     success: t.Optional(t.Boolean()),
    //     estimatedGas: t.Optional(t.String()),
    //     transactionData: t.Optional(t.String()),
    //     contractAddress: t.Optional(t.String()),
    //     error: t.Optional(t.String())
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // body: t.Object({
    //   content: t.String(),
    //   userAddress: t.String()
    // })
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
  }, {
    // response: {
    //   200: t.Object({
    //     success: t.Optional(t.Boolean()),
    //     estimatedGas: t.Optional(t.String()),
    //     transactionData: t.Optional(t.String()),
    //     contractAddress: t.Optional(t.String()),
    //     error: t.Optional(t.String())
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // body: t.Object({
    //   postId: t.Number()
    // })
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
  }, {
    // response: { 
    //   200: t.Object({
    //     success: t.Optional(t.Boolean()),
    //     estimatedGas: t.Optional(t.String()),
    //     transactionData: t.Optional(t.String()),
    //     contractAddress: t.Optional(t.String()),
    //     error: t.Optional(t.String())
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // body: t.Object({
    //   postId: t.Number(),
    //   content: t.String()
    // })
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
  }, {
    // response: {
    //   200: t.Object({
    //     success: t.Optional(t.Boolean()),
    //     estimatedGas: t.Optional(t.String()),
    //     transactionData: t.Optional(t.String()),
    //     contractAddress: t.Optional(t.String()),
    //     error: t.Optional(t.String())
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // body: t.Object({
    //   transactionHash: t.String()
    // })
  })
  
  // Decode all events from a transaction
  .get('/events/:txHash', async ({ params }) => {
    try {
      const events = await chainSocialFuncs.decodeChainSocialEvents(params.txHash);
      return events;
    } catch (error) {
      return { error: 'Failed to decode events', message: (error as Error).message };
    }
  }, {
    // response: {
    //   200: t.Object({
    //     transactionHash: t.String(),
    //     events: t.Array(
    //       t.Object({
    //         eventName: t.Optional(t.String()),
    //         args: t.Optional(t.Any()),
    //         rawLog: t.Optional(t.Any()),
    //         error: t.Optional(t.String())
    //       })
    //     )
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })  
    // },
    // tags: ['ChainSocial'],
    // params: t.Object({
    //   txHash: t.String()
    // })
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
  }, {
    // response: {
    //   200: t.Object({
    //     transactionHash: t.String(),
    //     events: t.Array(
    //       t.Object({
    //         eventName: t.Optional(t.String()),
    //         args: t.Optional(t.Any()),
    //         rawLog: t.Optional(t.Any()),
    //         error: t.Optional(t.String())
    //       })
    //     )
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // params: t.Object({
    //   txHash: t.String(),
    //   eventName: t.String()
    // })
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
  }, {
    // response: {
    //   200: t.Object({
    //     hasLiked: t.Boolean()
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // params: t.Object({
    //   postId: t.String(),
    //   address: t.String()
    // })
  })

  .get("/simulate/follow-user/:userAddress", async ({ params }) => {
    try {
      const { userAddress } = params as { userAddress: string };
      const result = await chainSocialWriteFuncs.followUser(userAddress);
      return result;
    } catch (error) {
      console.error(error);
      return { error: 'Failed to simulate follow user', message: (error as Error).message };
    }
  }, {
    // response: {
    //   200: t.Object({
    //     success: t.Optional(t.Boolean()),
    //     estimatedGas: t.Optional(t.String()),
    //     transactionData: t.Optional(t.String()),
    //     contractAddress: t.Optional(t.String()),
    //     error: t.Optional(t.String())
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // params: t.Object({
    //   userAddress: t.String(),
    // })
  })
  
  .post("/simulate/unfollow-user", async ({ body }) => {
    try {
      const { userAddress, user } = body as { userAddress: string, user: string };
      const result = await chainSocialWriteFuncs.unfollowUser(userAddress, user);
      return result;
    } catch (error) {
      console.error(error);
      return { error: 'Failed to simulate unfollow user', message: (error as Error).message };
    }
  }, {
    // response: {
    //   200: t.Object({
    //     success: t.Optional(t.Boolean()),
    //     estimatedGas: t.Optional(t.String()),
    //     transactionData: t.Optional(t.String()),
    //     contractAddress: t.Optional(t.String()),
    //     error: t.Optional(t.String())
    //   }),
    //   400: t.Object({
    //     error: t.String(),
    //     message: t.String()
    //   })
    // },
    // tags: ['ChainSocial'],
    // body: t.Object({
    //   userAddress: t.String(),
    //   user: t.String()
    // })
  })  
  ;
