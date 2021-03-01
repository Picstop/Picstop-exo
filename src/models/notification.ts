import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from '../types/types';

const notificationSchema = new Schema({
    _id: { type: String, default: () => uuidv4() },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    relatedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    relatedPostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: false,
    },
    notificationType: { type: String, required: true },
    comment: { type: String, required: false },
});

export default mongoose.model<Notification>('Notification', notificationSchema);
