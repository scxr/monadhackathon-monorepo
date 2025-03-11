import { getUser } from "./chainSocialViewFuncs";
import { userCache } from './cache';

const indexer_endpoint = process.env.GQL_ENDPOINT || 'http://157.245.35.199/v1/graphql';

export async function getAllPosts() {
    const response = await fetch(indexer_endpoint as string, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'testing'
        },
        body: JSON.stringify({ query: `{
            ChainSocial_PostCreated {
                id
                content
                author
            }
        }` 
    })
    });

    const data = await response.json();
    return data;
}

export async function getPostsByUser(userAddress: string) {
    let start = Date.now();
    const response = await fetch(indexer_endpoint as string, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'testing'
        },
        body: JSON.stringify({ query: `{
            ChainSocial_PostCreated(where: {author: {_eq: "${userAddress}"}}) {
                id
                content
                author
            }
        }` })
    });

    const data = await response.json();
    console.log(`Time taken: ${Date.now() - start}ms`);
    return data;
}

export async function getPostsWithOffsetAndLimit(offset: number, limit: number) {
    try {
        let start = Date.now();
        // Get posts
        const postsResponse = await fetch(indexer_endpoint as string, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': 'testing'
            },
            body: JSON.stringify({ query: `{
                ChainSocial_PostCreated(order_by: {postId: desc},offset: ${offset}, limit: ${limit}) {
                    id
                    content
                    author
                    postId
                }
            }` })
        });

        const postsData = await postsResponse.json();
        if (!postsData.data?.ChainSocial_PostCreated) {
            throw new Error('Failed to fetch posts');
        }

        const posts = postsData.data.ChainSocial_PostCreated;
        const userAddresses = [...new Set(posts.map((post: any) => post.author))] as string[];
        const postIds = posts.map((post: any) => post.postId);

        // Batch fetch users and likes in parallel
        const [users, likes, comments] = await Promise.all([
            getUsers(userAddresses),
            getPostLikes(postIds),
            getPostComments(postIds)
        ]);

        // Map the data together
        const postsWithUsers = posts.map((post: any) => ({
            ...post,
            user: users[post.author] || null,
            likes: likes?.[post.postId] || {
                likeCount: 0,
                likers: []
            },
            comments: comments?.[post.postId] || {
                commentCount: 0,
                commenters: []
            }
        }));

        console.log(`Time taken: ${Date.now() - start}ms`);
        return postsWithUsers;
    } catch (error) {
        console.error('Error in getPostsWithOffsetAndLimit:', error);
        throw error;
    }
}

export async function getUserPosts(userAddress: string) {
    const response = await fetch(indexer_endpoint as string, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'testing'
        },
        body: JSON.stringify({ query: `{
            ChainSocial_PostCreated(where: {author: {_eq: "${userAddress}"}}) {
                id
                content
                postId
            }
        }` })
    })

    const data = await response.json();

    console.log(data);

    const posts = data.data.ChainSocial_PostCreated;
    const postIds = posts.map((post: any) => post.postId);

    const [likes, comments] = await Promise.all([
        getPostLikes(postIds),
        getPostComments(postIds)
    ]);

    console.log(likes);
    console.log(comments);
    

    const postsWithLikesAndComments = posts.map((post: any) => ({
        ...post,
        likes: likes[post.postId],
        comments: comments[post.postId]
    }));

    let postsReversed = postsWithLikesAndComments.reverse();

    return postsReversed;
}

