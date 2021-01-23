import mongoose from 'mongoose';

/* eslint-disable class-methods-use-this */
import { NextFunction, Response } from 'express';

import { loggers } from 'winston';
import * as AWS from 'aws-sdk';
import Post from '../models/post';
import { Post as PostType, NewRequest as Request } from '../types/types';
import initLogger from '../core/logger';
import User from '../models/user';
import { client } from '../core/redis';
import { removeNullUndef } from '../core/helpers';

const logger = initLogger('ControllerPosts');

const s3Bucket = process.env.BUCKET_NAME;
const credentials = {
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
};
AWS.config.update({ credentials, region: 'us-east-1' });
const s3 = new AWS.S3();
export default class PostController {
    async createPost(req: Request, res: Response) {
        const {
            caption, location, files,
        } = req.body;
        const authorId = req.user._id;
        const _id = mongoose.Types.ObjectId();
        const nl = [...Array(files).keys()];
        const uploadPromises = nl.map((i) => s3.getSignedUrl('putObject', {
            Bucket: s3Bucket,
            Key: `${authorId}/${_id.toString()}/${i}.jpg`,
            Expires: 60,
            ContentType: 'image/jpeg',
            ACL: 'public-read',
        }));
        const downloadPromises = nl.map((i) => s3.getSignedUrl('getObject', {
            Bucket: s3Bucket,
            Key: `${authorId}/${_id.toString()}/${i}.jpg`,
        }));
        try {
            const urls = await Promise.all(uploadPromises);
            const images = nl.map((i) => `${authorId}/${_id.toString()}/${i}.webp`);

            const post = removeNullUndef({
                _id,
                authorId,
                location,
                caption,
                images,
            });

            return Post.create(post)
                .then((p) => res.status(201).json({
                    success: true,
                    message: {
                        post: p,
                        uploadUrls: urls,
                    },
                }))
                .catch((err: any) => {
                    logger.error(`Error when saving a post ${post}: ${err}`);
                    return res.status(500).json({ success: false, message: err.message });
                });
        } catch (e) {
            logger.error(`Image upload error: ${e}`);
            return res.status(500).json({ success: false, message: e.message });
        }
    }

    getPost(req: Request, res: Response) {
        const { id } = req.params;
        Post.findById(id)
            .orFail(new Error('Post not found!'))
            .exec()
            .then((post) => {
                const imagePromises = post.images.map((i) => s3.getSignedUrl('getObject', {
                    Bucket: s3Bucket,
                    Key: i,
                }));
                return Promise.all(imagePromises).then((urls) => {
                    post.images = urls;
                    return post;
                });
            })
            .then((result) => res.status(200).json({
                success: true,
                message: result,
            }))
            .catch((err) => {
                logger.error(`Error when getting a post by id ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    getUserPosts(req: Request, res: Response) {
        const { userId } = req.body;
        Post.find({ authorId: userId })
            .orFail(new Error('Post not found!'))
            .exec()
            .then((posts) => {
                const reMakePost = posts.map((z) => {
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
            .then((result) => res.status(200).json({
                success: true,
                message: {
                    posts: result,
                    count: result.length,
                },
            }))
            .catch((err) => {
                logger.error(`Error when finding posts with userId ${userId}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    deletePost(req: Request, res: Response) {
        const { id } = req.params;

        Post.findByIdAndDelete(id)
            .orFail(new Error('Post not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: `Successfully deleted post with result: ${result}` }))
            .catch((err) => {
                logger.error(`Error when deleting a post with postId ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async updatePostCaption(req: Request, res: Response) {
        const { caption } = req.body;
        const { id } = req.params;

        return Post.findByIdAndUpdate({ _id: id }, { caption }, { new: true })
            .orFail(new Error('Post not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error when updating post ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async getFeedSet(req: Request, res: Response) {
        const { userId } = req.body;
        const getStr = `SeenPosts:${userId}`;
        let PostList;
        const set = await client.get(getStr);
        if (set == null || set === '') {
            PostList = [];
        } else {
            PostList = set.split(',');
        }

        User.findById(userId)
            .orFail(new Error('User not found!'))
            .exec()
            .then((usr) => {
                usr.following.push(usr._id);
                if (PostList.length < 1) {
                    return Post.find({
                        authorId: {
                            $in: usr.following,
                        },
                    }).limit(20);
                }
                return Post.find({
                    _id: {
                        $ne: {
                            $in: PostList,
                        },
                    },
                    authorId: {
                        $in: usr.following,
                    },
                }).limit(20);
            })
            .then((posts) => {
                const reMakePost = posts.map((z) => {
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
            .then((posts) => new Promise((resolve, reject) => {
                posts.forEach((p) => { console.log(p._id); PostList.push(p._id); });
                console.log(PostList);
                if (PostList.length <= 1) {
                    client.setex(getStr, 600, PostList.toString())
                        .then(() => resolve(posts))
                        .catch((err) => reject(err));
                } else {
                    resolve([]);
                }
            }))
            .then((result: any) => res.status(200).json({
                success: true,
                message: result,
            }))
            .catch((err) => {
                logger.error(`Error when acquiring feed for user ${userId}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async likePost(req: Request, res: Response) {
        const { id } = req.params;
        return Post.findByIdAndUpdate(id, { $push: { likes: req.user._id } }, { new: true })
            .orFail(new Error('Post not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while liking a Post ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async unlikePost(req: Request, res: Response) {
        const { id } = req.params;
        return Post.findByIdAndUpdate(id, { $pull: { likes: req.user._id } }, { new: true })
            .orFail(new Error('Post not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while liking a post ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }
}
