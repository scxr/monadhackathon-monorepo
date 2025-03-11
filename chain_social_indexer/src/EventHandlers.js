/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const {
 ChainSocial,
} = require("generated");
BigInt.prototype.toJSON = function() {
  return this.toString();
};

ChainSocial.CommentAdded.handler(async ({event, context}) => {


  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    commentId: event.params.commentId,
    postId: event.params.postId,
    author: event.params.author,
    content: event.params.content,
    transactionHash: event.transaction.hash
  };

  context.ChainSocial_CommentAdded.set(entity);
});


ChainSocial.Followed.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    follower: event.params.follower,
    followed: event.params.followed,
  };

  context.ChainSocial_Followed.set(entity);
});


ChainSocial.PostCreated.handler(async ({event, context}) => {
  console.log(JSON.stringify(event, null, 2))
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    postId: event.params.postId,
    author: event.params.author,
    content: event.params.content,
    blockHash: event.block.hash
  };

  context.ChainSocial_PostCreated.set(entity);
});


ChainSocial.PostLiked.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    postId: event.params.postId,
    liker: event.params.liker,
  };

  context.ChainSocial_PostLiked.set(entity);
});


ChainSocial.Unfollowed.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    follower: event.params.follower,
    followed: event.params.followed,
  };

  context.ChainSocial_Unfollowed.set(entity);
});


ChainSocial.UserCreated.handler(async ({event, context}) => {
  console.log(JSON.stringify(event, null, 2))
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    userAddress: event.params.userAddress,
    username: event.params.username,
  };

  context.ChainSocial_UserCreated.set(entity);
});

