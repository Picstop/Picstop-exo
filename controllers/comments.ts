/* eslint-disable class-methods-use-this */
import { NextFunction, Response } from 'express';

import Comment from '../models/comment';
import { Comment as CommentType, NewRequest as Request } from '../types/types';
import initLogger from '../core/logger';

const logger = initLogger('ControllerComments');

export default class CommentController {
    createComment(req: Request, res: Response, next: NextFunction) {
        const { postId, comment } = req.body;
        const authorId = req.user._id;

        const newComment = new Comment({
            postId,
            comment,
            authorId,
        });

        return newComment
            .save()
            .then((result: any) => res.status(201).json({ success: true, message: result }))
            .catch((err: any) => {
                logger.error(`Error while creating a new comment: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    getComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        return Comment.findById(id)
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while getting a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    editComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        const { comment } = req.body;
        return Comment.findByIdAndUpdate(id, { comment })
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error when editing a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    async deleteComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        const commentAuthor = await Comment.findById(id).exec();

        if (commentAuthor !== req.user._id) {
            // TODO: add a custom error and a try/catch
            logger.error(`Error when deleting a comment ${id}: User is not author of post`);
            return res
                .status(401)
                .json({ success: false, message: 'User is not author of post.' });
        }

        return Comment.findByIdAndRemove(id)
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while removing a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    likeComment(req: Request, res: Response, next: NextFunction) {
        const { commentId } = req.query;
        return Comment.findByIdAndUpdate(commentId, { $push: { likes: req.user._id } })
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while liking a comment ${commentId}: ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }
}
