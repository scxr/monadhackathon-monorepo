import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userAddress } = await req.json();
    const postId = params.id;

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }

    // Check if user has already liked the post
    const hasLiked = await kv.sismember(`post:${postId}:likes`, userAddress);
    if (hasLiked) {
      return NextResponse.json(
        { error: 'User has already liked this post' },
        { status: 400 }
      );
    }

    // Add user to post's likes set
    await kv.sadd(`post:${postId}:likes`, userAddress);
    
    // Increment post's like count
    await kv.hincrby(`post:${postId}`, 'likes', 1);

    revalidatePath('/api/posts');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    );
  }
} 