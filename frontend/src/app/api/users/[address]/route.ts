import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: Request,
  context: { params: { address: string } }
) {
  try {
    const { address } = await context.params;
    const response = await fetch(`http://localhost:3000/chain-social/user/${address}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = await response.json();
    if (userData.user.exists === false) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: { address: string } }
) {
  try {
    const { address } = context.params;
    const updates = await req.json();
    const allowedFields = ['username', 'bio', 'avatar'];
    
    // Filter out non-allowed fields
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    await kv.hset(`user:${address}`, sanitizedUpdates);
    
    revalidatePath(`/api/users/${address}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 