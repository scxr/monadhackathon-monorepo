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
    let start = Date.now();
    const response = await fetch(indexer_endpoint as string, {
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

    const data = await response.json();
    // console.log(JSON.stringify(data));
    let posts = data.data.ChainSocial_PostCreated;
    let useraddrs = posts.map((post: any) => post.author);
    let postIds = posts.map((post: any) => post.postId);
    let [users, likes] = await Promise.all([getUsers(useraddrs), getPostLikes(postIds)]);
    let postsWithUsers = posts.map((post: any) => {
        return {
            ...post,
            user: users[post.author],
            likes: likes?.[post.postId] || {
                likeCount: 0,
                likers: []
            }
        }
    });
    return postsWithUsers;
}

export async function getUsers(users: String[]) {
    let start = Date.now();
    let userData: { [key: string]: any } = {};

    for (let i = 0; i < users.length; i++) {
        try {
            const response = await fetch(indexer_endpoint as string, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': 'testing'
                },
                body: JSON.stringify({ query: `{
                        ChainSocial_UserCreated(where: {userAddress: {_eq: "${users[i]}"}}) {
                        id
                        username
                    }
                }` })
            });
    
            const data = await response.json();
            // userData.push(data);
            if (data.data.ChainSocial_UserCreated.length > 0) {
                userData[users[i].toString()] = data.data.ChainSocial_UserCreated[0];
            }

        } catch (error) {
            console.error(error);
        }
    }

    // console.log(JSON.stringify(userData));
    console.log(`Time taken: ${Date.now() - start}ms`);
    return userData;
}

async function getPostLikes(postIds: number[]) {
    try {
        let likes = {} as { [key: number]: { likeCount: number, likers: string[] } };
        for (let i = 0; i < postIds.length; i++) {
            const postId = postIds[i];
            const response = await fetch(indexer_endpoint as string, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': 'testing'
                },
                body: JSON.stringify({ query: `{
                    ChainSocial_PostLiked(where: {postId: {_eq: "${postId}"}}) {
                        liker
                        id
                    }
                }` })
            })
            const data = await response.json();
            if (data.data.ChainSocial_PostLiked.length > 0) {
                likes[postId] = {
                    likeCount: data.data.ChainSocial_PostLiked.length,
                    likers: data.data.ChainSocial_PostLiked.map((like: any) => like.liker)
                }
            } else {
                likes[postId] = {
                    likeCount: 0,
                    likers: []
                }
            }
        }
        return likes;
    } catch (error) {
        console.error(error);
    }
}
// getAllPosts();
// getPostsByUser("0xC7A0c405DF55943E37d76B1E3c67FdD6518b26f3");
// getPostsWithOffsetAndLimit(10, 16);

// getUsers(["0xC7A0c405DF55943E37d76B1E3c67FdD6518b26f3", "0x9A54a612e01303aC16fe3573Def52bf1A6132D3d"])