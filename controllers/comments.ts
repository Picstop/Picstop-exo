/* eslint-disable class-methods-use-this */
import { NextFunction, Request, Response } from 'express';

import Comment from '../models/comment';

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
        return Comment.findById(id)
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }

    editComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        const { comment } = req.body;
        return Comment.findByIdAndUpdate(id, { comment })
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }

    async deleteComment(req: Request, res: Response, next: NextFunction) {
        const { id } = req.query;
        const commentAuthor = await Comment.findById(id).exec();
        if (commentAuthor !== req.user._id) {
            return res
                .status(401)
                .json({ success: false, message: 'User is not author of post.' });
        }

        return await Comment.findByIdAndRemove(id)
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }

    likeComment(req: Request, res: Response, next: NextFunction) {
        const { commentId } = req.query;
        return Comment.findByIdAndUpdate(commentId, { $push: { likes: req.user.id } })
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => res.status(500).json({ success: false, message: err }));
    }
}