export async function getUsers(users: String[]) {
    try {
        let start = Date.now();
        let cacheHits = 0;
        
        // const response = await fetch(indexer_endpoint as string, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'x-hasura-admin-secret': 'testing'
        //     },
        //     body: JSON.stringify({ query: `{
        //         ChainSocial_UserCreated(where: {userAddress: {_in: ${JSON.stringify(users)}}}) {
        //             id
        //             username
        //             userAddress
        //         }
        //     }` })
        // });

        // const data = await response.json();
        // if (!data.data?.ChainSocial_UserCreated) {
        //     throw new Error('Failed to fetch users');
        // }

        // const userData: { [key: string]: any } = {};
        let userDataTwo: { [key: string]: {
            username: string,
            bio: string,
            pfpLink: string,
            joinedAt: string,
            exists: boolean
        } } = {}
        
        // Batch processing in groups of 5
        const batchSize = 5;
        for (let i = 0; i < users.length; i += batchSize) {
            // Get the current batch (either 5 or remainder)
            const batch = users.slice(i, i + batchSize);
            
            // Check which users are already in cache
            const batchWithCacheStatus = batch.map(user => {
                const userStr = user as string;
                const isCached = userCache.get(userStr) !== undefined;
                if (isCached) cacheHits++;
                return { userStr, isCached };
            });
            
            // Only fetch users that are not in cache
            const usersToFetch = batchWithCacheStatus
                .filter(item => !item.isCached)
                .map(item => item.userStr);
            
            // Process non-cached users in parallel
            if (usersToFetch.length > 0) {
                const batchResults = await Promise.all(
                    usersToFetch.map(user => getUser(user))
                );
                
                // Add results to userDataTwo (cache is updated in getUser)
                usersToFetch.forEach((user, index) => {
                    userDataTwo[user] = batchResults[index];
                });
            }
            
            // Add cached results to userDataTwo
            batchWithCacheStatus
                .filter(item => item.isCached)
                .forEach(item => {
                    userDataTwo[item.userStr] = userCache.get(item.userStr);
                });
        }
        
        // data.data.ChainSocial_UserCreated.forEach((user: any) => {
        //     userData[user.userAddress] = user;  
        // });

        // console.log(userDataTwo);

        console.log(`Time taken: ${Date.now() - start}ms, Cache hits: ${cacheHits}/${users.length}`);
        return userDataTwo;
        // return userData;
    } catch (error) {
        console.error('Error in getUsers:', error);
        throw error;
    }
}

async function getPostLikes(postIds: number[]) {
    try {
        const response = await fetch(indexer_endpoint as string, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': 'testing'
            },
            body: JSON.stringify({ query: `{
                ChainSocial_PostLiked(where: {postId: {_in: ${JSON.stringify(postIds)}}}) {
                    postId
                    liker
                    id
                }
            }` })
        });

        
        const data = await response.json();
        if (!data.data?.ChainSocial_PostLiked) {
            throw new Error('Failed to fetch likes');
        }

        const likes: { [key: number]: { likeCount: number, likers: string[] } } = {};
        
        // Initialize all postIds with empty likes
        postIds.forEach(postId => {
            likes[postId] = {
                likeCount: 0,
                likers: []
            };
        });

        // Fill in the actual likes
        data.data.ChainSocial_PostLiked.forEach((like: any) => {
            if (!likes[like.postId]) {
                likes[like.postId] = {
                    likeCount: 0,
                    likers: []
                };
            }
            likes[like.postId].likers.push(like.liker);
            likes[like.postId].likeCount++;
        });

        return likes;
    } catch (error) {
        console.error('Error in getPostLikes:', error);
        throw error;
    }
}

async function getPostComments(postIds: number[]) {
    try {
        const response = await fetch(indexer_endpoint as string, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': 'testing'
            },
            body: JSON.stringify({ query: `{
                ChainSocial_CommentAdded(where: {postId: {_in: ${JSON.stringify(postIds)}}}) {
                    commentId
                    author
                    content
                    postId
                    id
                }
            }` })
        });

        const data = await response.json();
        if (!data.data?.ChainSocial_CommentAdded) {
            throw new Error('Failed to fetch comments');
        }

        const comments: { [key: number]: { commentCount: number, commenters: string[], comments: string[] } } = {};

        // Initialize all postIds with empty comments
        postIds.forEach(postId => {
            comments[postId] = {
                commentCount: 0,
                commenters: [],
                comments: []
            };
        });

        // Get all unique authors from comments
        const uniqueAuthors = [...new Set(data.data.ChainSocial_CommentAdded.map((comment: any) => comment.author))] as string[];
        
        // Fetch all users in one batch
        const users = await getUsers(uniqueAuthors);

        // Process all comments
        data.data.ChainSocial_CommentAdded.forEach((comment: any) => {
            if (!comments[comment.postId]) {
                comments[comment.postId] = {
                    commentCount: 0,
                    commenters: [],
                    comments: []
                };
            }
            comments[comment.postId].commenters.push(users[comment.author]?.username || comment.author);
            comments[comment.postId].commentCount++;
            comments[comment.postId].comments.push(comment.content);
        });

        return comments;
    } catch (error) {
        console.error('Error in getPostComments:', error);
        throw error;
    }
}

