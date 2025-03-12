import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const userAddress = url.searchParams.get('address');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching following posts for user: ${userAddress}, offset: ${offset}, limit: ${limit}`);

    let response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/data/following-posts/${userAddress}`)
    let postsData = await response.json()
    return NextResponse.json(postsData);
  } catch (error) {
    console.error('Error fetching following posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch following posts' },
      { status: 500 }
    );
  }
} 