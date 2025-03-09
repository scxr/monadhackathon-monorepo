import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const { postId, walletAddress, action = 'like' } = await req.json();
    
    if (!postId || !walletAddress) {
      return NextResponse.json(
        { error: 'Post ID and wallet address are required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const postExists = await kv.exists(`post:${postId}`);
    if (!postExists) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user has already liked the post
    const hasLiked = await kv.sismember(`post:${postId}:likes`, walletAddress);
    
    if (action === 'like' && hasLiked) {
      return NextResponse.json(
        { error: 'You have already liked this post' },
        { status: 400 }
      );
    }
    
    if (action === 'unlike' && !hasLiked) {
      return NextResponse.json(
        { error: 'You have not liked this post' },
        { status: 400 }
      );
    }

    if (action === 'like') {
      // Add user to post's likes set
      await kv.sadd(`post:${postId}:likes`, walletAddress);
    } else {
      // Remove user from post's likes set
      await kv.srem(`post:${postId}:likes`, walletAddress);
    }
    
    // Get updated like count
    const likeCount = await kv.scard(`post:${postId}:likes`);
    
    // Revalidate paths
    revalidatePath('/api/get-posts');
    
    return NextResponse.json({ 
      success: true,
      action,
      likeCount
    });
  } catch (error) {
    console.error('Error handling post like:', error);
    return NextResponse.json(
      { error: 'Failed to process like action' },
      { status: 500 }
    );
  }
} 