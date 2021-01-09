import mongoose, { Schema } from 'mongoose';

import { Post } from '../types/types';

const PostSchema = new Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    caption: {
        type: String,
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Location',
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
    }],
},
{
    timestamps: true,
});

export default mongoose.model<Post>('Post', PostSchema);
