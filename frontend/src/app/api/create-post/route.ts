import { NextResponse } from 'next/server';


export async function POST(req: Request) {
  try {

    const body = await req.json();

    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const response = await fetch(`http://localhost:3000/chain-social/simulate/create-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
      }),
    });

    console.log(response);

    const data = await response.json();

   
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

export async function GET(req: Request) {
  try {
    let params = new URL(req.url).searchParams;
    let txn = params.get('txn');
    const response = await fetch(`http://localhost:3000/chain-social/confirm/create-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionHash: txn,
      }),
    });

    const data = await response.json();

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
