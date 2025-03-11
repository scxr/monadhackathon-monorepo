# Chain Social

### What is it? 

Chain social is a 100% on-chain social media platform akin to X.com, users can follow, like, comment, and post there own content along with buying/viewing tokens from within the actual platform. Everything from likes, to posts are verifiable on chain, even profile pictures are stored in ipfs and the hash is further stored in the contract too. It has been made to try and mask the onchain interactions so users dont feel the impact of chain calls with Monad helps with alot considering its blazing fast.  One method used to do this is optimistically rendering the frontend, we assume every call will succeed, in the case it doesn't its fixed but more often than not this is a good time save with no drawbacks.

### Tech stack

Lets get into the actual juicy information, the following technologies have been utilised for this project:

- Bun (Run time)
- Typescript (Language)
- Nextjs (Front-end framework with backend calls)
- Elysiajs (Back-end framework)
- Envio (Contract events indexer)
- Solidity (Smart contract code)

For the backend Bun is used along with [ElysiaJs](https://elysiajs.com/) for maximum speed and response times, on average (with user caching) we see sub 50ms response times even on complex queries. [Envio](https://envio.dev) helps a lot with the speed too, instead of querying directly from the contract which would take a few hundred ms we can just use GQL queries which helps the faster queries.

### Bounty services used

- Privy
- Envio
- 0x apis

Privy was used for user creation, a further tactic to hide on chain interactions, the only time a user has to actually do anything themselves on chain is when they deposit to there chain-social address.

Envio was used as previously stated was used for indexing/fetching events from the contract

0x was used so users could buy tokens from posts directly on the platform, and fetch the info too for prices.

### Project structure

<u>Backend</u>

backend
- abis
	- Abi of the chainsocial contract
- models
	- Legacy, not in use currently as i switched to using envio for more "on chain" brevity
- routes
	- Where the routes are loaded onto the router, all routes are loaded here, there is a readme in the backend directory detailing the endpoints
- scripts
	- Scripts that were used for generating data, i.e a create_post script that was used to generate 100s of posts for testing purposes
- utils
	- For modularity all routes use functions made in the files stored here, IE indexerFuncs contains all functions related to querying the envio database

<u>Frontend</u>

frontend
- src/app/api
	- Backend functions that call endpoints from the elysia backend for simplicity on frontend design
- src/post/[id]
	- Page that is rendered when an individual post is clicked
- src/profile/[address]
	- Page that is rendered when a user that isnt the current active users page is loaded
- src/profile
	- Page that is rendered when a user views there own profile
- components
	- Regular pages
- lib
	- Configs needed for frontend, specifically privy config

<u>ContractHH</u>

contractsHH
- contracts
	- Contracts used for chain social, only one, ChainSocial.sol
- scripts
	- Deployment and code verification scripts
- test
	- Tests written for all functions of the contract

<u>Chain social indexer</u>

This is mostly generated code by envio for indexing the contract events


### How it looks

__Homepage__
![Homepage](https://imgur.com/CPfKcCg.png)

__Token Info__
![enter image description here](https://imgur.com/zPxtnbW.png)

__Profile Page__
![enter image description here](https://imgur.com/fHD2kAw.png)

__Buy Profile__
![enter image description here](https://imgur.com/9pKxW6Y.png)

And much more :)