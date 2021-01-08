import mongoose, { Schema } from 'mongoose';

import { LocationReport } from '../types/types';

const locationReportSchema = new Schema({
    reason: { 
        type: 'string',
        required: [true, 'Reason is required']
    },
   reportedBy: {

        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Report author ID is required']

    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Report location ID is required']
    }
       

},
{
    timestamps: true,
});

export default mongoose.model<LocationReport>('LocationReport', locationReportSchema);
