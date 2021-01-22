import express from 'express';
import PostController from '../controllers/posts';
import PostMiddleware from '../middleware/posts';
import { NewRequest as Request } from '../types/types';
import { isAuthenticated } from '../config/passport';

const router = express.Router();
const Posts = new PostController();

router.post('/create', isAuthenticated, async (req: Request, res) => Posts.createPost(req, res));

router.get('/get/:id', isAuthenticated, async (req: Request, res) => Posts.getPost(req, res));

router.delete('/delete/:id', isAuthenticated, PostMiddleware.verifyAuthor, async (req: Request, res) => Posts.deletePost(req, res));

router.post('/getUserPosts', isAuthenticated, async (req: Request, res) => Posts.getUserPosts(req, res));

router.patch('/caption/:id', isAuthenticated, PostMiddleware.verifyAuthor, async (req: Request, res) => Posts.updatePostCaption(req, res));

router.post('/like/:id', isAuthenticated, PostMiddleware.checkIfAlreadyLiked, async (req: Request, res) => Posts.likePost(req, res));

router.post('/unlike/:id', isAuthenticated, PostMiddleware.checkIfAlreadyUnliked, async (req: Request, res) => Posts.unlikePost(req, res));

router.post('/feed', isAuthenticated, async (req: Request, res) => Posts.getFeedSet(req, res));

export default router;
