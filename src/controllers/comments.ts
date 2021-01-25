/* eslint-disable class-methods-use-this */
import { Response } from 'express';

import Comment from '../models/comment';
import { NewRequest as Request } from '../types/types';
import initLogger from '../core/logger';
import Post from '../models/post';

const logger = initLogger('ControllerComments');

export default class CommentController {
    async createComment(req: Request, res: Response) {
        const { postId, comment } = req.body;
        const authorId = req.user._id;

        const newComment = new Comment({
            postId,
            comment,
            authorId,
        });
        try {
            await newComment.save();
            await Post.findByIdAndUpdate(postId, { $set: { comments: newComment._id } });
            return res.status(201).json({ success: true, message: newComment });
        } catch (error) {
            logger.error(`Error while creating a new comment: ${error}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    getComment(req: Request, res: Response) {
        const { id } = req.params;
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
        const { id } = req.params;
        const { comment } = req.body;
        return Comment.findByIdAndUpdate(id, { comment }, { new: true })
            .orFail(new Error('Comment not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error when editing a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    async deleteComment(req: Request, res: Response) {
        const { id } = req.params;

        return Comment.findByIdAndDelete(id)
            .orFail(new Error('Comment not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while removing a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    likeComment(req: Request, res: Response) {
        const { id } = req.params;
        return Comment.findByIdAndUpdate(id, { $push: { likes: req.user._id } }, { new: true })
            .orFail(new Error('Comment not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while liking a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }

    unlikeComment(req: Request, res: Response) {
        const { id } = req.params;
        return Comment.findByIdAndUpdate(id, { $pull: { likes: req.user._id } }, { new: true })
            .orFail(new Error('Comment not found!'))
            .exec()
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while liking a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }
}
