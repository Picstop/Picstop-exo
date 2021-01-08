import express from 'express';
import PostController from '../controllers/posts';
import PostMiddleware from '../middleware/posts';
import { NewRequest as Request } from '../types/types';

const router = express.Router();
const Posts = new PostController();

router.post('/createPost/', async (req: Request, res) => Posts.createPost(req, res));

router.get('/getPost/:id', async (req: Request, res) => Posts.getPost(req, res));

router.delete('/deletePost/:id', PostMiddleware.verifyAuthor, async (req: Request, res) => Posts.deletePost(req, res));

router.get('/getUserPosts/', async (req: Request, res) => Posts.getUserPosts(req, res));

router.patch('/updatePostCaption/:id', PostMiddleware.verifyAuthor, async (req: Request, res) => Posts.updatePostCaption(req, res));

export default router;
