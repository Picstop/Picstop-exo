import { Request, Response } from 'express';
import _ from 'lodash';
import { loggers } from 'winston';
import {
    Dimension,
    Location as LocationType,
    Quadrant as QuadrantType,
} from '../types/types';

import Location from '../models/location';
import Quadrant from '../models/quadrant';
import initLogger from '../core/logger';

/* eslint-disable no-underscore-dangle */

/* eslint-disable class-methods-use-this */

const logger = initLogger('ControllerQuadrant');

export default class QuadrantController {
    findBounds(quadrantId: QuadrantType['_id']) {
        let dims = {
            minLat: -90,
            minLong: -180,
            maxLat: 90,
            maxLong: 180,
        };
        const quadArray = quadrantId.split('');
        quadArray.forEach((e: any) => {
            e = Number(e);
            switch (e) {
            case 0:
                dims = {
                    minLat: (dims.maxLat - dims.minLat) / 2 + dims.minLat,
                    minLong:
                            (dims.maxLong - dims.minLong) / 2 + dims.minLong,
                    maxLat: dims.maxLat,
                    maxLong: dims.maxLong,
                };
                break;
            case 1:
                dims = {
                    minLat: (dims.maxLat - dims.minLat) / 2 + dims.minLat,
                    minLong: dims.minLong,
                    maxLat: dims.maxLat,
                    maxLong:
                            (dims.maxLong - dims.minLong) / 2 + dims.minLong,
                };
                break;
            case 2:
                dims = {
                    minLat: dims.minLat,
                    minLong: dims.minLong,
                    maxLat: (dims.maxLat - dims.minLat) / 2 + dims.minLat,
                    maxLong:
                            (dims.maxLong = dims.minLong) / 2 + dims.minLong,
                };
                break;
            case 3:
                dims = {
                    minLat: dims.minLat,
                    minLong:
                            (dims.maxLong - dims.minLong) / 2 + dims.minLong,
                    maxLat: (dims.maxLat - dims.minLat) / 2 + dims.minLat,
                    maxLong: dims.maxLong,
                };
                break;
            default:
                return dims;
            }
        });
        return dims;
    }

    async addLocation(req: Request, res: Response) {
        try {
            const {
                lat, long, name, author,
            } = req.body;

            const isOffical = author === 'Picstop';

            // check params
            if (!lat || !long || !name || !author) {
                return res
                    .status(400)
                    .json({ success: false, message: 'Missing parameters' });
            }

            // check proximity for locations that are too close
            const nearbyLocs = await Location.find({
                geoLocation: {
                    $near: {
                        $maxDistance: 10,
                        $geometry: { type: 'Point', coordinates: [lat, long] },
                    },
                },
            }).exec();
            if (nearbyLocs.length !== 0) {
                return res.status(500).json({
                    success: false,
                    message:
                        'There is a pre-established nearby location within 10 meters.',
                });
            }

            // instantiating new location to access location id
            const addLoc = new Location({
                geoLocation: { type: 'Point', coordinates: [lat, long] },
                name,
                author,
                isOffical,
            });
            // Finding quadrant for location, if leaf has less than 10 locs, add location, else grow tree
            const leafQuad = await this.findLeaf(
                lat,
                long,
                this.findNextBounds('', lat, long),
            );

            const leafQuadInfo = await Quadrant.findById(leafQuad);

            // console.log(leafQuadInfo!.locations);
            if (leafQuadInfo!.locations.length < 10) {
                await leafQuadInfo!.locations.push(addLoc._id);
                leafQuadInfo!
                    .save()
                    .then(() => addLoc.save())
                    .then(() => res.status(200).json({ success: true, message: addLoc }))
                    .catch((err: any) => {
                        logger.error(`Error when pushing a location ${addLoc._id}: ${err}`);
                        res.status(500).json({ success: false, message: err });
                    });
            } else {
                addLoc.save().then(() => {
                    this.growTree(leafQuad, addLoc)
                        .then(() => res.status(200).json({
                            success: true,
                            message: addLoc,
                            grew: true,
                        }))
                        .catch((err: any) => {
                            logger.error(`Error when adding a location ${addLoc._id} to tree: ${err}`);
                            return res.status(500).json({ success: false, message: err });
                        });
                });
            }
        } catch (error) {
            logger.error(`Error when adding a location: ${error}`);
            return res.status(500).json({ success: false, message: error });
        }
    }

