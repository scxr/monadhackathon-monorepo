import {Elysia, t} from 'elysia';
import * as indexerReqs from '../utils/indexerFuncs';
import { cors } from '@elysiajs/cors';

export const indexerReqsRoutes = new Elysia({ 
    prefix: '/data',
    
})
    .use(cors({
        origin: '*', // Be more restrictive in production
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }))
    // Get all posts from the envio database
    // Returns all posts in the envio database
    .get('/all-posts', async () => {
        return await indexerReqs.getAllPosts();
    }, {
        // response: {
        //     200: t.Object({
        //         posts: t.Array(t.Object({
        //             id: t.String(),
        //             content: t.String(),
        //             author: t.String(),
        //             timestamp: t.String(),
        //             likes: t.String()
        //         }))
        //     }),
        //     400: t.Object({
        //         error: t.String(),
        //         message: t.String()
        //     })
        // },
        tags: ['IndexerReqs']
    })
    // Get posts by user from the envio database
    // Returns all posts by a specific user
    .get('/posts-by-user/:address', async ({ params }) => {
        return await indexerReqs.getPostsByUser(params.address);
    }, {
        // response: {
        //     200: t.Object({
        //         posts: t.Array(t.Object({
        //             id: t.String(),
        //             content: t.String(),
        //             author: t.String(),
        //             timestamp: t.String(),
        //             likes: t.String()
        //         }))
        //     }),
        //     400: t.Object({
        //         error: t.String(),
        //         message: t.String()
        //     })
        // },
        // tags: ['IndexerReqs'],
        // params: t.Object({
        //     address: t.String()
        // })
    })
    // Get posts with offset and limit from the envio database
    // Returns posts with a specific offset and limit
    .get('/posts-with-offset-and-limit/:offset/:limit', async ({ params }) => {
        return await indexerReqs.getPostsWithOffsetAndLimit(Number(params.offset), Number(params.limit));
    }, {
        // response: {
        //     200: t.Object({
        //         posts: t.Array(t.Object({
        //             id: t.String(),
        //             content: t.String(),
        //             author: t.String(),
        //             timestamp: t.String(),
        //             likes: t.String()
        //         }))
        //     }),
        //     400: t.Object({
        //         error: t.String(),
        //         message: t.String()
        //     })
        // },
        // tags: ['IndexerReqs'],
        // params: t.Object({
        //     offset: t.String(),
        //     limit: t.String()
        // })
    })
    // Get post by id from the envio database
    // Returns a specific post by its id
    .get('/post/:id', async ({ params }) => {
        return await indexerReqs.getPostById(Number(params.id));
    }, {
        // response: {
        //     200: t.Object({
        //         post: t.Object({
        //             id: t.String(),
        //             content: t.String(),
        //             author: t.String(),
        //             timestamp: t.String(),
        //             likes: t.String()
        //         })
        //     }),
        //     400: t.Object({
        //         error: t.String(),  
        //         message: t.String()
        //     })
        // },
        // tags: ['IndexerReqs'],
        // params: t.Object({
        //     id: t.String()
        // })
    })
    // Get following from the envio database
    // Returns a list of addresses that the user is following
    .get('/following/:address', async ({ params }) => {
        const result = await indexerReqs.getFollowing(params.address);
        return {
            following: result.following.map(address => ({ address })),
            unfollowed: result.unfollowed.map(address => ({ address }))
        };
    }, {
        // response: {
        //     200: t.Object({
        //         following: t.Array(t.Object({
        //             address: t.String()
        //         })),
        //         unfollowed: t.Array(t.Object({
        //             address: t.String()
        //         }))
        //     }),
        //     400: t.Object({
        //         error: t.String(),
        //         message: t.String()
        //     })
        // },
        // tags: ['IndexerReqs'],
        // params: t.Object({
        //     address: t.String()
        // })
    })
    // Get following posts from the envio database
    // Returns all posts from the users that the user is following
    .get('/following-posts/:address', async ({ params }) => {
        return await indexerReqs.getFollowingPosts(params.address);
    }, {
        // response: {
        //     200: t.Object({
        //         posts: t.Array(t.Object({
        //             id: t.String(),
        //             content: t.String(),
        //             author: t.String(),
        //             timestamp: t.String(),
        //             likes: t.String()
        //         }))
        //     }),
        //     400: t.Object({
        //         error: t.String(),
        //         message: t.String()
        //     })
        // },
        // tags: ['IndexerReqs'],
        // params: t.Object({
        //     address: t.String()
        // })
    })
    // Get user posts from the envio database
    // Returns all posts by a specific user
    .get('/user-posts/:address', async ({ params }) => {
        return await indexerReqs.getUserPosts(params.address);
    }, {
        // response: {
        //     200: t.Object({
        //         posts: t.Array(t.Object({
        //             id: t.String(),
        //             content: t.String(),
        //             author: t.String(),
        //             timestamp: t.String(),
        //             likes: t.String()
        //         }))
        //     }),
        //     400: t.Object({
        //         error: t.String(),
        //         message: t.String()
        //     })
        // },
        // tags: ['IndexerReqs'],
        // params: t.Object({
        //     address: t.String()
        // })
    });

