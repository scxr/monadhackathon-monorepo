import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { address: string } }) {
    const { address } = await params;
    
    
}

export async function POST(request: Request) {
    const { address, followerAddress } = await request.json();

    let response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/simulate/unfollow-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userAddress: address,
            user: followerAddress
        })
    })

    let data = await response.json()

    return NextResponse.json({
        success: true,
        message: 'User unfollowed successfully',
        data: data
    })
}
