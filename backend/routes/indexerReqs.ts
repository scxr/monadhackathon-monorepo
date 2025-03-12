import {Elysia, t} from 'elysia';
import * as indexerReqs from '../utils/indexerFuncs';
import { cors } from '@elysiajs/cors';

export const indexerReqsRoutes = new Elysia({ prefix: '/data' })
    .use(cors({
        origin: '*', // Be more restrictive in production
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }))
    .get('/all-posts', async () => {
        return await indexerReqs.getAllPosts();
    }, {
        response: {
            200: t.Object({
                posts: t.Array(t.Object({
                    id: t.Number(),
                    content: t.String(),
                    author: t.String(),
                    timestamp: t.String(),
                    likes: t.Number()
                }))
            }),
            400: t.Object({
                error: t.String(),
                message: t.String()
            })
        },
        tags: ['IndexerReqs']
    })
    .get('/posts-by-user/:address', async ({ params }) => {
        return await indexerReqs.getPostsByUser(params.address);
    }, {
        response: {
            200: t.Object({
                posts: t.Array(t.Object({
                    id: t.Number(),
                    content: t.String(),
                    author: t.String(),
                    timestamp: t.String(),
                    likes: t.Number()
                }))
            }),
            400: t.Object({
                error: t.String(),
                message: t.String()
            })
        },
        tags: ['IndexerReqs'],
        params: t.Object({
            address: t.String()
        })
    })
    .get('/posts-with-offset-and-limit/:offset/:limit', async ({ params }) => {
        return await indexerReqs.getPostsWithOffsetAndLimit(Number(params.offset), Number(params.limit));
    }, {
        response: {
            200: t.Object({
                posts: t.Array(t.Object({
                    id: t.Number(),
                    content: t.String(),
                    author: t.String(),
                    timestamp: t.String(),
                    likes: t.Number()
                }))
            }),
            400: t.Object({
                error: t.String(),
                message: t.String()
            })
        },
        tags: ['IndexerReqs'],
        params: t.Object({
            offset: t.String(),
            limit: t.String()
        })
    })
    .get('/post/:id', async ({ params }) => {
        return await indexerReqs.getPostById(Number(params.id));
    }, {
        response: {
            200: t.Object({
                post: t.Object({
                    id: t.Number(),
                    content: t.String(),
                    author: t.String(),
                    timestamp: t.String(),
                    likes: t.Number()
                })
            }),
            400: t.Object({
                error: t.String(),  
                message: t.String()
            })
        },
        tags: ['IndexerReqs'],
        params: t.Object({
            id: t.String()
        })
    })
    .get('/following/:address', async ({ params }) => {
        const result = await indexerReqs.getFollowing(params.address);
        return {
            following: result.following.map(address => ({ address })),
            unfollowed: result.unfollowed.map(address => ({ address }))
        };
    }, {
        response: {
            200: t.Object({
                following: t.Array(t.Object({
                    address: t.String()
                })),
                unfollowed: t.Array(t.Object({
                    address: t.String()
                }))
            }),
            400: t.Object({
                error: t.String(),
                message: t.String()
            })
        },
        tags: ['IndexerReqs'],
        params: t.Object({
            address: t.String()
        })
    })
    .get('/following-posts/:address', async ({ params }) => {
        return await indexerReqs.getFollowingPosts(params.address);
    }, {
        response: {
            200: t.Object({
                posts: t.Array(t.Object({
                    id: t.Number(),
                    content: t.String(),
                    author: t.String(),
                    timestamp: t.String(),
                    likes: t.Number()
                }))
            }),
            400: t.Object({
                error: t.String(),
                message: t.String()
            })
        },
        tags: ['IndexerReqs'],
        params: t.Object({
            address: t.String()
        })
    })
    .get('/user-posts/:address', async ({ params }) => {
        return await indexerReqs.getUserPosts(params.address);
    }, {
        response: {
            200: t.Object({
                posts: t.Array(t.Object({
                    id: t.Number(),
                    content: t.String(),
                    author: t.String(),
                    timestamp: t.String(),
                    likes: t.Number()
                }))
            }),
            400: t.Object({
                error: t.String(),
                message: t.String()
            })
        },
        tags: ['IndexerReqs'],
        params: t.Object({
            address: t.String()
        })
    });

