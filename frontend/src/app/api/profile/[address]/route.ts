import { NextResponse } from 'next/server';

// Mock database of user profiles
const userProfiles: Record<string, any> = {};

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    // const address = params.address.toLowerCase();
    const {address} = await params;

    let response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/user/${address}`);
    let data = await response.json();
  
    console.log(data);
  
    
    return NextResponse.json(data.user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const {address} = await params;
    const updates = await request.json();

    console.log(updates);
    // Validate updates
    const allowedFields = ['username', 'bio', 'pfp'];
    const validUpdates: Record<string, any> = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field];
      }
    }
    
    // Send the update to your API
    const response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/user/${address}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bio: updates.bio,
        pfpImage: updates.pfpBase64
      })
    });

    let data = await response.json();
    console.log(data);
    
    if (!data.transactionData) {
      throw new Error('Failed to update profile');
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

