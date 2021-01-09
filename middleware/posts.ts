import mongoose from 'mongoose';
import { NextFunction, Response } from 'express';
import { NewRequest as Request } from '../types/types';
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
        const { id } = req.params;
        const currUserId = req.user._id;

        // Verify first that this post exists in the database
        // TODO: #8 add this logging to the controller and use the controller method here instead
        let post;
        try {
            post = await Post.findById(id)
                .orFail(new Error('Post not found!'))
                .exec();
        } catch (e) {
            logger.info(`Error finding post ${id} with error ${e}`);
            return res
                .status(500)
                .json({ success: false, message: e.message });
        }

        // Note: use .equals instead of ==
        if (post.authorId.equals(currUserId)) { return next(); }

        return res
            .status(500)
            .json({ success: false, message: 'Author id does not match. Access forbidden.' });
    }

    static async checkIfAlreadyLiked(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        try {
            const post = await Post.findById(id)
                .orFail(new Error('Post not found'))
                .exec();
            const liked = post.likes.some((user) => `${user}` == (req.user._id));
            if (!liked) { return next(); }
            return res.status(400).json({ success: false, message: 'Already liked post' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async checkIfAlreadyUnliked(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        try {
            const post = await Post.findById(id)
                .orFail(new Error('Post not found'))
                .exec();
            const liked = post.likes.some((user) => `${user}` == (req.user._id));
            if (!liked) { return res.status(400).json({ success: false, message: 'Already unliked post' }); }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
