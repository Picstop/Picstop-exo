import { NextFunction, Response } from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { NewRequest as Request } from '../types/types';
import Location from '../models/location';
import User from '../models/user';

export default class locationMiddleware {
    checkProximity(req: Request, res: Response, next: NextFunction) {
        const { long, lat } = req.body;

        Location.find({ geoLocation: { $near: { $maxDistance: 10, $geometry: { type: 'Point', coordinates: [long, lat] } } } }).exec()
            .then((locations) => {
                if (locations.length !== 0) {
                    return res.status(406).json({ success: false, message: locations });
                }
                next();
            }).catch((error) => res.status(500).json({ success: false, message: 'Error checking proximity', data: error }));
    }

    validateLocation(req: Request, res: Response, next: NextFunction) {
        const { name, lat, long } = req.body;
        const validCoord = !lat || !long || lat > -90 || lat < 90 || long > -180 || long < 180;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Location name undefined.' });
        } if (!(name.length >= 3 && name.length <= 40)) {
            return res.status(400).json({ success: false, message: 'Location name must be within 3 and 40 characters.' });
        } if (!validCoord) {
            return res.status(400).json({ success: false, message: 'Not a valid coordinate.' });
        }
        next();
    }

    validateQueryInput(req: Request, res: Response, next: NextFunction) {
        const { long, lat, maxDistance } = req.body;
        if (!lat || lat < -90 || lat > 90) {
            return res.status(400).json({ success: false, message: 'Invalid latitude: -90 < lat < 90' });
        } if (!long || long < -180 || long > 180) {
            return res.status(400).json({ success: false, message: 'Invalid longitude: -180 < lat < 180' });
        } if (!maxDistance) {
            return res.status(400).json({ success: false, message: 'Missing value: maxDistance' });
        }
        next();
    }

    isLocation(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const findLocation = Location.findOne({ _id: mongoose.Types.ObjectId(id) }).orFail(new Error('Location not found')).exec();
            if (findLocation) return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Location not found' });
        }
        /*
        return Location.findOne({ _id: mongoose.Types.ObjectId(id) }).orFail(new Error('Location not found')).exec()
            .then(() => next())
            .catch((e) => res.status(500).json({ success: false, message: e.message })); */
    }

    async alreadySaved(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        try {
            const user = await User.findById(req.user._id).exec();
            const alreadySaved = user.savedLocations.includes(id);
            if (alreadySaved) {
                return res.status(400).json({ success: false, message: 'Already saved location' });
            }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
