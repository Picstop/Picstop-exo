import mongoose, { Schema } from 'mongoose';

import { Quadrant } from '../types/types';

const quadrantSchema = new Schema({
    _id: {
        type: String,
        required: true,
    },
    locations: {
        type: Array,
        default: [],
    },
    minLat: {
        type: Number,
        required: true,
    },
    maxLat: {
        type: Number,
        required: true,
    },
    minLong: {
        type: Number,
        required: true,
    },
    maxLong: {
        type: Number,
        required: true,
    },
    isLeaf: {
        type: Boolean,
        required: true,
        default: false,
    },

},
{
    timestamps: true,
});

export default mongoose.model<Quadrant>('Quadrant', quadrantSchema);
