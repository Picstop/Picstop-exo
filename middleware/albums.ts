/* eslint-disable class-methods-use-this */
import { Response, NextFunction } from 'express';
import Album from '../models/album';
import { NewRequest as Request } from '../types/types';
import initLogger from '../core/logger';
import Post from '../models/post';

const logger = initLogger('MiddlewareAlbums');

export default class AlbumMiddleware {
    // cant remove post from alb if alb only has 1 post
    static async checkAlbumPostsLength(req: Request, res: Response, next: NextFunction) {
        const { albumId } = req.body;
        Album.findById(albumId).orFail(new Error('Album not found')).exec()
            .then((album) => {
                if (album.posts.length <= 1) {
                    return res.status(400).json({ success: false, message: 'You must have at least 2 posts in an album to remove a post.' });
                }
                return next();
            });
    }

    // is in album (can remove)
    static async isInAlbum(req: Request, res: Response, next: NextFunction) {
        const { albumId, postId } = req.body;
        Album.findById(albumId).orFail(new Error('Album not found')).exec()
            .then((album) => {
                const post = album.posts.some((post) => `${post}` == (postId));
                if (post) {
                    return next();
                }
                return res.status(500).json({ success: false, message: 'Post is not in album.' });
            })
            .catch((error) => {
                logger.error(`Error getting album ${albumId} with error ${error}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    // is already in album
    static async isAlreadyInAlbum(req: Request, res: Response, next: NextFunction) {
        const { albumId, postId } = req.body;
        Album.findById(albumId).orFail(new Error('Album not found')).exec()
            .then((album) => {
                const post = album.posts.some((post) => `${post}` == (postId));
                if (post) {
                    return res.status(500).json({ success: false, message: 'Post is not in album.' });
                }
                return next();
            })
            .catch((error) => {
                logger.error(`Error getting album ${albumId} with error ${error}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    // isAuthor
    static async isAuthorAlbum(req: Request, res: Response, next: NextFunction) {
        const { albumId } = req.body;
        Album.findById(albumId).orFail(new Error('Post not found')).exec()
            .then((album) => {
                if (album.author === req.user._id) {
                    return next();
                }
                return res.status(401).json({ success: false, message: 'User is not author of album' });
            })
            .catch((error) => {
                logger.error(`Error getting album ${albumId} with error ${error}`);
                return res.status(500).json({ success: false, message: error });
            });
    }

    // isAuthorPost
    static async isAuthorPost(req: Request, res: Response, next: NextFunction) {
        const { postId } = req.body;
        const currUserId = req.user._id;
        let post;
        try {
            post = await Post.findById(postId)
                .orFail(new Error('Post not found!'))
                .exec();
        } catch (e) {
            logger.info(`Error finding post ${postId} with error ${e}`);
            return res
                .status(500)
                .json({ success: false, message: e.message });
        }

        // Note: use .equals instead of ==
        if (post.authorId.equals(currUserId)) { return next(); }

        return res.status(401).json({ success: false, message: 'Author id does not match. Access forbidden.' });
    }
    // check album title
}
