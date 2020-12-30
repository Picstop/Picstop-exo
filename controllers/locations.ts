import {
    Dimension,
    Location as LocationType,
} from '../types/types';
import { Request, Response } from 'express';

import Location from '../models/location';
import _ from 'lodash';

/* eslint-disable no-underscore-dangle */

/* eslint-disable class-methods-use-this */

export default class LocationController {
    async addLocation(req: Request, res: Response) {
        const { long, lat, author, name } = req.body;
        const isOfficial = author === 'Picstop'
        const newLoc = new Location({
            name,
            author,
            isOfficial,
            geoLocation: { type: 'Point', coordinates: [long, lat] }

        })

        return newLoc.save()
        .then(() => res.status(200).json({ success: true, message: 'Location added successfully', data: newLoc }))
        .catch((err: Error) => res.status(500).json({ success: false, message: 'Error adding location', data: err }))

    }

    async findNearby(req: Request, res: Response){
        const { lat, long, maxDistance } = req.body;
        return Location.find({ geoLocation: { $near: { $maxDistance: maxDistance, $geometry: { type: 'Point', coordinates: [long, lat] } } } }).exec()
        .then((locations) => res.status(200).json({ success: true, message: locations }))
        .catch((error) => res.status(500).json({ success: false, message: 'Error checking proximity', data: error }))
    }


    
}
