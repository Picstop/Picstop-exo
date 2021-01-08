/* eslint-disable max-len */
import { Response } from 'express';

import _ from 'lodash';
import Location from '../models/location';
import {
    Location as LocationType,
    NewRequest as Request,
} from '../types/types';
import User from '../models/user';

/* eslint-disable no-underscore-dangle */

/* eslint-disable class-methods-use-this */

export default class LocationController {
    async addLocation(req: Request, res: Response) {
        const {
            long, lat, name,
        } = req.body;
        let { author } = req.body;
        if (!author) author = req.user._id;
        const isOfficial = author === 'Picstop';
        const newLoc = new Location({
            name,
            author,
            isOfficial,
            geoLocation: { type: 'Point', coordinates: [long, lat] },

        });
        // push saved location to user
        try {
            await newLoc.save();
            await User.findByIdAndUpdate(req.user._id, { $push: { savedLocations: newLoc._id } }).exec();
            return res.status(200).json({ success: true, message: 'Location added successfully', data: newLoc });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error adding location', data: error });
        }
    }

    async findNearby(req: Request, res: Response) {
        const { lat, long, maxDistance } = req.body;
        return Location.find({ geoLocation: { $near: { $maxDistance: maxDistance, $geometry: { type: 'Point', coordinates: [long, lat] } } }, $or: [{ isOfficial: true }, { _id: { $in: req.user.savedLocations } }] }).exec()
            .then((locations) => res.status(200).json({ success: true, message: locations }))
            .catch((error) => res.status(500).json({ success: false, message: 'Error checking proximity', data: error }));
    }
}
