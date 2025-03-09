const { Schema, model} = require('mongoose');

import type { Post } from './types';

const postSchema = new Schema({
    postId: {
        type: Number,
        required: true,
        unique: true
    },
    poster: {
        type: String,
        required: true  
    },
    content: {
        type: String,
        required: true
    },
    transactionHash: {
        type: String,
        required: true
    }
})

const Posts = model('Post', postSchema);

export async function createPostInDb(post: Post) {
    console.log(post);
    const newPost = await Posts.create(post);
    return newPost;
}

export default {
    createPostInDb
};
