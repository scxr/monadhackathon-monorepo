import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await request.json();
    const {id: postId} = await params;

    console.log(`Making comment on post ${postId} with content ${content}`);

    let comment = await fetch(`https://spirited-nourishment-production-8fb5.up.railway.app/chain-social/simulate/add-comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        postId: postId,
        content: content
      })
    })

    let commentData = await comment.json();

    console.log(commentData);

    // TODO: Add validation for the comment content
    // - Check if content is not empty
    // - Check if content length is within limits
    // - Check if post exists

    // TODO: Add database operations
    // - Insert the new comment into the database
    // - Update the post's comment count
    // - Associate the comment with the user who posted it

    // TODO: Add blockchain transaction
    // - Create the transaction data for the comment
    // - Return the transaction data to be signed by the user

    // For now, return mock data
    return NextResponse.json({
      success: true,
      commentData: commentData
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
} 