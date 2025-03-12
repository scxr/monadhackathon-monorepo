import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { postId } = await req.json();
    let response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/simulate/like-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        postId: postId
      })
    })
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    );
  }
} 