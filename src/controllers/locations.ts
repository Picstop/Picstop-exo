/* eslint-disable max-len */
import { Response } from 'express';

import Location from '../models/location';
import {
    NewRequest as Request,
} from '../types/types';
import User from '../models/user';
import Post from '../models/post';
import initLogger from '../core/logger';
/* eslint-disable no-underscore-dangle */
const logger = initLogger('ControllerPosts');
/* eslint-disable class-methods-use-this */

export default class LocationController {
    async addLocation(req: Request, res: Response) {
        const {
            long, lat, name,
        } = req.body;
        const author = req.user._id;
        const isOfficial = req.user.username === 'picstop';
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
            logger.error(`Error adding location for user ${req.user._id} with error ${error} `);
            return res.status(500).json({ success: false, message: 'Error adding location', data: error });
        }
    }

    async saveLocation(req: Request, res: Response) {
        const { id } = req.body;
        User.findByIdAndUpdate(req.user._id, { $push: { savedLocations: id } }).exec()
            .then(() => res.status(200).json({ success: true, message: 'Successfully saved location to user' })).catch((e) => {
                logger.error(`Error saving location ${id} for user ${req.user._id} with error ${e}`);
                return res.status(500).json({ success: false, message: 'Error adding location.' });
            });
    }

    async findNearby(req: Request, res: Response) {
        const { lat, long, maxDistance } = req.body;
        return Location.find({ geoLocation: { $near: { $maxDistance: maxDistance, $geometry: { type: 'Point', coordinates: [long, lat] } } }, $or: [{ isOfficial: true }, { _id: { $in: req.user.savedLocations } }] }).exec()
            .then((locations) => res.status(200).json({ success: true, message: locations }))
            .catch((error) => {
                logger.error(`Error finding nearby locations with error ${error}`);
                return res.status(500).json({ success: false, message: 'Error checking proximity', data: error });
            });
    }

    async getExamplePics(req: Request, res: Response) {
        const { id } = req.params;
        // @ts-ignore
        Post.find({ location: id }).populate({ path: 'authorId' }).exec()
            .then((posts) => {
                // @ts-ignore
                const filtered = posts.filter((post) => post.authorId.private === false || post.authorId.followers.indexOf(req.user._id) >= 0);
                return res.status(200).json({ success: true, message: filtered });
            })
            .catch((error) => {
                logger.error(`Error finding example pics for location ${id} with error ${error}`);
                return res.status(500).json({ success: false, message: error.message });
            });
    }
}
