import express from 'express';
import AlbumController from '../controllers/albums';
import AlbumMiddleware from '../middleware/albums';
import { NewRequest as Request } from '../types/types';
import { isAuthenticated } from '../config/passport';

const router = express.Router();

// create
router.post('/create', isAuthenticated, AlbumMiddleware.isAuthorPost, (req: Request, res) => AlbumController.createAlbum(req, res));

// add post to album

router.post('/add', isAuthenticated,
    AlbumMiddleware.isAuthorPost,
    AlbumMiddleware.isAuthorAlbum,
    AlbumMiddleware.isAlreadyInAlbum, (req: Request, res) => AlbumController.addToAlbum(req, res));

// remove post from album

router.delete('/removePost', isAuthenticated,
    AlbumMiddleware.isAuthorAlbum,
    AlbumMiddleware.isInAlbum,
    AlbumMiddleware.checkAlbumPostsLength, (req: Request, res) => AlbumController.removeFromAlbum(req, res));

// delete album

router.delete('/remove', isAuthenticated,
    AlbumMiddleware.isAuthorAlbum, (req: Request, res) => AlbumController.deleteAlbum(req, res));

// edit title

router.patch('/title', isAuthenticated,
    AlbumMiddleware.isAuthorAlbum, (req: Request, res) => AlbumController.editTitle(req, res));

// get album

router.get('/get/:id', isAuthenticated, async (req: Request, res) => AlbumController.getAlbum(req, res));