    async growTree(quadrantId: QuadrantType['_id'], location: LocationType) {
        let newQuad = `${quadrantId}0`;
        const quadrant = await Quadrant.findById(quadrantId);
        // console.log(`quadrant: ${quadrant}`);
        // console.log(location);

        // finding locations in quadrant, then pushing new location
        let locs = await Location.find({ _id: { $in: quadrant?.locations } });
        if (location) {
            locs.push(location);
        }
        locs = _.uniq(locs);
        let newDims = {
            minLat: -90,
            minLong: -180,
            maxLat: 90,
            maxLong: 180,
        };
        Quadrant.updateOne({ _id: quadrantId }, { isLeaf: false })
            .exec()
            // Quadrant.updateOne({ _id: quadrantId }, { isLeaf: false, $unset: { locations: 1 } }).exec()
            .then((result: any) => {
                logger.debug(`Result while updating a Quadrant: ${result}`);
                return location;
            })
            // console.log('parent quad updated');

            .catch((error: any) => {
                logger.error(`Error while updating a Quadrant: ${error}`);
                throw new Error(error);
            });

        for (let i = 0; i < 4; i++) {
            newDims = this.findBounds(newQuad);
            const addLocs = [];

            for (let j = 0; j < locs.length; j++) {
                if (
                    this.checkBounds(
                        locs[j].geoLocation.coordinates[0],
                        locs[j].geoLocation.coordinates[1],
                        newDims,
                    )
                ) {
                    addLocs.push(locs[j]);
                }
            }

            const createQuad = new Quadrant({
                _id: newQuad,
                locations: [],
                minLat: newDims.minLat,
                minLong: newDims.minLong,
                maxLat: newDims.maxLat,
                maxLong: newDims.maxLong,
                isLeaf: true,
            });

            addLocs.forEach((e: LocationType) => {
                createQuad.locations.push(e._id);
            });
            const copy = newQuad.toString();
            createQuad
                .save()
                .then(() => {
                    if (createQuad.locations.length >= 10) {
                        this.growTree(copy, location);
                    }
                })
                .catch((err) => {
                    logger.error(`Result while saving a Quadrant: ${err}`);
                    throw new Error(err);
                });

            // increments index
            newQuad = `${newQuad.slice(0, -1)}${i + 1}`;
        }
    }

    checkBounds(lat: number, long: number, dims: Dimension) {
        return (
            lat > dims.minLat
            && lat <= dims.maxLat
            && long > dims.minLong
            && long <= dims.maxLong
        );
    }

    findNextBounds(quadrantId: QuadrantType['_id'], lat: number, long: number) {
        for (let i = 0; i < 3; i++) {
            const bounds = this.findBounds(quadrantId + i);

            // console.log(i, ' ', bounds);
            // console.log(lat, long);
            if (this.checkBounds(lat, long, bounds)) {
                return i.toString();
            }
        }
        return '3';
    }

    async findLeaf(lat: number, long: number, quadrantId: QuadrantType['_id']) {
        const quad = await Quadrant.findById(quadrantId);
        if (!quad) {
            return '';
        }
        if (quad && quad.isLeaf) {
            return quadrantId;
        }
        const next: string = await this.findLeaf(
            lat,
            long,
            this.findNextBounds(quadrantId, lat, long),
        );
        // console.log('nextbounds ', next);
        const out: string = next !== '' ? next : quadrantId;
        return out;
    }
}
