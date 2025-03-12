import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = await params; 
  

  let response = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/blockchain/token-info/${address}`);
  let data = await response.json();

  console.log(data);

  return NextResponse.json(data);
}

