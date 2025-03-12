import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    let side = "buy"
  const { address, amount, userAddress } = await request.json();

  // Simulate API call with 5 second delay
//   await new Promise(resolve => setTimeout(resolve, 5000));  
    let response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/transaction/trade`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            side: side,
            amount: amount,
            token: address,
            user: userAddress
        })
    });
    let data = await response.json();
    console.log(data);

  return NextResponse.json({
    success: true,
    message: `Successfully purchased ${amount} MON tokens for address ${address}`,
    data: data
  });
}


