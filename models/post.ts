import mongoose, { Schema } from 'mongoose';

import { Post } from '../types/types';

const PostSchema = new Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    caption: {
        type: String,
    },
    image: {
        type: String,
        required: true,
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    likes: {
        type: Array,
        default: [],
    },
    comments: {
        type: Array,
        default: [],
    },

},
{
    timestamps: true,
});

export default mongoose.model<Post>('Post', PostSchema);
