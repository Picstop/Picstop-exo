import mongoose, { Schema } from 'mongoose';

import { Album } from '../types/types';

const albumSchema = new Schema({
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    }],
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author Id is required'],
    },
    title: {
        type: String,
        maxlength: [150, 'Title cannot exceed 150 characters'],
    },

},
{
    timestamps: true,
});

export default mongoose.model<Album>('Album', albumSchema);
