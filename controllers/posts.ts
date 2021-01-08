import * as mongoose from 'mongoose';

/* eslint-disable class-methods-use-this */
import { NextFunction, Request, Response } from 'express';

import { loggers } from 'winston';
import Post from '../models/post';
import { Post as PostType } from '../types/types';
import initLogger from '../core/logger';
import User from '../models/user';
import Redis from 'ioredis'

const logger = initLogger('ControllerPosts');

const client = Redis.createClient(process.env.REDIS_PORT);

client.on("error", (err) => logger.error(`Redis Error: ${err}`));

export default class PostController {
    createPost(req: Request, res: Response, next: NextFunction) {
        const { authorId, caption, location } = req.body;
        let post;
        if (!caption) {
            post = new Post({
                authorId,
                location,
            });
        } else {
            post = new Post({
                authorId,
                location,
                caption,
            });
        }

        return post.save()
            .then((result: any) => res.status(201).json({ success: true, message: result }))
            .catch((err: any) => {
                logger.error(`Error when saving a post ${post}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    getPost(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        Post.findById(id).exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error when getting a post by id ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    getUserPosts(req: Request, res: Response, next: NextFunction) {
        const { userId } = req.body;
        Post.find({ authorId: userId }).exec()
            .then((result) => res.status(200).json({
                success: true,
                message: {
                    posts: result,
                    count: result.length,
                },
            }))
            .catch((err) => {
                logger.error(`Error when finding posts with userId ${userId}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    deletePost(req: Request, res: Response, next: NextFunction) {
        const { postId } = req.query;

        Post.findByIdAndDelete(postId).exec()
            .then((result) => res.status(200).json({ success: true, message: `Successfully deleted post with result: ${result}` }))
            .catch((err) => {
                logger.error(`Error when deleting a post with postId ${postId}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    async updatePostCaption(req: Request, res: Response, next: NextFunction) {
        const authorId = Post.find({ authorId: req.user['id'] });
        const { caption, postId } = req.body;
        if (authorId !== req.user['id']) {
            // TODO: raise and try/catch a custom error here
            logger.info('Error when updating post caption: User is not an author of post');
            return res.status(401).json({ success: false, message: 'User is not author of post.' });
        }
        Post.findByIdAndUpdate({ _id: postId }, { caption }).exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error when updating post ${postId}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    async getFeedSet(req: Request, res: Response) {
        const { userId } = req.body;
        const getStr = `SeenPosts:${userId}`;
        const PostList = await client.get(getStr).split(",")||[];

        User.findById(userId).exec()
            .then(usr => Post.find({
                _id: {
                    $ne: {
                        $in: PostList
                    }
                },
                authorId: {
                    $in: usr.following
                }
            }).sort({date: 'descending'}).limit(20))
            .then(posts => new Promise((resolve, reject) => {
                posts.forEach(p => PostList.push(p['_id']))
                client.setex(getStr, 600, PostList.toString())
                    .then(() => resolve(posts))
                    .catch(err => reject(err))
            }))
            .then((result) => res.status(200).json({
                success: true,
                message: result,
            }))
            // .then(async (result: any) => { //switch me in when aws upload is merged
            //     const orderPromises = result.map((i) => this.getDownload(i));
            //     return Promise.all(orderPromises)
            //         .then((urls) => res.status(200).json({
            //             success: true,
            //             message: {
            //                 posts: result,
            //                 url: urls,
            //             },
            //         }))
            //         .catch((err) => {
            //             logger.error(`Error when acquiring feed for user ${userId}: ${err}`);
            //             return res.status(500).json({ success: false, message: err });
            //         });
            // })
            .catch((err) => {
                logger.error(`Error when acquiring feed for user ${userId}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }
}
