import * as mongoose from 'mongoose';

/* eslint-disable class-methods-use-this */
import { NextFunction, Request, Response } from 'express';

import Comment from '../models/comment';
import { Comment as CommentType } from '../types/types';

export default class CommentController {
    createComment(req: Request, res: Response, next: NextFunction) {
        const { postId, comment } = req.body;

        const newComment = new Comment({
            postId,
            comment,
        });

        return newComment
            .save()
            .then((result: any) => res.status(201).json({ success: true, message: result }))
            .catch((err: any) => res.status(500).json({ success: false, message: err.message }));
    }

    getComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        Comment.findById(id)
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }

    editComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        const { comment } = req.body;
        Comment.findByIdAndUpdate(id, { comment })
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }

    async deleteComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        const commentAuthor = await Comment.findById(id).exec();
        if (commentAuthor !== req.user.id) {
            return res
                .status(401)
                .json({ success: false, message: 'User is not author of post.' });
        }

        await Comment.findByIdAndRemove(id)
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }

    likeComment(req: Request, res: Response, next: NextFunction) {
        const { commentId } = req.query;
        Comment.findByIdAndUpdate(commentId, { $push: { likes: req.user.id } })
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }
}
