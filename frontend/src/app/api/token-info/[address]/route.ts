import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = await params; 
  

  let response = await fetch(`http://localhost:3000/blockchain/token-info/${address}`);
  let data = await response.json();

  console.log(data);

  return NextResponse.json(data);
}

