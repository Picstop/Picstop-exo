import express from 'express';
import PostController from '../controllers/posts';

const router = express.Router();
const Posts = new PostController();

router.post('/', async (req, res, next) => Posts.createPost(req, res, next));

router.get('/:id', async (req, res, next) => Posts.getPost(req, res, next));

router.delete('/:id', async (req, res, next) => Posts.deletePost(req, res, next));

router.get('/user', async (req, res, next) => Posts.getUserPosts(req, res, next));

router.patch('/:id', async (req, res, next) => Posts.updatePostCaption(req, res, next));

export default router;
