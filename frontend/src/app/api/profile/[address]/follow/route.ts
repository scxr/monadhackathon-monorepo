import { NextResponse } from 'next/server';

// Mock database for storing follow relationships
const followRelationships: Record<string, string[]> = {};

export async function POST(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = await params;
    const { followerAddress } = await request.json();
    
    // console.log("Follow/unfollow request for:", address, "follower:", followerAddress);


    
    if (!address || !followerAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    
    let response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/simulate/follow-user/${address}`, {
      method: 'GET',
    })
    
    let data = await response.json()
    console.log(data)
      // Follow
    // followRelationships[address].push(followerAddress);
    
    // console.log("User followed. Updated followers:", followRelationships[address]);
    
    return NextResponse.json({
      success: true,
      message: 'User followed successfully',
      isFollowing: true,
      data: data
    });
    
  } catch (error) {
    console.error('Error following/unfollowing user:', error);
    return NextResponse.json(
      { error: 'Failed to process follow request' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = await params;
    const url = new URL(request.url);
    const followerAddress = url.searchParams.get('followerAddress');
    
    let response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/data/following/${followerAddress}`, {
      method: 'GET',
    })
    
    let data = await response.json()
    console.log(data)

    let followingUsers = data.following.map((user: any) => user.toLowerCase())
    
    return NextResponse.json({
      success: true,
      isFollowing: followingUsers.includes(address?.toLowerCase() || '')
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
} 