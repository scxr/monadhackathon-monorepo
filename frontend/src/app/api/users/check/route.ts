import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    
    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // For now, always return false to indicate user doesn't exist
    // In a real implementation, you would check your database
    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
} 