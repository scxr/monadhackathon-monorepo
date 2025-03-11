import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = await params;

  return NextResponse.json({
    success: true,
    isFollowing: true
  });
  
}
