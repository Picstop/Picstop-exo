import express from 'express';
import PostController from '../controllers/posts';
import PostMiddleware from '../middleware/posts';

const router = express.Router();
const Posts = new PostController();

router.post('/createPost/', async (req, res) => Posts.createPost(req, res));

router.get('/getPost/:id', async (req, res) => Posts.getPost(req, res));

router.delete('/deletePost/:id', PostMiddleware.verifyAuthor, async (req, res, next) => Posts.deletePost(req, res, next));


router.get('/getUserPosts/', async (req, res) => Posts.getUserPosts(req, res));


router.patch('/updatePostCaption/:id', PostMiddleware.verifyAuthor, async (req, res, next) => Posts.updatePostCaption(req, res, next));

export default router;
