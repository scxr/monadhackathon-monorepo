import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log("Creating profile");
    // Parse the request body
    const body = await request.json();
    const { walletAddress, username, bio, b64image } = body;

    // Validate required fields
    if (!walletAddress || !username) {
      return NextResponse.json(
        { message: 'Wallet address and username are required' },
        { status: 400 }
      );
    }
    
    // Forward the request to your localhost API
    const response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/simulate/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: walletAddress,
        username,
        bio,
        pfpImage: b64image
      }),
    });

    // console.log("Response", JSON.stringify({
    //     userAddress: walletAddress,
    //     username,
    //     bio,
    //     pfpImage: b64image
    //   })
    // );

    
    
    // Check if the request was successful
    if (!response.ok) {
        console.log("Failed to create profile", response);
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
        { message: errorData.message || 'Failed to create profile' },
        { status: response.status }
      );
    }
    
    // Return the successful response
    const data = await response.json();
    console.log("Successfully created profile");
    console.log(data);

    

    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in create-profile API route:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 