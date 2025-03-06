import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const posts = await fetch(`http://localhost:3000/data/posts-with-offset-and-limit/${offset}/${limit}`)
    const data = await posts.json();
    console.log(data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
} 