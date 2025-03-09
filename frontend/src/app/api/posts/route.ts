import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const { content, authorAddress } = await req.json();
    
    if (!content || !authorAddress) {
      return NextResponse.json(
        { error: 'Content and author address are required' },
        { status: 400 }
      );
    }

    const post = {
      id: `post_${Date.now()}`,
      content,
      authorAddress,
      timestamp: Date.now(),
      likes: 0,
    };

    await kv.hset(`post:${post.id}`, post);
    await kv.zadd('posts_by_time', { score: post.timestamp, member: post.id });
    
    revalidatePath('/api/posts');
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const postIds = await kv.zrange('posts_by_time', 0, 20, { rev: true });
    const posts = await Promise.all(
      postIds.map(async (id) => {
        const post = await kv.hgetall(`post:${id}`);
        return post;
      })
    );

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
} 