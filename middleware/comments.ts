import mongoose from 'mongoose';
import { NextFunction, Response } from 'express';
import { NewRequest as Request } from '../types/types';
import Comment from '../models/comment';
import initLogger from '../core/logger';

const logger = initLogger('MiddlewareComments');

export default class CommentMiddleware {
    /**
     * Verifies is the `authorId` in the request is the same as the authorId for the comment the request is trying to access
     * @param {express.Request} req Request object
     * @param {express.Response} res Response object
     * @param {express.NextFunction} next The next function to call if this one passes
     */
    static async verifyAuthor(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        const currUserId = req.user._id;

        // Verify first that this comment exists in the database
        // TODO: #10 add this logging to the controller and use the controller method here instead
        let comment;
        try {
            comment = await Comment.findById(id).orFail(new Error('Comment not found!')).exec();
        } catch (e) {
            logger.info(`Error finding comment ${id} with error ${e}`);
            return res
                .status(500)
                .json({ success: false, message: e.message });
        }

        // Note: use .equals instead of ==
        if (comment.authorId.equals(currUserId)) { return next(); }

        return res
            .status(500)
            .json({ success: false, message: 'Author id does not match. Access forbidden.' });
    }

    static async checkIfAlreadyLiked(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        try {
            const comment = await Comment.findById(id)
                .orFail(new Error('Comment not found'))
                .exec();
            const liked = comment.likes.some((user) => `${user}` == (req.user._id));
            if (!liked) { return next(); }
            return res.status(400).json({ success: false, message: 'Already liked comment' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async checkIfAlreadyUnliked(req: Request, res: Response, next: NextFunction) {
        const { id } = req.params;
        try {
            const comment = await Comment.findById(id)
                .orFail(new Error('Comment not found'))
                .exec();
            const liked = comment.likes.some((user) => `${user}` == (req.user._id));
            if (!liked) { return res.status(400).json({ success: false, message: 'Already unliked comment' }); }
            return next();
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}
