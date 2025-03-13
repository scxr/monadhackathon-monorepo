# Backend

### Blockchain routes

`GET blockchain/balance/:address`
Returns the balance of an address

`GET blockchain/gas-price`
Returns the current gas price


`GET blockchain/token-info/:address`
Returns token supply, decimals, name, symbol and prrice

### Chain-social Routes
Routes that interact directly with the chain-social contract

`GET chain-social/user/:address`
Returns a users username, bio, pfpLink, joinedAt, and if they exist

`PUT chain-social/user/:address`
Modifies a users bio and profile picture (after uploading it to ipfs) if supplied

`POST chain-social/simulate/create-user`
Returns the data required to sign and send to the contract for creating a user with desired parameters

`GET chain-social/post/:id`
Return a post by its id

`GET chain-social/post/:id/comments`
Return comments on a post by its id

`GET chain-social/user/:address/posts`
Returns the posts made by a specific user

`GET chain-social/user/:address/following`
Returns who a user is following directly called from the contract

`GET chain-social/does-follow/:follower/:followed`
Check if follower follows followed 

`POST chain-social/simulate/create-post`
Returns data that is required to sign and send to the contract for making a post of specified content

`POST chain-social/simulate/like-post`
Returns data that is required to sign and send to the contract for liking a specific post

`POST chain-social/simulate/add-comment`
Returns data that is required to sign and send to the contract for adding a comment to a specific post

`GET chain-social/user/:address/liked/:postId`
Check if a user liked a specific post

`GET chain-social/simulate/follow-user/:userAddress`
Returns data that is required to sign and send to the contract for following a user

`POST chain-social/simulate/unfollow-user`
Returns data that is required to sign and send to the contract for unfollowing a  user

## Indexer routes

`GET data/all-posts`
Return all posts made on the platform (not used)

`GET data/posts-by-user/:address`
Faster way of getting posts made by a user

`GET data/posts-with-offset-and-limit/:offset/:limit`
Return `limit` number of posts made after `offset`

`GET data/post/:id`
Return a post by its postId 

`GET data/following/:address`
Return who a user is following more efficiently

`GET data/following-posts/:address`
Return posts made by people a user is following

### Transaction routes

`POST transaction/trade`
Returns signable data for a user to submit a trade