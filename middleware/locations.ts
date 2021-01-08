import { NextFunction, Response } from 'express';
import bodyParser from 'body-parser';
import { NewRequest as Request } from '../types/types';

import Location from '../models/location';

export default class locationMiddleware {
    checkProximity(req: Request, res: Response, next: NextFunction) {
        const { long, lat } = req.body;

        Location.find({ geoLocation: { $near: { $maxDistance: 10, $geometry: { type: 'Point', coordinates: [long, lat] } } } }).exec()
            .then((locations) => {
                if (locations.length !== 0) {
                    return res.status(406).json({ success: false, message: 'There is a pre-existing location within 10 meters of your location.' });
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
}
