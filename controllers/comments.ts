/* eslint-disable class-methods-use-this */
import { NextFunction, Response } from 'express';

import Comment from '../models/comment';
import { Comment as CommentType, NewRequest as Request } from '../types/types';
import initLogger from '../core/logger';

const logger = initLogger('ControllerComments');

export default class CommentController {
    createComment(req: Request, res: Response) {
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

    getComment(req: Request, res: Response) {
        const { id } = req.query;
        return Comment.findById(id)
            .orFail(new Error('Comment not found'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while getting a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    editComment(req: Request, res: Response) {
        const { id } = req.query;
        const { comment } = req.body;
        return Comment.findByIdAndUpdate(id, { comment })
            .orFail(new Error('Comment not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error when editing a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async deleteComment(req: Request, res: Response) {
        const { id } = req.query;

        return Comment.findByIdAndRemove(id)
            .orFail(new Error('Comment not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while removing a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    likeComment(req: Request, res: Response) {
        const { commentId } = req.query;
        return Comment.findByIdAndUpdate(commentId, { $push: { likes: req.user._id } })
            .orFail(new Error('Comment not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while liking a comment ${commentId}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }
}
