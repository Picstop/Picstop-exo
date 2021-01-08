import mongoose, { Schema } from 'mongoose';

import { UserReport } from '../types/types';

const userReportSchema = new Schema({
    reason: { 
        type: 'string',
        required: [true, 'Reason is required']
    },
   reportedBy: {

        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Report author ID is required']

    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Report user ID is required']
    }
       

},
{
    timestamps: true,
});

export default mongoose.model<UserReport>('UserReport', userReportSchema);
