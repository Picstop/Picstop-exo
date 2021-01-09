import mongoose, { Schema } from 'mongoose';

import { Location } from '../types/types';

const locationSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        geoLocation: {
            type: { type: String },
            coordinates: [],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        isOfficial: {
            type: Boolean,
        },
    },
    {
        timestamps: true,
    },
);

locationSchema.index({ geoLocation: '2dsphere' });

export default mongoose.model<Location>('Location', locationSchema);
