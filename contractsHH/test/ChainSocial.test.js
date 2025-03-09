const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ChainSocial", function() {
  // Fixture to deploy the contract and set up test accounts
  async function deployChainSocialFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    const ChainSocial = await ethers.getContractFactory("ChainSocial");
    const chainSocial = await ChainSocial.deploy();
    
    return { chainSocial, owner, user1, user2, user3 };
  }

  describe("User Management", function() {
    it("should create a new user", async function() {
      const { chainSocial, user1 } = await loadFixture(deployChainSocialFixture);
      
      const tx = await chainSocial.connect(user1).createUser(
        "alice",
        "Web3 enthusiast",
        "ipfs://QmHash"
      );
      
      const receipt = await tx.wait();
      console.log(`Gas used for creating a user: ${receipt.gasUsed}`);
      
      expect(tx)
        .to.emit(chainSocial, "UserCreated")
        .withArgs(user1.address, "alice");

      const user = await chainSocial.getUser(user1.address);
      expect(user.username).to.equal("alice");
      expect(user.bio).to.equal("Web3 enthusiast");
      expect(user.pfpLink).to.equal("ipfs://QmHash");
      expect(user.exists).to.equal(true);
    });

    it("should not allow duplicate users", async function() {
      const { chainSocial, user1 } = await loadFixture(deployChainSocialFixture);
      
      await chainSocial.connect(user1).createUser("alice", "bio", "ipfs://QmHash");
      
      await expect(
        chainSocial.connect(user1).createUser("alice2", "bio2", "ipfs://QmHash2")
      ).to.be.revertedWith("User already exists");
    });

    it("should update user profile", async function() {
      const { chainSocial, user1 } = await loadFixture(deployChainSocialFixture);
      
      await chainSocial.connect(user1).createUser("alice", "bio", "ipfs://QmHash");
      
      const tx = await chainSocial.connect(user1).updateProfile(
        "Updated bio",
        "ipfs://NewHash"
      );
      
      const receipt = await tx.wait();
      console.log(`Gas used for updating a profile: ${receipt.gasUsed}`);

      const user = await chainSocial.getUser(user1.address);
      expect(user.bio).to.equal("Updated bio");
      expect(user.pfpLink).to.equal("ipfs://NewHash");
    });
  });

  describe("Post Management", function() {
    async function createUserFixture() {
      const fixture = await deployChainSocialFixture();
      await fixture.chainSocial.connect(fixture.user1).createUser("alice", "bio", "ipfs://QmHash");
      return fixture;
    }

    it("should create a post", async function() {
      const { chainSocial, user1 } = await loadFixture(createUserFixture);
      
      const tx = await chainSocial.connect(user1).createPost("Hello Web3!");
      const receipt = await tx.wait();
      console.log(`Gas used for creating a post: ${receipt.gasUsed}`);
      
      expect(tx).to.emit(chainSocial, "PostCreated");
        
      const postId = 0; // First post ID
      const post = await chainSocial.getPost(postId);
      
      expect(post.content).to.equal("Hello Web3!");
      expect(post.author).to.equal(user1.address);
      expect(post.likes).to.equal(0);
    });

    it("should like a post", async function() {
      const { chainSocial, user1, user2 } = await loadFixture(createUserFixture);
      
      await chainSocial.connect(user2).createUser("bob", "bio", "ipfs://QmHash");
      await chainSocial.connect(user1).createPost("Hello Web3!");
      
      const tx = await chainSocial.connect(user2).likePost(0);
      const receipt = await tx.wait();
      console.log(`Gas used for liking a post: ${receipt.gasUsed}`);
      
      const post = await chainSocial.getPost(0);
      expect(post.likes).to.equal(1);
    });

    it("should not allow double likes", async function() {
      const { chainSocial, user1, user2 } = await loadFixture(createUserFixture);
      
      await chainSocial.connect(user2).createUser("bob", "bio", "ipfs://QmHash");
      await chainSocial.connect(user1).createPost("Hello Web3!");
      
      await chainSocial.connect(user2).likePost(0);
      
      await expect(
        chainSocial.connect(user2).likePost(0)
      ).to.be.revertedWith("User already liked this post");
    });

    it("should comment on a post", async function() {
      const { chainSocial, user1, user2 } = await loadFixture(createUserFixture);
      
      await chainSocial.connect(user2).createUser("bob", "bio", "ipfs://QmHash");
      await chainSocial.connect(user1).createPost("Hello Web3!");
      
      const tx = await chainSocial.connect(user2).commentOnPost(0, "Great post!");
      const receipt = await tx.wait();
      console.log(`Gas used for commenting on a post: ${receipt.gasUsed}`);
      
      expect(tx).to.emit(chainSocial, "CommentAdded");
      
      const comments = await chainSocial.getPostComments(0);
      expect(comments.length).to.equal(1);
      expect(comments[0].content).to.equal("Great post!");
      expect(comments[0].author).to.equal(user2.address);
    });
  });

  describe("Following System", function() {
    async function createUsersFixture() {
      const fixture = await deployChainSocialFixture();
      await fixture.chainSocial.connect(fixture.user1).createUser("alice", "bio", "ipfs://QmHash");
      await fixture.chainSocial.connect(fixture.user2).createUser("bob", "bio", "ipfs://QmHash");
      return fixture;
    }

    it("should follow a user", async function() {
      const { chainSocial, user1, user2 } = await loadFixture(createUsersFixture);
      
      const tx = await chainSocial.connect(user1).followUser(user2.address);
      const receipt = await tx.wait();
      console.log(`Gas used for following a user: ${receipt.gasUsed}`);
      
      expect(tx)
        .to.emit(chainSocial, "Followed")
        .withArgs(user1.address, user2.address);
      
      const following = await chainSocial.getFollowing(user1.address);
      expect(following.length).to.equal(1);
      expect(following[0]).to.equal(user2.address);
    });

    it("should not allow following yourself", async function() {
      const { chainSocial, user1 } = await loadFixture(createUsersFixture);
      
      await expect(
        chainSocial.connect(user1).followUser(user1.address)
      ).to.be.revertedWith("Cannot follow yourself");
    });

    it("should unfollow a user", async function() {
      const { chainSocial, user1, user2 } = await loadFixture(createUsersFixture);
      
      await chainSocial.connect(user1).followUser(user2.address);
      
      const tx = await chainSocial.connect(user1).unfollowUser(user2.address);
      const receipt = await tx.wait();
      console.log(`Gas used for unfollowing a user: ${receipt.gasUsed}`);
      
      const following = await chainSocial.getFollowing(user1.address);
      expect(following.length).to.equal(0);
    });
  });

  describe("Post Retrieval", function() {
    async function createPostsFixture() {
      const fixture = await deployChainSocialFixture();
      await fixture.chainSocial.connect(fixture.user1).createUser("alice", "bio", "ipfs://QmHash");
      
      for(let i = 0; i < 15; i++) {
        await fixture.chainSocial.connect(fixture.user1).createPost(`Post ${i}`);
      }
      
      return fixture;
    }

    it("should get paginated user posts", async function() {
      const { chainSocial, user1 } = await loadFixture(createPostsFixture);
      
      const firstPage = await chainSocial.getUserPosts(user1.address, 0, 10);
      expect(firstPage.length).to.equal(10);
      
      expect(firstPage[0].content).to.equal("Post 14");
      expect(firstPage[9].content).to.equal("Post 5");

      const secondPage = await chainSocial.getUserPosts(user1.address, 10, 10);
      expect(secondPage.length).to.equal(5);
      expect(secondPage[0].content).to.equal("Post 4");
      expect(secondPage[4].content).to.equal("Post 0");
    });

    it("should handle offset larger than available posts", async function() {
      const { chainSocial, user1 } = await loadFixture(createPostsFixture);
      
      const posts = await chainSocial.getUserPosts(user1.address, 20, 10);
      expect(posts.length).to.equal(0);
    });

    it("should handle limit larger than remaining posts", async function() {
      const { chainSocial, user1 } = await loadFixture(createPostsFixture);
      
      const posts = await chainSocial.getUserPosts(user1.address, 12, 10);
      expect(posts.length).to.equal(3);
    });
  });

  // New section specifically for gas measurements
  describe("Gas Usage Measurements", function() {
    it("should measure gas for all main operations", async function() {
      const { chainSocial, owner, user1, user2, user3 } = await loadFixture(deployChainSocialFixture);
      
      // Create users
      let tx = await chainSocial.connect(user1).createUser("alice", "Alice's bio", "ipfs://QmHash1");
      let receipt = await tx.wait();
      console.log(`Gas used for creating user1: ${receipt.gasUsed}`);
      
      tx = await chainSocial.connect(user2).createUser("bob", "Bob's bio", "ipfs://QmHash2");
      receipt = await tx.wait();
      console.log(`Gas used for creating user2: ${receipt.gasUsed}`);
      
      // Update profile
      tx = await chainSocial.connect(user1).updateProfile("Updated Alice bio", "ipfs://QmNewHash1");
      receipt = await tx.wait();
      console.log(`Gas used for updating profile: ${receipt.gasUsed}`);
      
      // Create posts
      tx = await chainSocial.connect(user1).createPost("Alice's first post");
      receipt = await tx.wait();
      console.log(`Gas used for creating first post: ${receipt.gasUsed}`);
      
      tx = await chainSocial.connect(user1).createPost("Alice's second post");
      receipt = await tx.wait();
      console.log(`Gas used for creating second post: ${receipt.gasUsed}`);
      
      tx = await chainSocial.connect(user2).createPost("Bob's first post");
      receipt = await tx.wait();
      console.log(`Gas used for creating Bob's post: ${receipt.gasUsed}`);
      
      // Like posts
      tx = await chainSocial.connect(user2).likePost(0); // User2 likes User1's first post
      receipt = await tx.wait();
      console.log(`Gas used for liking a post: ${receipt.gasUsed}`);
      
      // Comment on posts
      tx = await chainSocial.connect(user2).commentOnPost(0, "Great post Alice!");
      receipt = await tx.wait();
      console.log(`Gas used for commenting on a post: ${receipt.gasUsed}`);
      
      // Follow/unfollow
      tx = await chainSocial.connect(user1).followUser(user2.address);
      receipt = await tx.wait();
      console.log(`Gas used for following a user: ${receipt.gasUsed}`);
      
      tx = await chainSocial.connect(user1).unfollowUser(user2.address);
      receipt = await tx.wait();
      console.log(`Gas used for unfollowing a user: ${receipt.gasUsed}`);
      
      // Get user posts (read operation, no gas cost for view functions)
      const posts = await chainSocial.getUserPosts(user1.address, 0, 10);
      console.log(`Number of posts retrieved: ${posts.length}`);
      
      // Summary
      console.log("\n=== Gas Usage Summary ===");
      console.log("These measurements can help optimize your contract for gas efficiency");
    });
  });
});