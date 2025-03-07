import {Elysia} from 'elysia';
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
    })
    .get('/posts-by-user/:address', async ({ params }) => {
        return await indexerReqs.getPostsByUser(params.address);
    })
    .get('/posts-with-offset-and-limit/:offset/:limit', async ({ params }) => {
        return await indexerReqs.getPostsWithOffsetAndLimit(Number(params.offset), Number(params.limit));
    })
    .get('/post/:id', async ({ params }) => {
        return await indexerReqs.getPostById(Number(params.id));
    })
    .get('/user-posts/:address', async ({ params }) => {
        return await indexerReqs.getUserPosts(params.address);
    });

