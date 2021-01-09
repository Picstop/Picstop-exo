import * as mongoose from 'mongoose';

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

const credentials = {
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
};
AWS.config.update({ credentials, region: 'us-east-1' });
const s3Bucket = process.env.BUCKET_NAME;
const s3 = new AWS.S3();
export default class PostController {
    async getUpload(files: number, authId: string, postId: string) {
        return new Promise((resolve, reject) => {
            const nl = [...Array(files).keys()];
            const orderPromises = nl.map((i) => s3.getSignedUrl('putObject', {
                Bucket: s3Bucket,
                Key: `${authId}/${postId}/${i}.webp`,
                Expires: 60,
                ContentType: 'image/webp',
                ACL: 'public-read',
            }));
            Promise.all(orderPromises)
                .then((urls) => resolve(urls))
                .catch((err) => reject(err));
        });
    }

    createPost(req: Request, res: Response) {
        const {
            authorId, caption, location, files,
        } = req.body;
        const post = removeNullUndef({
            authorId,
            location,
            caption,
        });

        return Post.create(post)
            .then((result: any) => this.getUpload(files, authorId, result._id)
                .then((url: Array<string>) => res.status(201).json({
                    success: true,
                    message: {
                        post: result,
                        urls: url,
                    },
                }))
                .catch((err: any) => {
                    logger.error(`Error when saving a post ${post}: ${err}`);
                    return res.status(500).json({ success: false, message: err.message });
                }))
            .catch((err: any) => {
                logger.error(`Error when saving a post ${post}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async getDownload(post: any) {
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: s3Bucket,
                Prefix: `${post.authorId}/${post._id}`,
            };
            s3.listObjectsV2(params, async (err, data) => {
                if (err) return reject(err);

                const nl = [...Array(data.Contents.length).keys()];

                const orderPromises = nl.map((i) => s3.getSignedUrl('getObject', {
                    Bucket: s3Bucket,
                    Key: `${post.authorId}/${post.id}/${i}.webp`,
                    Expires: 60,
                }));
                return Promise.all(orderPromises)
                    .then((urls) => resolve(urls))
                    .catch((err1) => reject(err1));
            });
        });
    }

    getPost(req: Request, res: Response) {
        const { id } = req.params;
        Post.findById(id)
            .orFail(new Error('Post not found!'))
            .exec()
            .then((result) => {
                this.getDownload(result)
                    .then((urls) => res.status(200).json({
                        success: true,
                        message: {
                            post: result,
                            url: urls,
                        },
                    }))
                    .catch((err) => {
                        logger.error(`Error when getting a post ${id}'s images: ${err}`);
                        return res.status(500).json({ success: false, message: err });
                    });
            })
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
            .then(async (result) => {
                const orderPromises = result.map((i) => this.getDownload(i));
                return Promise.all(orderPromises)
                    .then((urls) => res.status(200).json({
                        success: true,
                        message: {
                            posts: result,
                            count: result.length,
                            url: urls,
                        },
                    }))
                    .catch((err) => {
                        logger.error(`Error when finding posts with userId ${userId}: ${err}`);
                        return res.status(500).json({ success: false, message: err });
                    });
            })
            .catch((err) => {
                logger.error(`Error when finding posts with userId ${userId}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    deletePost(req: Request, res: Response) {
        const { postId } = req.query;

        Post.findByIdAndDelete(postId)
            .orFail(new Error('Post not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: `Successfully deleted post with result: ${result}` }))
            .catch((err) => {
                logger.error(`Error when deleting a post with postId ${postId}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async updatePostCaption(req: Request, res: Response) {
        const { caption, postId } = req.body;

        return Post.findByIdAndUpdate({ _id: postId }, { caption })
            .orFail(new Error('Post not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error when updating post ${postId}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async getFeedSet(req: Request, res: Response) {
        const { userId } = req.body;
        const getStr = `SeenPosts:${userId}`;
        const PostList = await client.get(getStr).split(',') || [];

        User.findById(userId)
            .orFail(new Error('User not found!'))
            .exec()
            .then((usr) => Post.find({
                _id: {
                    $ne: {
                        $in: PostList,
                    },
                },
                authorId: {
                    $in: usr.following,
                },
            }).limit(20))
            .then((posts) => new Promise((resolve, reject) => {
                posts.forEach((p) => PostList.push(p._id));
                client.setex(getStr, 600, PostList.toString())
                    .then(() => resolve(posts))
                    .catch((err) => reject(err));
            }))
            .then(async (result: any) => {
                const orderPromises = result.map((i) => this.getDownload(i));
                return Promise.all(orderPromises)
                    .then((urls) => res.status(200).json({
                        success: true,
                        message: {
                            posts: result,
                            url: urls,
                        },
                    }))
                    .catch((err) => {
                        logger.error(`Error when acquiring feed for user ${userId}: ${err}`);
                        return res.status(500).json({ success: false, message: err });
                    });
            })
            .catch((err) => {
                logger.error(`Error when acquiring feed for user ${userId}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }
}
