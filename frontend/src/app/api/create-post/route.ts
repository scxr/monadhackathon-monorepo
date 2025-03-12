import { NextResponse } from 'next/server';


export async function POST(req: Request) {
  try {

    const body = await req.json();

    const { content, author } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/simulate/create-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        userAddress: author,
      }),
    });

    

    const data = await response.json();
    console.log(`Post created: ${JSON.stringify(data)}`);
   
    return NextResponse.json({ 
      success: true, 
      data: data.transactionData,
      gasEstimate: data.estimatedGas
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 

export async function GET(req: Request) {
  try {
    let params = new URL(req.url).searchParams;
    let txn = params.get('txn');
    const response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/confirm/create-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionHash: txn,
      }),
    });

    const data = await response.json();
    console.log(`Post confirmed: ${JSON.stringify(data)}`);
    return NextResponse.json({ 
      success: true, 
      data: data.transactionData
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
