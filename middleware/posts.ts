import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';

import Post from '../models/post';
import initLogger from '../core/logger';

const logger = initLogger('MiddlewarePosts');

export default class PostMiddleware {
    /**
     * Verifies is the `authorId` in the request is the same as the authorId for the post the request is trying to access
     * @param {express.Request} req Request object
     * @param {express.Response} res Response object
     * @param {express.NextFunction} next The next function to call if this one passes
     */
    static async verifyAuthor(req: Request, res: Response, next: NextFunction) {
        const { id } = req.body;
        const currUserId = req.user._id;

        // Verify first that this post exists in the database
        // TODO: #8 add this logging to the controller and use the controller method here instead
        let post;
        try {
            post = await Post.findById(id).exec();
        } catch (e) {
            if (e instanceof mongoose.Error.DocumentNotFoundError) {
                logger.info(`Document with id ${id} not found.`);
                return res
                    .status(400)
                    .json({ success: false, message: 'Post was not found' });
            }
            logger.info(`Error finding post ${id} with error ${e}`);
            return res
                .status(500)
                .json({ success: false, message: e });
        }

        // Note: use .equals instead of ==
        if (post.authorId.equals(currUserId)) {
            next();
        } else {
            return res
                .status(500)
                .json({ success: false, message: 'Author id does not match. Access forbidden.' });
        }
    }
}
