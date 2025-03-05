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
    console.log(data);
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
    console.log(data);
    console.log(`Time taken: ${Date.now() - start}ms`);
    return data;
}
// getAllPosts();
// getPostsByUser("0xC7A0c405DF55943E37d76B1E3c67FdD6518b26f3");
// getPostsWithOffsetAndLimit(10, 16);