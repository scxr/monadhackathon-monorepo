import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const {address} = await params;
    
    // Generate mock posts for this user
    let posts = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/data/user-posts/${address}`);
    let data = await posts.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user posts' },
      { status: 500 }
    );
  }
}

function generateMockPosts(address: string) {
  const postCount = Math.floor(Math.random() * 10) + 1; // 1-10 posts
  const posts = [];
  
  const username = `User_${address.substring(0, 6)}`;
  const handle = `@${username.toLowerCase()}`;
  const avatar = `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 8) + 1}.jpg`;
  
  const topics = [
    "Just deployed my first smart contract! #blockchain #ethereum",
    "Learning about zero-knowledge proofs today. Mind blown! 🤯",
    "Web3 is the future of the internet. Change my mind.",
    "Decentralization is not just a technical choice, it's a philosophy.",
    "Tokenomics is the new economics. Fascinating field!",
    "NFTs are more than just digital art. They're about ownership in the digital age.",
    "DAOs will revolutionize organizational structures. No more hierarchies!",
    "Interoperability between blockchains is the next big challenge.",
    "Layer 2 solutions are making blockchain scalable. Exciting times!",
    "Smart contracts are eating the world, one industry at a time."
  ];
  
  for (let i = 0; i < postCount; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in the last 30 days
    
    posts.push({
      id: i + 1,
      postId: `${address.substring(0, 6)}_${i + 1}`,
      username,
      handle,
      avatar,
      content: topics[i % topics.length],
      time: formatDate(date),
      comments: {
        commentCount: Math.floor(Math.random() * 5),
        comments: []
      },
      reposts: Math.floor(Math.random() * 10),
      user: {
        username,
        id: address
      },
      likes: {
        likeCount: Math.floor(Math.random() * 20),
        likers: []
      }
    });
  }
  
  return posts;
}

function formatDate(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
} 