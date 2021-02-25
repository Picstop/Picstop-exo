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
            maxlength: [10000, 'Comment cannot exceed 100000 characters'],
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
