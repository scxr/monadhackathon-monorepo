import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = await context.params;
    
    // Get post data
    const post = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/data/post/${id}`);
    const postData = await post.json();

    if (!postData) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Get like count
    const likeCount = postData.likes.likeCount;
    
    // Get comments (if implemented)
    // const comments = await kv.lrange(`post:${id}:comments`, 0, -1);
    
    return NextResponse.json({
      ...postData,
      likes: likeCount || 0,
      // comments: comments || []
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
} 