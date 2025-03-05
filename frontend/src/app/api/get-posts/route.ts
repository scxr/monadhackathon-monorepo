import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(req: Request) {
  try {
    // Get URL parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userAddress = url.searchParams.get('userAddress');
    
    let postIds;
    
    // If userAddress is provided, get posts for that specific user
    if (userAddress) {
      postIds = await kv.smembers(`user:${userAddress}:posts`);
      
      // Sort by timestamp (we'll need to fetch posts first to get timestamps)
      const postsWithTimestamps = await Promise.all(
        postIds.map(async (id) => {
          const post = await kv.hgetall(`post:${id}`);
          return { id, timestamp: post?.timestamp ? Number(post.timestamp) : 0 };
        })
      );
      
      // Sort by timestamp (descending)
      postsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply pagination
      postIds = postsWithTimestamps
        .slice(offset, offset + limit)
        .map(item => item.id);
    } else {
      // Get all posts sorted by time (newest first)
      postIds = await kv.zrange('posts_by_time', offset, offset + limit - 1, { rev: true });
    }
    
    // Fetch full post data for each ID
    const posts = await Promise.all(
      postIds.map(async (id) => {
        const post = await kv.hgetall(`post:${id}`);
        
        // Get like count
        const likeCount = await kv.scard(`post:${id}:likes`);
        
        return {
          ...post,
          likes: likeCount || 0
        };
      })
    );
    
    // Get total count for pagination
    const totalPosts = userAddress 
      ? await kv.scard(`user:${userAddress}:posts`)
      : await kv.zcard('posts_by_time');
    
    return NextResponse.json({
      posts,
      pagination: {
        total: totalPosts,
        offset,
        limit,
        hasMore: offset + posts.length < totalPosts
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 