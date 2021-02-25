/* eslint-disable class-methods-use-this */
import { Response } from 'express';
import Album from '../models/album';
import { NewRequest as Request } from '../types/types';
import initLogger from '../core/logger';

const logger = initLogger('ControllerAlbums');

export default class AlbumController {
    static async addToAlbum(req: Request, res: Response) {
        const { postId, albumId } = req.body;
        Album.findByIdAndUpdate(albumId, { $push: { posts: postId } }).exec()
            .then((alb) => res.status(200).json({ success: true, message: alb }))
            .catch((err) => {
                logger.error(`Error pushing post ${postId} to album ${albumId} with error ${err}`);
                return res.status(500).json({ success: false, message: 'Error pushing post to album' });
            });
    }

    static async removeFromAlbum(req: Request, res: Response) {
        const { postId, albumId } = req.body;
        Album.findByIdAndUpdate(albumId, { $pull: { posts: postId } }).exec()
            .then(() => res.status(200).json({ success: true, message: 'Successfully removed post from album' }))
            .catch((err) => {
                logger.error(`Error pushing post ${postId} to album ${albumId} with error ${err}`);
                return res.status(500).json({ success: false, message: 'Error removing post from album' });
            });
    }

    static async createAlbum(req: Request, res: Response) {
        const { postId, title } = req.body;
        const album = new Album({
            posts: [postId],
            author: req.user._id,
            title,
        });
        album.save()
            .then(() => res.status(200).json({ success: true, message: album }))
            .catch((err) => {
                logger.error(`Error creating album with error ${err}`);
                res.status(500).json({ success: false, message: err });
            });
    }

    static async deleteAlbum(req: Request, res: Response) {
        const { albumId } = req.body;
        Album.findByIdAndDelete(albumId).exec()
            .then(() => res.status(200).json({ success: true, message: 'Successfully deleted album' }))
            .catch((err) => {
                logger.error(`Error deleting album ${albumId} with error ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    // edit Title
    static async editTitle(req: Request, res: Response) {
        const { title, albumId } = req.body;
        Album.findByIdAndUpdate(albumId, { title }).exec()
            .then(() => res.status(200).json({ success: true, message: 'Successfully updated title' }))
            .catch((err) => {
                logger.error(`Error updating title ${title} for ${albumId} with error ${err}`);
                return res.status(500).json({ success: false, message: err });
            });
    }

    static async getAlbum(req: Request, res: Response) {
        const { albumId } = req.params;
        console.log(albumId);
        return Album.findById(albumId).populate([{ path: 'posts', model: 'Post' }]).orFail(new Error('Album not found')).exec()
            .then((album) => res.status(200).json({ success: true, message: album.posts }))
            .catch((err) => {
                logger.error(`Error getting album ${albumId} with error ${err}`);
                return res.status(500).json({ success: false, message: err.message });
            });
    }
}
