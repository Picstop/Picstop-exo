import mongoose, { Schema } from 'mongoose';

import { CommentReport } from '../types/types';

const commentReportSchema = new Schema({
    reason: {
        type: 'string',
        required: [true, 'Reason is required'],
    },
    reportedBy: {

        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Report author ID is required'],

    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        required: [true, 'Comment ID is required'],
    },

},
{
    timestamps: true,
});

export default mongoose.model<CommentReport>('CommentReport', commentReportSchema);
