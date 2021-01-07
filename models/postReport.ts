import mongoose, { Schema } from 'mongoose';

import { PostReport } from '../types/types';

const postReportSchema = new Schema({
    reason: { 
        type: 'string',
        required: [true, 'Reason is required']
    },
   reportedBy: {

        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Report author ID is required']

    }
       

},
{
    timestamps: true,
});

export default mongoose.model<PostReport>('PostReport', postReportSchema);
