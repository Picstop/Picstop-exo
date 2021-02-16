/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
import { Response } from 'express';

import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';
import Location from '../models/location';
import {

    NewRequest as Request,

} from '../types/types';
import User from '../models/user';
import Post from '../models/post';
import initLogger from '../core/logger';

dotenv.config();
/* eslint-disable no-underscore-dangle */
const logger = initLogger('ControllerPosts');
/* eslint-disable class-methods-use-this */
const s3Bucket = process.env.BUCKET_NAME;
const credentials = {
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
};
AWS.config.update({ credentials, region: 'us-east-1' });
const s3 = new AWS.S3();
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

    async findNearby(req: Request, res: Response, newLocs: Array<any>) {
        const { lat, long, maxDistance } = req.body;

        try {
            const user = await User.findById(req.user._id);
            const locations1: any = await Location.find({ geoLocation: { $near: { $maxDistance: maxDistance, $geometry: { type: 'Point', coordinates: [long, lat] } } }, $or: [{ isOfficial: true }, { _id: { $in: user.savedLocations } }] }).exec();
            const uniqueIds = [...new Set([...user.savedLocations, ...locations1.map((x) => x._id)])];
            const locations: any = await Location.find({ _id: { $in: uniqueIds } });
            if (locations.length < 1) return res.status(200).json({ success: true, message: [] });

            for (const location of locations) {
                const posts = await Post.aggregate([
                    {
                        $project: {
                            authorId: 1,
                            caption: 1,
                            location: 1,
                            likes: 1,
                            comments: 1,
                            images: 1,
                            length: { $size: '$likes' },
                        },
                    },
                    { $sort: { length: -1 } },
                    { $match: { location: location._id } },

                ]);
                let image;
                posts.forEach((post) => {
                    if (post.images) {
                        image = post.images[0];
                    }
                });
                const object: any = {
                    geoLocation: location.geoLocation,
                    _id: location._id,
                    author: location.author,
                    name: location.name,
                    isOfficial: location.isOfficial,
                    createdAt: location.createdAt,
                    updated: location.updatedAt,
                };
                if (!image || image === undefined) {
                    object.images = '';
                } else {
                    object.images = image;
                }

                await newLocs.push(object);

                // if (!post.images) images.push(null)
            }
            console.log(newLocs);
            await newLocs.forEach(async (location) => {
                // console.log(location.images);
                if (location.images !== '') {
                    const download = await s3.getSignedUrl('getObject', {
                        Bucket: s3Bucket,
                        Key: location.images,
                    });
                    location.images = download;
                }
            });
            return res.status(200).json({ success: true, message: await newLocs });
        } catch (error) {
            logger.error(`Error finding nearby locations with error ${error}`);
            return res.status(500).json({ success: false, message: error });
        }
    }

    async getExamplePics(req: Request, res: Response) {
        const { id } = req.params;
        // @ts-ignore
        Post.find({ location: id }).populate({ path: 'authorId' }).exec()
            .then((posts) => {
                // @ts-ignore
                const filtered = posts.filter((post) => post.authorId.private === false || post.authorId.followers.indexOf(req.user._id) >= 0);
                const reMakePost = filtered.map((z) => {
                    const imagePromises = z.images.map((i) => s3.getSignedUrl('getObject', {
                        Bucket: s3Bucket,
                        Key: i,
                    }));
                    return Promise.all(imagePromises).then((urls) => {
                        z.images = urls;
                        return z;
                    });
                });
                return Promise.all(reMakePost);
            })
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((error) => {
                logger.error(`Error finding example pics for location ${id} with error ${error}`);
                return res.status(500).json({ success: false, message: error.message });
            });
    }

    async getLocationById(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const location = await Location.findById(id).orFail(new Error('Location not found'))
                .exec()
                .then((loc) => loc);
            return res.status(200).json({ success: true, message: { location } });
        } catch (error) {
            logger.error(`Error getting location by id: ${id} with error ${error}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
