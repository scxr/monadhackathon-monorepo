// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/// @title ChainSocial - A decentralized social media contract
/// @notice This contract implements basic social media functionality on the blockchain
/// @dev Implements user profiles, posts, comments, likes, and following system
contract ChainSocial {
    /// @notice Structure representing a user profile
    /// @dev The exists field is used to check if a user has been created
    struct User {
        string username;     // The user's display name
        string bio;         // User's biography or description
        string pfpLink;     // Link to profile picture
        uint256 joinedAt;   // Timestamp when user joined
        bool exists;        // Whether the user exists
    }

    /// @notice Structure representing a social media post
    /// @dev Posts store their comments as an array of comment IDs
    struct Post {
        uint256 id;         // Unique identifier for the post
        address author;     // Address of the post creator
        string content;     // Content of the post
        uint256 timestamp;  // When the post was created
        uint256 likes;      // Number of likes on the post
        uint256[] comments; // Array of comment IDs
    }

    /// @notice Structure representing a comment on a post
    struct Comment {
        uint256 id;         // Unique identifier for the comment
        uint256 postId;     // ID of the post being commented on
        address author;     // Address of the comment creator
        string content;     // Content of the comment
        uint256 timestamp;  // When the comment was created
    }

    mapping(address => User) public users;
    mapping(address => address[]) public following;
    mapping(address => mapping(address => bool)) public isFollowing;

    Post[] public posts;
    Comment[] public comments;
    mapping(uint256 => mapping(address => bool)) public hasLiked;

    mapping(address => uint256[]) private userPosts;

    /// @notice Emitted when a new user profile is created
    /// @param userAddress The address of the new user
    /// @param username The username chosen by the user
    event UserCreated(address indexed userAddress, string username);

    /// @notice Emitted when a new post is created
    /// @param postId The ID of the new post
    /// @param author The address of the post creator
    /// @param content The content of the post
    event PostCreated(uint256 indexed postId, address indexed author, string content);

    /// @notice Emitted when a comment is added to a post
    /// @param commentId The ID of the new comment
    /// @param postId The ID of the post being commented on
    /// @param author The address of the comment creator
    /// @param content The content of the comment
    event CommentAdded(uint256 indexed commentId, uint256 indexed postId, address indexed author, string content);

    /// @notice Emitted when a user follows another user
    /// @param follower The address of the user who is following
    /// @param followed The address of the user being followed
    event Followed(address indexed follower, address indexed followed);

    /// @notice Emitted when a user unfollows another user
    /// @param follower The address of the user who is unfollowing
    /// @param followed The address of the user being unfollowed
    event Unfollowed(address indexed follower, address indexed followed);

    /// @notice Emitted when a user likes a post
    /// @param postId The ID of the post being liked
    /// @param liker The address of the user who liked the post
    event PostLiked(uint256 indexed postId, address indexed liker);

    /// @notice Modifier to check if a post exists
    /// @param postId The ID of the post to check
    modifier postExists(uint256 postId) {
        require(postId < posts.length, "Post does not exist");
        _;
    }

    /// @notice Modifier to check if a user exists
    /// @param userAddress The address of the user to check
    modifier userExists(address userAddress) {
        require(users[userAddress].exists, "User does not exist");
        _;
    }

    /// @notice Creates a new user profile
    /// @dev Emits UserCreated event upon successful creation
    /// @param _username The desired username for the new user
    /// @param _bio The user's biography or description
    /// @param _pfpLink Link to the user's profile picture
    function createUser(string memory _username, string memory _bio, string memory _pfpLink) public {
        require(bytes(_username).length > 0, "Username cannot be null");
        require(users[msg.sender].exists == false, "User already exists");

        users[msg.sender] = User({
            username: _username,
            bio: _bio,
            pfpLink: _pfpLink,
            joinedAt: block.timestamp,
            exists: true
        });

        emit UserCreated(msg.sender, _username);
    }

    /// @notice Updates an existing user's profile information
    /// @param _bio The new biography text
    /// @param _pfpLink The new profile picture link
    function updateProfile(string memory _bio, string memory _pfpLink) public userExists(msg.sender) {
        users[msg.sender].bio = _bio;
        users[msg.sender].pfpLink = _pfpLink;
    }

    /// @notice Creates a new post
    /// @dev Emits PostCreated event upon successful creation
    /// @param _content The content of the post
    /// @return postId The ID of the newly created post
    function createPost(string memory _content) public userExists(msg.sender) returns (uint256) {
        uint256 postId = posts.length;

        posts.push(Post({
            id: postId,
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            likes: 0,
            comments: new uint256[](0)
        }));

        userPosts[msg.sender].push(postId); 

        emit PostCreated(postId, msg.sender, _content);
        return postId;
    }

    /// @notice Allows a user to like a post
    /// @dev A user can only like a post once
    /// @param _postId The ID of the post to like
    function likePost(uint256 _postId) public postExists(_postId) userExists(msg.sender) {
        require(!hasLiked[_postId][msg.sender], "User already liked this post");

        posts[_postId].likes++;
        hasLiked[_postId][msg.sender] = true;

        emit PostLiked(_postId, msg.sender);
    }

    /// @notice Adds a comment to an existing post
    /// @dev Emits CommentAdded event upon successful creation
    /// @param _postId The ID of the post to comment on
    /// @param _content The content of the comment
    /// @return commentId The ID of the newly created comment
    function commentOnPost(uint256 _postId, string memory _content) public userExists(msg.sender) postExists(_postId) returns (uint256) {
        uint256 commentId = comments.length;
        
        comments.push(Comment({
            id: commentId,
            postId: _postId,
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp
        }));
        
        posts[_postId].comments.push(commentId);
        
        emit CommentAdded(commentId, _postId, msg.sender, _content);
        return commentId;
    }

    /// @notice Allows a user to follow another user
    /// @dev Emits Followed event upon successful following
    /// @param _userToFollow The address of the user to follow
    function followUser(address _userToFollow) public userExists(msg.sender) userExists(_userToFollow) {
        require(_userToFollow != msg.sender, "Cannot follow yourself");
        require(users[_userToFollow].exists, "User to follow does not exist");
        require(!isFollowing[msg.sender][_userToFollow], "Already following this user");
        
        following[msg.sender].push(_userToFollow);
        isFollowing[msg.sender][_userToFollow] = true;
        
        emit Followed(msg.sender, _userToFollow);
    }

    /// @notice Allows a user to unfollow another user
    /// @dev Emits Unfollowed event upon successful unfollowing
    /// @param _userToUnfollow The address of the user to unfollow
    function unfollowUser(address _userToUnfollow) public userExists(msg.sender) userExists(_userToUnfollow) {
        require(isFollowing[msg.sender][_userToUnfollow], "Not following this user");
        
        // Remove from following array
        address[] storage followingList = following[msg.sender];
        for (uint256 i = 0; i < followingList.length; i++) {
            if (followingList[i] == _userToUnfollow) {
                followingList[i] = followingList[followingList.length - 1];
                followingList.pop();
                break;
            }
        }
        
        isFollowing[msg.sender][_userToUnfollow] = false;
        
        emit Unfollowed(msg.sender, _userToUnfollow);
    }

    /// @notice Retrieves a user's profile information
    /// @param _userAddress The address of the user to get information for
    /// @return User struct containing the user's profile information
    function getUser(address _userAddress) public view returns (User memory) {
        require(users[_userAddress].exists, "User does not exist");
        return users[_userAddress];
    }

    /// @notice Retrieves a specific post by ID
    /// @param _postId The ID of the post to retrieve
    /// @return Post struct containing the post information
    function getPost(uint256 _postId) public view postExists(_postId) returns (Post memory) {
        return posts[_postId];
    }

    /// @notice Retrieves all comments for a specific post
    /// @param _postId The ID of the post to get comments for
    /// @return Array of Comment structs containing the post's comments
    function getPostComments(uint256 _postId) public view postExists(_postId) returns (Comment[] memory) {
        uint256[] memory commentIds = posts[_postId].comments;
        Comment[] memory postComments = new Comment[](commentIds.length);
        
        for (uint256 i = 0; i < commentIds.length; i++) {
            postComments[i] = comments[commentIds[i]];
        }
        
        return postComments;
    }

    /// @notice Gets the list of addresses that a user is following
    /// @param _user The address of the user to get following list for
    /// @return Array of addresses that the user is following
    function getFollowing(address _user) public view returns (address[] memory) {
        return following[_user];
    }

    /// @notice Retrieves posts made by a specific user with pagination
    /// @param _user The address of the user whose posts to retrieve
    /// @param _offset Number of posts to skip from the start
    /// @param _limit Maximum number of posts to return
    /// @return Array of Post structs containing the user's posts
    function getUserPosts(
        address _user,
        uint256 _offset,
        uint256 _limit
    ) public view returns (Post[] memory) {
        uint256[] storage userPostIds = userPosts[_user];
        
        // Calculate actual limit based on remaining posts
        uint256 remaining = userPostIds.length > _offset ? 
            userPostIds.length - _offset : 0;
        uint256 actualLimit = _limit > remaining ? remaining : _limit;
        
        // Create array of appropriate size
        Post[] memory result = new Post[](actualLimit);
        
        // Fill array from newest to oldest
        for (uint256 i = 0; i < actualLimit; i++) {
            uint256 postIndex = userPostIds.length - 1 - (_offset + i);
            result[i] = posts[userPostIds[postIndex]];
        }
        
        return result;
    }
}