export async function getPostById(postId: number) {
    const response = await fetch(indexer_endpoint as string, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'testing'
        },
        body: JSON.stringify({ query: `{
            ChainSocial_PostCreated(where: {postId: {_eq: ${postId}}}) {
                id
                content
                author
            }
        }` })
    })



    const data = await response.json();
    console.log(JSON.stringify(data));
    if (!data.data?.ChainSocial_PostCreated) {
        throw new Error('Failed to fetch post');
    }
    const post = data.data.ChainSocial_PostCreated[0];
    const user = await getUsers([post.author]);
    const likes = await getPostLikes([postId]);
    const comments = await getPostComments([postId]);

    console.log("comments: ", comments[postId]);

    const postWithUsers = {
        ...post,
        user: user[post.author],
        likes: likes[postId],
        comments: comments[postId]
    }
    
    return postWithUsers;
}

export async function getFollowing(userAddress: string) {
    const response = await fetch(indexer_endpoint as string, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'testing'
        },
        body: JSON.stringify({ query: `{
            ChainSocial_Followed(where: {follower: {_eq: "${userAddress}"}}) {
                followed,
                db_write_timestamp
            }
        }` })
    })

    const unfollowedResponse = await fetch(indexer_endpoint as string, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'testing'
        },
        body: JSON.stringify({ query: `{
            ChainSocial_Unfollowed(where: {follower: {_eq: "${userAddress}"}}) {
                followed,
                db_write_timestamp
            }
        }` })
    })

    const data = await response.json();
    const unfollowedData = await unfollowedResponse.json();

    const following = data.data.ChainSocial_Followed;
    const unfollowed = unfollowedData.data.ChainSocial_Unfollowed;

    const unfollowedUsers: string[] = [];
    const followingUsers: string[] = [];

    for (const followed of following) {
        if (unfollowed.some((unfollowed: any) => {
            return unfollowed.followed === followed.followed && unfollowed.db_write_timestamp > followed.db_write_timestamp
        })) {
            unfollowedUsers.push(followed.followed);
        } else {
            followingUsers.push(followed.followed);
        }
    }
    console.log({
        following: followingUsers,
        unfollowed: unfollowedUsers
    });
    return {
        following: followingUsers,
        unfollowed: unfollowedUsers
    }
}

export async function getPostsByUsers(userAddresses: string[]) {
    try {
        let start = Date.now();
        // Get posts from specified users
        const postsResponse = await fetch(
            indexer_endpoint as string,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-hasura-admin-secret": "testing"
                },
                body: JSON.stringify({ query: `{
                    ChainSocial_PostCreated(where: {author: {_in: ${JSON.stringify(userAddresses)}}}, order_by: {postId: desc}) {
                        id
                        content
                        author
                        postId
                    }
                }` })
            }
        );

        const postsData = await postsResponse.json();
        if (!postsData.data?.ChainSocial_PostCreated) {
            throw new Error('Failed to fetch posts');
        }

        const posts = postsData.data.ChainSocial_PostCreated;
        if (posts.length === 0) {
            return [];
        }

        const postIds = posts.map((post: any) => post.postId);

        // Batch fetch users, likes, and comments in parallel
        const [users, likes, comments] = await Promise.all([
            getUsers(userAddresses as string[]),
            getPostLikes(postIds),
            getPostComments(postIds)
        ]);

        // Map the data together
        const postsWithDetails = posts.map((post: any) => ({
            ...post,
            user: users[post.author] || { username: post.author.slice(0, 6) + '...' },
            likes: likes?.[post.postId] || {
                likeCount: 0,
                likers: []
            },
            comments: comments?.[post.postId] || {
                commentCount: 0,
                commenters: [],
                comments: []
            }
        }));

        console.log(`Time taken for getPostsByUsers: ${Date.now() - start}ms`);
        return postsWithDetails;
    } catch (error) {
        console.error('Error in getPostsByUsers:', error);
        throw error;
    }
}

export async function getFollowingPosts(userAddress: string) {
    try {
        const following = await getFollowing(userAddress);
        
        // If not following anyone, return empty array
        if (!following.following || following.following.length === 0) {
            return [];
        }
        
        // Get posts from all followed users
        const followingPosts = await getPostsByUsers(following.following);
        return followingPosts;
    } catch (error) {
        console.error('Error in getFollowingPosts:', error);
        throw error;
    }
}

// getFollowing("0x4c2E0165CA1123608CFf84f7805B6C57Be9C3813");

// getAllPosts();
// getPostsByUser("0xC7A0c405DF55943E37d76B1E3c67FdD6518b26f3");
// getPostsWithOffsetAndLimit(10, 16);

// getUsers(["0xC7A0c405DF55943E37d76B1E3c67FdD6518b26f3", "0x9A54a612e01303aC16fe3573Def52bf1A6132D3d"])