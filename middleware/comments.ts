import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';

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
        const { id } = req.body;
        const currUserId = req.user._id;

        // Verify first that this comment exists in the database
        // TODO: #10 add this logging to the controller and use the controller method here instead
        let comment;
        try {
            comment = await Comment.findById(id);
        } catch (e) {
            if (e instanceof mongoose.Error.DocumentNotFoundError) {
                logger.info(`Document with id ${id} not found.`);
                return res
                    .status(400)
                    .json({ success: false, message: 'Comment was not found' });
            }
            throw e;
        }

        // Note: use .equals instead of ==
        if (comment.authorId.equals(currUserId)) {
            next();
        } else {
            return res
                .status(500)
                .json({ success: false, message: 'Author id does not match. Access forbidden.' });
        }
    }
}
