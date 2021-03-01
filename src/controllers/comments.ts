/* eslint-disable class-methods-use-this */
import { Response } from 'express';

import apn from 'apn';
import Comment from '../models/comment';
import User from '../models/user';
import { NewRequest as Request, Post as IPost } from '../types/types';
import initLogger from '../core/logger';
import Post from '../models/post';
import Notification from '../models/notification';
import { apnProvider } from '../config/notifs';

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
            const post: IPost = await Post.findByIdAndUpdate(postId, { $set: { comments: newComment._id } });
            const notifiedUser = await User.findByIdAndUpdate(authorId, { $inc: { notifications: 1 } });
            if (notifiedUser._id === authorId) return res.status(201).json({ success: true, message: newComment });
            const newNotif = await new Notification({
                userId: post.authorId,
                relatedUserId: req.user._id,
                relatedPostId: post._id,
                comment,
                notificationType: 'COMMENT_POST',
            }).save();
            const notif = new apn.Notification({
                id: newNotif._id,
                category: 'COMMENT_POST',
                title: `${req.user.username} commented on your post`,
                topic: process.env.APP_BUNDLE_ID,
                body: comment,
                expiry: Math.floor(Date.now() / 1000) + 600,
                sound: 'default',
                pushType: 'alert',
                badge: notifiedUser.notifications,
                payload: {
                    postId: post._id,
                },
            });
            apnProvider.send(notif, notifiedUser.identifiers);

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
            .then(async (com) => {
                await Notification.findOneAndDelete({ relatedUserId: req.user._id, comment: com.comment, notificationType: 'COMMENT_POST' })
                    .orFail(new Error('Could not delete notification'))
                    .exec()
                    .catch((err) => logger.error(`Error while removing a comment notification ${id}: ${err}`));
                return com;
            })
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
            .then(async (comment) => {
                const user = await User.findByIdAndUpdate(comment.authorId, { $inc: { notifications: 1 } });
                if (user._id === req.user._id) return comment;
                const newNotif = await new Notification({
                    userId: user._id,
                    relatedUserId: req.user._id,
                    relatedPostId: comment.postId,
                    comment: comment.comment,
                    notificationType: 'LIKE_POST',
                }).save();
                const notif = new apn.Notification({
                    id: newNotif._id,
                    category: 'LIKE_COMMENT',
                    title: `${req.user.username} liked your post`,
                    topic: process.env.APP_BUNDLE_ID,
                    body: comment.comment,
                    expiry: Math.floor(Date.now() / 1000) + 600,
                    sound: 'default',
                    pushType: 'alert',
                    badge: user.notifications,
                    payload: {
                        postId: id,
                    },
                });
                apnProvider.send(notif, user.identifiers);
                return comment;
            })
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
            .then(async (com) => {
                await Notification.findOneAndDelete({
                    relatedUserId: req.user._id, postId: com.postId, comment: com.comment, notificationType: 'LIKE_COMMENT',
                })
                    .orFail(new Error('Could not delete notification'))
                    .exec()
                    .catch((err) => logger.error(`Error while removing a comment like notification ${id}: ${err}`));
                return com;
            })
            .then((result) => res.status(200).json({ success: true, message: result }))
            .catch((err) => {
                logger.error(`Error while unliking a comment ${id}: ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }
}
