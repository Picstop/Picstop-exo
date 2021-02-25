import mongoose, { Schema } from 'mongoose';
import { Comment } from '../types/types';

const CommentSchema = new Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        comment: {
            type: String,
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<Comment>('Comment', CommentSchema);
